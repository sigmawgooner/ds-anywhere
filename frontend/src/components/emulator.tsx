import { useState, useEffect } from 'preact/hooks';
import './emulator.css';
import { LuChevronsRight, LuPause, LuSettings, LuX } from 'react-icons/lu';

interface EmulatorProps {
  onOpenSettings: () => void;
  stopEmulating: () => void;
}

export default function Emulator({ onOpenSettings, stopEmulating }: EmulatorProps) {
  const [gameTitle, setGameTitle] = useState('Nintendo DS');
  const [gameSubtitle, setGameSubtitle] = useState('');
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [fastForward, setFastForward] = useState(false);

  const shutdownListener = () => {
    stopEmulating();
  };

  const pauseEmulator = () => {
    if (paused) return;
    setPaused(true);
    window.WebMelon.emulator.pause();
  };

  const resumeEmulator = () => {
    if (!paused) return;
    setPaused(false);
    window.WebMelon.emulator.resume();
  };

  const startFastForward = () => {
    if (fastForward || paused) return;
    setFastForward(true);
    window.WebMelon.emulator.setEmulatorSpeed(2);
  };
  
  const stopFastForward = () => {
    if (!fastForward || paused) return;
    setFastForward(false);
    window.WebMelon.emulator.setEmulatorSpeed(1);
  };

  const openSettings = () => {
    pauseEmulator();
    onOpenSettings();
  };

  const shutdownEmulator = () => {
    window.WebMelon.emulator.shutdown();
  };

  useEffect(() => {
    if (document.getElementById('top-screen') && !started) {
      setStarted(true);
      window.WebMelon.emulator.startEmulation('top-screen', 'bottom-screen');
      window.WebMelon.emulator.addShutdownListener(shutdownListener);
      if (window.WebMelon.firmware.getFirmwareSettings().shouldFirmwareBoot) {
        setGameTitle('Main Menu');
        setGameSubtitle('Firmware Boot');
      } else {
        const romTitle = window.WebMelon.emulator.getGameTitle();
        if (romTitle) {
          const romTitleParts = romTitle.split('\n');
          setGameTitle(romTitleParts[0]);
          if (romTitleParts.length > 1) {
            setGameSubtitle(romTitleParts[1]);
          }
        }
      }
    }
  }, [started]);

  return (
    <>
      <div className="emulator-header">
        <div className="game-title-text-container">
          <span className="game-title-text"><b>{gameTitle}</b> ({gameSubtitle})</span>
        </div>
        <div className="emulator-controls-section">
          <div className="tooltip" data-tip="Stop Emulator">
            <button className="btn btn-square" onClick={shutdownEmulator}>
              <LuX size={'1.5em'} />
            </button>
          </div>
          <div className="tooltip" data-tip="Settings">
            <button className="btn btn-square" onClick={openSettings}>
              <LuSettings size={'1.5em'} />
            </button>
          </div>
          <div className="tooltip" data-tip={paused ? 'Resume' : 'Pause'}>
            <button 
              className={paused ? 'btn btn-square btn-primary' : 'btn btn-square'}
              onClick={paused ? resumeEmulator : pauseEmulator}
            >
              <LuPause size={'1.5em'} />
            </button>
          </div>
          <div className="tooltip" data-tip={fastForward ? 'Stop fast forward' : 'Fast forward (2x)'}>
            <button 
              className={fastForward ? 'btn btn-square btn-primary' : 'btn btn-square'}
              onClick={fastForward ? stopFastForward : startFastForward}
            >
              <LuChevronsRight size={'1.5em'} />
            </button>
          </div>
        </div>
      </div>
      <div className="emulator-container">
        <canvas className="emulator-screen" id="top-screen" height="192" width="256" />
        <canvas className="emulator-screen" id="bottom-screen" height="192" width="256" />
      </div>
    </>
  )
}