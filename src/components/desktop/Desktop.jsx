import { useState, useReducer, useEffect, useRef } from 'react';
import Window from '../window/Window';
import PS5Projects from '../projects/PS5Projects';
import Notes from '../notes/Notes';
import { wallpapers } from '../../data/wallpapers';

const ICONS = [
  { id: 'projects', label: 'Projects' },
  { id: 'about',    label: 'About Me' },
  { id: 'notes',    label: 'Notes' },
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
    <img 
      src="/assets/icons/faiberpfp.jpeg" 
      alt="About Me" 
      width="56" 
      height="56" 
      style={{ objectFit: 'cover', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} 
    />
  );
}

function NotesIcon() {
  return (
    <div style={{
      width: '56px',
      height: '56px',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '32px'
    }}>
      📝
    </div>
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
    size: { w: window.innerWidth * 0.55, h: window.innerHeight * 0.70 },
    className: 'projects-window',
    content: <PS5Projects />,
    startMaximized: false,
  },
  notes: {
    title: 'Notes',
    size: { w: 800, h: 550 },
    className: 'notes-window mac-window',
    content: <Notes />,
    startMaximized: false,
  },
  about: {
    title: 'About Me',
    size: { w: 600, h: 420 },
    allowMaximize: false,
    content: (
      <div style={{ 
        padding: '32px', 
        color: '#1A1A1A', 
        backgroundColor: 'rgba(250, 250, 250, 0.95)',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px'
      }}>
        {/* Top Section: Profile Pic & Info */}
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          {/* Profile Picture Placeholder */}
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '20px',
            backgroundColor: '#d9d9d9',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden'
          }}>
            <img 
              src="/assets/icons/faiberpfp.jpeg" 
              alt="Faiber Piedrahita Profile" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>

          {/* Structured Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '1rem' }}>
            <div style={{ display: 'flex' }}>
              <span style={{ fontWeight: 'bold', width: '95px', flexShrink: 0 }}>NAME:</span> 
              <span>Faiber Piedrahita</span>
            </div>
            <div style={{ display: 'flex' }}>
              <span style={{ fontWeight: 'bold', width: '95px', flexShrink: 0 }}>POSITION:</span> 
              <span>Gameplay Programmer & Game Developer</span>
            </div>
            <div style={{ display: 'flex' }}>
              <span style={{ fontWeight: 'bold', width: '95px', flexShrink: 0 }}>MAIL:</span> 
              <span>contact@faiber.dev</span>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div style={{
          backgroundColor: '#e6e6e6',
          padding: '24px',
          borderRadius: '16px',
          fontSize: '1.1rem',
          lineHeight: '1.6',
          color: '#1A1A1A'
        }}>
          I love building cozy, interactive experiences. Welcome to my modern desktop portfolio
        </div>
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
              {id === 'projects' ? <FolderIcon /> : id === 'notes' ? <NotesIcon /> : <UserIcon />}
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
            allowMaximize={def.allowMaximize !== false}
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
                  if (win.minimized) {
                    openWindow(id);
                  } else {
                    const maxZ = Math.max(...Object.values(windows).map(w => w.z || 0));
                    if (win.z === maxZ) {
                      dispatch({ type: 'MINIMIZE', id });
                    } else {
                      focusWindow(id);
                    }
                  }
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
