# Empirical Challenge Report & Handoff (Challenger M3-1 Gen 2)

**Milestone**: M3-1 Gen 2 (Lifecycle & Interaction Verifier)  
**Working Directory**: `/home/faiber/Desktop/IngesoftV/Faiber/FaiberDev.github.io/.agents/teamwork/challenger_m3_1_gen2/`  
**Date**: 2026-10-14  
**Verdict**: **FAIL**

---

## Executive Summary

An automated, visual-DOM empirical test suite (`tests/lifecycle-interaction.test.mjs`) was created and executed against `src/components/modal/MarkdownModal.jsx`, `src/components/desktop/Desktop.jsx`, and `src/components/projects/PS5Projects.jsx`. 

While build integrity, oxlint, originRect fallbacks, window dragging, maximize/restore, and shortcut input filtering passed, **two critical lifecycle and interaction defects were empirically discovered and verified**:
1. **GSAP Spring Entrance Animation Never Runs (`gsap.fromTo` call count = 0)**: In `MarkdownModal.jsx`, `useGSAP` specifies `{ dependencies: [] }` while `Desktop.jsx` mounts the modal unconditionally with `isOpen: false`. On initial load, `windowRef.current` is null, causing `useGSAP` to abort early and never execute again when `isOpen` becomes true. The modal pops abruptly into the DOM without any spring curve.
2. **Modal Is Permanently Stuck Open After Reopening (`isClosing` State Never Reset)**: In `MarkdownModal.jsx`, `isClosing` is set to `true` upon the first close. Because `Desktop.jsx` does not unmount the component instance, `isClosing` remains `true` in React state. When reopened, any subsequent close attempt (Close button, Minimize button, ESC key, or backdrop click) checks `if (isClosing) return;` and silently aborts, leaving the modal impossible to close.

---

## 1. Observation

### 1.1 Empirical Test Suite Execution Results
Command executed:
```bash
node tests/lifecycle-interaction.test.mjs
```
Verbatim stdout/stderr output:
```
================================================================
   CHALLENGER M3-1 GEN 2: EMPIRICAL LIFECYCLE & INTERACTION SUITE
================================================================

[TEST 1] Initial Desktop Mount
[TEST 2] Trigger B Double-Click & Entrance Tween
- Modal present in DOM: true
- gsap.fromTo calls captured: 0

[TEST 3] Modal First Close via Close Button
[TEST 4] Modal Re-Open (Second Open Attempt)
- Modal present in DOM on second open: true
- gsap.fromTo calls captured on second open: 0

[TEST 5] Modal Second Close Attempt (isClosing Bug Check)
- Modal closed on second attempt: false

[TEST 6] Trigger A: Projects Catalog Play Button
- Trigger A opened modal: true
- Trigger A gsap.fromTo count: 0

[TEST 7] originRect Fallbacks Handling
[TEST 8] Keyboard ESC Key Handling
[TEST 9] Backdrop Click vs Inner Window Click
[TEST 10] Window Header Dragging & Maximize Toggle
[TEST 11] Desktop Shortcut Trigger B Input Matrix

================================================================
                   FINAL VERIFICATION RESULTS                   
================================================================
✓ PASS [T1] Initial Modal Closed State: Modal in DOM at startup: false (expected: false)
✗ FAIL [T2] Trigger B Open & GSAP Entrance Animation: Modal in DOM: true, gsap.fromTo calls: 0 (expected: > 0)
✓ PASS [T3] First Modal Close via Close Button: Modal closed and removed from DOM on 1st close: true
✗ FAIL [T4] Modal Re-Open State & Entrance Tween: Modal in DOM: true, gsap.fromTo calls: 0 (expected: > 0)
✗ FAIL [T5] Modal Second Close (isClosing state reset): Modal successfully closed second time: false (expected: true)
✗ FAIL [T6] Trigger A (Projects Catalog) Open & Entrance Tween: Modal opened: true, gsap.fromTo count: 0 (expected: > 0)
✓ PASS [T7] originRect Null / Undefined / Zero-Bounds Fallbacks: null crash: false, undefined crash: false, zero-bounds crash: false
✓ PASS [T8] ESC Key Triggers Modal Close: ESC key caused onClose callback: true
✓ PASS [T9] Backdrop Click Closes, Inner Click Preserved: Inner click dismissed: false (expected false), Overlay click dismissed: true (expected true)
✓ PASS [T10] Window Dragging & Maximize/Restore Toggle: Max toggle passed: true, Drag coordinates updated: true
✓ PASS [T11] Desktop Shortcut Single / Double / Touch Input Matrix: Single click ignored: true, Double click opened: true, Touch opened: true

----------------------------------------------------------------
TOTAL: 7 / 11 PASSED
OVERALL EMPIRICAL VERDICT: FAIL
----------------------------------------------------------------
```

### 1.2 Code Inspection: The `useGSAP` Dead Hook
In `src/components/modal/MarkdownModal.jsx` lines 59-92:
```javascript
  // Spring entrance animation originating from trigger
  useGSAP(() => {
    if (!windowRef.current) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const { deltaX, deltaY, scaleStart } = getOriginDeltas();
    ...
    gsap.fromTo(
      windowRef.current,
      { x: deltaX, y: deltaY, scale: scaleStart, autoAlpha: 0, transformOrigin: '50% 50%' },
      { x: 0, y: 0, scale: 1, autoAlpha: 1, duration: 0.38, ease: 'back.out(1.4)', clearProps: 'transform' }
    );
  }, { scope: containerRef, dependencies: [] });

  ...
  if (!isOpen) return null;
```
In `src/components/desktop/Desktop.jsx` lines 225-229 and 408-413:
```javascript
  const [pongModal, setPongModal] = useState({
    isOpen: false,
    originRect: null,
    zIndex: 2000,
  });
  ...
  <MarkdownModal
    isOpen={pongModal.isOpen}
    originRect={pongModal.originRect}
    zIndex={pongModal.zIndex}
    onClose={closePongModal}
  />
```
Because `MarkdownModal` mounts on initial page load when `isOpen` is `false`, `windowRef.current` is `null`. The hook runs on mount, hits line 60 (`if (!windowRef.current) return`), and terminates. Because `dependencies` is set to `[]`, `@gsap/react` never triggers this hook again when `isOpen` becomes `true`.

### 1.3 Code Inspection: The Unreset `isClosing` State
In `src/components/modal/MarkdownModal.jsx` lines 21 and 95-128:
```javascript
  const [isClosing, setIsClosing] = useState(false);
  ...
  const handleClose = useCallback(() => {
    if (isClosing || !windowRef.current) return;
    setIsClosing(true);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = windowRef.current;

    contextSafe(() => {
      if (prefersReduced) {
        gsap.to(target, { autoAlpha: 0, duration: 0.15, onComplete: () => { onClose?.(); } });
        return;
      }

      const { deltaX, deltaY, scaleStart } = getOriginDeltas();

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
    })();
  }, [isClosing, contextSafe, onClose, getOriginDeltas]);
```
When closed the first time, `setIsClosing(true)` is executed. On animation completion, `onClose?.()` fires `closePongModal` in `Desktop.jsx`, updating `pongModal.isOpen = false`. In `MarkdownModal.jsx`, returning `null` when `isOpen === false` does not unmount the component instance because `Desktop.jsx` renders `<MarkdownModal>` unconditionally. There is no `useEffect` or state reset when `isOpen` transitions back to `true`. Thus, `isClosing` remains `true`. When reopened, any subsequent call to `handleClose()` hits `if (isClosing) return;` and silently drops the user's action.

---

## 2. Logic Chain

1. **Premise 1 (R3 Requirement)**: `ORIGINAL_REQUEST.md` Requirement R3 explicitly states: *"Mount and unmount the modal window using `@gsap/react` and `gsap` ... implementing a subtle spring/back-out curve originating from the trigger button"*.
2. **Premise 2 (Mount State)**: Observation 1.2 demonstrates that `Desktop.jsx` mounts `<MarkdownModal>` at application startup with `isOpen: false`.
3. **Premise 3 (Dead Hook Execution)**: Observation 1.2 shows that `useGSAP` executes at initial mount time with `dependencies: []`. Because `isOpen` is `false`, `windowRef.current` is `null`, and line 60 early-returns before any GSAP call. Because dependencies are static `[]`, `@gsap/react` never re-evaluates the entrance tween when `isOpen` changes from `false` to `true`.
4. **Deduction 1 (Entrance Failure)**: The modal opens without any spring physics or animation from the trigger element. The captured `gsap.fromTo` call count is 0 for both Trigger A and Trigger B. This violates R3.
5. **Premise 4 (State Lifecycle)**: Observation 1.3 shows that `isClosing` is a React state variable initialized to `false` and set to `true` on close.
6. **Premise 5 (No Reset Mechanism)**: Observation 1.3 demonstrates that `isClosing` is never reset to `false` when `isOpen` changes back to `true`, nor does `Desktop.jsx` unmount `<MarkdownModal>`.
7. **Deduction 2 (Unclosable Window)**: When a user closes the modal once and reopens it, `isClosing` remains `true`. All subsequent close mechanisms (Close button, Minimize button, ESC key listener, backdrop overlay click) invoke `handleClose()`, which checks `if (isClosing) return;` and aborts. The modal cannot be closed.

---

## 3. Caveats

- **Build and Lint Integrity**: `npm run build` and `npm run lint` succeed without errors.
- **Origin Vector Math**: `getOriginDeltas` correctly handles `null`, `undefined`, and zero-dimension bounding boxes with safe fallbacks and clamping.
- **Window Controls on First Open**: Dragging, maximize/restore, ESC key, and backdrop click work as designed during the first open cycle. The defect is specifically an unmount/re-mount lifecycle and React state synchronization bug.

---

## 4. Conclusion

The implementation provided by Worker M3 Gen 2 fails empirical challenge testing. The modal window violates Requirement R3 by failing to execute the GSAP spring entrance animation upon opening, and possesses a critical interaction defect preventing users from ever closing the modal after reopening it.

**Verdict: FAIL**

### Required Remediations for Implementation Worker:
1. **Fix `useGSAP` Entrance Dependency**:
   - In `MarkdownModal.jsx`, update the `useGSAP` dependencies array to include `isOpen`:
     ```javascript
     useGSAP(() => {
       if (!isOpen || !windowRef.current) return;
       ...
     }, { scope: containerRef, dependencies: [isOpen] });
     ```
2. **Reset `isClosing` State on Open**:
   - In `MarkdownModal.jsx`, synchronize `isClosing` with `isOpen` via `useEffect`:
     ```javascript
     useEffect(() => {
       if (isOpen) {
         setIsClosing(false);
       }
     }, [isOpen]);
     ```
   - OR conditionally mount `<MarkdownModal>` in `Desktop.jsx` (`{pongModal.isOpen && <MarkdownModal ... />}`) so that component state is cleanly initialized on every open.

---

## 5. Verification Method

To independently reproduce this empirical challenge and verify the failures:

1. **Run the Automated Test Suite**:
   ```bash
   node tests/lifecycle-interaction.test.mjs
   ```
   *Expected output*: Tests T2, T4, T5, and T6 fail with exit code 1.

2. **Manual Reproduction via Browser**:
   ```bash
   npm run preview
   ```
   - Navigate to `http://localhost:4173/`.
   - Double-click the "UE5 Pong Arch" desktop icon: observe that the window snaps into view abruptly without any spring curve (`gsap.fromTo` was not executed).
   - Click the red close button: the modal animates closed.
   - Double-click the "UE5 Pong Arch" desktop icon to reopen it.
   - Click the red close button, press ESC, or click the backdrop: **the modal will not close**.
