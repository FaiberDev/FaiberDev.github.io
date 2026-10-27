import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { createServer } from 'vite';

async function runTestSuite() {
  console.log('================================================================');
  console.log('   CHALLENGER M3-1 GEN 2: EMPIRICAL LIFECYCLE & INTERACTION SUITE');
  console.log('================================================================');

  // Setup simulated visual browser DOM
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

  win.matchMedia = (query) => ({
    matches: false,
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

  // Spy on GSAP physics tweens
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
  // Test 1: Desktop Initial Mount & Modal Closed State
  // -------------------------------------------------------------
  console.log('\n[TEST 1] Initial Desktop Mount');
  await act(async () => {
    root.render(React.createElement(Desktop));
  });

  const ps5BootPresent = !!win.document.querySelector('.ps5-intro-container');
  // Log into the desktop through the initial PS5 boot screen
  const initialBootProfile = win.document.querySelector('.ps5-intro-container');
  if (initialBootProfile) {
    await act(async () => {
      initialBootProfile.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 100));
  }

  const modalInitiallyInDom = !!win.document.querySelector('.markdown-modal-window');
  results.push({
    id: 'T1',
    name: 'Initial PS5 Boot & Modal Closed State',
    pass: !modalInitiallyInDom && ps5BootPresent,
    detail: `PS5 Boot Screen present at startup: ${ps5BootPresent}, Modal in DOM: ${modalInitiallyInDom}`,
  });

  // -------------------------------------------------------------
  // Test 2: Trigger via Projects Catalog & PS5 Profile Login
  // -------------------------------------------------------------
  console.log('\n[TEST 2] Projects Catalog & PS5 Profile Login & Entrance Tween');
  gsapLog.fromTo.length = 0;
  gsapLog.to.length = 0;

  const icons = Array.from(win.document.querySelectorAll('.desktop-icon'));
  const projectsShortcut = icons.find(el => el.textContent.includes('Projects'));

  await act(async () => {
    projectsShortcut?.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });

  const profileCard = win.document.querySelector('.ps5-intro-profile-card');
  if (profileCard) {
    await act(async () => {
      profileCard.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 100));
  }

  const playBtn1 = win.document.querySelector('.ps5-play-btn');
  if (playBtn1) {
    await act(async () => {
      playBtn1.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
  }

  const modalOpen1 = !!win.document.querySelector('.markdown-modal-window');
  const entranceTweenCount1 = gsapLog.fromTo.length;
  console.log(`- Modal present in DOM: ${modalOpen1}`);
  console.log(`- gsap.fromTo calls captured: ${entranceTweenCount1}`);

  results.push({
    id: 'T2',
    name: 'Projects Catalog Open & GSAP Entrance Animation',
    pass: modalOpen1 && entranceTweenCount1 > 0,
    detail: `Modal in DOM: ${modalOpen1}, gsap.fromTo calls: ${entranceTweenCount1} (expected: > 0)`,
  });

  // -------------------------------------------------------------
  // Test 3: First Modal Close via Close Button
  // -------------------------------------------------------------
  console.log('\n[TEST 3] Modal First Close via Close Button');
  const closeBtn1 = win.document.querySelector('.markdown-modal-window .win-btn.close');
  let firstCloseTriggered = false;
  if (closeBtn1) {
    await act(async () => {
      closeBtn1.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
    // Wait for GSAP exit tween duration (0.24s + buffer)
    await new Promise(r => setTimeout(r, 350));
    const modalAfterClose1 = !!win.document.querySelector('.markdown-modal-window');
    firstCloseTriggered = !modalAfterClose1;
  }

  results.push({
    id: 'T3',
    name: 'First Modal Close via Close Button',
    pass: firstCloseTriggered,
    detail: `Modal closed and removed from DOM on 1st close: ${firstCloseTriggered}`,
  });

  // -------------------------------------------------------------
  // Test 4: Modal Re-Opening (Second Open) & Entrance Tween
  // -------------------------------------------------------------
  console.log('\n[TEST 4] Modal Re-Open (Second Open Attempt)');
  gsapLog.fromTo.length = 0;
  const playBtnReopen = win.document.querySelector('.ps5-play-btn');
  if (playBtnReopen) {
    await act(async () => {
      playBtnReopen.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
  }

  const modalOpen2 = !!win.document.querySelector('.markdown-modal-window');
  const entranceTweenCount2 = gsapLog.fromTo.length;
  console.log(`- Modal present in DOM on second open: ${modalOpen2}`);
  console.log(`- gsap.fromTo calls captured on second open: ${entranceTweenCount2}`);

  results.push({
    id: 'T4',
    name: 'Modal Re-Open State & Entrance Tween',
    pass: modalOpen2 && entranceTweenCount2 > 0,
    detail: `Modal in DOM: ${modalOpen2}, gsap.fromTo calls: ${entranceTweenCount2} (expected: > 0)`,
  });

  // -------------------------------------------------------------
  // Test 5: Modal Second Close (isClosing Reset Verification)
  // -------------------------------------------------------------
  console.log('\n[TEST 5] Modal Second Close Attempt (isClosing Bug Check)');
  const closeBtn2 = win.document.querySelector('.markdown-modal-window .win-btn.close');
  let secondCloseTriggered = false;
  if (closeBtn2) {
    await act(async () => {
      closeBtn2.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 350));
    const modalAfterClose2 = !!win.document.querySelector('.markdown-modal-window');
    secondCloseTriggered = !modalAfterClose2;
  }

  console.log(`- Modal closed on second attempt: ${secondCloseTriggered}`);
  results.push({
    id: 'T5',
    name: 'Modal Second Close (isClosing state reset)',
    pass: secondCloseTriggered,
    detail: `Modal successfully closed second time: ${secondCloseTriggered} (expected: true)`,
  });

  // -------------------------------------------------------------
  // Test 6: Trigger A (Projects Window "More information" button)
  // -------------------------------------------------------------
  console.log('\n[TEST 6] Trigger A: Projects Catalog Play Button');
  // First unmount the desktop and re-render fresh desktop
  await act(async () => {
    root.render(null);
  });
  await act(async () => {
    root.render(React.createElement(Desktop));
  });

  const bootCard6 = win.document.querySelector('.ps5-intro-container');
  if (bootCard6) {
    await act(async () => {
      bootCard6.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 100));
  }

  const projectsShortcut6 = Array.from(win.document.querySelectorAll('.desktop-icon'))
    .find(el => el.textContent.includes('Projects'));

  await act(async () => {
    projectsShortcut6?.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });

  const playBtn = win.document.querySelector('.ps5-play-btn');
  let triggerAOpened = false;
  let triggerAEntranceTween = 0;
  if (playBtn) {
    gsapLog.fromTo.length = 0;
    await act(async () => {
      playBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
    triggerAOpened = !!win.document.querySelector('.markdown-modal-window');
    triggerAEntranceTween = gsapLog.fromTo.length;
  }

  console.log(`- Trigger A opened modal: ${triggerAOpened}`);
  console.log(`- Trigger A gsap.fromTo count: ${triggerAEntranceTween}`);
  results.push({
    id: 'T6',
    name: 'Trigger A (Projects Catalog) Open & Entrance Tween',
    pass: triggerAOpened && triggerAEntranceTween > 0,
    detail: `Modal opened: ${triggerAOpened}, gsap.fromTo count: ${triggerAEntranceTween} (expected: > 0)`,
  });

  // -------------------------------------------------------------
  // Test 7: originRect Null / Undefined / Zero Fallback Unit Tests
  // -------------------------------------------------------------
  console.log('\n[TEST 7] originRect Fallbacks Handling');
  const isolatedContainer = win.document.createElement('div');
  win.document.body.appendChild(isolatedContainer);
  const isolatedRoot = ReactDOM.createRoot(isolatedContainer);

  let nullCrash = false;
  let undefCrash = false;
  let zeroCrash = false;

  try {
    await act(async () => {
      isolatedRoot.render(React.createElement(MarkdownModal, { isOpen: true, originRect: null, onClose: () => {} }));
    });
  } catch (e) {
    nullCrash = true;
  }

  try {
    await act(async () => {
      isolatedRoot.render(React.createElement(MarkdownModal, { isOpen: true, originRect: undefined, onClose: () => {} }));
    });
  } catch (e) {
    undefCrash = true;
  }

  try {
    await act(async () => {
      isolatedRoot.render(React.createElement(MarkdownModal, {
        isOpen: true,
        originRect: { left: 0, top: 0, width: 0, height: 0 },
        onClose: () => {},
      }));
    });
  } catch (e) {
    zeroCrash = true;
  }

  const fallbacksPass = !nullCrash && !undefCrash && !zeroCrash;
  results.push({
    id: 'T7',
    name: 'originRect Null / Undefined / Zero-Bounds Fallbacks',
    pass: fallbacksPass,
    detail: `null crash: ${nullCrash}, undefined crash: ${undefCrash}, zero-bounds crash: ${zeroCrash}`,
  });

  // -------------------------------------------------------------
  // Test 8: Keyboard ESC Key on Fresh Component
  // -------------------------------------------------------------
  console.log('\n[TEST 8] Keyboard ESC Key Handling');
  let escFired = false;
  await act(async () => {
    isolatedRoot.render(null);
  });
  await act(async () => {
    isolatedRoot.render(React.createElement(MarkdownModal, {
      isOpen: true,
      originRect: null,
      onClose: () => { escFired = true; },
    }));
  });

  await act(async () => {
    win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 350));

  results.push({
    id: 'T8',
    name: 'ESC Key Triggers Modal Close',
    pass: escFired,
    detail: `ESC key caused onClose callback: ${escFired}`,
  });

  // -------------------------------------------------------------
  // Test 9: Backdrop Click vs Inner Window Click
  // -------------------------------------------------------------
  console.log('\n[TEST 9] Backdrop Click vs Inner Window Click');
  let backdropFired = false;
  await act(async () => {
    isolatedRoot.render(null);
  });
  await act(async () => {
    isolatedRoot.render(React.createElement(MarkdownModal, {
      isOpen: true,
      originRect: null,
      onClose: () => { backdropFired = true; },
    }));
  });

  // First click inner window -> should NOT fire
  const innerWin = isolatedContainer.querySelector('.markdown-modal-window');
  let innerClickClosed = false;
  if (innerWin) {
    await act(async () => {
      innerWin.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 100));
    innerClickClosed = backdropFired;
  }

  // Click overlay -> should fire
  const overlay = isolatedContainer.querySelector('.markdown-modal-overlay');
  if (overlay) {
    await act(async () => {
      overlay.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 350));
  }

  const t9Pass = !innerClickClosed && backdropFired;
  results.push({
    id: 'T9',
    name: 'Backdrop Click Closes, Inner Click Preserved',
    pass: t9Pass,
    detail: `Inner click dismissed: ${innerClickClosed} (expected false), Overlay click dismissed: ${backdropFired} (expected true)`,
  });

  // -------------------------------------------------------------
  // Test 10: Window Header Dragging & Maximize Toggle
  // -------------------------------------------------------------
  console.log('\n[TEST 10] Window Header Dragging & Maximize Toggle');
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

  const maxBtn = isolatedContainer.querySelector('.win-btn.max');
  const header = isolatedContainer.querySelector('.markdown-modal-header');
  const modalEl = isolatedContainer.querySelector('.markdown-modal-window');

  // Test Maximize toggle
  let maximizedBefore = modalEl.classList.contains('maximized');
  await act(async () => {
    maxBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });
  let maximizedAfter = modalEl.classList.contains('maximized');
  await act(async () => {
    maxBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });
  let restoredAfter = modalEl.classList.contains('maximized');

  // Test dragging
  const initialTop = modalEl.style.top;
  const initialLeft = modalEl.style.left;

  await act(async () => {
    header.dispatchEvent(new win.MouseEvent('mousedown', { clientX: 200, clientY: 200, bubbles: true }));
    win.document.dispatchEvent(new win.MouseEvent('mousemove', { clientX: 250, clientY: 260, bubbles: true }));
    win.document.dispatchEvent(new win.MouseEvent('mouseup', { bubbles: true }));
  });

  const draggedTop = modalEl.style.top;
  const draggedLeft = modalEl.style.left;
  const draggedMoved = draggedTop !== initialTop || draggedLeft !== initialLeft;

  const t10Pass = !maximizedBefore && maximizedAfter && !restoredAfter && draggedMoved;
  results.push({
    id: 'T10',
    name: 'Window Dragging & Maximize/Restore Toggle',
    pass: t10Pass,
    detail: `Max toggle passed: ${!maximizedBefore && maximizedAfter && !restoredAfter}, Drag coordinates updated: ${draggedMoved}`,
  });

  // Clean up isolated test container before Test 11
  await act(async () => {
    isolatedRoot.unmount();
  });
  isolatedContainer.remove();

  // -------------------------------------------------------------
  // Test 11: Direct Desktop Shortcut Removal Verification
  // -------------------------------------------------------------
  console.log('\n[TEST 11] Direct Desktop Shortcut Removal Verification');
  await act(async () => {
    root.render(null);
  });
  await act(async () => {
    root.render(React.createElement(Desktop));
  });

  const bootCard11 = win.document.querySelector('.ps5-intro-container');
  if (bootCard11) {
    await act(async () => {
      bootCard11.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 100));
  }

  const desktopLabels = Array.from(win.document.querySelectorAll('.desktop-icon'))
    .map(el => el.textContent.trim());

  const hasDirectAccess = desktopLabels.some(label => label.includes('UE5 Pong'));
  console.log(`- Direct desktop shortcut present: ${hasDirectAccess} (expected: false)`);
  console.log(`- Desktop icons: ${desktopLabels.join(', ')}`);

  results.push({
    id: 'T11',
    name: 'Direct Desktop Shortcut Removal (Smooth Projects Catalog Flow)',
    pass: !hasDirectAccess && desktopLabels.includes('Projects'),
    detail: `Direct access removed: ${!hasDirectAccess}, Projects catalog present: ${desktopLabels.includes('Projects')}`,
  });

  // -------------------------------------------------------------
  // Summary and Verdict Determination
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('                   FINAL VERIFICATION RESULTS                   ');
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
  console.log(`OVERALL EMPIRICAL VERDICT: ${allPassed ? 'PASS' : 'FAIL'}`);
  console.log('----------------------------------------------------------------\n');

  // Clean teardown
  await act(async () => {
    root.unmount();
    isolatedRoot.unmount();
  });
  await viteServer.close();

  process.exit(allPassed ? 0 : 1);
}

runTestSuite().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
