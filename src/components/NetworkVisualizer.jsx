import { Shield, Server, Globe, Laptop, Wifi, Lock, FileText } from 'lucide-react';

// Visualizador de red: grid de 4 zonas + firewall central + paquete animado +
// overlay de commit. El overlay de resultado se pasa como `children` (lo monta App).
export default function NetworkVisualizer({
  level,
  gameState,
  commitProgress,
  packetCoords,
  children,
}) {
  return (
    <div className="h-1/2 border-b border-slate-800 relative bg-[#0B1120] overflow-hidden p-8">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      ></div>

      {/* Commit Overlay */}
      {gameState === 'committing' && (
        <div className="absolute inset-0 bg-slate-950/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="w-64 bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
            <div
              className="bg-orange-500 h-full transition-all duration-200 ease-out"
              style={{ width: `${commitProgress}%` }}
            ></div>
          </div>
          <div className="text-orange-500 font-mono text-sm animate-pulse">Committing...</div>
        </div>
      )}

      {/* Animated Packet Layer (On Top) */}
      <div
        className="absolute z-30 transition-all duration-500 linear flex flex-col items-center justify-center pointer-events-none"
        style={{
          left: `${packetCoords.x}%`,
          top: `${packetCoords.y}%`,
          opacity: packetCoords.opacity,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className={`w-8 h-8 rounded-full shadow-xl flex items-center justify-center relative ${packetCoords.color}`}
        >
          <div
            className={`absolute inset-0 rounded-full animate-ping opacity-75 ${packetCoords.color}`}
          ></div>
          {level.packet.app === 'ssl' ? (
            <Lock size={14} className="text-black" />
          ) : level.packet.app === 'dns' ? (
            <Globe size={14} className="text-black" />
          ) : (
            <FileText size={14} className="text-black" />
          )}
        </div>
        <div className="mt-2 bg-black/90 text-white text-[10px] px-2 py-1 rounded border border-slate-600 whitespace-nowrap font-mono shadow-lg transform -translate-x-1/2 left-1/2 absolute top-full">
          {packetCoords.label}
        </div>
      </div>

      {/* Grid Layout for Zones */}
      <div className="w-full h-full grid grid-cols-3 gap-8">
        {/* Left Column: Trust & Guest */}
        <div className="flex flex-col gap-6 h-full">
          {/* Trust */}
          <div
            className={`flex-1 border-2 border-dashed rounded-2xl p-4 relative transition-all duration-500 ${level.packet.srcZone === 'trust' ? 'border-emerald-500 bg-emerald-900/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]' : 'border-slate-700 bg-slate-900/40'}`}
          >
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm uppercase tracking-wider">
              <Laptop size={16} /> Trust-L3
            </div>
            <div className="text-[10px] text-emerald-700/70 font-mono mt-1">10.1.1.0/24</div>
            <div className="absolute bottom-3 right-3 opacity-10">
              <Laptop size={64} />
            </div>
          </div>
          {/* Guest */}
          <div
            className={`flex-1 border-2 border-dashed rounded-2xl p-4 relative transition-all duration-500 ${level.packet.srcZone === 'guest' ? 'border-yellow-500 bg-yellow-900/20 shadow-[0_0_30px_rgba(234,179,8,0.15)]' : 'border-slate-700 bg-slate-900/40'}`}
          >
            <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm uppercase tracking-wider">
              <Wifi size={16} /> Guest-L3
            </div>
            <div className="text-[10px] text-yellow-700/70 font-mono mt-1">172.16.0.0/24</div>
            <div className="absolute bottom-3 right-3 opacity-10">
              <Wifi size={64} />
            </div>
          </div>
        </div>

        {/* Center Column: Firewall */}
        <div className="flex items-center justify-center relative">
          {/* Connecting Lines */}
          <div className="absolute w-full h-1 bg-slate-800 top-1/4 -z-10"></div>{' '}
          {/* Trust -> Untrust Path */}
          <div className="absolute w-full h-1 bg-slate-800 bottom-1/4 -z-10"></div>{' '}
          {/* Guest -> DMZ Path */}
          <div className="absolute h-full w-1 bg-slate-800 left-1/2 -z-10"></div>{' '}
          {/* Vertical Path */}
          <div className="w-48 h-48 bg-slate-800 rounded-xl border-2 border-orange-500 shadow-[0_0_60px_rgba(249,115,22,0.25)] flex flex-col items-center justify-center z-20 relative">
            <Shield size={56} className="text-orange-500 mb-3 filter drop-shadow-lg" />
            <div className="text-xs font-bold text-white tracking-widest">PA-3220</div>
            <div className="text-[9px] text-slate-400 font-mono mt-1">203.0.113.1</div>
            {/* Interfaces */}
            <div className="absolute top-8 -left-3 bg-slate-900 border border-slate-600 text-[9px] text-emerald-500 px-1 rounded">
              eth1/2
            </div>
            <div className="absolute top-8 -right-3 bg-slate-900 border border-slate-600 text-[9px] text-blue-500 px-1 rounded">
              eth1/1
            </div>
            <div className="absolute bottom-8 -left-3 bg-slate-900 border border-slate-600 text-[9px] text-yellow-500 px-1 rounded">
              eth1/4
            </div>
            <div className="absolute bottom-8 -right-3 bg-slate-900 border border-slate-600 text-[9px] text-purple-500 px-1 rounded">
              eth1/3
            </div>
          </div>
        </div>

        {/* Right Column: Untrust & DMZ */}
        <div className="flex flex-col gap-6 h-full">
          {/* Untrust */}
          <div
            className={`flex-1 border-2 border-dashed rounded-2xl p-4 relative transition-all duration-500 ${level.packet.dstZone === 'untrust' ? 'border-blue-500 bg-blue-900/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]' : 'border-slate-700 bg-slate-900/40'}`}
          >
            <div className="flex items-center gap-2 text-blue-500 font-bold text-sm uppercase tracking-wider justify-end">
              Untrust-L3 <Globe size={16} />
            </div>
            <div className="text-[10px] text-blue-700/70 font-mono mt-1 text-right">0.0.0.0/0</div>
            <div className="absolute bottom-3 left-3 opacity-10">
              <Globe size={64} />
            </div>
          </div>
          {/* DMZ */}
          <div
            className={`flex-1 border-2 border-dashed rounded-2xl p-4 relative transition-all duration-500 ${level.packet.dstZone === 'dmz' ? 'border-purple-500 bg-purple-900/20 shadow-[0_0_30px_rgba(168,85,247,0.15)]' : 'border-slate-700 bg-slate-900/40'}`}
          >
            <div className="flex items-center gap-2 text-purple-500 font-bold text-sm uppercase tracking-wider justify-end">
              DMZ-L3 <Server size={16} />
            </div>
            <div className="text-[10px] text-purple-700/70 font-mono mt-1 text-right">
              192.168.50.0/24
            </div>
            <div className="absolute bottom-3 left-3 opacity-10">
              <Server size={64} />
            </div>
          </div>
        </div>
      </div>

      {/* Results Overlay (inyectado por App) */}
      {children}
    </div>
  );
}
