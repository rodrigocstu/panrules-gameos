import { useState } from 'react';
import { Wand2, CheckCircle, XCircle, Copy, Download } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext.jsx';
import { ZONES, APPS, SERVICES, PROFILES } from '../../data/constants';
import { EMPTY_DRAFT, buildLevel, validateDraft } from '../../lib/levelDraft.js';

const ZONE_IDS = Object.keys(ZONES);
const NAT_TYPES = ['NONE', 'SNAT', 'DNAT', 'DNAT+SNAT'];
const TIERS = ['F', 'N', 'A'];

// Campo de texto reutilizable.
function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-orange-500"
      >
        {options.map((o) => (
          <option key={o.id ?? o} value={o.id ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * LevelBuilder — formulario WYSIWYG (sin código) que produce un objeto Level
 * válido. Valida contra el motor (la solución debe ganar) y exporta JSON.
 */
export default function LevelBuilder() {
  const { t } = useI18n();
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const set = (key) => (val) => {
    setDraft((d) => ({ ...d, [key]: val }));
    setResult(null);
  };

  const toggleTrack = (track) => {
    setDraft((d) => {
      const has = d.tracks.includes(track);
      return { ...d, tracks: has ? d.tracks.filter((x) => x !== track) : [...d.tracks, track] };
    });
    setResult(null);
  };

  const handleValidate = () => setResult(validateDraft(draft));

  const json = JSON.stringify(buildLevel(draft), null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard no disponible.
    }
  };

  const handleDownload = () => {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `level-${draft.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* Formulario */}
      <div className="space-y-4">
        {/* Metadatos */}
        <section className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            {t('console.builder.meta')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ID" value={draft.id} onChange={set('id')} type="number" />
            <SelectField label="Tier" value={draft.tier} onChange={set('tier')} options={TIERS} />
          </div>
          <div className="flex gap-4 text-xs text-slate-300">
            {['ngfw-engineer', 'netsec-architect'].map((tr) => (
              <label key={tr} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={draft.tracks.includes(tr)}
                  onChange={() => toggleTrack(tr)}
                  className="accent-orange-500"
                />
                {t(`track.${tr}`)}
              </label>
            ))}
          </div>
        </section>

        {/* Textos bilingües */}
        <section className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            {t('console.builder.texts')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('console.builder.titleEs')} value={draft.titleEs} onChange={set('titleEs')} />
            <Field label={t('console.builder.titleEn')} value={draft.titleEn} onChange={set('titleEn')} />
            <Field label={t('console.builder.descEs')} value={draft.descEs} onChange={set('descEs')} />
            <Field label={t('console.builder.descEn')} value={draft.descEn} onChange={set('descEn')} />
            <Field label={t('console.builder.hintEs')} value={draft.hintEs} onChange={set('hintEs')} />
            <Field label={t('console.builder.hintEn')} value={draft.hintEn} onChange={set('hintEn')} />
            <Field label={t('console.builder.explEs')} value={draft.explEs} onChange={set('explEs')} />
            <Field label={t('console.builder.explEn')} value={draft.explEn} onChange={set('explEn')} />
          </div>
        </section>

        {/* Paquete + solución */}
        <section className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            {t('console.builder.policy')}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label={t('editor.aria.srcZone')} value={draft.srcZone} onChange={set('srcZone')} options={ZONE_IDS} />
            <SelectField label={t('editor.aria.dstZone')} value={draft.dstZone} onChange={set('dstZone')} options={ZONE_IDS} />
            <Field label="Source IP" value={draft.srcIp} onChange={set('srcIp')} />
            <Field label="Dest IP" value={draft.dstIp} onChange={set('dstIp')} />
            <SelectField label={`${t('editor.aria.app')} (packet)`} value={draft.packetApp} onChange={set('packetApp')} options={APPS} />
            <SelectField label={`${t('editor.aria.app')} (solution)`} value={draft.solApp} onChange={set('solApp')} options={APPS} />
            <SelectField label={t('editor.aria.service')} value={draft.solService} onChange={set('solService')} options={SERVICES} />
            <SelectField label={t('editor.aria.profile')} value={draft.solProfile} onChange={set('solProfile')} options={PROFILES} />
            <SelectField label={t('editor.aria.action')} value={draft.solAction} onChange={set('solAction')} options={['ALLOW', 'DENY']} />
            <SelectField label={t('nat.aria.type')} value={draft.solNat} onChange={set('solNat')} options={NAT_TYPES} />
          </div>
        </section>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleValidate}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            <Wand2 size={16} /> {t('console.builder.validate')}
          </button>
        </div>
      </div>

      {/* Resultado + preview JSON */}
      <div className="space-y-3">
        {result && (
          <div
            role="status"
            className={`rounded-lg border p-3 text-sm flex items-start gap-2 ${
              result.valid
                ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                : 'border-red-500 bg-red-950/40 text-red-300'
            }`}
          >
            {result.valid ? (
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
            ) : (
              <XCircle size={18} className="shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold">
                {result.valid ? t('console.builder.valid') : t('console.builder.invalid')}
              </div>
              {result.fieldErrors.length > 0 && (
                <div className="text-xs mt-1">
                  {t('console.builder.missing')}: {result.fieldErrors.join(', ')}
                </div>
              )}
              {!result.verdict.isWin && (
                <div className="text-xs mt-1">
                  {t('console.builder.engine')}: {result.verdict.reasonCode}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <Copy size={14} /> {copied ? t('set.copied') : t('console.builder.copy')}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <Download size={14} /> {t('console.builder.download')}
          </button>
        </div>

        <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-emerald-300 font-mono overflow-auto max-h-[60vh]">
          {json}
        </pre>
      </div>
    </div>
  );
}
