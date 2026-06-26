import { Save } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext.jsx';

// Botón flotante de commit. Deshabilitado salvo en estado 'idle'.
export default function CommitButton({ gameState, onCommit }) {
  const { t } = useI18n();
  return (
    <div className="absolute bottom-4 right-4 lg:right-6 z-50">
      <button
        onClick={onCommit}
        disabled={gameState !== 'idle'}
        className={`flex items-center gap-2 px-4 lg:px-6 py-3 lg:py-4 rounded-lg shadow-2xl font-bold text-sm transition-all transform focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${gameState === 'idle' ? 'bg-orange-600 hover:bg-orange-500 text-white hover:scale-105' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
      >
        <Save size={18} /> {gameState === 'committing' ? t('commit.busy') : t('commit.idle')}
      </button>
    </div>
  );
}
