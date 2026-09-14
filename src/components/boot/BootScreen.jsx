import { useEffect, useRef, useState } from 'react';

const BIOS_LINES = [
  'FAIBER BIOS v1.02',
  'Copyright (C) 199X-202X, Piedrahita Megatrends',
  'CPU: Gameplay Processor @ 3.4GHz',
  'Memory Test: 64000K OK',
  'Initializing window manager...',
  'Loading shaders and assets...',
  'System Boot OK.',
  '',
];

const NAME = 'Faiber Piedrahita';

export default function BootScreen({ onBoot }) {
  const [phase, setPhase] = useState('bios'); // 'bios' | 'splash'
  const [biosText, setBiosText] = useState('');
  const [booting, setBooting] = useState(false);
  const lineRef = useRef(0);

  // Run BIOS lines one by one
  useEffect(() => {
    let timer;
    const tick = () => {
      if (lineRef.current < BIOS_LINES.length) {
        setBiosText(prev => prev + BIOS_LINES[lineRef.current] + '\n');
        lineRef.current++;
        timer = setTimeout(tick, Math.random() * 200 + 100);
      } else {
        timer = setTimeout(() => setPhase('splash'), 500);
      }
    };
    timer = setTimeout(tick, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleStart = () => {
    setBooting(true);
    setTimeout(onBoot, 400);
  };

  return (
    <div className={`boot-screen${phase === 'splash' ? ' splash-active' : ''}`}>
      {/* BIOS terminal */}
      {phase === 'bios' && (
        <div className="bios-sequence">
          <div id="bios-text" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{biosText}</div>
          <div className="cursor">_</div>
        </div>
      )}

      {/* Splash */}
      {phase === 'splash' && (
        <div className="boot-content">
          <h1 className="title-text">
            {NAME.split('').map((char, i) => {
              if (char === ' ') return <span key={i} className="title-letter space">{char}</span>;
              const letterIndex = NAME.slice(0, i).replace(/ /g, '').length;
              return (
                <span
                  key={i}
                  className="title-letter"
                  style={{ '--i': letterIndex }}
                >
                  {char}
                </span>
              );
            })}
          </h1>
          <p className="subtitle-text">Gameplay Programmer &amp; Developer</p>
          <button
            id="start-btn"
            className="retro-btn press-start-btn"
            onClick={handleStart}
            style={booting ? { animation: 'none' } : {}}
          >
            <span className="btn-icon">{booting ? '⏳' : '▷'}</span>
            {booting ? 'Booting...' : 'Press Start'}
          </button>
        </div>
      )}

      <div className="crt-overlay" />
    </div>
  );
}
