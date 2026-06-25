import { Shield } from 'lucide-react';

// Barra superior estática: marca del simulador + dispositivo.
export default function TopBar() {
  return (
    <div className="bg-slate-950 border-b border-slate-800 px-4 lg:px-6 py-3 flex justify-between items-center z-50">
      <div className="flex items-center gap-3">
        <div className="bg-orange-600 p-1.5 rounded text-white shrink-0">
          <Shield size={20} />
        </div>
        <div>
          <h1 className="font-bold text-base lg:text-lg text-slate-100 tracking-tight">
            PAN-OS <span className="text-orange-500">NGFW</span>{' '}
            <span className="hidden sm:inline">SIMULATOR</span>
          </h1>
          <div className="text-xs text-slate-500 font-mono">MANAGEMENT CONSOLE</div>
        </div>
      </div>
      <div className="flex items-center gap-6 text-xs font-mono">
        <div className="flex flex-col items-end">
          <span className="text-slate-500 hidden sm:block">DEVICE</span>
          <span className="text-emerald-400">PA-3220-HQ</span>
        </div>
      </div>
    </div>
  );
}
