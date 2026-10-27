# Empirical Challenge & Stress Test Report (Challenger M3-2 Gen 2)

**Milestone**: Milestone 3 Gen 2 — Frontend Implementation & Motion Engineering  
**Working Directory**: `/home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io/.agents/teamwork/challenger_m3_2_gen2/`  
**Date**: 2026-10-14  
**Verdict**: **FAIL**

---

## Executive Summary

While Worker M3 Gen 2 achieved clean build compilation (`npm run build`), zero lint errors (`npm run lint`), robust markdown AST parsing across complex GFM tables/code blocks, and accurate aesthetic styling, empirical stress testing using automated test harnesses revealed **two critical runtime blockers**:

1. **R3 Animation Failure (Critical)**: The GSAP spring physics window entrance animation (`back.out(1.4)`) **never executes at runtime**. In `src/components/modal/MarkdownModal.jsx`, `useGSAP` is configured with `dependencies: []`. Because `<MarkdownModal />` is initially rendered in `Desktop.jsx` with `isOpen = false` (returning `null`), the `useGSAP` effect runs on initial mount when `windowRef.current === null` and immediately aborts. When the user subsequently opens the modal via Trigger A or Trigger B (`isOpen = true`), `useGSAP` never re-runs because of the empty dependency array. An empirical spy on `gsap.fromTo` captured exactly **0 calls** when the modal was opened.
2. **R4 Multi-Open Lockup (Critical)**: The modal **cannot be closed when opened a second time**. In `MarkdownModal.jsx`, closing sets `isClosing = true`. However, `isClosing` is never reset to `false`. Because `MarkdownModal` remains mounted in `Desktop.jsx` (which toggles `isOpen`), its React component Fiber retains `isClosing === true`. On any subsequent opening, invoking `handleClose()` immediately hits `if (isClosing || !windowRef.current) return;` and returns without calling `onClose()`. The modal becomes permanently stuck open on screen.

---

## 1. Observation

### 1. Build and Linting Integrity
- **Command**: `npm run lint` (`oxlint`)
  * **Result**: Code 0. 0 errors, 120 warnings in external `.agents/` scripts, 0 errors in application code. `npx oxlint src` yielded 0 errors.
- **Command**: `npm run build` (`vite build`)
  * **Result**: Code 0. Transformed 508 modules in 285ms.
  * Emitted bundle: `dist/assets/index-C8YqO_TQ.js` (636.93 kB minified, 204.00 kB gzip) and `dist/assets/index-3Gjp6VWa.css` (17.60 kB, 4.23 kB gzip).
  * Vite emitted chunk size warning:
    ```
    (!) Some chunks are larger than 500 kB after minification. Consider:
    - Using dynamic import() to code-split the application
    ```

### 2. Markdown AST Parsing and Syntax Highlighting
- Evaluated `src/data/pong-architecture.md` (632 lines, 28,656 bytes) through `ReactMarkdown` with `remarkGfm` and `rehypeHighlight`.
  * Generated 46,929 bytes of valid HTML with 0 AST parsing errors or runtime exceptions.
  * Verified table generation (`<table class="...">`), code fence highlighting with `.hljs-*` tokens, headers (`h1` through `h4`), inline code capsules, and math equations.
- Evaluated adversarial markdown stress test suite (escaped GFM table pipes `\|`, LaTeX formula blocks `$$\int_0^\infty ...$$`, unknown code block languages ````unknown_lang````, deeply nested blockquotes `>>>`, and unclosed delimiter tags).
  * **Result**: All test cases rendered valid HTML with 0 AST parser crashes or unhandled exceptions.

### 3. Empirical Lifecycle Test Harness (`tests/lifecycle-interaction.test.mjs`)
Executed the automated test harness spanning JSDOM, React 19, and Vite SSR module loading with direct GSAP method interception:
```
=== STARTING EMPIRICAL CHALLENGER TEST HARNESS ===
--- Test 1: Desktop Initial Mount ---
TC-1: PASS (modal present: false)

--- Test 2: Trigger B Double-Click & Entrance Animation ---
Modal in DOM after Trigger B: true
gsap.fromTo calls captured on open: 0
TC-2: FAIL (gsap.fromTo calls: 0)

--- Test 3: First Modal Close via Close Button ---
TC-3: PASS (modal in DOM: false)

--- Test 4: Modal Re-Open (Second Time) ---
Modal in DOM on second open: true
gsap.fromTo calls on 2nd open: 0
TC-4: FAIL (gsap.fromTo calls: 0)

--- Test 5: Second Modal Close (isClosing persistence) ---
TC-5: FAIL (modal closed: false)
>>> [CONFIRMED BUG]: Modal cannot be closed on second open because isClosing is stuck at true!

--- Test 6: MarkdownModal originRect Fallback Handling ---
TC-6: PASS

--- Test 7: Keyboard ESC Key on Fresh MarkdownModal ---
TC-7: PASS (onClose called: true)

--- Test 8: Backdrop Click Dismissal ---
TC-8: FAIL (onClose called: false due to isClosing state poisoning)

--- Test 9: Inner Window Click Propagation ---
TC-9: PASS (inner click closed: false)

--- Test 10: Maximize & Restore Controls ---
TC-10: PASS

TOTAL: 6 / 10 PASSED, 4 FAILED
```

### 4. Source Code Examination

**File**: `src/components/modal/MarkdownModal.jsx`
- Line 21:
  ```javascript
  const [isClosing, setIsClosing] = useState(false);
  ```
- Lines 58–92:
  ```javascript
  // Spring entrance animation originating from trigger
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
        clearProps: 'transform',
      }
    );
  }, { scope: containerRef, dependencies: [] });
  ```
- Lines 95–98, 122–128:
  ```javascript
  const handleClose = useCallback(() => {
    if (isClosing || !windowRef.current) return;
    setIsClosing(true);
    ...
      gsap.to(target, {
        x: deltaX,
        y: deltaY,
        scale: scaleStart,
        autoAlpha: 0,
        duration: 0.24,
        ease: 'power2.in',
        onComplete: () => {
          onClose?.();
        },
      });
  }, [isClosing, contextSafe, onClose, getOriginDeltas]);
  ```
- Line 165:
  ```javascript
  if (!isOpen) return null;
  ```

**File**: `src/components/desktop/Desktop.jsx`
- Lines 408–413:
  ```jsx
  {/* Retro OS Markdown Deep-Dive Modal */}
  <MarkdownModal
    isOpen={pongModal.isOpen}
    originRect={pongModal.originRect}
    zIndex={pongModal.zIndex}
    onClose={closePongModal}
  />
  ```

---

## 2. Logic Chain

1. **Premise 1 (Component Lifecycle)**: In `Desktop.jsx`, `<MarkdownModal />` is rendered unconditionally in the JSX tree. On desktop mount, `pongModal.isOpen` is `false`.
2. **Premise 2 (Initial Null Render)**: When `MarkdownModal` executes on mount, `isOpen` is `false`, so line 165 returns `null`. Neither `containerRef.current` nor `windowRef.current` is attached to any DOM element.
3. **Premise 3 (Dead useGSAP Hook)**: `useGSAP` executes its effect on initial mount. Because `windowRef.current` is `null`, line 60 (`if (!windowRef.current) return;`) returns immediately. Because line 92 declares `dependencies: []`, React and `@gsap/react` will never re-execute this effect when `isOpen` becomes `true`. As a consequence, `gsap.fromTo` is never invoked, violating requirement R3.
4. **Premise 4 (State Retention in React Fiber)**: When the modal is closed for the first time, `handleClose()` calls `setIsClosing(true)`. In `onComplete`, `onClose?.()` is invoked, causing `Desktop` to set `isOpen = false`. `MarkdownModal` re-renders and returns `null`. Crucially, because `<MarkdownModal />` remains in the parent's component hierarchy, React retains its Fiber and all hook state.
5. **Premise 5 (Missing State Reset)**: There is no code that resets `isClosing` back to `false` (neither when `isOpen` transitions, nor in `onComplete`, nor via `useEffect`).
6. **Premise 6 (Modal Close Lockout)**: When the user opens the modal a second time, `isOpen` becomes `true`. However, `isClosing` is still `true`. When the user attempts to close the modal (via Close button, Minimize, ESC key, or backdrop click), `handleClose()` checks `if (isClosing || !windowRef.current) return;`. Because `isClosing === true`, `handleClose()` returns immediately without executing exit physics or calling `onClose()`. The modal cannot be dismissed, violating requirement R4 and acceptance criteria.

---

## 3. Caveats

- **Build and Lint Integrity**: The codebase passes `npm run lint` and `npm run build` cleanly.
- **Markdown AST Engine**: The markdown parser and syntax highlighter components are fully operational and resilient against complex/adversarial inputs.
- **Vite Bundle Warning**: The production bundle warning (`Some chunks are larger than 500 kB`) is primarily driven by synchronous inclusion of Highlight.js languages in `rehype-highlight` and raw markdown. While functional, future optimization could leverage dynamic import code-splitting for the modal.
- No other caveats.

---

## 4. Conclusion

Due to the absence of the GSAP spring entrance animation at runtime (R3) and the permanent closure lockout bug upon subsequent openings (R4), Milestone 3 Gen 2 cannot be approved in its current state.

**Verdict: FAIL**

### Concrete Remediations for Worker M3 Gen 3:
1. In `src/components/modal/MarkdownModal.jsx`:
   - Change `useGSAP` dependencies from `[]` to `[isOpen]`:
     ```javascript
     useGSAP(() => {
       if (!isOpen || !windowRef.current) return;
       // ... spring entrance tween ...
     }, { scope: containerRef, dependencies: [isOpen] });
     ```
   - Ensure `isClosing` is reset to `false` whenever `isOpen` is `true` or upon animation completion:
     ```javascript
     useEffect(() => {
       if (isOpen) {
         setIsClosing(false);
       }
     }, [isOpen]);
     ```
     And inside `onComplete`:
     ```javascript
     onComplete: () => {
       setIsClosing(false);
       onClose?.();
     }
     ```
2. In `src/components/desktop/Desktop.jsx`:
   - Optionally conditionally render the modal or pass a unique key:
     ```jsx
     {pongModal.isOpen && (
       <MarkdownModal
         key={pongModal.isOpen ? 'open' : 'closed'}
         ...
       />
     )}
     ```

---

## 5. Verification Method

To independently reproduce the failures:

1. **Execute Empirical Test Harness**:
   ```bash
   node tests/lifecycle-interaction.test.mjs
   ```
   *Observed Result*: TC-2 fails with `gsap.fromTo calls captured on open: 0`. TC-5 fails with `modal closed: false (isClosing is stuck at true)`.
2. **Inspect Spied fromTo Call Count**:
   Run direct spy on `useGSAP` during `isOpen` toggle:
   ```bash
   node -e "
   import { JSDOM } from 'jsdom';
   import React, { act } from 'react';
   import ReactDOM from 'react-dom/client';
   import { createServer } from 'vite';
   async function test() {
     const dom = new JSDOM('<!doctype html><html><body><div id=\"root\"></div></body></html>');
     const win = dom.window; globalThis.window = win; globalThis.document = win.document;
     globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);
     win.matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
     const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
     const gsap = (await vite.ssrLoadModule('gsap')).default;
     let calls = 0; const orig = gsap.fromTo; gsap.fromTo = function() { calls++; return orig.apply(this, arguments); };
     const { default: MarkdownModal } = await vite.ssrLoadModule('./src/components/modal/MarkdownModal.jsx');
     const root = ReactDOM.createRoot(win.document.getElementById('root'));
     function App() { const [o, setO] = React.useState(false); React.useEffect(() => { setO(true); }, []); return React.createElement(MarkdownModal, { isOpen: o }); }
     await act(async () => { root.render(React.createElement(App)); });
     console.log('gsap.fromTo calls on open:', calls);
     await vite.close();
   }
   test();
   "
   ```
   *Observed Result*: `gsap.fromTo calls on open: 0`.
