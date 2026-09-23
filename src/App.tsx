import { useCallback, useEffect, useState } from 'react';
import type { DinoKind } from './game/dinos';
import { audio } from './game/audio';
import { MAX_LEVELS } from './game/levels';
import { loadSave, writeSave, type SaveData, type Settings } from './game/storage';
import { BabyBook } from './components/BabyBook';
import { GameScreen } from './components/GameScreen';
import { TitleScreen } from './components/TitleScreen';

type Screen = 'title' | 'game';

export default function App() {
  const [save, setSave] = useState<SaveData>(loadSave);
  const [screen, setScreen] = useState<Screen>('title');
  const [bookOpen, setBookOpen] = useState(false);
  const [levelIndex, setLevelIndex] = useState(Math.min(save.progress.level, MAX_LEVELS - 1));
  const [gameKey, setGameKey] = useState(0);

  useEffect(() => {
    audio.setSfx(save.settings.sfx);
    audio.setMusic(save.settings.music);
    audio.setVoice(save.settings.voice);
  }, [save.settings]);

  useEffect(() => {
    writeSave(save);
  }, [save]);

  const toggle = useCallback((k: keyof Settings) => {
    setSave((s) => ({ ...s, settings: { ...s.settings, [k]: !s.settings[k] } }));
  }, []);

  const onHatch = useCallback((kind: DinoKind) => {
    setSave((s) => ({
      ...s,
      progress: { ...s.progress, hatched: { ...s.progress.hatched, [kind]: (s.progress.hatched[kind] ?? 0) + 1 } },
    }));
  }, []);

  const onComplete = useCallback((idx: number) => {
    const completedLevel = idx + 1;
    setSave((s) => {
      const milestone = completedLevel % 10 === 0 ? completedLevel / 10 : null;
      const milestoneBabies = milestone
        ? [...new Set([...(s.progress.milestoneBabies ?? []), milestone])].sort((a, b) => a - b)
        : s.progress.milestoneBabies ?? [];
      return {
        ...s,
        progress: {
          ...s.progress,
          level: Math.min(MAX_LEVELS - 1, Math.max(s.progress.level, idx + 1)),
          milestoneBabies,
        },
      };
    });
  }, []);

  const stopSpeech = () => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
  };

  const play = () => {
    audio.unlock();
    stopSpeech();
    setLevelIndex(Math.min(save.progress.level, MAX_LEVELS - 1));
    setGameKey((k) => k + 1);
    setScreen('game');
  };

  const next = useCallback(() => {
    stopSpeech();
    setLevelIndex((i) => Math.min(MAX_LEVELS - 1, i + 1));
    setGameKey((k) => k + 1);
  }, []);

  const replay = useCallback(() => {
    stopSpeech();
    setGameKey((k) => k + 1);
  }, []);

  const home = useCallback(() => {
    stopSpeech();
    setScreen('title');
  }, []);

  const reset = () => {
    setSave((s) => ({ ...s, progress: { level: 0, hatched: {}, milestoneBabies: [] } }));
    setLevelIndex(0);
    setBookOpen(false);
  };

  return (
    <div className="fixed inset-0 overflow-hidden font-display" onContextMenu={(e) => e.preventDefault()}>
      {screen === 'title' ? (
        <TitleScreen
          progress={save.progress}
          settings={save.settings}
          onToggle={toggle}
          onPlay={play}
          onBook={() => setBookOpen(true)}
        />
      ) : (
        <GameScreen
          key={gameKey}
          levelIndex={levelIndex}
          settings={save.settings}
          onToggle={toggle}
          onHatch={onHatch}
          onComplete={onComplete}
          onHome={home}
          onNext={next}
          onReplay={replay}
        />
      )}
      {bookOpen && <BabyBook progress={save.progress} onClose={() => setBookOpen(false)} onReset={reset} />}
    </div>
  );
}
