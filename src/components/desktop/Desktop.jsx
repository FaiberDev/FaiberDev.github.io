import { useState, useReducer, useEffect, useRef } from 'react';
import Window from '../window/Window';
import PS5Projects from '../projects/PS5Projects';
import { wallpapers } from '../../data/wallpapers';

const ICONS = [
  { id: 'projects', label: 'Projects' },
  { id: 'about',    label: 'About Me' },
];

function windowsReducer(state, action) {
  switch (action.type) {
    case 'OPEN': {
      if (state[action.id]) {
        return { ...state, [action.id]: { ...state[action.id], minimized: false } };
      }
      return { ...state, [action.id]: { open: true, minimized: false, z: action.z, isMaximized: action.isMaximized || false } };
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

// Custom Desktop Icons
function FolderIcon() {
  return (
    <img 
      src="/assets/folder.webp" 
      alt="Projects Folder" 
      width="56" 
      height="56" 
      style={{ objectFit: 'contain' }} 
    />
  );
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
  );
}

const WINDOW_DEFS = {
  projects: {
    title: 'Projects Catalog',
    size: { w: window.innerWidth * 0.65, h: window.innerHeight * 0.75 },
    className: 'projects-window',
    content: <PS5Projects />,
    startMaximized: false,
  },
  about: {
    title: 'About Me',
    size: { w: 600, h: 400 },
    content: (
      <div style={{ padding: '24px', color: 'var(--text-primary)' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '16px' }}>Faiber Piedrahita</h2>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
          Gameplay Programmer & Game Developer.
          <br /><br />
          I love building cozy, interactive, and highly polished experiences. 
          Welcome to my modern desktop portfolio!
        </p>
      </div>
    ),
  },
};

export default function Desktop() {
  const [windows, dispatch] = useReducer(windowsReducer, {});
  const zRef = useRef(1000);
  const [activeWallpaper, setActiveWallpaper] = useState(wallpapers[0]);
  const [showWallpaperMenu, setShowWallpaperMenu] = useState(false);
  const videoRef = useRef(null);
  const clock = useClock();

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
      <video ref={videoRef} className="desktop-bg" autoPlay loop muted />

      <div className="desktop-icons">
        {ICONS.map(({ id, label }) => (
          <div key={id} className="desktop-icon" onClick={() => openWindow(id)}>
            <div className="icon-img">
              {id === 'projects' ? <FolderIcon /> : <UserIcon />}
            </div>
            <span className="icon-label">{label}</span>
          </div>
        ))}
      </div>

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

      {/* Hidden Wallpaper Menu Toggle */}
      <div className={`wallpaper-menu-container ${showWallpaperMenu ? 'visible' : ''}`}>
        <div className="wallpaper-menu-title">Display Settings</div>
        <div className="wallpaper-list">
          {wallpapers.map((wp) => (
            <div
              key={wp.id}
              className={`wallpaper-btn${activeWallpaper.id === wp.id ? ' active' : ''}`}
              title={wp.name}
              onClick={() => setActiveWallpaper(wp)}
            >
              {wp.icon}
            </div>
          ))}
        </div>
      </div>

      {/* Modern Taskbar */}
      <div className="taskbar">
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
          <span className="cat-mascot" title="Meow!">🐈‍⬛</span>
          <button 
            className={`settings-btn ${showWallpaperMenu ? 'active' : ''}`}
            onClick={() => setShowWallpaperMenu(!showWallpaperMenu)}
            title="Display Settings"
          >
            <SettingsIcon />
          </button>
          <span className="sys-clock">{clock}</span>
        </div>
      </div>
    </div>
  );
}
