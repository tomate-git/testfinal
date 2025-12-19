
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Space, BookingStatus } from '../../types';
import { AdminEditSpaceModal } from './modals/AdminEditSpaceModal';
import { MousePointer2, Layers } from 'lucide-react';

interface AdminFloorPlanProps {
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

export const AdminFloorPlan: React.FC<AdminFloorPlanProps> = ({ setIsSidebarCollapsed }) => {
  const { spaces, updateSpace, reservations } = useApp();
  const [hoveredSpace, setHoveredSpace] = useState<Space | null>(null);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);

  // Helper to check if space is busy today
  const isSpaceBusy = (spaceId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return reservations.some(r => r.spaceId === spaceId && r.date === today && r.status === BookingStatus.CONFIRMED);
  };

  // Function to map SVG paths to Spaces based on string matching
  const findSpace = (keyword: string, index?: number) => {
    if (index !== undefined) {
      return spaces.find(s => s.name.toLowerCase().includes(keyword) && s.name.includes(`${index}`)) || null;
    }
    return spaces.find(s => s.name.toLowerCase().includes(keyword)) || null;
  };

  // Component for Door Indicators
  const Door = ({ x, y, vertical = false, rotation = 0 }: { x: number, y: number, vertical?: boolean, rotation?: number }) => (
    <g transform={`translate(${x},${y}) rotate(${rotation})`}>
      <rect
        x={vertical ? -3 : -15}
        y={vertical ? -15 : -3}
        width={vertical ? 6 : 30}
        height={vertical ? 30 : 6}
        fill="white"
        stroke="#1e293b"
        strokeWidth="2"
        rx="1"
        className="drop-shadow-md"
      />
      <path
        d={vertical ? "M0,-15 Q25,0 0,15" : "M-15,0 Q0,25 15,0"}
        fill="none"
        stroke="white"
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.6"
      />
    </g>
  );

  // Interactive Zone Component
  const Zone = ({ d, space, color, label, rotation = 0 }: { d: string, space: Space | null, color: string, label?: string, rotation?: number }) => {
    const isBusy = space ? isSpaceBusy(space.id) : false;
    const isHovered = space && hoveredSpace?.id === space.id;

    const handleClick = () => {
      if (space) {
        setEditingSpace(space);
        setIsSidebarCollapsed(true);
      }
    };

    // Calculate center for label
    const getCenter = (path: string) => {
      const coords = path.match(/[\d.]+/g)?.map(Number) || [];
      if (coords.length < 4) return { x: 0, y: 0 };
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (let i = 0; i < coords.length; i += 2) {
        const x = coords[i], y = coords[i + 1];
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
    };

    const center = getCenter(d);

    return (
      <g
        onClick={handleClick}
        onMouseEnter={() => space && setHoveredSpace(space)}
        onMouseLeave={() => setHoveredSpace(null)}
        className={`${space ? 'cursor-pointer' : 'cursor-default'} transition-all duration-300 group`}
        style={{ filter: isHovered ? `drop-shadow(0 0 15px ${color})` : 'none' }}
      >
        {/* 3D Depth Effect */}
        <path
          d={d}
          fill={color}
          fillOpacity={isHovered ? 0.2 : 0.1}
          stroke="none"
          style={{ transform: 'translate(6px, 6px)' }}
        />

        {/* Main Shape */}
        <path
          d={d}
          fill={isHovered ? color : `${color}DD`}
          fillOpacity={isHovered ? 0.95 : 0.85}
          stroke={isHovered ? 'white' : 'rgba(255,255,255,0.3)'}
          strokeWidth={isHovered ? 3 : 1}
          className="transition-all duration-300 ease-out"
        />

        {/* Label */}
        {label && (
          <text
            x={center.x}
            y={center.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="12"
            fontWeight="bold"
            className="pointer-events-none font-sans tracking-widest uppercase"
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              transformBox: 'fill-box',
              transformOrigin: 'center',
              transform: `rotate(${rotation}deg)`
            }}
          >
            {label}
          </text>
        )}

        {/* Status Dot */}
        {isBusy && (
          <circle cx={center.x + 20} cy={center.y - 20} r="4" fill="#ef4444" stroke="white" strokeWidth="2" className="animate-pulse" />
        )}
      </g>
    );
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-[#0B1120] relative overflow-hidden rounded-3xl border border-slate-800 shadow-2xl">

      {/* Technical Background */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
                   linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), 
                   linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
                   radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.05) 0%, transparent 50%)
               `,
          backgroundSize: '40px 40px, 40px 40px, 100% 100%'
        }}>
      </div>

      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 pointer-events-none">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Layers size={24} className="text-ess-500" /> ARCHITECTURE
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-mono">VUE AÉRIENNE NIVEAU 0</p>
        </div>

        {/* Legend */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-4 rounded-xl pointer-events-auto shadow-xl">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs font-bold text-slate-300">
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#22c55e] rounded shadow-[0_0_10px_#22c55e]"></div> Green Room</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#d946ef] rounded shadow-[0_0_10px_#d946ef]"></div> Studio</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#f472b6] rounded shadow-[0_0_10px_#f472b6]"></div> Kiosques</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#3b82f6] rounded shadow-[0_0_10px_#3b82f6]"></div> Containers</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#eab308] rounded shadow-[0_0_10px_#eab308]"></div> Numérique / Commun</div>
          </div>
        </div>
      </div>

      {/* 3D Map Container */}
      <div className="flex-1 flex items-center justify-center relative z-10 overflow-hidden">
        <div className="relative w-full h-full p-4 flex items-center justify-center scale-95">

          <svg viewBox="0 0 1000 600" className="w-full h-full max-w-[1100px] drop-shadow-2xl transition-transform duration-500">

            {/* WALLS / FLOORPLAN OUTLINE */}
            {/* Defined by the outer shape: Diagonal left, straight top, straight right, stepped bottom */}
            <path
              d="M50 450 L350 50 L700 50 L700 150 L850 150 L950 150 L950 550 L800 600 L150 600 L50 450 Z"
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="6"
              className="drop-shadow-2xl"
            />

            {/* --- ZONE 2: GREEN ROOM (Top Left, Diagonal) --- */}
            {/* The large upper-left area defined by the diagonal wall */}
            <Zone
              d="M60 440 L350 60 L650 60 L650 400 L200 400 L60 440 Z"
              space={findSpace('green')}
              color="#22c55e"
              label="GREEN ROOM"
              rotation={-15}
            />

            {/* --- STUDIO (Bottom Left, Purple) --- */}
            {/* Located strictly BELOW the Green Room */}
            <Zone
              d="M50 460 L200 410 L200 590 L120 590 L50 500 Z"
              space={findSpace('studio')}
              color="#d946ef"
              label="STUDIO"
            />

            {/* Media (Small part next to studio) */}
            <Zone
              d="M210 410 L350 410 L350 590 L210 590 Z"
              space={findSpace('media')}
              color="#c026d3"
              label="MEDIA"
            />

            {/* --- KIOSQUES (Top Right, Zone 3, Pink) --- */}
            {/* Horizontal row top right */}
            <g transform="translate(660, 160)">
              <Zone d="M0 0 L60 0 L60 60 L0 60 Z" space={findSpace('kiosque', 1)} color="#f472b6" label="K1" />
              <Zone d="M70 0 L130 0 L130 60 L70 60 Z" space={findSpace('kiosque', 2)} color="#f472b6" label="K2" />
              <Zone d="M140 0 L200 0 L200 60 L140 60 Z" space={findSpace('kiosque', 3)} color="#f472b6" label="K3" />
              <Zone d="M0 70 L60 70 L60 130 L0 130 Z" space={findSpace('kiosque', 4)} color="#f472b6" label="K4" />
              <Zone d="M70 70 L130 70 L130 130 L70 130 Z" space={findSpace('kiosque', 5)} color="#f472b6" label="K5" />
            </g>

            {/* --- CONTAINERS (Far Right, Blue) --- */}
            {/* Vertical column on the right edge */}
            <g transform="translate(870, 160)">
              <Zone d="M0 0 L70 0 L70 60 L0 60 Z" space={findSpace('container', 1)} color="#3b82f6" label="C1" />
              <Zone d="M0 70 L70 70 L70 130 L0 130 Z" space={findSpace('container', 2)} color="#3b82f6" label="C2" />
              <Zone d="M0 140 L70 140 L70 200 L0 200 Z" space={findSpace('container', 3)} color="#3b82f6" label="C3" />
            </g>

            {/* --- NUMÉRIQUE / COMMUN (Bottom Center/Right, Yellow) --- */}
            <Zone
              d="M360 410 L650 410 L650 590 L360 590 Z"
              space={findSpace('numérique')}
              color="#eab308"
              label="NUMÉRIQUE / COMMUN"
            />

            {/* --- DOORS INDICATORS --- */}
            {/* Studio Door */}
            <Door x={200} y={500} vertical />

            {/* Green Room Doors */}
            <Door x={400} y={400} />
            <Door x={500} y={400} />

            {/* Kiosks Doors */}
            <Door x={690} y={220} />
            <Door x={760} y={220} />
            <Door x={830} y={220} />

            {/* Containers Doors */}
            <Door x={870} y={190} vertical />
            <Door x={870} y={260} vertical />
            <Door x={870} y={330} vertical />

            {/* Main Entrance (Bottom Right angled) */}
            <g transform="translate(750, 600) rotate(0)">
              <rect x="-20" y="-5" width="40" height="10" fill="white" />
              <text x="0" y="-15" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">SORTIE SECURS</text>
            </g>

            {/* Main Entrance (Bottom Left) */}
            <g transform="translate(100, 550) rotate(-45)">
              <rect x="-20" y="-5" width="40" height="10" fill="#22c55e" />
              <text x="0" y="-15" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">ENTRÉE</text>
            </g>

          </svg>
        </div>
      </div>

      {/* Hover Details Overlay */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none">
        <div className={`bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-6 rounded-2xl shadow-2xl w-80 transition-all duration-300 transform ${hoveredSpace ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {hoveredSpace && (
            <>
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-black text-white leading-none uppercase">{hoveredSpace.name}</h3>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-2 py-1 rounded uppercase">{hoveredSpace.category}</span>
                {isSpaceBusy(hoveredSpace.id) ?
                  <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-2 py-1 rounded uppercase border border-red-500/50 animate-pulse">Occupé</span>
                  :
                  <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-1 rounded uppercase border border-green-500/50">Libre</span>
                }
              </div>

              {!hoveredSpace.pricing.isQuote && (
                <div className="flex justify-end items-center text-slate-400 text-sm pt-3 border-t border-slate-700">
                  <span className="font-bold text-white text-lg">
                    {hoveredSpace.pricing.day === 0 ? 'Gratuit' : `${hoveredSpace.pricing.day}€`} <span className="text-xs font-normal text-slate-500">{hoveredSpace.pricing.day === 0 ? '' : '/j'}</span>
                  </span>
                </div>
              )}
              <div className="mt-3 flex items-center gap-2 text-ess-400 text-xs font-bold uppercase tracking-wider">
                <MousePointer2 size={12} /> Cliquez pour configurer
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Modal Integration */}
      {editingSpace && (
        <AdminEditSpaceModal
          space={editingSpace}
          onClose={() => setEditingSpace(null)}
          onUpdate={async (updatedSpace) => { await updateSpace(updatedSpace); setEditingSpace(null); }}
          allSpaces={spaces}
        />
      )}

    </div>
  );
};
