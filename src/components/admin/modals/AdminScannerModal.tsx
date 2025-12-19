

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, QrCode, Search, CheckCircle, AlertTriangle, Camera, Calendar, Clock, Building, CameraOff, RefreshCw, User as UserIcon, MapPin, Download, Printer, Copy, Mail, ScanLine } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../../context/AppContext';
import { Reservation, BookingStatus, User } from '../../../types';
import { api } from '../../../data/api';
import { decodePayload, encodeReservationPayload } from '../../../utils/qrPayload';
import { generateQrDataUrl } from '../../../utils/qrGenerator';
import { resolveReservationInfo } from '../../../services/qrAccess';

interface AdminScannerModalProps {
  onClose: () => void;
}

export const AdminScannerModal: React.FC<AdminScannerModalProps> = ({ onClose }) => {
  const { reservations, checkInReservation, spaces } = useApp();
  const [manualId, setManualId] = useState('');
  const [scanStatus, setScanStatus] = useState<'scanning' | 'success' | 'error'>('scanning');
  const [scannedRes, setScannedRes] = useState<Reservation | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [scannerInitialized, setScannerInitialized] = useState(false);
  const scannerRef = useRef<any>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [availableCameras, setAvailableCameras] = useState<any[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [activeCameraLabel, setActiveCameraLabel] = useState<string>('');
  const onSuccessRef = useRef<any>(null);
  const onFailureRef = useRef<any>(null);

  // Get all users for resolution
  const [allUsers, setAllUsers] = useState<User[]>([]);
  useEffect(() => {
    let mounted = true;
    api.users.getAll().then(users => { if (mounted) setAllUsers(users); });
    return () => { mounted = false; };
  }, []);

  // Initialize Real Scanner (auto-start without default UI)
  useEffect(() => {
    let isMounted = true;

    const initScanner = async () => {
      let Html5Qrcode = (window as any).Html5Qrcode;
      if (!Html5Qrcode) {
        try {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[src*="html5-qrcode"]') as HTMLScriptElement | null;
            if (existing) {
              existing.addEventListener('load', () => resolve());
              existing.addEventListener('error', () => reject(new Error('load-error')));
            } else {
              const s = document.createElement('script');
              s.src = 'https://unpkg.com/html5-qrcode';
              s.type = 'text/javascript';
              s.onload = () => resolve();
              s.onerror = () => reject(new Error('load-error'));
              document.head.appendChild(s);
            }
          });
          Html5Qrcode = (window as any).Html5Qrcode;
        } catch {
          if (isMounted) {
            setErrorMessage('Librairie de scan non chargée.');
            setScanStatus('error');
          }
          return;
        }
      }

      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (err) {
        console.error('Camera permission denied or device not found', err);
        if (isMounted) {
          setScanStatus('error');
          setErrorMessage("Accès à la caméra refusé ou appareil non détecté.");
        }
        return;
      }

      if (!isMounted) return;

      const html5QrCode = new Html5Qrcode('reader');
      scannerRef.current = html5QrCode;

      const onScanSuccess = (decodedText: string) => {
        html5QrCode
          .stop()
          .then(() => {
            try { html5QrCode.clear(); } catch { }
            processCode(decodedText);
          })
          .catch(() => {
            processCode(decodedText);
          });
      };

      const onScanFailure = (_error: any) => {
        if (scanStatus === 'scanning') {
          setScannerInitialized(true);
        }
      };

      onSuccessRef.current = onScanSuccess;
      onFailureRef.current = onScanFailure;

      try {
        const cameras = await Html5Qrcode.getCameras();
        setAvailableCameras(cameras || []);
        const backCam = cameras?.find((c: any) => /back|rear/i.test(c.label)) || cameras?.[0];
        if (!backCam) throw new Error('Aucune caméra disponible');

        await html5QrCode.start(
          backCam.id,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            experimentalFeatures: { useBarCodeDetectorIfSupported: true }
          },
          onScanSuccess,
          onScanFailure
        );
        if (isMounted) {
          setScannerInitialized(true);
          setActiveCameraId(backCam.id);
          setActiveCameraLabel(backCam.label || 'Caméra');
        }
      } catch (e) {
        try {
          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              experimentalFeatures: { useBarCodeDetectorIfSupported: true }
            },
            onScanSuccess,
            onScanFailure
          );
          if (isMounted) {
            setScannerInitialized(true);
            setActiveCameraId(null);
            setActiveCameraLabel('Caméra arrière');
          }
        } catch (err2) {
          console.error('Error starting scanner', err2);
          if (isMounted) {
            setScanStatus('error');
            setErrorMessage("Impossible de démarrer le scanner.");
          }
        }
      }
    };

    const timeout = setTimeout(() => initScanner(), 300);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      const inst = scannerRef.current;
      if (inst) {
        try {
          inst.stop().then(() => inst.clear()).catch(() => { });
        } catch { }
      }
    };
  }, []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;

    await processCode(manualId.trim());
  };

  const processCode = async (code: string) => {
    const decoded = decodePayload(code);
    const id = decoded ? decoded.id : code;
    const res = reservations.find(r => r.id === id);

    if (!res) {
      setScanStatus('error');
      setErrorMessage('Réservation introuvable.');
      return;
    }

    if (res.status !== BookingStatus.CONFIRMED) {
      setScanStatus('error');
      setErrorMessage(`Réservation non valide (Statut: ${res.status})`);
      return;
    }

    // Success
    setScannedRes(res);
    if (!res.checkedInAt) {
      try {
        await checkInReservation(res.id);
      } catch (e) { }
    }
    setScanStatus('success');
  };

  // Generate QR code when success state is reached
  useEffect(() => {
    const run = async () => {
      if (scanStatus === 'success' && scannedRes) {
        try {
          const payload = encodeReservationPayload(scannedRes.id);
          const url = await generateQrDataUrl(payload, 220);
          setQrUrl(url);
        } catch {
          setQrUrl('');
        }
      } else {
        setQrUrl('');
      }
    };
    run();
  }, [scanStatus, scannedRes]);

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { }
  };

  const handleDownloadQr = () => {
    if (!qrUrl || !scannedRes) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `qr-${scannedRes.id}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handlePrintQr = () => {
    if (!qrUrl) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>QR Code</title><style>body{margin:0;padding:20px;display:flex;align-items:center;justify-content:center;background:#000}img{width:320px;height:320px}</style></head><body><img src="${qrUrl}" /></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { try { w.print(); } catch { } }, 300);
  };

  const resetScan = () => {
    // Close modal to reset state cleanly
    onClose();
  };

  const switchCamera = async () => {
    const inst = scannerRef.current;
    if (!inst || availableCameras.length < 2 || scanStatus !== 'scanning') return;
    try { await inst.stop(); } catch { }
    const currentIndex = availableCameras.findIndex((c: any) => c.id === activeCameraId);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % availableCameras.length : 0;
    const nextCam = availableCameras[nextIndex];
    setActiveCameraId(nextCam.id);
    setActiveCameraLabel(nextCam.label || 'Caméra');
    try {
      await inst.start(
        nextCam.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          experimentalFeatures: { useBarCodeDetectorIfSupported: true }
        },
        onSuccessRef.current,
        onFailureRef.current
      );
      setScannerInitialized(true);
    } catch { }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // Resolved Data
  const info = scannedRes ? resolveReservationInfo(reservations, allUsers, spaces, scannedRes.id) : null;
  const client = info ? info.user : null;
  const space = info ? info.space : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md animate-fade-in">
      <div className="absolute inset-0 checkerboard"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 to-slate-900/70"></div>
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col relative animate-fade-in-up max-h-[90vh] transition-all duration-300">

        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 z-30 p-2 bg-white/60 hover:bg-white rounded-full backdrop-blur-sm transition-colors">
          <X size={20} />
        </button>

        {scanStatus !== 'success' && (
          <div className="p-6 border-b border-white/10 shrink-0 bg-slate-900 z-20 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-ess-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-ess-500/20">
                  <Camera size={18} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Scanner QR</h3>
                  <p className="text-slate-400 text-[11px] font-medium">Placez le QR code face à la caméra</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider hidden sm:block">{activeCameraLabel}</span>
                <button onClick={switchCamera} disabled={availableCameras.length < 2} className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 flex items-center gap-2">
                  <RefreshCw size={16} /> Changer de caméra
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scanner Viewport or Results */}
        <div className="relative bg-slate-950 flex-1 min-h-[520px] sm:min-h-[560px] flex flex-col overflow-hidden">

          {/* SCANNER MODE */}
          {scanStatus === 'scanning' && (
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="absolute inset-0 checkerboard"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 to-slate-900/70"></div>
              <div id="reader" className="w-full h-full absolute inset-0 object-cover z-10"></div>

              {!scannerInitialized && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 z-10 bg-slate-900">
                  <div className="w-12 h-12 border-4 border-slate-800 border-t-ess-500 rounded-full animate-spin mb-4"></div>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Initialisation...</span>
                </div>
              )}

              {/* Overlay Guide */}
              {scannerInitialized && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                  <div className="w-72 h-72 relative">
                    {/* Laser Animation */}
                    <div className="scan-laser"></div>

                    {/* Corners */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-ess-500 rounded-tl-2xl drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-ess-500 rounded-tr-2xl drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-ess-500 rounded-bl-2xl drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-ess-500 rounded-br-2xl drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]"></div>
                  </div>
                  <div className="absolute mt-80 bg-slate-900/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
                    <p className="text-white text-xs font-bold uppercase tracking-widest animate-pulse">Recherche de code...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUCCESS MODE - PREMIUM DESIGN */}
          {scanStatus === 'success' && scannedRes && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col h-full bg-slate-900 text-white z-20 absolute inset-0"
            >
              {/* Decorative Background */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-900 to-black z-0"></div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

              <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="p-8 text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                  >
                    <CheckCircle size={40} className="text-white" strokeWidth={3} />
                  </motion.div>
                  <h2 className="text-3xl font-black uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">Check-in Validé</h2>
                  <p className="text-green-400 font-bold uppercase tracking-widest text-xs mt-2">Accès Autorisé</p>
                </div>

                {/* Content Grid */}
                <div className="flex-1 px-8 pb-8 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {/* User Card */}
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col items-center text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg border border-white/10">
                        {client?.firstName?.[0]}{client?.lastName?.[0]}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-1">{client ? `${client.firstName} ${client.lastName}` : 'Visiteur Inconnu'}</h3>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
                        {client?.type === 'COMPANY' ? <Building size={12} /> : <UserIcon size={12} />}
                        {client?.companyName || 'Particulier'}
                      </div>

                      {client?.email && (
                        <div className="flex gap-2 w-full mt-auto">
                          <a href={`mailto:${client.email}`} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
                            <Mail size={16} /> Email
                          </a>
                          {client.phone && (
                            <a href={`tel:${client.phone}`} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2">
                              📞 Appeler
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Reservation Details */}
                    <div className="space-y-4">
                      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl"><MapPin size={24} /></div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Espace</div>
                          <div className="text-lg font-bold text-white">{space?.name || 'Espace Inconnu'}</div>
                        </div>
                      </div>

                      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                        <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl"><Clock size={24} /></div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Créneau</div>
                          <div className="text-lg font-bold text-white">{scannedRes.customTimeLabel || scannedRes.slot}</div>
                          <div className="text-xs text-slate-400">{scannedRes.date}</div>
                        </div>
                      </div>

                      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                        <div className="p-3 bg-green-500/20 text-green-400 rounded-xl"><Calendar size={24} /></div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Arrivée</div>
                          <div className="text-lg font-bold text-white">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 bg-slate-950/50 backdrop-blur-md flex justify-center gap-4">
                  <button onClick={resetScan} className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-lg hover:bg-slate-200 transition-transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-3">
                    <ScanLine size={24} /> Scanner le suivant
                  </button>
                  <button onClick={onClose} className="px-6 py-4 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition">
                    Terminer
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ERROR MODE */}
          {scanStatus === 'error' && (
            <div className="absolute inset-0 z-10 bg-slate-900 flex flex-col items-center justify-center text-slate-300 p-8 animate-fade-in-up text-center">
              {errorMessage.includes('introuvable') || errorMessage.includes('non valide') ? (
                // Scan Logic Error
                <>
                  <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.3)] animate-pulse">
                    <AlertTriangle size={48} className="text-red-500" />
                  </div>
                  <h3 className="text-3xl font-black text-white mb-2 tracking-tight">REFUSÉ</h3>
                  <p className="text-red-400 text-sm font-bold mb-8 max-w-xs mx-auto bg-red-900/20 px-4 py-2 rounded-lg border border-red-900/50">{errorMessage}</p>
                  <button onClick={() => { setScanStatus('scanning'); setErrorMessage(''); }} className="px-8 py-3 bg-white text-slate-900 hover:bg-slate-200 rounded-xl font-bold transition shadow-lg">
                    Réessayer
                  </button>
                </>
              ) : (
                // Hardware/Permission Error
                <>
                  <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-700">
                    <CameraOff size={40} className="text-slate-500" />
                  </div>
                  <h3 className="text-xl font-black text-white mb-3">Caméra indisponible</h3>
                  <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto leading-relaxed font-medium">
                    Impossible d'accéder à la caméra. Vérifiez les permissions du navigateur.
                  </p>

                  <div className="space-y-3 w-full max-w-xs">
                    <button onClick={handleRetry} className="w-full py-3 bg-ess-600 hover:bg-ess-500 text-white rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2">
                      <RefreshCw size={18} /> Réessayer
                    </button>
                    <p className="text-[10px] text-slate-600 uppercase font-bold tracking-wider mt-6">Utilisez la saisie manuelle ci-dessous</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Input Section (Hidden on Success) */}
        {scanStatus !== 'success' && (
          <div className="p-5 bg-slate-900 border-t border-white/10 relative z-30 shrink-0">
            <form onSubmit={handleManualSubmit} className="flex gap-3">
              <div className="relative flex-1 group">
                <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-ess-500 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Saisie manuelle (ID)"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-ess-500 focus:border-ess-500 outline-none transition-all font-mono text-sm shadow-inner"
                />
              </div>
              <button type="submit" className="bg-white hover:bg-slate-200 text-slate-900 p-3.5 rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95">
                <Search size={20} />
              </button>
            </form>
          </div>
        )}

        {/* Styles for Laser Animation & Background */}
        <style>{`
            @keyframes scan-laser {
                0% { top: 0; opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { top: 100%; opacity: 0; }
            }
            .scan-laser {
                position: absolute;
                left: 0;
                right: 0;
                height: 2px;
                background: #0ea5e9;
                box-shadow: 0 0 15px #0ea5e9, 0 0 30px #0ea5e9;
                animation: scan-laser 2s ease-in-out infinite;
                z-index: 20;
            }
            .checkerboard {
                --tile: rgba(148, 163, 184, 0.10);
                background-color: #0b1220;
                background-image:
                    conic-gradient(from 90deg, var(--tile) 90deg, transparent 0) 0 0/24px 24px,
                    conic-gradient(from 90deg, transparent 90deg, var(--tile) 0) 12px 12px/24px 24px;
            }
            #reader { border: none !important; background: black; }
            #reader video { object-fit: cover; width: 100% !important; height: 100% !important; border-radius: 0 !important; }
            #reader__scan_region { display: none; }
            #reader__dashboard_section_csr span { display: none; } 
            #reader__dashboard_section_swaplink { display: none !important; }
        `}</style>
      </div>
    </div>
  );
};
