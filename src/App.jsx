import { useState } from 'react';
import { LEVELS } from './data/levels';
import { createLog } from './lib/logs';
import { usePacketAnimation } from './hooks/usePacketAnimation.js';
import { useProgress } from './hooks/useProgress.js';
import TopBar from './components/TopBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import NetworkVisualizer from './components/NetworkVisualizer.jsx';
import ResultOverlay from './components/ResultOverlay.jsx';
import PolicyEditor from './components/PolicyEditor.jsx';
import TrafficLog from './components/TrafficLog.jsx';
import LogModal from './components/LogModal.jsx';
import Onboarding from './components/Onboarding.jsx';
import CommitButton from './components/CommitButton.jsx';
import LevelSelect from './components/LevelSelect.jsx';
import CompletionScreen from './components/CompletionScreen.jsx';

export default function FirewallNGFW() {
  // --- Progreso persistido (T3.2) + puntuación (T3.7) ---
  const {
    levelIdx,
    setLevelIdx,
    completed,
    attempts,
    recordResult,
    score,
    streak,
    bestStreak,
    reset,
  } = useProgress();

  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);
  const [gameState, setGameState] = useState('idle');
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  // outcome: 'allow-win' | 'block-win' | 'failure' | null  (preservado — T2.1)
  const [outcome, setOutcome] = useState(null);
  // reasonCode del último veredicto (T2.7): permite mostrar la microlección
  // específica del fallo en el ExplanationPanel del resultado.
  const [reasonCode, setReasonCode] = useState(null);

  // Policy State
  const [ruleName, setRuleName] = useState('Rule-1');
  const [srcZone, setSrcZone] = useState('trust');
  const [dstZone, setDstZone] = useState('untrust');
  const [app, setApp] = useState('any');
  const [service, setService] = useState('application-default');
  const [profile, setProfile] = useState('none');
  const [action, setAction] = useState('ALLOW');
  const [natType, setNatType] = useState('NONE');

  const level = LEVELS[levelIdx];

  const handleResult = (isWin, reason, effect, code) => {
    setGameState(isWin ? 'success' : 'failure');
    // outcome para el overlay (T2.1): acierto que permite vs. acierto que bloquea
    // vs. fallo. Coherente con el veredicto del motor (effect === finalAction).
    setOutcome(!isWin ? 'failure' : effect === 'allow' ? 'allow-win' : 'block-win');
    // reasonCode del veredicto para la microlección del resultado (T2.7).
    setReasonCode(code ?? null);
    setLogs((prev) => [createLog(level, effect, reason), ...prev]);

    // Registrar intento, completado, puntuación y racha en una transición (T3.7).
    recordResult(level.id, isWin);
  };

  // La animación y sus timers viven en el hook (cleanup garantizado, invariante #7).
  const { packetCoords, commitProgress, startCommit, resetPacket } = usePacketAnimation({
    onPhase: setGameState,
    onResult: handleResult,
  });

  // Snapshot de la política actual; los selects están deshabilitados durante la
  // animación, así que estos valores no cambian hasta que vuelve a 'idle'.
  const commitPolicy = () => {
    startCommit(level, { srcZone, dstZone, app, service, action, nat: natType, profile });
  };

  // Resetea los campos de la política a sus valores por defecto entre niveles.
  const resetPolicy = () => {
    setRuleName('Rule-1');
    setSrcZone('trust');
    setDstZone('untrust');
    setApp('any');
    setService('application-default');
    setProfile('none');
    setAction('ALLOW');
    setNatType('NONE');
    resetPacket();
    setGameState('idle');
  };

  // Avanza al siguiente nivel o muestra la pantalla de finalización (T3.3).
  const nextLevel = () => {
    if (levelIdx < LEVELS.length - 1) {
      setLevelIdx(levelIdx + 1);
      resetPolicy();
    } else {
      // Último nivel superado: mostrar CompletionScreen en lugar de alert().
      setShowCompletion(true);
    }
  };

  // Navega a un nivel específico desde LevelSelect (T3.3).
  const handleSelectLevel = (idx) => {
    setLevelIdx(idx);
    resetPolicy();
    setShowCompletion(false);
  };

  // Reinicia el juego completo desde CompletionScreen.
  const handleRepeat = () => {
    reset();
    resetPolicy();
    setShowCompletion(false);
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col relative">
      <LogModal log={selectedLog} onClose={() => setSelectedLog(null)} />

      <TopBar score={score} streak={streak} />

      <div className="flex-1 grid grid-cols-12 overflow-hidden relative">
        <Sidebar
          levelIdx={levelIdx}
          level={level}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
        />

        {/* Center: Visualizer & Editor */}
        <div className="col-span-12 lg:col-span-10 bg-slate-950 flex flex-col relative">
          <NetworkVisualizer
            level={level}
            gameState={gameState}
            commitProgress={commitProgress}
            packetCoords={packetCoords}
          >
            <ResultOverlay
              gameState={gameState}
              reason={logs[0]?.reason}
              outcome={outcome}
              level={level}
              reasonCode={reasonCode}
              ruleName={ruleName}
              onNext={nextLevel}
              onReconfigure={() => setGameState('idle')}
            />
          </NetworkVisualizer>

          {/* --- EDITOR --- */}
          <div className="h-1/2 flex flex-col bg-slate-900">
            <PolicyEditor
              level={level}
              ruleName={ruleName}
              setRuleName={setRuleName}
              srcZone={srcZone}
              setSrcZone={setSrcZone}
              dstZone={dstZone}
              setDstZone={setDstZone}
              app={app}
              setApp={setApp}
              service={service}
              setService={setService}
              action={action}
              setAction={setAction}
              profile={profile}
              setProfile={setProfile}
              natType={natType}
              setNatType={setNatType}
              disabled={gameState !== 'idle'}
            />

            <TrafficLog logs={logs} onSelectLog={setSelectedLog} />
          </div>

          <CommitButton gameState={gameState} onCommit={commitPolicy} />
        </div>
      </div>

      <Onboarding show={showOnboarding} onClose={() => setShowOnboarding(false)} />

      {/* Selector de niveles (T3.3) */}
      {showLevelSelect && (
        <LevelSelect
          levels={LEVELS}
          currentIdx={levelIdx}
          completed={completed}
          attempts={attempts}
          onSelect={handleSelectLevel}
          onClose={() => setShowLevelSelect(false)}
        />
      )}

      {/* Pantalla de finalización — reemplaza el alert() eliminado (T3.3) */}
      {showCompletion && (
        <CompletionScreen
          totalLevels={LEVELS.length}
          attempts={attempts}
          score={score}
          bestStreak={bestStreak}
          onRepeat={handleRepeat}
          onSelectLevel={() => {
            setShowCompletion(false);
            setShowLevelSelect(true);
          }}
        />
      )}
    </div>
  );
}
