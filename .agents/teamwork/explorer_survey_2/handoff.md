# Handoff Report: Frontend Codebase & Desktop Architecture Survey

**Agent**: Explorer 2 (Frontend Codebase & Desktop Explorer)  
**Date**: 2026-10-14  
**Target File**: `/home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io/.agents/teamwork/explorer_survey_2/handoff.md`

---

## 1. Observation

### 1.1 Desktop Component (`src/components/desktop/Desktop.jsx`)
- **Icon Definitions** (lines 7–11):
  ```javascript
  const ICONS = [
    { id: 'projects', label: 'Projects' },
    { id: 'about',    label: 'About Me' },
    { id: 'notes',    label: 'Notes' },
  ];
  ```
- **Desktop Icon Rendering & Click Handling** (lines 222–231):
  ```jsx
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
  ```
  - **Click Behavior**: Currently uses a single `onClick={() => openWindow(id)}`. There is **no `onDoubleClick` event handler** or double-click state detection anywhere on the desktop.
- **Window Reducer & State Management** (lines 13–35):
  - State shape: dictionary of open windows:
    `{ [windowId]: { open: boolean, minimized: boolean, z: number, isMaximized: boolean } }`.
  - Actions: `OPEN`, `CLOSE`, `MINIMIZE`, `MAXIMIZE`, `FOCUS`.
  - `zRef.current` (initialized to `1000`, line 191) increments on every window focus or open.
- **Window Definitions (`WINDOW_DEFS`)** (lines 105–187):
  - Static map holding window metadata:
    - `projects`: `title: 'Projects Catalog'`, `size: { w: window.innerWidth * 0.55, h: window.innerHeight * 0.70 }`, `className: 'projects-window'`, `content: <PS5Projects />`.
    - `notes`: `title: 'Notes'`, `size: { w: 800, h: 550 }`, `className: 'notes-window'`, `content: <Notes />`.
    - `about`: `title: 'About Me'`, `size: { w: 600, h: 420 }`, `allowMaximize: false`.
- **Taskbar Integration** (lines 273–298):
  - Maps over `Object.entries(windows)` to display tabs with active and minimized states. Clicking a tab either minimizes, focuses, or un-minimizes the window.
- **Available Desktop Icons**:
  - `FolderIcon` uses `/assets/folder.webp` (56x56).
  - `UserIcon` uses `/assets/icons/faiberpfp.jpeg` (56x56).
  - `public/assets/icons/unreal-engine.png` exists in the filesystem (99,359 bytes, clean transparent Unreal Engine logo).

---

### 1.2 Projects Catalog Component (`src/components/projects/PS5Projects.jsx`) & Data (`src/data/ps5Projects.js`)
- **Data Definition for Pong Project** (`src/data/ps5Projects.js`, lines 27–37):
  ```javascript
  {
    id: 'data-driven-rhythm-architecture',
    title: 'Data-Driven Rhythm Architecture',
    subtitle: 'Unreal Engine 5 · Gameplay System',
    description: "A sample-accurate, framerate-independent rhythm system built in C++ utilizing Unreal Engine 5's Quartz subsystem and a custom JSON parser",
    coverUrl: unrealCover,
    logoUrl: null,
    backgroundGradient: 'radial-gradient(circle at 70% 35%, #182848 0%, #101c33 45%, #080c17 100%)',
    buttonText: 'More information',
  }
  ```
  - The project is at **index 0** of `ps5ProjectsData`.
  - It features `buttonText: 'More information'`, but **no `playUrl`**.
- **Button Rendering in `PS5Projects.jsx`** (lines 115–129):
  ```jsx
  {activeProject.playUrl ? (
    <a 
      href={activeProject.playUrl}
      target="_blank"
      rel="noreferrer"
      className="ps5-play-btn"
      style={{ textDecoration: 'none' }}
    >
      {activeProject.buttonText || activeProject.playText || 'More information'}
    </a>
  ) : (
    <button className="ps5-play-btn">
      {activeProject.buttonText || activeProject.playText || 'More information'}
    </button>
  )}
  ```
  - When `activeProject.playUrl` is falsy (as is the case for index 0 `data-driven-rhythm-architecture`), it renders `<button className="ps5-play-btn">More information</button>`.
  - **Critical Finding**: This button currently has **no `onClick` handler**; clicking it is currently a no-op!

---

### 1.3 Window Component (`src/components/window/Window.jsx`)
- **Structure & Features** (lines 3–82):
  - Controlled by props: `id`, `title`, `children`, `defaultSize`, `onClose`, `onFocus`, `zIndex`, `isMinimized`, `className`, `startMaximized`, `allowMaximize`.
  - **Centering Calculation** (lines 12–19):
    ```javascript
    setPos({
      x: Math.max(20, (window.innerWidth  - defaultSize.w) / 2),
      y: Math.max(20, (window.innerHeight - defaultSize.h) / 2 - 30),
    });
    ```
  - **Draggability** (lines 21–39):
    - Handled via `onHeaderMouseDown` on `.window-header`.
    - Attaches `mousemove` and `mouseup` event listeners directly to `document`.
    - Updates local `pos` state: `{ x, y }`.
  - **Header Controls** (lines 66–77):
    - Traffic light buttons: `.win-btn.min` (yellow), `.win-btn.max` (green), `.win-btn.close` (red).
  - **Content Container** (line 79):
    `<div className="window-content" style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>{children}</div>`

---

### 1.4 Styling Tokens & Classes in `src/index.css`
- **Typography & Font**:
  - `@font-face` loads local `SST` fonts (Light, Rg, Medium, Bold, Heavy).
  - `--font-main: 'SST', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;`
  - `--font-title: 'SST', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;`
- **Glassmorphism & Color Variables** (lines 114–126):
  - `--glass-bg: rgba(240, 150, 170, 0.35);` (soft frosted pink)
  - `--glass-border: rgba(255, 255, 255, 0.6);` (white glass rim)
  - `--glass-shadow: 0 8px 32px 0 rgba(138, 20, 40, 0.25);` (deep plum tint)
  - `--glass-blur: blur(16px);`
  - `--text-primary: #2d1b2e;` (high contrast dark plum)
  - `--text-secondary: #573a58;`
  - `--accent: rgba(255, 255, 255, 0.4);`
  - `--accent-hover: rgba(255, 255, 255, 0.7);`
- **Window Classes** (lines 380–467):
  - `.window`: `position: absolute; background: var(--glass-bg); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur); border: 1px solid var(--glass-border); box-shadow: var(--glass-shadow); border-radius: 14px; overflow: hidden; z-index: 1000;`
  - `.window.active`: `box-shadow: 0 12px 48px 0 rgba(0, 0, 0, 0.5); border: 1px solid rgba(255,255,255,0.4);`
  - `.window.maximized`: `top: 0 !important; left: 0 !important; width: 100% !important; height: calc(100% - 56px) !important; border-radius: 0; border: none;`
  - `.window-header`: `background: rgba(255,255,255,0.08); border-bottom: 1px solid var(--glass-border); padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; cursor: grab;`
  - `.win-btn`: `width: 12px; height: 12px; border: none; border-radius: 50%; cursor: pointer; opacity: 0.8;`
    - `.win-btn.close`: `#ff5f56`
    - `.win-btn.min`: `#ffbd2e`
    - `.win-btn.max`: `#27c93f`
- **Scrollbar Styling**:
  - `grep_search` for `scrollbar` in `src/` yielded **0 matches**. Custom scrollbars are not yet defined globally or locally.

---

### 1.5 Package & Build Baseline
- `package.json` contains:
  - `dependencies`: `react: ^19.2.8`, `react-dom: ^19.2.8`
  - `devDependencies`: `@vitejs/plugin-react: ^6.1.0`, `oxlint: ^1.79.0`, `vite: ^8.2.2`
  - **Not installed yet**: `gsap`, `@gsap/react`, `react-markdown`.
- Verification run:
  - `npm run lint`: 0 errors.
  - `npm run build`: builds in 210ms with 0 errors.

---

## 2. Logic Chain

```
[Observation 1.1: Desktop.jsx ICONS has no Pong item, and uses onClick without onDoubleClick]
       │
       ▼
(Inference: Add 'pong-architecture' to ICONS or create dedicated desktop shortcut with /assets/icons/unreal-engine.png.
 Attach onDoubleClick handler to desktop icon to fulfill Trigger B, extracting e.currentTarget.getBoundingClientRect() for GSAP origin.)
       │
[Observation 1.2: PS5Projects.jsx index 0 'data-driven-rhythm-architecture' renders button.ps5-play-btn with 'More information' but has no onClick]
       │
       ▼
(Inference: Trigger A is directly located on button.ps5-play-btn. Passing an onOpenArchitecture callback from Desktop.jsx into PS5Projects allows clicking this button to capture its bounding rect and trigger the modal.)
       │
[Observation 1.3: Window.jsx handles dragging, traffic-light controls, and centering, but lacks GSAP spring entry/exit physics]
       │
       ▼
(Inference: The Markdown Modal can leverage the existing Window component frame or a specialized MarkdownModal component utilizing the same styling tokens (.window, .window-header, .win-btn, etc.) while wrapping it with a GSAP useGSAP hook to animate from the trigger's originRect.)
       │
[Observation 1.4: src/index.css lacks scrollbar styling and markdown/code block syntax styling]
       │
       ▼
(Inference: The modal CSS must introduce retro scrollbar rules (::-webkit-scrollbar with pink frosted glass thumb) and clean code block / typography styling harmonizing with the cozy pastel Neubrutalist/glass aesthetic.)
```

---

## 3. Caveats
- **Dual Trigger Origin Coordinates**: Trigger A originates from an element inside a window (which may be moved or maximized), whereas Trigger B originates from the desktop grid. The origin bounding box (`DOMRect`) must be read dynamically at click/double-click time via `e.currentTarget.getBoundingClientRect()`.
- **Drag & GSAP Transform Interaction**: If GSAP animates `transform: translate(x, y) scale(...)`, upon animation completion `clearProps: 'transform'` or coordinate handover must occur so that `Window.jsx`'s `pos.x / pos.y` style values continue to work without transform conflicts.
- **Single vs Double Click on Mobile**: Mobile touch screens do not have a native "double-click". On touch devices, a single tap or double tap fallback should open the modal for accessibility.

---

## 4. Conclusion

### 4.1 Trigger Integration Blueprint

#### Trigger A: Projects Catalog Button
1. In `src/components/projects/PS5Projects.jsx`:
   - Accept prop `onOpenArchitecture`: `export default function PS5Projects({ onOpenArchitecture })`.
   - On line 126, attach the click handler:
     ```jsx
     <button 
       className="ps5-play-btn"
       onClick={(e) => {
         const rect = e.currentTarget.getBoundingClientRect();
         onOpenArchitecture?.({
           id: activeProject.id,
           originRect: rect,
         });
       }}
     >
       {activeProject.buttonText || activeProject.playText || 'More information'}
     </button>
     ```

#### Trigger B: Desktop Double-Click Shortcut
1. In `src/components/desktop/Desktop.jsx`:
   - Add Pong shortcut to `ICONS`:
     ```javascript
     const ICONS = [
       { id: 'projects',          label: 'Projects' },
       { id: 'pong-architecture', label: 'UE5 Pong Arch', isShortcut: true },
       { id: 'about',             label: 'About Me' },
       { id: 'notes',             label: 'Notes' },
     ];
     ```
   - Render custom icon using `/assets/icons/unreal-engine.png`:
     ```jsx
     function PongIcon() {
       return (
         <div style={{ position: 'relative', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           <img 
             src="/assets/icons/unreal-engine.png" 
             alt="Pong Architecture" 
             width="52" 
             height="52" 
             style={{ objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }} 
           />
           <span style={{
             position: 'absolute', bottom: -2, right: -2,
             backgroundColor: 'rgba(255,255,255,0.95)', color: '#2d1b2e',
             fontSize: '9px', fontWeight: 800, padding: '1px 4px',
             borderRadius: '4px', border: '1px solid rgba(0,0,0,0.15)'
           }}>
             UE5
           </span>
         </div>
       );
     }
     ```
   - Wire both `onDoubleClick` and `onClick`:
     ```jsx
     <div 
       key={id} 
       className="desktop-icon" 
       onClick={(e) => {
         if (id !== 'pong-architecture') openWindow(id);
       }}
       onDoubleClick={(e) => {
         const rect = e.currentTarget.getBoundingClientRect();
         if (id === 'pong-architecture') {
           openPongModal(rect);
         } else {
           openWindow(id);
         }
       }}
     >
     ```

### 4.2 State Management Architecture
- Manage `pongModalState` in `Desktop.jsx`:
  ```javascript
  const [pongModal, setPongModal] = useState({
    isOpen: false,
    originRect: null,
  });
  ```
- Opening helper:
  ```javascript
  const openPongModal = (originRect) => {
    zRef.current++;
    setPongModal({ isOpen: true, originRect, zIndex: zRef.current });
  };
  const closePongModal = () => {
    setPongModal(prev => ({ ...prev, isOpen: false }));
  };
  ```
- Pass `onOpenArchitecture={({ originRect }) => openPongModal(originRect)}` to `<PS5Projects />` in `WINDOW_DEFS.projects.content`.

### 4.3 Styling System Specifications
- **Modal Frame**: `.window.markdown-modal` with `--glass-bg`, `--glass-border`, `--glass-blur`, `--glass-shadow`, `border-radius: 14px`.
- **Modal Content**:
  - Background: `rgba(252, 250, 252, 0.96)` (light retro paper matching `Notes.jsx`) or dark glass `rgba(20, 16, 24, 0.94)` with high contrast text.
  - Dimensions: `width: min(920px, 92vw); height: min(680px, 85vh);`.
- **Retro Scrollbar Classes**:
  ```css
  .markdown-scroll-container::-webkit-scrollbar {
    width: 8px;
  }
  .markdown-scroll-container::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.04);
    border-radius: 4px;
  }
  .markdown-scroll-container::-webkit-scrollbar-thumb {
    background: rgba(240, 150, 170, 0.5);
    border-radius: 4px;
  }
  .markdown-scroll-container::-webkit-scrollbar-thumb:hover {
    background: rgba(240, 150, 170, 0.8);
  }
  ```
- **Code Block Syntax Styling**:
  - `pre`: `background: #18141f; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 16px; overflow-x: auto; color: #f0f0f5;`
  - Inline code: `background: rgba(240, 150, 170, 0.16); color: #9c1d45; padding: 2px 6px; border-radius: 4px; font-family: monospace;`

---

## 5. Verification Method

1. **Verify Desktop Icons & Double Click**:
   - Inspect `src/components/desktop/Desktop.jsx` to confirm the presence of the Pong shortcut and `onDoubleClick` event wiring.
2. **Verify Projects Catalog Button**:
   - Inspect `src/components/projects/PS5Projects.jsx` to verify that `ps5-play-btn` invokes `onOpenArchitecture` passing `e.currentTarget.getBoundingClientRect()`.
3. **Verify CSS Tokens & Parity**:
   - Verify that all modal styles reference CSS variables from `src/index.css` (`--font-main`, `--glass-bg`, `--glass-border`, `--glass-shadow`, `--glass-blur`).
4. **Build & Lint Integrity**:
   - Run `npm run lint` (`oxlint`). Must pass with 0 errors.
   - Run `npm run build` (`vite build`). Must generate production bundles in `dist/` with 0 errors.
5. **Invalidation Conditions**:
   - Modal fails to open from either Trigger A or Trigger B.
   - GSAP animation origin coordinates do not match the clicked element's bounding rect.
   - Build or lint commands fail.
