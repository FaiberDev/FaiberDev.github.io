import { useState, useReducer, useEffect, useRef } from 'react';
import Window from '../window/Window';
import PS5Projects from '../projects/PS5Projects';
import PS5Intro from '../projects/PS5Intro';
import Notes from '../notes/Notes';
import About from '../about/About';
import MarkdownModal from '../modal/MarkdownModal';
import { NotesDocIcon } from '../common/Icons';
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
      borderRadius: '14px',
      background: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)',
      border: '1px solid rgba(255, 255, 255, 0.9)',
      boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#d9466f'
    }}>
      <NotesDocIcon size={28} />
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

function DisplayIcon({ size = 14 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

const WINDOW_DEFS = {
  projects: {
    title: 'Projects Catalog',
    size: { w: 1020, h: 640 },
    className: 'projects-window',
    content: <PS5Projects />,
    startMaximized: false,
  },
  notes: {
    title: 'Notes',
    size: { w: 840, h: 560 },
    className: 'notes-window',
    content: <Notes />,
    startMaximized: false,
  },
  about: {
    title: 'About Me',
    size: { w: 740, h: 580 },
    className: 'about-window',
    allowMaximize: false,
    content: <About />,
  },
};

export default function Desktop() {
  const [isBooted, setIsBooted] = useState(false);
  const [windows, dispatch] = useReducer(windowsReducer, {});
  const zRef = useRef(1000);
  const [activeWallpaper, setActiveWallpaper] = useState(wallpapers[0]);
  const [showWallpaperMenu, setShowWallpaperMenu] = useState(false);
  const wallpaperMenuRef = useRef(null);
  const settingsBtnRef = useRef(null);
  const [pongModal, setPongModal] = useState({
    isOpen: false,
    originRect: null,
    zIndex: 2000,
  });
  const videoRef = useRef(null);
  const clock = useClock();

  useEffect(() => {
    if (videoRef.current && !videoRef.current.src.endsWith(activeWallpaper.src)) {
      videoRef.current.src = activeWallpaper.src;
    }
  }, [activeWallpaper]);

  useEffect(() => {
    if (!showWallpaperMenu) return;
    const handlePointerDown = (e) => {
      if (
        wallpaperMenuRef.current?.contains(e.target) ||
        settingsBtnRef.current?.contains(e.target)
      ) {
        return;
      }
      setShowWallpaperMenu(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [showWallpaperMenu]);

  const openWindow = (id) => {
    zRef.current++;
    setShowWallpaperMenu(false);
    dispatch({ type: 'OPEN', id, z: zRef.current });
  };

  const focusWindow = (id) => {
    zRef.current++;
    dispatch({ type: 'FOCUS', id, z: zRef.current });
  };

  const windowControllers = useRef(new Map());

  const registerController = (id, controller) => {
    if (controller) {
      windowControllers.current.set(id, controller);
    } else {
      windowControllers.current.delete(id);
    }
  };

  const dispatchDirect = (id, action) => {
    if (action === 'close')    dispatch({ type: 'CLOSE', id });
    if (action === 'minimize') dispatch({ type: 'MINIMIZE', id });
  };

  const handleWindowClose = (id, action) => {
    const ctrl = windowControllers.current.get(id);
    if (ctrl && action === 'close') {
      ctrl.close();
      return;
    }
    if (ctrl && action === 'minimize') {
      ctrl.minimize();
      return;
    }
    dispatchDirect(id, action);
  };

  const openPongModal = (originRect) => {
    zRef.current++;
    setPongModal({
      isOpen: true,
      originRect: originRect ?? null,
      zIndex: zRef.current + 100,
    });
  };

  const closePongModal = () => {
    setPongModal((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="desktop">
      {/* Initial Startup / PS5 Boot Sequence */}
      {!isBooted && (
        <PS5Intro onLogin={() => setIsBooted(true)} />
      )}

      <video ref={videoRef} className="desktop-bg" autoPlay loop muted playsInline />

      {/* Upper Right Current User Badge - ONLY on the wallpaper when booted */}
      {isBooted && (
        <div className="desktop-user-pill">
          <div className="desktop-user-avatar">
            <img src="/assets/icons/faiberpfp.jpeg" alt="Faiber Piedrahita" />
            <span className="desktop-user-online" title="Online" />
          </div>
          <div
            className="desktop-user-meta"
            style={{ cursor: 'pointer' }}
            onClick={() => openWindow('about')}
          >
            <span className="desktop-user-name">Faiber Piedrahita</span>
            <span className="desktop-user-role">Gameplay Programmer</span>
          </div>
          <button
            className="desktop-switch-user-btn"
            title="Switch User / PS5 Intro"
            onClick={() => setIsBooted(false)}
          >
            Switch User
          </button>
        </div>
      )}

      <div className="desktop-icons">
        {ICONS.map(({ id, label }) => (
          <div
            key={id}
            role="button"
            tabIndex={0}
            className="desktop-icon"
            onClick={() => openWindow(id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openWindow(id);
              }
            }}
          >
            <div className="icon-img">
              {id === 'projects' ? (
                <FolderIcon />
              ) : id === 'notes' ? (
                <NotesIcon />
              ) : (
                <UserIcon />
              )}
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
            registerController={registerController}
            onClose={(action) => dispatchDirect(id, action)}
            onFocus={() => focusWindow(id)}
          >
            {id === 'projects' ? (
              <PS5Projects
                onOpenArchitecture={(data) => {
                  const rect = data?.originRect || data;
                  openPongModal(rect);
                }}
              />
            ) : (
              def.content
            )}
          </Window>
        );
      })}

      {/* Hidden Wallpaper Menu Toggle */}
      <div
        ref={wallpaperMenuRef}
        className={`wallpaper-menu-container ${showWallpaperMenu ? 'visible' : ''}`}
      >
        <div className="wallpaper-menu-title">
          <DisplayIcon size={14} />
          <span>Display Settings</span>
        </div>
        <div className="wallpaper-list">
          {wallpapers.map((wp) => (
            <button
              key={wp.id}
              type="button"
              className={`wallpaper-btn${activeWallpaper.id === wp.id ? ' active' : ''}`}
              title={wp.name}
              aria-label={wp.name}
              onClick={() => setActiveWallpaper(wp)}
            >
              {typeof wp.icon === 'string' && (wp.icon.startsWith('/') || wp.icon.includes('.')) ? (
                <img
                  src={wp.icon}
                  alt={wp.name}
                  className="wallpaper-btn-icon"
                />
              ) : (
                wp.icon
              )}
            </button>
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
                title="Click to focus/minimize, Right-click to close"
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleWindowClose(id, 'close');
                }}
                onClick={() => {
                  if (win.minimized) {
                    openWindow(id);
                  } else {
                    const maxZ = Math.max(...Object.values(windows).map((w) => w.z || 0));
                    if (win.z === maxZ) {
                      handleWindowClose(id, 'minimize');
                    } else {
                      focusWindow(id);
                    }
                  }
                }}
              >
                <span className="taskbar-tab-label">{def?.title ?? id}</span>
                <span
                  className="taskbar-tab-close"
                  title="Close Window"
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWindowClose(id, 'close');
                  }}
                >
                  ✕
                </span>
              </button>
            );
          })}
        </div>
        <div className="system-tray">
          <span className="cat-mascot" title="Meow!">🐈‍⬛</span>
          <button 
            ref={settingsBtnRef}
            className={`settings-btn ${showWallpaperMenu ? 'active' : ''}`}
            onClick={() => setShowWallpaperMenu(!showWallpaperMenu)}
            title="Display Settings"
          >
            <SettingsIcon />
          </button>
          <span className="sys-clock">{clock}</span>
        </div>
      </div>

      {/* Retro OS Markdown Deep-Dive Modal */}
      <MarkdownModal
        isOpen={pongModal.isOpen}
        originRect={pongModal.originRect}
        zIndex={pongModal.zIndex}
        onClose={closePongModal}
      />
    </div>
  );
}
