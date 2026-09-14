import { useState, useReducer, useEffect, useRef } from 'react';
import Window from '../window/Window';
import PS5Projects from '../projects/PS5Projects';
import { wallpapers } from '../../data/wallpapers';

// ── Desktop icons config ────────────────────────────────────────
const ICONS = [
  { id: 'projects', label: 'projects.exe' },
  { id: 'about',    label: 'AboutMe.txt'  },
];

// ── Window reducer ──────────────────────────────────────────────
function windowsReducer(state, action) {
  switch (action.type) {
    case 'OPEN': {
      if (state[action.id]) {
        return {
          ...state,
          [action.id]: { ...state[action.id], minimized: false },
        };
      }
      return {
        ...state,
        [action.id]: { open: true, minimized: false, z: action.z, isMaximized: action.isMaximized || false },
      };
    }
    case 'CLOSE': {
      const next = { ...state };
      delete next[action.id];
      return next;
    }
    case 'MINIMIZE':
      return { ...state, [action.id]: { ...state[action.id], minimized: true } };
    case 'MAXIMIZE':
      return { ...state, [action.id]: { ...state[action.id], isMaximized: action.isMaximized } };
    case 'FOCUS':
      return { ...state, [action.id]: { ...state[action.id], z: action.z } };
    default:
      return state;
  }
}

// ── Clock hook ──────────────────────────────────────────────────
function useClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const fmt = () => {
      const now = new Date();
      let h = now.getHours(), m = now.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
    };
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// ── Folder SVG icon ─────────────────────────────────────────────
function FolderIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 16 16" shapeRendering="crispEdges">
      <rect x="1" y="3" width="6" height="2" fill="#E6A822"/>
      <rect x="1" y="5" width="14" height="8" fill="#F8C53A"/>
      <rect x="2" y="5" width="12" height="1" fill="#FFD97D"/>
      <path d="M1,3 h6 v2 h7 v8 h-14 v-10 z" fill="none" stroke="var(--border-color)" strokeWidth="1"/>
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 16 16" shapeRendering="crispEdges">
      <rect x="3" y="2" width="10" height="12" fill="#FDFDFD"/>
      <path d="M3,2 h10 v12 h-10 z" fill="none" stroke="var(--border-color)" strokeWidth="1"/>
      <rect x="5" y="5" width="6" height="1" fill="#A0A0A0"/>
      <rect x="5" y="7" width="6" height="1" fill="#A0A0A0"/>
      <rect x="5" y="9" width="4" height="1" fill="#A0A0A0"/>
    </svg>
  );
}

// ── Window content map ──────────────────────────────────────────
const WINDOW_DEFS = {
  projects: {
    title: 'projects.exe',
    size: { w: window.innerWidth * 0.9, h: window.innerHeight * 0.9 },
    className: 'projects-window',
    content: <PS5Projects />,
    startMaximized: true,
  },
  about: {
    title: 'AboutMe.txt',
    content: (
      <>
        <h2>Faiber Piedrahita</h2>
        <p>Gameplay Programmer &amp; Game Developer.</p>
        <p>I love building cozy and interactive experiences.</p>
      </>
    ),
  },
};

// ── Desktop ─────────────────────────────────────────────────────
export default function Desktop() {
  const [windows, dispatch] = useReducer(windowsReducer, {});
  const zRef = useRef(1000);
  const [activeWallpaper, setActiveWallpaper] = useState(wallpapers[0]);
  const videoRef = useRef(null);
  const clock = useClock();

  // Apply wallpaper CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(activeWallpaper.colors).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [activeWallpaper]);

  // Sync video src
  useEffect(() => {
    if (videoRef.current && !videoRef.current.src.endsWith(activeWallpaper.src)) {
      videoRef.current.src = activeWallpaper.src;
    }
  }, [activeWallpaper]);

  const openWindow = (id) => {
    zRef.current++;
    dispatch({ type: 'OPEN', id, z: zRef.current });
  };

  const focusWindow = (id) => {
    zRef.current++;
    dispatch({ type: 'FOCUS', id, z: zRef.current });
  };

  const handleWindowClose = (id, action) => {
    if (action === 'close')    dispatch({ type: 'CLOSE', id });
    if (action === 'minimize') dispatch({ type: 'MINIMIZE', id });
  };

  return (
    <div className="desktop">
      {/* Live wallpaper */}
      <video ref={videoRef} className="desktop-bg" autoPlay loop muted />

      {/* Wallpaper selector */}
      <div className="wallpaper-menu-container">
        <div className="wallpaper-list">
          {wallpapers.map((wp) => (
            <div
              key={wp.id}
              className={`wallpaper-btn${activeWallpaper.id === wp.id ? ' active' : ''}`}
              data-name={wp.name}
              onMouseEnter={() => setActiveWallpaper(wp)}
              onClick={() => setActiveWallpaper(wp)}
            >
              {wp.icon}
            </div>
          ))}
        </div>
      </div>

      {/* Desktop icons */}
      <div className="desktop-icons">
        {ICONS.map(({ id, label }) => (
          <div key={id} className="desktop-icon" onClick={() => openWindow(id)}>
            <div className="icon-img">
              {id === 'projects' ? <FolderIcon /> : <DocIcon />}
            </div>
            <span className="icon-label">{label}</span>
          </div>
        ))}
      </div>

      {/* Open windows */}
      {Object.entries(windows).map(([id, win]) => {
        const def = WINDOW_DEFS[id];
        if (!def) return null;
        return (
          <Window
            key={id}
            id={id}
            title={def.title}
            defaultSize={def.size}
            startMaximized={def.startMaximized}
            className={def.className ?? ''}
            zIndex={win.z}
            isMinimized={win.minimized}
            onClose={(action) => handleWindowClose(id, action)}
            onFocus={() => focusWindow(id)}
          >
            {def.content}
          </Window>
        );
      })}

      {/* Taskbar */}
      <div className="taskbar">
        <button className="retro-btn start-menu-btn">
          <span className="btn-icon">❖</span> Start
        </button>
        <div className="taskbar-windows">
          {Object.entries(windows).map(([id, win]) => {
            const def = WINDOW_DEFS[id];
            return (
              <button
                key={id}
                className={`taskbar-tab${!win.minimized ? ' active' : ''}`}
                onClick={() => {
                  if (win.minimized) openWindow(id);
                  else if (!win.minimized) dispatch({ type: 'MINIMIZE', id });
                }}
              >
                {def?.title ?? id}
              </button>
            );
          })}
        </div>
        <div className="system-tray">
          <span className="sys-clock">{clock}</span>
        </div>
      </div>

      <div className="crt-overlay" />
    </div>
  );
}
