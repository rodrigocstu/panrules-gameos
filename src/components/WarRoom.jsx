import { useState } from 'react';
import { Swords, ArrowLeft, Pause, Play, RefreshCw, Users, CheckCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useI18n, pickText } from '../i18n/I18nContext.jsx';
import { navigateTo } from '../hooks/useHashRoute.js';
import { useWarRoomState, ROLES } from '../hooks/useWarRoomState.js';
import { LEVELS } from '../data/levels';
import { evaluate } from '../lib/firewall-engine';
import { APPS, SERVICES, PROFILES, ZONES } from '../data/constants';

const ZONE_IDS = Object.keys(ZONES);
const NAT_TYPES = ['NONE', 'SNAT', 'DNAT', 'DNAT+SNAT'];
// Niveles Fundamentals para la sala (tickets de demo).
const TICKET_IDS = LEVELS.filter((l) => l.tier === 'F').map((l) => l.id);

// Permisos por rol: qué campos puede editar cada jugador.
const SECURITY_FIELDS = ['srcZone', 'dstZone', 'app', 'service', 'action', 'profile'];
function canEdit(role, field) {
  if (role === 'security') return SECURITY_FIELDS.includes(field);
  if (role === 'nat') return field === 'nat';
  return false; // validator / instructor observan la config
}

const ROLE_COLOR = {
  security: 'text-emerald-400',
  nat: 'text-blue-400',
  validator: 'text-amber-400',
  instructor: 'text-purple-400',
};

export default function WarRoom() {
  const { lang, t } = useI18n();
  const { state, me, join, leave, updateConfig, setPaused, setResult, newTicket } = useWarRoomState();
  const [name, setName] = useState('');
  const [role, setRole] = useState('security');

  const level = LEVELS.find((l) => l.id === state.levelId) ?? LEVELS[0];
  const isInstructor = me?.role === 'instructor';
  const canCommit = me?.role === 'validator' || isInstructor;

  // ─── Pantalla de unión ─────────────────────────────────────────────────────
  if (!me) {
    return (
      <Shell t={t}>
        <div className="max-w-sm mx-auto mt-12 bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold">
            <Swords size={18} className="text-orange-500" /> {t('warroom.join')}
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('warroom.namePlaceholder')}
            aria-label={t('warroom.name')}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
          <div>
            <span className="text-xs text-slate-400">{t('warroom.role')}</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              aria-label={t('warroom.role')}
              className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`warroom.role.${r}`)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => join(name, role)}
            disabled={!name.trim()}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2 rounded font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          >
            {t('warroom.enter')}
          </button>
          {state.players.length > 0 && (
            <p className="text-xs text-slate-500">
              {t('warroom.inRoom', { count: state.players.length })}
            </p>
          )}
        </div>
      </Shell>
    );
  }

  // ─── Sala ──────────────────────────────────────────────────────────────────
  const commit = () => {
    if (!canCommit || state.paused) return;
    const verdict = evaluate(state.config, level);
    setResult({
      isWin: verdict.isWin,
      reasonCode: verdict.reasonCode,
      outcome: verdict.outcome,
      by: me.name,
    });
  };

  const field = (key, label, options) => {
    const editable = canEdit(me.role, key) && !state.paused;
    return (
      <label className="block">
        <span className="text-xs text-slate-400">{label}</span>
        <select
          value={state.config[key]}
          disabled={!editable}
          onChange={(e) => updateConfig({ [key]: e.target.value })}
          aria-label={label}
          className={`mt-1 w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-orange-500 ${
            editable
              ? 'bg-slate-900 border-slate-700 text-white'
              : 'bg-slate-800 border-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          {options.map((o) => (
            <option key={o.id ?? o} value={o.id ?? o}>
              {o.label ?? o}
            </option>
          ))}
        </select>
      </label>
    );
  };

  return (
    <Shell t={t} onLeave={leave}>
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Jugadores + ticket */}
        <div className="space-y-4">
          <section className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">
              <Users size={14} /> {t('warroom.players')} ({state.players.length})
            </div>
            <ul className="space-y-1">
              {state.players.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-xs">
                  <span className="text-white">
                    {p.name} {p.id === me.id && <span className="text-slate-500">({t('warroom.you')})</span>}
                  </span>
                  <span className={`font-bold ${ROLE_COLOR[p.role]}`}>{t(`warroom.role.${p.role}`)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <div className="text-xs font-bold text-orange-500 mb-1">
              {t('warroom.ticket')} #{2040 + state.levelId}
            </div>
            <p className="text-sm font-semibold text-white">{pickText(level.title, lang)}</p>
            <p className="text-xs text-slate-400 mt-1">{pickText(level.desc, lang)}</p>
            <div className="mt-2 pt-2 border-t border-slate-700 text-xs font-mono text-slate-400 space-y-0.5">
              <div>SRC: <span className="text-white">{level.packet.srcIp}</span></div>
              <div>DST: <span className="text-white">{level.packet.dstIp}</span></div>
              <div>APP: <span className="text-white">{level.packet.app}</span></div>
            </div>
          </section>
        </div>

        {/* Editor colaborativo */}
        <div className="lg:col-span-2 space-y-4">
          {state.paused && (
            <div role="status" className="bg-amber-950/50 border border-amber-500 rounded-lg px-3 py-2 text-sm text-amber-300 flex items-center gap-2">
              <Pause size={15} /> {t('warroom.pausedBanner')}
            </div>
          )}

          <section className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                {t('warroom.policy')}
              </h3>
              <span className="text-xs text-slate-500">
                {t('warroom.youEdit')}: <span className={`font-bold ${ROLE_COLOR[me.role]}`}>{t(`warroom.role.${me.role}`)}</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field('srcZone', t('editor.aria.srcZone'), ZONE_IDS)}
              {field('dstZone', t('editor.aria.dstZone'), ZONE_IDS)}
              {field('app', t('editor.aria.app'), APPS)}
              {field('service', t('editor.aria.service'), SERVICES)}
              {field('action', t('editor.aria.action'), ['ALLOW', 'DENY'])}
              {field('profile', t('editor.aria.profile'), PROFILES)}
              {field('nat', t('nat.aria.type'), NAT_TYPES)}
            </div>
          </section>

          {/* Resultado */}
          {state.result && (
            <section
              className={`rounded-lg border p-3 flex items-start gap-2 ${
                state.result.isWin
                  ? state.result.outcome === 'block-win'
                    ? 'border-sky-500 bg-sky-950/40'
                    : 'border-emerald-500 bg-emerald-950/40'
                  : 'border-red-500 bg-red-950/40'
              }`}
            >
              {state.result.isWin ? (
                state.result.outcome === 'block-win' ? (
                  <ShieldCheck size={18} className="text-sky-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                )
              ) : (
                <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                <div className="font-bold text-white">
                  {state.result.isWin ? t('warroom.result.win') : t('warroom.result.fail')}
                </div>
                <div className="text-xs text-slate-400">
                  {t('warroom.validatedBy', { name: state.result.by })} · {state.result.reasonCode}
                </div>
              </div>
            </section>
          )}

          {/* Controles */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={commit}
              disabled={!canCommit || state.paused}
              title={!canCommit ? t('warroom.onlyValidator') : undefined}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <CheckCircle size={15} /> {t('warroom.commit')}
            </button>
            {isInstructor && (
              <>
                <button
                  type="button"
                  onClick={() => setPaused(!state.paused)}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  {state.paused ? <Play size={15} /> : <Pause size={15} />}
                  {state.paused ? t('warroom.resume') : t('warroom.pause')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const idx = TICKET_IDS.indexOf(state.levelId);
                    const next = TICKET_IDS[(idx + 1) % TICKET_IDS.length];
                    newTicket(next);
                  }}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  <RefreshCw size={15} /> {t('warroom.newTicket')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

// Shell común: header con título + volver.
function Shell({ children, t, onLeave }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 px-4 lg:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-1.5 rounded text-white">
            <Swords size={20} />
          </div>
          <div>
            <h1 className="font-bold text-base lg:text-lg text-slate-100 tracking-tight">
              {t('warroom.title')}
            </h1>
            <div className="text-xs text-slate-500 font-mono">{t('warroom.subtitle')}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (onLeave) onLeave();
            navigateTo('game');
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <ArrowLeft size={14} aria-hidden="true" /> {t('console.back')}
        </button>
      </header>
      <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
    </div>
  );
}
