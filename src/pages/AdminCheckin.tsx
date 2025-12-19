import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Reservation, BookingStatus, User } from '../types';
import { api } from '../data/api';
import { decodePayload, encodeReservationPayload } from '../utils/qrPayload';
import { generateQrDataUrl } from '../utils/qrGenerator';
import { resolveReservationInfo } from '../services/qrAccess';

export const AdminCheckin: React.FC = () => {
  const navigate = useNavigate();
  const { reservations, checkInReservation, spaces } = useApp();
  const [manualId, setManualId] = useState('');
  const [scanStatus, setScanStatus] = useState<'scanning' | 'success' | 'error'>('scanning');
  const [scannedRes, setScannedRes] = useState<Reservation | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [scannerInitialized, setScannerInitialized] = useState(false);
  const scannerRef = useRef<any>(null);
  const [availableCameras, setAvailableCameras] = useState<any[]>([]);
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null);
  const [activeCameraLabel, setActiveCameraLabel] = useState<string>('');
  const onSuccessRef = useRef<any>(null);
  const onFailureRef = useRef<any>(null);
  const [qrUrl, setQrUrl] = useState<string>('');

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [actionMenu, setActionMenu] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActionMenu(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
  useEffect(() => {
    let mounted = true;
    api.users.getAll().then(users => { if (mounted) setAllUsers(users); });
    return () => { mounted = false; };
  }, []);

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
          if (isMounted) { setErrorMessage('Librairie de scan non chargée.'); setScanStatus('error'); }
          return;
        }
      }
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (err) {
        if (isMounted) { setScanStatus('error'); setErrorMessage("Accès à la caméra refusé ou appareil non détecté."); }
        return;
      }
      if (!isMounted) return;
      const html5QrCode = new Html5Qrcode('reader');
      scannerRef.current = html5QrCode;
      const onScanSuccess = (decodedText: string) => {
        html5QrCode.stop().then(() => { try { html5QrCode.clear(); } catch { }; processCode(decodedText); })
          .catch(() => { processCode(decodedText); });
      };
      const onScanFailure = () => { if (scanStatus === 'scanning') setScannerInitialized(true); };
      onSuccessRef.current = onScanSuccess;
      onFailureRef.current = onScanFailure;
      try {
        const cameras = await Html5Qrcode.getCameras();
        setAvailableCameras(cameras || []);
        const backCam = cameras?.find((c: any) => /back|rear/i.test(c.label)) || cameras?.[0];
        if (!backCam) throw new Error('Aucune caméra disponible');
        await html5QrCode.start(backCam.id, { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0, experimentalFeatures: { useBarCodeDetectorIfSupported: true } }, onScanSuccess, onScanFailure);
        setScannerInitialized(true);
        setActiveCameraId(backCam.id);
        setActiveCameraLabel(backCam.label || 'Caméra');
      } catch (e) {
        try {
          await html5QrCode.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0, experimentalFeatures: { useBarCodeDetectorIfSupported: true } }, onScanSuccess, onScanFailure);
          setScannerInitialized(true);
          setActiveCameraId(null);
          setActiveCameraLabel('Caméra arrière');
        } catch (err2) {
          setScanStatus('error');
          setErrorMessage('Impossible de démarrer le scanner.');
        }
      }
    };
    const timeout = setTimeout(() => initScanner(), 300);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
      const inst = scannerRef.current;
      if (inst) { try { inst.stop().then(() => inst.clear()).catch(() => { }); } catch { } }
    };
  }, []);

  const processCode = async (code: string) => {
    const decoded = decodePayload(code);
    const id = decoded ? decoded.id : code;
    const res = reservations.find(r => r.id === id);
    if (!res) { setScanStatus('error'); setErrorMessage('Réservation introuvable.'); return; }
    if (res.status !== BookingStatus.CONFIRMED) { setScanStatus('error'); setErrorMessage(`Réservation non valide (Statut: ${res.status})`); return; }
    setScannedRes(res);
    if (!res.checkedInAt) { try { await checkInReservation(res.id); } catch { } }
    setScanStatus('success');
  };

  useEffect(() => {
    (async () => {
      if (scanStatus === 'success' && scannedRes) {
        try { const payload = encodeReservationPayload(scannedRes.id); const url = await generateQrDataUrl(payload, 240); setQrUrl(url); } catch { setQrUrl(''); }
      } else { setQrUrl(''); }
    })();
  }, [scanStatus, scannedRes]);

  const copyToClipboard = async (text: string) => { try { await navigator.clipboard.writeText(text); } catch { } };
  const handleManualSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!manualId.trim()) return; await processCode(manualId.trim()); };
  const handleRetry = () => { window.location.reload(); };
  const switchCamera = async () => {
    const inst = scannerRef.current;
    if (!inst || availableCameras.length < 2 || scanStatus !== 'scanning') return;
    try { await inst.stop(); } catch { }
    const currentIndex = availableCameras.findIndex((c: any) => c.id === activeCameraId);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % availableCameras.length : 0;
    const nextCam = availableCameras[nextIndex];
    setActiveCameraId(nextCam.id); setActiveCameraLabel(nextCam.label || 'Caméra');
    try { await inst.start(nextCam.id, { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0, experimentalFeatures: { useBarCodeDetectorIfSupported: true } }, onSuccessRef.current, onFailureRef.current); setScannerInitialized(true); } catch { }
  };

  const info = scannedRes ? resolveReservationInfo(reservations, allUsers, spaces, scannedRes.id) : null;
  const client = info ? info.user : null;
  const space = info ? info.space : null;

  return (
    <div className="min-h-screen bg-white dark:bg-black font-sans bg-grid-pattern">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-black border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${scanStatus === 'error' ? 'bg-red-100 dark:bg-red-900/20' : scanStatus === 'success' ? 'bg-green-100 dark:bg-green-900/20' : 'bg-zinc-100 dark:bg-zinc-900'}`}>
              <span className={`material-symbols-outlined ${scanStatus === 'error' ? 'text-red-600' : scanStatus === 'success' ? 'text-green-600' : 'text-zinc-900 dark:text-white'}`}>
                {scanStatus === 'scanning' ? 'qr_code_scanner' : scanStatus === 'success' ? 'check_circle' : 'error'}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-white">
                {scanStatus === 'scanning' ? 'Scanner QR' : scanStatus === 'success' ? 'Check-in Validé' : 'Erreur'}
              </h1>
              <p className="text-xs text-zinc-500">Admin Check-in System</p>
            </div>
          </div>
          <button onClick={() => navigate('/admin')} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span className="text-sm font-bold">Retour</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {scanStatus === 'scanning' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Scanner */}
            <div className="relative w-full aspect-square max-w-2xl mx-auto rounded-3xl overflow-hidden border-2 border-zinc-900 dark:border-white bg-black shadow-2xl">
              <div id="reader" className="absolute inset-0 z-10"></div>
              {!scannerInitialized && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-black">
                  <div className="w-12 h-12 border-4 border-zinc-800 border-t-white rounded-full animate-spin mb-4"></div>
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Initialisation...</span>
                </div>
              )}
              {scannerInitialized && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                  <div className="w-64 h-64 relative">
                    <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-2xl"></div>
                    <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-2xl"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="space-y-6">
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Caméra Active</div>
                    <div className="text-sm font-bold text-zinc-900 dark:text-white mt-1">{activeCameraLabel}</div>
                  </div>
                  <button
                    onClick={switchCamera}
                    disabled={availableCameras.length < 2}
                    className="w-14 h-14 rounded-full border-2 border-zinc-900 dark:border-white bg-white dark:bg-black text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center justify-center transition active:scale-95 shadow-lg"
                  >
                    <span className="material-symbols-outlined text-2xl">cameraswitch</span>
                  </button>
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">Saisie Manuelle</label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">qr_code</span>
                      <input
                        type="text"
                        placeholder="ID de réservation"
                        value={manualId}
                        onChange={(e) => setManualId(e.target.value)}
                        className="w-full bg-white dark:bg-black border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:border-black dark:focus:border-white outline-none transition-all font-mono text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-14 h-14 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold hover:opacity-90 transition flex items-center justify-center shadow-lg active:scale-95"
                    >
                      <span className="material-symbols-outlined">search</span>
                    </button>
                  </div>
                </form>
              </div>

              <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                Placez le QR code face à la caméra ou entrez l'ID manuellement
              </div>
            </div>
          </div>
        )}

        {scanStatus === 'success' && scannedRes && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Client Info */}
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center text-2xl font-black text-zinc-900 dark:text-white border-2 border-zinc-900 dark:border-white">
                  {client?.firstName?.[0]}{client?.lastName?.[0]}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-zinc-900 dark:text-white">{client ? `${client.firstName} ${client.lastName}` : 'Visiteur'}</h2>
                  <div className="flex items-center gap-2 text-zinc-500 text-sm font-bold mt-1">
                    <span className="material-symbols-outlined text-base">{client?.type === 'COMPANY' ? 'business_center' : 'person'}</span>
                    {client?.companyName || 'Particulier'}
                  </div>
                </div>
              </div>

              {client?.email && (
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={() => copyToClipboard(client.email)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition text-sm font-bold">
                    <span className="material-symbols-outlined text-lg">content_copy</span> {client.email}
                  </button>
                  {client.phone && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-zinc-700 dark:text-zinc-300 text-sm font-bold">
                      <span className="material-symbols-outlined text-lg">call</span> {client.phone}
                    </span>
                  )}
                  <a href={`mailto:${client.email}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition text-sm font-bold">
                    <span className="material-symbols-outlined text-lg">mail</span> Contacter
                  </a>
                </div>
              )}
            </div>

            {/* Reservation Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-black">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-zinc-900 dark:text-white">location_on</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Espace</div>
                    <div className="text-lg font-black text-zinc-900 dark:text-white">{space?.name || 'Inconnu'}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-black">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-zinc-900 dark:text-white">schedule</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Créneau</div>
                    <div className="text-lg font-black text-zinc-900 dark:text-white">{scannedRes.customTimeLabel || scannedRes.slot}</div>
                    <div className="text-xs text-zinc-500 mt-1 font-bold">{scannedRes.date}{scannedRes.endDate ? ` → ${scannedRes.endDate}` : ''}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-black">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-green-600">check_circle</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Statut</div>
                    <div className="text-sm font-black text-zinc-900 dark:text-white">{scannedRes.status}</div>
                    {scannedRes.checkedInAt && (
                      <div className="text-xs text-zinc-500 mt-1 font-bold">Arrivée: {new Date(scannedRes.checkedInAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-black">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-zinc-900 dark:text-white">qr_code_2</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">ID</div>
                    <div className="text-xs font-mono text-zinc-900 dark:text-white break-all font-bold">{scannedRes.id}</div>
                  </div>
                </div>
              </div>
            </div>

            {qrUrl && (
              <div className="bg-zinc-50 dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <img src={qrUrl} alt="QR" className="w-32 h-32 rounded-2xl border-2 border-zinc-900 dark:border-white shadow-lg" />
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Actions</div>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setActionMenu({ x: rect.left, y: rect.bottom + 8 });
                          }}
                          className="w-10 h-10 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 flex items-center justify-center transition"
                        >
                          <span className="material-symbols-outlined text-zinc-600 dark:text-zinc-400">more_vert</span>
                        </button>

                        {actionMenu && (
                          <div
                            ref={menuRef}
                            className="fixed z-50 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-100 dark:border-zinc-800 py-1 w-56 overflow-hidden animate-fade-in"
                            style={{ top: actionMenu.y, left: actionMenu.x - 180 }} // Adjust position to align properly
                          >
                            <a
                              href={qrUrl}
                              download={`qr-${scannedRes.id}.png`}
                              className="w-full text-left px-4 py-3 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-3 transition-colors"
                              onClick={() => setActionMenu(null)}
                            >
                              <span className="material-symbols-outlined text-lg">download</span> Télécharger
                            </a>
                            <button
                              onClick={() => {
                                setActionMenu(null);
                                const w = window.open('', '_blank');
                                if (!w) return;
                                w.document.write(`<!DOCTYPE html><html><head><title>QR Code</title><style>body{margin:0;padding:20px;display:flex;align-items:center;justify-content:center;background:#fff}img{width:320px;height:320px}</style></head><body><img src="${qrUrl}" /></body></html>`);
                                w.document.close();
                                setTimeout(() => { try { w.print(); } catch { } }, 300);
                              }}
                              className="w-full text-left px-4 py-3 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-3 transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">print</span> Imprimer
                            </button>
                            <button
                              onClick={() => {
                                setActionMenu(null);
                                copyToClipboard(scannedRes.id);
                              }}
                              className="w-full text-left px-4 py-3 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-3 transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">content_copy</span> Copier ID
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Event Info */}
            {scannedRes.eventName && (
              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-black">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Événement</div>
                <div className="text-xl font-black text-zinc-900 dark:text-white">{scannedRes.eventName}</div>
                {scannedRes.eventDescription && (
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">{scannedRes.eventDescription}</div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-center pt-4">
              <button onClick={handleRetry} className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg hover:opacity-90 transition shadow-xl flex items-center gap-3 active:scale-95">
                <span className="material-symbols-outlined">qr_code_scanner</span> Nouveau Scan
              </button>
            </div>
          </div>
        )}

        {scanStatus === 'error' && (
          <div className="max-w-xl mx-auto text-center">
            <div className="w-32 h-32 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mb-8 border-2 border-red-200 dark:border-red-900/30 mx-auto">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400" style={{ fontSize: '48px' }}>error</span>
            </div>
            <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-3">Erreur de scan</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-base mb-8 font-medium">{errorMessage}</p>
            <div className="flex items-center justify-center gap-4">
              <button onClick={handleRetry} className="px-6 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold inline-flex items-center gap-2 hover:opacity-90 transition shadow-xl active:scale-95">
                <span className="material-symbols-outlined">refresh</span> Réessayer
              </button>
              <button onClick={() => setScanStatus('scanning')} className="px-6 py-4 border-2 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-zinc-900 dark:text-white rounded-2xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition active:scale-95">
                Retour au scan
              </button>
            </div>
          </div>
        )}
      </main>

      <style>{`
        #reader { border: none !important; background: black; }
        #reader video { object-fit: cover; width: 100% !important; height: 100% !important; border-radius: 0 !important; }
        #reader__scan_region { display: none; }
        #reader__dashboard_section_csr span { display: none; }
        #reader__dashboard_section_swaplink { display: none !important; }
        
        .bg-grid-pattern {
          background-size: 40px 40px;
          background-image: linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
        }
        .dark .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
        }
      `}</style>
    </div>
  );
};

export default AdminCheckin;
