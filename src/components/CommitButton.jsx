import { Save } from 'lucide-react';

// Botón flotante de commit. Deshabilitado salvo en estado 'idle'.
export default function CommitButton({ gameState, onCommit }) {
  return (
    <div className="absolute bottom-36 right-6 z-50">
      <button
        onClick={onCommit}
        disabled={gameState !== 'idle'}
        className={`flex items-center gap-2 px-6 py-4 rounded-lg shadow-2xl font-bold text-sm transition-all transform ${gameState === 'idle' ? 'bg-orange-600 hover:bg-orange-500 text-white hover:scale-105' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
      >
        <Save size={18} /> {gameState === 'committing' ? 'Committing...' : 'Commit Changes'}
      </button>
    </div>
  );
}
