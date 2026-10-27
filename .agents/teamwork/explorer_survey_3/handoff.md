# Handoff Report: Dependencies, Build Setup & GSAP Motion Architecture Survey

**Agent**: Explorer 3 (Frontend Packages & Motion Explorer)  
**Date**: 2026-10-14  
**Target File**: `/home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io/.agents/teamwork/explorer_survey_3/handoff.md`  
**Working Directory**: `/home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io/.agents/teamwork/explorer_survey_3/`

---

## 1. Observation

### 1.1 Dependency Audit (`package.json`)
Inspection of `/home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io/package.json` reveals:
```json
{
  "name": "portfolio-react",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.8",
    "react-dom": "^19.2.8"
  },
  "devDependencies": {
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.4",
    "@vitejs/plugin-react": "^6.1.0",
    "oxlint": "^1.79.0",
    "vite": "^8.2.2"
  }
}
```

- **Installed State**:
  - `react`: `^19.2.8` (React 19).
  - `react-dom`: `^19.2.8`.
  - `vite`: `^8.2.2`.
  - `oxlint`: `^1.79.0`.
  - `@vitejs/plugin-react`: `^6.1.0`.
- **Missing Required Dependencies**:
  - `react-markdown`: **Not installed**.
  - `gsap`: **Not installed**.
  - `@gsap/react`: **Not installed**.
  - Markdown plugins (`remark-gfm`, `rehype-highlight`): **Not installed**.

### 1.2 Package Compatibility & Dry-Run Resolution
1. **NPM Registry Queries**:
   - `npm info react-markdown peerDependencies` returned:
     `{ '@types/react': '>=18', react: '>=18' }` (React 19 compatible).
   - `npm info @gsap/react peerDependencies` returned:
     `{ gsap: '^3.12.5', react: '>=17' }` (React 19 compatible).
   - `npm info rehype-highlight dependencies` returned:
     `{ '@types/hast': '^3.0.0', 'hast-util-to-text': '^4.0.0', lowlight: '^3.0.0', 'unist-util-visit': '^5.0.0', vfile: '^6.0.0' }`.
   - `npm info remark-gfm version` returned `4.0.1`.

2. **Resolution Dry-Run Command**:
   ```bash
   npm install --dry-run react-markdown gsap @gsap/react rehype-highlight remark-gfm
   ```
   **Output**:
   ```
   added 109 packages in 6s
   Exited with code 0.
   ```
   There were **zero** peer dependency conflicts with React 19.

### 1.3 Build and Lint Baseline
- **Lint Check**:
  `npm run lint` (`oxlint`) executed across 17 files with 104 rules:
  **Result**: 0 errors, 117 warnings (internal live-browser script warnings). Oxlint exited with code 0.
- **Build Check**:
  `npm run build` (`vite build`) compiled client environment:
  **Result**: 43 modules transformed, production assets emitted to `dist/` in 165ms with code 0.
- **Vite Asset Handling**:
  `vite.config.js`:
  ```javascript
  import react from '@vitejs/plugin-react'
  import { defineConfig } from 'vite'

  export default defineConfig({
    plugins: [react()],
  })
  ```
  Vite 8 natively supports importing `.md` files as raw text strings via the `?raw` suffix:
  `import pongArchitectureContent from '../../data/pong-architecture.md?raw';`.
  This processes the markdown synchronously at build time without requiring external plugins or runtime `fetch()` requests.

### 1.4 GSAP & Motion Guidelines
From `.agents/skills/gsap-react/SKILL.md`, `.agents/skills/gsap-core/SKILL.md`, `.agents/skills/gsap-performance/SKILL.md`, and `.agents/skills/motion-design/SKILL.md`:
- **Plugin Registration**: Always register `useGSAP`: `gsap.registerPlugin(useGSAP)`.
- **Scoped Animation**: Always provide `{ scope: containerRef }` to `useGSAP` to prevent selector leaks.
- **Context-Safe Handlers**: Event callbacks or closing routines executed after initial render MUST be wrapped in `contextSafe` to avoid memory leaks or updates on unmounted nodes.
- **Transform Only**: Animate compositor properties (`x`, `y`, `scale`, `autoAlpha`). Never animate `width`, `height`, `top`, or `left`.
- **Spring/Back-out Easing**: Use `ease: "back.out(1.4)"` for an organic, tactile OS window pop.
- **Exit Direction**: Exit should accelerate using `ease: "power2.in"` or `ease: "back.in(1.2)"` with duration ~200–250ms (shorter than entrance ~350–400ms).
- **Reduced Motion**: Respect `window.matchMedia('(prefers-reduced-motion: reduce)')`.

---

## 2. Logic Chain

```
[Observation 1.1: package.json lacks react-markdown, gsap, @gsap/react, rehype-highlight, remark-gfm]
       │
       ▼
(Inference 2.1: The project requires installing these 5 packages.
 Observation 1.2 confirmed through npm dry-run that all 5 packages resolve cleanly under React 19 with 0 conflicts.)
       │
       ▼
[Observation 1.3: vite.config.js uses standard Vite 8; ORIGINAL_REQUEST.md specifies saving to src/data/pong-architecture.md]
       │
       ▼
(Inference 2.2: Since files in src/data/ are not statically served under /dist at runtime, fetch('/src/data/...') would fail in production.
 Using Vite's native `import md from '../../data/pong-architecture.md?raw'` synchronously bundles the markdown content, eliminates network latency, works offline, and preserves base path independence on GitHub Pages.)
       │
       ▼
[Observation 1.4: Dual triggers (Trigger A in PS5Projects and Trigger B on Desktop) capture trigger element bounding boxes]
       │
       ▼
(Inference 2.3: To animate the modal window directly originating from the clicked trigger button/icon:
 1. Read originRect = triggerEl.getBoundingClientRect().
 2. Compute the delta between the trigger center and the modal's resting viewport center:
    deltaX = (originRect.left + originRect.width / 2) - (modalLeft + modalWidth / 2)
    deltaY = (originRect.top + originRect.height / 2) - (modalTop + modalHeight / 2)
    scaleStart = Math.max(0.12, Math.min(originRect.width / modalWidth, originRect.height / modalHeight))
 3. GSAP animates from { x: deltaX, y: deltaY, scale: scaleStart, autoAlpha: 0 }
    to { x: 0, y: 0, scale: 1, autoAlpha: 1 } with ease: 'back.out(1.4)'.
 4. On entrance completion, execute clearProps: 'transform' so window drag/maximize is unaffected by residual transform matrices.)
       │
       ▼
[Observation 1.4: If React unmounts <MarkdownModal /> immediately on close click, the exit animation will be cut off]
       │
       ▼
(Inference 2.4: The modal component must intercept the close trigger, invoke contextSafe() to animate back towards (deltaX, deltaY) with scale: scaleStart and autoAlpha: 0 (ease: 'power2.in', duration: 0.24s), and only invoke the parent's unmount/close callback upon tween completion.)
```

---

## 3. Caveats

1. **Trigger Origin Availability**:
   - If the modal is triggered without a bounding rectangle (e.g. keyboard navigation, direct shortcut, or fallback), the animation must gracefully fall back to a center-origin entrance (`deltaX: 0, deltaY: 25, scale: 0.95`).
2. **Transform Cleanup vs Window Dragging**:
   - `Window.jsx` tracks window dragging via inline `top` and `left` coordinates. If GSAP leaves inline `transform: translate(...)` on the window root, subsequent drag operations will experience coordinate offsets. Setting `clearProps: "transform"` on the entrance tween’s `onComplete` ensures the DOM node remains cleanly positioned by `top` and `left`.
3. **Accessibility (Reduced Motion)**:
   - Users with `prefers-reduced-motion: reduce` must not experience aggressive spring physics. When reduced motion is requested, duration should drop to `0.01s` or simple opacity fading.
4. **Markdown File Existence Sequencing**:
   - `src/data/pong-architecture.md` is authored by Worker 1 (Technical Writer). Importing it statically via `?raw` requires that the file exists on disk. If the frontend engineer tests before the technical writer finishes, a placeholder file or fallback string must be present to prevent Vite compile errors.

---

## 4. Conclusion

### 4.1 Dependency Installation Specification
The frontend implementer must execute:
```bash
npm install gsap @gsap/react react-markdown rehype-highlight remark-gfm
```

| Package | Recommended Version | Purpose |
|---|---|---|
| `gsap` | `^3.15.0` | High-performance animation engine |
| `@gsap/react` | `^2.1.2` | Official React hook (`useGSAP`) with automatic cleanup & `contextSafe` |
| `react-markdown` | `^10.1.0` | React markdown AST renderer |
| `rehype-highlight` | `^7.0.2` | Code block syntax highlighting via `highlight.js` (C++, JSON, bash) |
| `remark-gfm` | `^4.0.1` | GitHub Flavored Markdown support (tables, autolinks, task lists) |

### 4.2 Raw Asset Import Pattern
Load markdown directly via Vite 8:
```javascript
import pongArchitectureRaw from '../../data/pong-architecture.md?raw';
```
- Fully synchronous: available on initial render.
- Production safe: packaged directly into Vite's production bundle chunks.
- No network requests, loading spinners, or 404 hazards.

### 4.3 GSAP Spring Physics Architecture Blueprint

Here is the exact production-ready implementation pattern for `MarkdownModal.jsx`:

```jsx
import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import pongArchitectureRaw from '../../data/pong-architecture.md?raw';

gsap.registerPlugin(useGSAP);

export default function MarkdownModal({
  isOpen,
  originRect,
  onClose,
  zIndex = 2000,
}) {
  const containerRef = useRef(null);
  const windowRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);

  // Compute resting dimensions and position
  const modalWidth = Math.min(940, window.innerWidth * 0.88);
  const modalHeight = Math.min(680, window.innerHeight * 0.82);
  const modalLeft = Math.max(16, (window.innerWidth - modalWidth) / 2);
  const modalTop = Math.max(20, (window.innerHeight - modalHeight) / 2 - 20);

  // Calculate delta from trigger origin to modal center
  const getOriginDeltas = () => {
    if (!originRect) {
      return { deltaX: 0, deltaY: 30, scaleStart: 0.94 };
    }
    const triggerCenterX = originRect.left + originRect.width / 2;
    const triggerCenterY = originRect.top + originRect.height / 2;
    const modalCenterX = modalLeft + modalWidth / 2;
    const modalCenterY = modalTop + modalHeight / 2;

    const deltaX = triggerCenterX - modalCenterX;
    const deltaY = triggerCenterY - modalCenterY;
    const scaleStart = Math.max(
      0.12,
      Math.min(originRect.width / modalWidth, originRect.height / modalHeight)
    );

    return { deltaX, deltaY, scaleStart };
  };

  const { contextSafe } = useGSAP({ scope: containerRef });

  // Spring entrance animation
  useGSAP(() => {
    if (!windowRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const { deltaX, deltaY, scaleStart } = getOriginDeltas();

    if (prefersReduced) {
      gsap.fromTo(
        windowRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.15 }
      );
      return;
    }

    gsap.fromTo(
      windowRef.current,
      {
        x: deltaX,
        y: deltaY,
        scale: scaleStart,
        autoAlpha: 0,
        transformOrigin: '50% 50%',
      },
      {
        x: 0,
        y: 0,
        scale: 1,
        autoAlpha: 1,
        duration: 0.38,
        ease: 'back.out(1.4)',
        clearProps: 'transform', // Keeps positioning clean for dragging/resizing
      }
    );
  }, { scope: containerRef, dependencies: [] });

  // Smooth reverse unmount exit animation
  const handleClose = contextSafe(() => {
    if (isClosing) return;
    setIsClosing(true);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const { deltaX, deltaY, scaleStart } = getOriginDeltas();

    if (prefersReduced) {
      gsap.to(windowRef.current, {
        autoAlpha: 0,
        duration: 0.15,
        onComplete: onClose,
      });
      return;
    }

    gsap.to(windowRef.current, {
      x: deltaX,
      y: deltaY,
      scale: scaleStart,
      autoAlpha: 0,
      duration: 0.24,
      ease: 'power2.in',
      onComplete: () => {
        onClose();
      },
    });
  });

  return (
    <div
      ref={containerRef}
      className="markdown-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        pointerEvents: 'auto',
      }}
    >
      <div
        ref={windowRef}
        className="window active markdown-modal-window"
        style={{
          position: 'absolute',
          left: modalLeft,
          top: modalTop,
          width: modalWidth,
          height: modalHeight,
          display: 'flex',
          flexDirection: 'column',
          willChange: 'transform, opacity',
        }}
      >
        {/* Title bar */}
        <div className="window-header">
          <span className="window-title">UE5 Pong Architecture — Deep Dive</span>
          <div className="window-controls">
            <button className="win-btn min" onClick={handleClose} />
            <button className="win-btn max" disabled style={{ opacity: 0.3 }} />
            <button className="win-btn close" onClick={handleClose} />
          </div>
        </div>

        {/* Markdown Render Area */}
        <div className="window-content markdown-scroll-container">
          <article className="markdown-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {pongArchitectureRaw}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
}
```

### 4.4 Retro Code Syntax Theme & Scrollbar Specifications

Add to `src/index.css` (or dedicated `src/components/modal/MarkdownModal.css`):
```css
/* ── Retro Markdown Window & Scrollbars ─────────────────────── */
.markdown-modal-window {
  border-radius: 14px;
  background: rgba(22, 16, 26, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.65), 0 0 24px rgba(240, 150, 170, 0.2);
}

.markdown-scroll-container {
  padding: 32px 36px;
  color: #f2eef5;
  font-family: var(--font-main);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(240, 150, 170, 0.5) rgba(0, 0, 0, 0.2);
}

.markdown-scroll-container::-webkit-scrollbar {
  width: 8px;
}
.markdown-scroll-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
.markdown-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(240, 150, 170, 0.5);
  border-radius: 4px;
}
.markdown-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(240, 150, 170, 0.8);
}

/* ── Typography & Prose ─────────────────────────────────────── */
.markdown-prose h1, .markdown-prose h2, .markdown-prose h3 {
  color: #ffffff;
  font-weight: 700;
  margin-top: 1.6em;
  margin-bottom: 0.6em;
  letter-spacing: -0.3px;
}
.markdown-prose h1 {
  font-size: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  padding-bottom: 8px;
}
.markdown-prose h2 {
  font-size: 1.45rem;
  color: #ff9ec6;
}
.markdown-prose p {
  line-height: 1.7;
  margin-bottom: 1.2em;
  color: #ded9e5;
  font-size: 1.02rem;
}
.markdown-prose code:not(pre code) {
  background: rgba(240, 150, 170, 0.2);
  color: #ffb5d3;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9em;
}

/* ── Code Blocks (highlight.js tokens) ──────────────────────── */
.markdown-prose pre {
  background: #0e0914;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 10px;
  padding: 18px 20px;
  margin: 1.4em 0;
  overflow-x: auto;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.92rem;
  line-height: 1.55;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.5);
}
.markdown-prose pre code {
  color: #f8f8f2;
}

/* Custom Highlight.js Tokens */
.hljs-keyword, .hljs-selector-tag { color: #ff79c6; font-weight: 600; }
.hljs-string, .hljs-literal { color: #f1fa8c; }
.hljs-title, .hljs-section, .hljs-function { color: #80ffea; }
.hljs-number { color: #bd93f9; }
.hljs-comment, .hljs-quote { color: #6e6779; font-style: italic; }
.hljs-type, .hljs-built_in { color: #ffb86c; }
.hljs-attr, .hljs-variable { color: #50fa7b; }

/* Tables */
.markdown-prose table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5em 0;
  font-size: 0.95rem;
}
.markdown-prose th, .markdown-prose td {
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 10px 14px;
  text-align: left;
}
.markdown-prose th {
  background: rgba(255, 255, 255, 0.08);
  color: #ff9ec6;
  font-weight: 600;
}
.markdown-prose tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.03);
}
```

---

## 5. Verification Method

1. **Dependency Installation Check**:
   - Run: `npm list gsap @gsap/react react-markdown rehype-highlight remark-gfm`
   - Invalidation condition: Missing package or unresolved peer dependency error.
2. **Build Verification**:
   - Run: `npm run build`
   - Must output production bundles to `dist/` with 0 errors.
   - Invalidation condition: Build failure or `?raw` loader failure.
3. **Lint Verification**:
   - Run: `npm run lint`
   - Must produce 0 errors.
   - Invalidation condition: Unused variables, duplicate keys, or syntax errors.
4. **GSAP Animation Verification**:
   - Verify modal opens smoothly originating from Trigger A (`.ps5-play-btn`) and Trigger B (`PongIcon`).
   - Verify easing curve matches `back.out(1.4)` on entrance and `power2.in` on exit.
   - Verify clicking the close button (`.win-btn.close`) completes exit animation and cleans up without React warnings.
