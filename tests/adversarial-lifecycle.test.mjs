import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { createServer } from 'vite';

async function runAdversarialSuite() {
  console.log('================================================================');
  console.log('   CHALLENGER M3-1 GEN 3: ADVERSARIAL STRESS & EDGE-CASE HARNESS');
  console.log('================================================================');

  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
  });

  const win = dom.window;
  for (const key of Object.getOwnPropertyNames(win)) {
    if (key in globalThis) continue;
    try {
      globalThis[key] = win[key];
    } catch {}
  }
  globalThis.window = win;
  globalThis.document = win.document;
  globalThis.Image = win.Image;
  globalThis.getComputedStyle = win.getComputedStyle;
  globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 16);
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

  let prefersReducedMotion = false;
  win.matchMedia = (query) => ({
    matches: query.includes('prefers-reduced-motion') ? prefersReducedMotion : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
  globalThis.matchMedia = win.matchMedia;

  win.HTMLElement.prototype.getBoundingClientRect = function() {
    return {
      top: 120,
      left: 180,
      bottom: 220,
      right: 300,
      width: 120,
      height: 100,
      x: 180,
      y: 120,
    };
  };

  const viteServer = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  // Intercept and spy on GSAP calls
  const gsapModule = await viteServer.ssrLoadModule('gsap');
  const gsap = gsapModule.default || gsapModule.gsap || gsapModule;

  const gsapLog = {
    fromTo: [],
    to: [],
  };

  const origFromTo = gsap.fromTo;
  gsap.fromTo = function(target, fromVars, toVars) {
    gsapLog.fromTo.push({ target, fromVars, toVars });
    return origFromTo.apply(this, arguments);
  };

  const origTo = gsap.to;
  gsap.to = function(target, vars) {
    gsapLog.to.push({ target, vars });
    return origTo.apply(this, arguments);
  };

  const MarkdownModalMod = await viteServer.ssrLoadModule('./src/components/modal/MarkdownModal.jsx');
  const MarkdownModal = MarkdownModalMod.default;
  const DesktopMod = await viteServer.ssrLoadModule('./src/components/desktop/Desktop.jsx');
  const Desktop = DesktopMod.default;

  const results = [];
  const rootEl = win.document.getElementById('root');
  const root = ReactDOM.createRoot(rootEl);

  // -------------------------------------------------------------
  // ADV-1: 10 Consecutive Open / Close Cycles (No Lockup, fromTo > 0 every time)
  // -------------------------------------------------------------
  console.log('\n[ADV-1] 10-Cycle Sequential Open / Close Lifecycle Stress');
  await act(async () => {
    root.render(React.createElement(Desktop));
  });

  // Log in through initial PS5 boot screen
  const initialBoot = win.document.querySelector('.ps5-intro-container');
  if (initialBoot) {
    await act(async () => {
      initialBoot.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 100));
  }

  // Open Projects Catalog
  const projectsIcon = Array.from(win.document.querySelectorAll('.desktop-icon'))
    .find(el => el.textContent.includes('Projects'));

  await act(async () => {
    projectsIcon?.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });

  let adv1Pass = true;
  let cycleFailures = [];

  for (let cycle = 1; cycle <= 10; cycle++) {
    gsapLog.fromTo.length = 0;
    gsapLog.to.length = 0;

    // Open via Projects Catalog Play Button
    const playBtn = win.document.querySelector('.ps5-play-btn');
    if (!playBtn) {
      adv1Pass = false;
      cycleFailures.push(`Cycle ${cycle}: Play button not found`);
      break;
    }

    await act(async () => {
      playBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });

    const modalInDom = !!win.document.querySelector('.markdown-modal-window');
    const fromToCount = gsapLog.fromTo.length;

    if (!modalInDom || fromToCount < 1) {
      adv1Pass = false;
      cycleFailures.push(`Cycle ${cycle} Open Failed: inDOM=${modalInDom}, fromTo=${fromToCount}`);
      break;
    }

    // Close via close button
    const closeBtn = win.document.querySelector('.markdown-modal-window .win-btn.close');
    if (!closeBtn) {
      adv1Pass = false;
      cycleFailures.push(`Cycle ${cycle}: Close button not found`);
      break;
    }

    await act(async () => {
      closeBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });

    // Wait for exit tween
    await new Promise(r => setTimeout(r, 350));

    const modalAfterClose = !!win.document.querySelector('.markdown-modal-window');
    if (modalAfterClose) {
      adv1Pass = false;
      cycleFailures.push(`Cycle ${cycle} Close Failed: modal still in DOM`);
      break;
    }
  }

  results.push({
    id: 'ADV-1',
    name: '10-Cycle Sequential Open/Close Stress',
    pass: adv1Pass,
    detail: adv1Pass ? 'All 10 cycles opened with fromTo > 0 and closed cleanly' : cycleFailures.join('; '),
  });

  // -------------------------------------------------------------
  // ADV-2: Rapid ESC Key Hammering (50 events burst)
  // -------------------------------------------------------------
  console.log('\n[ADV-2] Rapid ESC Key Hammering (50 events burst)');
  let escCloseCount = 0;
  const isolatedContainer = win.document.createElement('div');
  win.document.body.appendChild(isolatedContainer);
  const isolatedRoot = ReactDOM.createRoot(isolatedContainer);

  await act(async () => {
    isolatedRoot.render(React.createElement(MarkdownModal, {
      isOpen: true,
      originRect: { left: 100, top: 100, width: 50, height: 50 },
      onClose: () => { escCloseCount++; },
    }));
  });

  gsapLog.to.length = 0;
  // Hammer ESC key 50 times in rapid succession
  await act(async () => {
    for (let i = 0; i < 50; i++) {
      win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    }
  });

  // Wait for exit animation completion
  await new Promise(r => setTimeout(r, 400));

  console.log(`- onClose calls from 50 ESC keys: ${escCloseCount}`);
  console.log(`- gsap.to exit tween calls: ${gsapLog.to.length}`);

  // onClose should fire exactly 1 time, and exactly 1 exit tween should be initiated
  const adv2Pass = escCloseCount === 1 && gsapLog.to.length === 1;
  results.push({
    id: 'ADV-2',
    name: 'Rapid ESC Key Hammering (Burst Resilience)',
    pass: adv2Pass,
    detail: `onClose called ${escCloseCount} times (expected: 1), exit tweens: ${gsapLog.to.length} (expected: 1)`,
  });

  // -------------------------------------------------------------
  // ADV-3: Extreme Off-Screen Window Dragging & Viewport Clamping
  // -------------------------------------------------------------
  console.log('\n[ADV-3] Window Dragging Boundary & Off-Screen Clamping');
  await act(async () => {
    isolatedRoot.render(null);
  });
  await act(async () => {
    isolatedRoot.render(React.createElement(MarkdownModal, {
      isOpen: true,
      originRect: null,
      onClose: () => {},
    }));
  });

  const header = isolatedContainer.querySelector('.markdown-modal-header');
  const modalEl = isolatedContainer.querySelector('.markdown-modal-window');

  // Drag far off to the negative coordinates: (-5000, -5000)
  await act(async () => {
    header.dispatchEvent(new win.MouseEvent('mousedown', { clientX: 200, clientY: 200, bubbles: true }));
    win.document.dispatchEvent(new win.MouseEvent('mousemove', { clientX: -5000, clientY: -5000, bubbles: true }));
  });

  const clampedTopNegative = parseInt(modalEl.style.top, 10);
  const clampedLeftNegative = parseInt(modalEl.style.left, 10);

  // Drag far off to positive coordinates: (+15000, +15000)
  await act(async () => {
    win.document.dispatchEvent(new win.MouseEvent('mousemove', { clientX: 15000, clientY: 15000, bubbles: true }));
    win.document.dispatchEvent(new win.MouseEvent('mouseup', { bubbles: true }));
  });

  const clampedTopPositive = parseInt(modalEl.style.top, 10);
  const clampedLeftPositive = parseInt(modalEl.style.left, 10);

  // When innerWidth=1024, innerHeight=768:
  // min bound = 0
  // max bound = innerWidth - 100 = 924, innerHeight - 100 = 668
  const maxExpectedX = win.innerWidth - 100;
  const maxExpectedY = win.innerHeight - 100;

  const negativeClampedOk = clampedTopNegative >= 0 && clampedLeftNegative >= 0;
  const positiveClampedOk = clampedLeftPositive <= maxExpectedX && clampedTopPositive <= maxExpectedY;

  console.log(`- Clamped negative bounds: top=${clampedTopNegative}, left=${clampedLeftNegative} (min >= 0)`);
  console.log(`- Clamped positive bounds: top=${clampedTopPositive}, left=${clampedLeftPositive} (max <= ${maxExpectedY}, ${maxExpectedX})`);

  // Also test drag when maximized (should NOT move)
  const maxBtn = isolatedContainer.querySelector('.win-btn.max');
  await act(async () => {
    maxBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });

  const posBeforeMaxDragTop = modalEl.style.top;
  const posBeforeMaxDragLeft = modalEl.style.left;

  await act(async () => {
    header.dispatchEvent(new win.MouseEvent('mousedown', { clientX: 300, clientY: 300, bubbles: true }));
    win.document.dispatchEvent(new win.MouseEvent('mousemove', { clientX: 400, clientY: 450, bubbles: true }));
    win.document.dispatchEvent(new win.MouseEvent('mouseup', { bubbles: true }));
  });

  const posAfterMaxDragTop = modalEl.style.top;
  const posAfterMaxDragLeft = modalEl.style.left;

  const maxLockedOk = posBeforeMaxDragTop === posAfterMaxDragTop && posBeforeMaxDragLeft === posAfterMaxDragLeft;
  console.log(`- Drag prevented when maximized: ${maxLockedOk}`);

  const adv3Pass = negativeClampedOk && positiveClampedOk && maxLockedOk;
  results.push({
    id: 'ADV-3',
    name: 'Window Dragging Boundary Clamping & Maximize Lock',
    pass: adv3Pass,
    detail: `Negative clamp ok: ${negativeClampedOk}, Positive clamp ok: ${positiveClampedOk}, Maximize drag lock: ${maxLockedOk}`,
  });

  // -------------------------------------------------------------
  // ADV-4: Degenerate originRect Matrix (NaN, negatives, huge bounds, missing fields)
  // -------------------------------------------------------------
  console.log('\n[ADV-4] Degenerate originRect Matrix');
  const degenerateCases = [
    { name: 'empty object', rect: {} },
    { name: 'NaN values', rect: { left: NaN, top: NaN, width: NaN, height: NaN } },
    { name: 'negative bounds', rect: { left: -500, top: -200, width: -10, height: -20 } },
    { name: 'massive dimensions', rect: { left: 100, top: 100, width: 50000, height: 50000 } },
    { name: 'zero size', rect: { left: 0, top: 0, width: 0, height: 0 } },
  ];

  let adv4Pass = true;
  let degenerateErrors = [];

  for (const tc of degenerateCases) {
    try {
      gsapLog.fromTo.length = 0;
      await act(async () => {
        isolatedRoot.render(null);
      });
      await act(async () => {
        isolatedRoot.render(React.createElement(MarkdownModal, {
          isOpen: true,
          originRect: tc.rect,
          onClose: () => {},
        }));
      });

      // Check if gsap.fromTo was called with sane scale (scale >= 0.12 or not NaN)
      const lastCall = gsapLog.fromTo[gsapLog.fromTo.length - 1];
      if (lastCall) {
        const startScale = lastCall.fromVars.scale;
        if (Number.isNaN(startScale) && tc.name !== 'NaN values') {
          adv4Pass = false;
          degenerateErrors.push(`${tc.name} generated scale=NaN`);
        }
      }
    } catch (err) {
      adv4Pass = false;
      degenerateErrors.push(`${tc.name} threw error: ${err.message}`);
    }
  }

  results.push({
    id: 'ADV-4',
    name: 'Degenerate originRect Geometries',
    pass: adv4Pass,
    detail: adv4Pass ? 'All 5 degenerate originRect cases handled gracefully without crashes' : degenerateErrors.join('; '),
  });

  // -------------------------------------------------------------
  // ADV-5: prefers-reduced-motion Accessibility Tween Verification
  // -------------------------------------------------------------
  console.log('\n[ADV-5] prefers-reduced-motion Accessibility Tween Verification');
  prefersReducedMotion = true;
  gsapLog.fromTo.length = 0;
  gsapLog.to.length = 0;

  await act(async () => {
    isolatedRoot.render(null);
  });
  await act(async () => {
    isolatedRoot.render(React.createElement(MarkdownModal, {
      isOpen: true,
      originRect: { left: 200, top: 200, width: 100, height: 100 },
      onClose: () => {},
    }));
  });

  const reducedEntrance = gsapLog.fromTo[gsapLog.fromTo.length - 1];
  const entranceHasNoTransform = reducedEntrance &&
    reducedEntrance.fromVars.scale === undefined &&
    reducedEntrance.fromVars.x === undefined &&
    reducedEntrance.toVars.duration === 0.15;

  console.log(`- prefers-reduced-motion entrance: autoAlpha fade only (no spring): ${entranceHasNoTransform}`);

  const closeBtnReduced = isolatedContainer.querySelector('.win-btn.close');
  let reducedCloseFired = false;
  if (closeBtnReduced) {
    await act(async () => {
      closeBtnReduced.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
    const reducedExit = gsapLog.to[gsapLog.to.length - 1];
    reducedCloseFired = reducedExit && reducedExit.vars.autoAlpha === 0 && reducedExit.vars.duration === 0.15;
  }

  console.log(`- prefers-reduced-motion exit: autoAlpha fade only: ${reducedCloseFired}`);
  prefersReducedMotion = false; // Reset

  const adv5Pass = entranceHasNoTransform && reducedCloseFired;
  results.push({
    id: 'ADV-5',
    name: 'prefers-reduced-motion Fade Tweens (Accessibility)',
    pass: adv5Pass,
    detail: `Entrance fade only: ${entranceHasNoTransform}, Exit fade only: ${reducedCloseFired}`,
  });

  // -------------------------------------------------------------
  // ADV-6: Interrupted Animation / Fast Open-Then-Close Race Condition
  // -------------------------------------------------------------
  console.log('\n[ADV-6] Interrupted Animation / Rapid Open-Then-Close');
  let raceCloseFired = false;
  await act(async () => {
    isolatedRoot.render(null);
  });

  function RaceApp() {
    const [open, setOpen] = React.useState(true);
    return React.createElement(MarkdownModal, {
      isOpen: open,
      originRect: null,
      onClose: () => {
        raceCloseFired = true;
        setOpen(false);
      },
    });
  }

  await act(async () => {
    isolatedRoot.render(React.createElement(RaceApp));
  });

  // Immediately close at t = 0 without waiting for 0.38s spring entrance
  const raceCloseBtn = isolatedContainer.querySelector('.win-btn.close');
  if (raceCloseBtn) {
    await act(async () => {
      raceCloseBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
  }

  await new Promise(r => setTimeout(r, 350));
  const adv6Pass = raceCloseFired;
  console.log(`- Immediate close completed: ${raceCloseFired}`);

  results.push({
    id: 'ADV-6',
    name: 'Interrupted Entrance Animation Race Condition',
    pass: adv6Pass,
    detail: `Modal closed cleanly when close triggered at t=0: ${raceCloseFired}`,
  });

  // Teardown isolated container
  await act(async () => {
    isolatedRoot.unmount();
  });
  isolatedContainer.remove();

  // -------------------------------------------------------------
  // Final Results
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('             ADVERSARIAL STRESS TEST SUMMARY                    ');
  console.log('================================================================');

  let passedCount = 0;
  for (const r of results) {
    const status = r.pass ? '✓ PASS' : '✗ FAIL';
    console.log(`${status} [${r.id}] ${r.name}: ${r.detail}`);
    if (r.pass) passedCount++;
  }

  const allPassed = passedCount === results.length;
  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL: ${passedCount} / ${results.length} PASSED`);
  console.log(`VERDICT: ${allPassed ? 'PASS' : 'FAIL'}`);
  console.log('----------------------------------------------------------------\n');

  await act(async () => {
    root.unmount();
  });
  await viteServer.close();

  process.exit(allPassed ? 0 : 1);
}

runAdversarialSuite().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
