import { useState } from 'react';
import { LEVELS } from './data/levels.js';
import { createLog } from './lib/logs.js';
import { usePacketAnimation } from './hooks/usePacketAnimation.js';
import TopBar from './components/TopBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import NetworkVisualizer from './components/NetworkVisualizer.jsx';
import ResultOverlay from './components/ResultOverlay.jsx';
import PolicyEditor from './components/PolicyEditor.jsx';
import TrafficLog from './components/TrafficLog.jsx';
import LogModal from './components/LogModal.jsx';
import Onboarding from './components/Onboarding.jsx';
import CommitButton from './components/CommitButton.jsx';

export default function FirewallNGFW() {
  const [levelIdx, setLevelIdx] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [gameState, setGameState] = useState('idle');
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);

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

  const handleResult = (isWin, reason, effect) => {
    setGameState(isWin ? 'success' : 'failure');
    setLogs((prev) => [createLog(level, effect, reason), ...prev]);
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

  const nextLevel = () => {
    if (levelIdx < LEVELS.length - 1) {
      setLevelIdx((prev) => prev + 1);
      setGameState('idle');
      setAction('ALLOW');
      setNatType('NONE');
      setApp('any');
      setProfile('none');
      resetPacket();
    } else {
      alert('PCNSE Certification Achieved! All scenarios complete.');
      setLevelIdx(0);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col relative">
      <LogModal log={selectedLog} onClose={() => setSelectedLog(null)} />

      <TopBar />

      <div className="flex-1 grid grid-cols-12 overflow-hidden relative">
        <Sidebar levelIdx={levelIdx} level={level} />

        {/* Center: Visualizer & Editor */}
        <div className="col-span-10 bg-slate-950 flex flex-col relative">
          <NetworkVisualizer
            level={level}
            gameState={gameState}
            commitProgress={commitProgress}
            packetCoords={packetCoords}
          >
            <ResultOverlay
              gameState={gameState}
              reason={logs[0]?.reason}
              onNext={nextLevel}
              onReconfigure={() => setGameState('idle')}
            />
          </NetworkVisualizer>

          {/* --- EDITOR --- */}
          <div className="h-1/2 flex flex-col bg-slate-900">
            <PolicyEditor
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
    </div>
  );
}
