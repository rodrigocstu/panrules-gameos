import { useState, useRef, useEffect } from 'react';
import { LEVELS } from './data/levels';
import { createLog } from './lib/logs';
import { usePacketAnimation } from './hooks/usePacketAnimation.js';
import { useProgress } from './hooks/useProgress.js';
import { useDragResize } from './hooks/useDragResize.js';
import { evaluateOrdered } from './lib/firewall-engine';
import TopBar from './components/TopBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import NetworkVisualizer from './components/NetworkVisualizer.jsx';
import ResultOverlay from './components/ResultOverlay.jsx';
import PolicyEditor from './components/PolicyEditor.jsx';
import MultiRuleEditor from './components/MultiRuleEditor.jsx';
import TrafficLog from './components/TrafficLog.jsx';
import LogModal from './components/LogModal.jsx';
import Onboarding from './components/Onboarding.jsx';
import CommitButton from './components/CommitButton.jsx';
import LevelSelect from './components/LevelSelect.jsx';
import CompletionScreen from './components/CompletionScreen.jsx';
import ResizeHandle from './components/ResizeHandle.jsx';

export default function FirewallNGFW() {
  // --- Layout redimensionable: ancho del sidebar, alto del visualizador, alto del log ---
  const [sidebarW, onSidebarDrag] = useDragResize({
    axis: 'horizontal',
    defaultSize: 200,
    minSize: 140,
    maxSize: 360,
    storageKey: 'sidebar',
  });
  const [vizH, onVizDrag, setVizH] = useDragResize({
    axis: 'vertical',
    defaultSize: null, // se inicializa desde DOM en useEffect
    minSize: 180,
    maxSize: null,
    storageKey: 'viz',
  });
  const [logH, onLogDrag] = useDragResize({
    axis: 'vertical',
    defaultSize: 128,
    minSize: 72,
    maxSize: 280,
    storageKey: 'log',
  });
  // Ref del contenedor central para capturar altura inicial del visualizador.
  const centerRef = useRef(null);
  useEffect(() => {
    if (vizH === null && centerRef.current) {
      setVizH(Math.floor(centerRef.current.clientHeight * 0.5));
    }
    // Solo al montar; setVizH es estable por useState.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Policy State (nivel single-rule)
  const [ruleName, setRuleName] = useState('Rule-1');
  const [srcZone, setSrcZone] = useState('trust');
  const [dstZone, setDstZone] = useState('untrust');
  const [app, setApp] = useState('any');
  const [service, setService] = useState('application-default');
  const [profile, setProfile] = useState('none');
  const [action, setAction] = useState('ALLOW');
  const [natType, setNatType] = useState('NONE');

  // Policy State (nivel multi-rule): array de PolicyRule
  const [multiRules, setMultiRules] = useState([]);

  const level = LEVELS[levelIdx];
  // ¿Es este nivel un editor multi-regla?
  const isMultiRule = level && level.multiRule === true;

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
    if (isMultiRule) {
      // Multi-rule: evaluar con evaluateOrdered
      if (!multiRules || multiRules.length === 0) return;
      startCommit(level, multiRules[0], { multiRules, useOrdered: true });
    } else {
      startCommit(level, { srcZone, dstZone, app, service, action, nat: natType, profile });
    }
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
    setMultiRules([]);
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

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar redimensionable — H1 */}
        <Sidebar
          levelIdx={levelIdx}
          level={level}
          onOpenLevelSelect={() => setShowLevelSelect(true)}
          completed={completed}
          style={{ width: sidebarW }}
        />
        <ResizeHandle axis="horizontal" onMouseDown={onSidebarDrag} />

        {/* Centro: Visualizador + Editor (flex-col) */}
        <div ref={centerRef} className="flex-1 min-w-0 bg-slate-950 flex flex-col">
          {/* Visualizador — altura dinámica */}
          <NetworkVisualizer
            level={level}
            gameState={gameState}
            commitProgress={commitProgress}
            packetCoords={packetCoords}
            style={
              vizH !== null
                ? { height: vizH, flexShrink: 0 }
                : { flex: 1, minHeight: 180 }
            }
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

          {/* H2: entre Visualizador y Editor */}
          <ResizeHandle axis="vertical" onMouseDown={onVizDrag} />

          {/* Editor + Log (ocupa el resto) */}
          <div className="flex-1 min-h-0 flex flex-col bg-slate-900">
            {/* Editor — ocupa espacio restante; CommitButton flota aquí */}
            <div className="flex-1 min-h-0 relative overflow-hidden">
              {isMultiRule ? (
                <MultiRuleEditor
                  rules={multiRules}
                  setRules={setMultiRules}
                  disabled={gameState !== 'idle'}
                />
              ) : (
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
              )}
              <CommitButton gameState={gameState} onCommit={commitPolicy} />
            </div>

            {/* H3: entre Editor y TrafficLog */}
            <ResizeHandle axis="vertical" onMouseDown={onLogDrag} />

            <TrafficLog
              logs={logs}
              onSelectLog={setSelectedLog}
              style={{ height: logH }}
            />
          </div>
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
          levels={LEVELS}
          totalLevels={LEVELS.length}
          completed={completed}
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
