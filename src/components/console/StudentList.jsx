import { useState } from 'react';
import { Users, Plus, Trash2, GraduationCap } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { useCohorts } from '../../hooks/useCohorts.js';
import { LEVELS } from '../../data/levels';

const TRACKS = ['ngfw-engineer', 'netsec-architect'];

// Cuántos niveles cubre cada track (para mostrar el tamaño del temario asignado).
function levelsInTrack(track) {
  return LEVELS.filter((l) => {
    if (track === 'ngfw-engineer') return l.tier === 'F' || (l.tracks || []).includes('ngfw-engineer');
    if (track === 'netsec-architect') return l.tier === 'A' || (l.tracks || []).includes('netsec-architect');
    return false;
  }).length;
}

/**
 * StudentList — gestión de cohorts de instructor (WBS 4.3).
 *
 * Crear/editar/eliminar cohorts y asignarles un cert track. Todo se persiste en
 * localStorage vía useCohorts (sin backend, herramienta de autor/instructor).
 */
export default function StudentList() {
  const { t } = useI18n();
  const { cohorts, addCohort, updateCohort, removeCohort } = useCohorts();
  const [name, setName] = useState('');
  const [track, setTrack] = useState('ngfw-engineer');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addCohort(name, track);
    setName('');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Formulario de alta */}
      <form
        onSubmit={handleAdd}
        className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Plus size={16} className="text-orange-500" /> {t('console.cohorts.new')}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('console.cohorts.namePlaceholder')}
            aria-label={t('console.cohorts.name')}
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
          <select
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            aria-label={t('console.cohorts.track')}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
          >
            {TRACKS.map((tr) => (
              <option key={tr} value={tr}>
                {t(`track.${tr}`)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!name.trim()}
            className="bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            {t('console.cohorts.add')}
          </button>
        </div>
      </form>

      {/* Lista de cohorts */}
      {cohorts.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12 text-slate-500">
          <Users size={40} className="mb-3 opacity-50" />
          <p className="text-sm">{t('console.cohorts.empty')}</p>
        </div>
      ) : (
        <ul className="space-y-2" aria-label={t('console.cohorts.listAria')}>
          {cohorts.map((cohort) => (
            <li
              key={cohort.id}
              className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center gap-3"
            >
              <div className="p-2 rounded-md bg-slate-700">
                <GraduationCap size={18} className="text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">{cohort.name}</div>
                <div className="text-xs text-slate-400">
                  {levelsInTrack(cohort.track)} {t('console.cohorts.levels')}
                </div>
              </div>
              <select
                value={cohort.track}
                onChange={(e) => updateCohort(cohort.id, { track: e.target.value })}
                aria-label={t('console.cohorts.changeTrack')}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
              >
                {TRACKS.map((tr) => (
                  <option key={tr} value={tr}>
                    {t(`track.${tr}`)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeCohort(cohort.id)}
                aria-label={`${t('console.cohorts.delete')}: ${cohort.name}`}
                className="text-slate-400 hover:text-red-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded p-1"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
