import { Shield, ArrowDown, X } from 'lucide-react';

// Modal de bienvenida. Devuelve null si no debe mostrarse.
export default function Onboarding({ show, onClose }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
      {/* Flecha apuntando a los tickets */}
      <div className="absolute bottom-[15%] left-[5%] z-20 flex flex-col items-center animate-bounce hidden md:flex">
        <div className="text-orange-500 font-bold font-mono mb-2 text-lg shadow-black drop-shadow-md">
          TICKETS HERE
        </div>
        <ArrowDown size={64} className="text-orange-500 filter drop-shadow-lg" />
      </div>

      <div className="bg-slate-800 border border-slate-600 p-8 rounded-2xl shadow-2xl max-w-lg relative z-10 mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="bg-orange-600 p-2 rounded-lg">
            <Shield size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome, Network Admin</h2>
        </div>

        <div className="space-y-4 text-slate-300 leading-relaxed">
          <p>
            You're a Network/IT Admin, and there are incoming tickets on the{' '}
            <span className="text-orange-400 font-bold">down left corner</span> of the page.
          </p>
          <p>
            You need to configure new firewall rules to resolve these tickets. Analyze the traffic,
            set the correct Source, Destination, and Actions, and keep the network secure!
          </p>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-orange-500/20 transition-all transform hover:-translate-y-1"
          >
            Let's Start
          </button>
        </div>
      </div>
    </div>
  );
}
