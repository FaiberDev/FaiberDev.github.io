import { JSDOM } from 'jsdom';
import React, { act, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { createServer } from 'vite';

// Verify all 10 Challenger tests against the proposed FixedMarkdownModal with prevIsOpen pattern
async function runTestSuite() {
  console.log('================================================================');
  console.log('   EXPLORER M3 FIX 1: SIMULATION OF 10 TESTS (ZERO LINT WARNINGS) ');
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

  const gsapModule = await viteServer.ssrLoadModule('gsap');
  const gsap = gsapModule.default || gsapModule.gsap || gsapModule;
  const { useGSAP } = await viteServer.ssrLoadModule('@gsap/react');
  gsap.registerPlugin(useGSAP);

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

  // Fixed MarkdownModal Component with React Recommended State Adjustment
  function MarkdownModal({
    isOpen = false,
    originRect = null,
    onClose,
    zIndex = 2000,
  }) {
    const containerRef = useRef(null);
    const windowRef = useRef(null);
    const dragState = useRef(null);
    const [isClosing, setIsClosing] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);

    // Synchronize isClosing during render when isOpen transitions to true
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
    if (prevIsOpen !== isOpen) {
      setPrevIsOpen(isOpen);
      if (isOpen) {
        setIsClosing(false);
      }
    }

    const modalWidth = useMemo(() => Math.min(940, window.innerWidth * 0.9), []);
    const modalHeight = useMemo(() => Math.min(700, window.innerHeight * 0.84), []);

    const [pos, setPos] = useState(() => ({
      x: Math.max(16, (window.innerWidth - modalWidth) / 2),
      y: Math.max(20, (window.innerHeight - modalHeight) / 2 - 20),
    }));

    const getOriginDeltas = useCallback(() => {
      const w = isMaximized ? window.innerWidth : modalWidth;
      const h = isMaximized ? (window.innerHeight - 56) : modalHeight;
      const modalCenterX = isMaximized ? window.innerWidth / 2 : (pos.x + w / 2);
      const modalCenterY = isMaximized ? (window.innerHeight - 56) / 2 : (pos.y + h / 2);

      if (!originRect) {
        return { deltaX: 0, deltaY: 30, scaleStart: 0.94 };
      }

      const triggerCenterX = originRect.left + originRect.width / 2;
      const triggerCenterY = originRect.top + originRect.height / 2;
      const deltaX = triggerCenterX - modalCenterX;
      const deltaY = triggerCenterY - modalCenterY;
      const scaleStart = Math.max(
        0.12,
        Math.min(originRect.width / w, originRect.height / h)
      );

      return { deltaX, deltaY, scaleStart };
    }, [originRect, isMaximized, modalWidth, modalHeight, pos.x, pos.y]);

    const { contextSafe } = useGSAP(() => {
      if (!isOpen || !windowRef.current) return;
      const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
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
    }, { scope: containerRef, dependencies: [isOpen] });

    const handleClose = useCallback(() => {
      if (isClosing || !windowRef.current) return;
      setIsClosing(true);

      const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      const target = windowRef.current;

      contextSafe(() => {
        if (prefersReduced) {
          gsap.to(target, {
            autoAlpha: 0,
            duration: 0.15,
            onComplete: () => {
              setIsClosing(false);
              onClose?.();
            },
          });
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
            setIsClosing(false);
            onClose?.();
          },
        });
      })();
    }, [isClosing, contextSafe, onClose, getOriginDeltas]);

    const onHeaderMouseDown = (e) => {
      if (isMaximized) return;
      dragState.current = { startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y };

      const onMouseMove = (moveEvent) => {
        if (!dragState.current) return;
        const { startX, startY, originX, originY } = dragState.current;
        setPos({
          x: Math.max(0, Math.min(window.innerWidth - 100, originX + moveEvent.clientX - startX)),
          y: Math.max(0, Math.min(window.innerHeight - 100, originY + moveEvent.clientY - startY)),
        });
      };

      const onMouseUp = () => {
        dragState.current = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    useEffect(() => {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleClose]);

    if (!isOpen) return null;

    const style = isMaximized
      ? { top: 0, left: 0, width: '100%', height: 'calc(100% - 56px)' }
      : {
          top: pos.y,
          left: pos.x,
          width: modalWidth,
          height: modalHeight,
        };

    return React.createElement(
      'div',
      {
        ref: containerRef,
        className: 'markdown-modal-overlay',
        style: { zIndex },
        onClick: (e) => {
          if (e.target === containerRef.current) {
            handleClose();
          }
        },
      },
      React.createElement(
        'div',
        {
          ref: windowRef,
          className: `markdown-modal-window active ${isMaximized ? 'maximized' : ''}`,
          style,
        },
        React.createElement(
          'div',
          { className: 'markdown-modal-header', onMouseDown: onHeaderMouseDown },
          React.createElement(
            'div',
            { className: 'markdown-modal-title-group' },
            React.createElement('span', { className: 'markdown-modal-badge' }, 'UE5 C++'),
            React.createElement('span', { className: 'markdown-modal-title' }, 'UE5 Pong Architecture — Deep Dive')
          ),
          React.createElement(
            'div',
            { className: 'markdown-modal-controls' },
            React.createElement('button', {
              className: 'win-btn min',
              title: 'Minimize',
              onClick: (e) => {
                e.stopPropagation();
                handleClose();
              },
            }),
            React.createElement('button', {
              className: 'win-btn max',
              title: isMaximized ? 'Restore' : 'Maximize',
              onClick: (e) => {
                e.stopPropagation();
                setIsMaximized((m) => !m);
              },
            }),
            React.createElement('button', {
              className: 'win-btn close',
              title: 'Close (Esc)',
              onClick: (e) => {
                e.stopPropagation();
                handleClose();
              },
            })
          )
        ),
        React.createElement('div', { className: 'markdown-scroll-container' })
      )
    );
  }

  function DesktopWithFixedModal() {
    const [pongModal, setPongModal] = useState({
      isOpen: false,
      originRect: null,
      zIndex: 2000,
    });

    const openPongModal = (originRect) => {
      setPongModal({
        isOpen: true,
        originRect: originRect ?? null,
        zIndex: 2100,
      });
    };

    const closePongModal = () => {
      setPongModal((prev) => ({ ...prev, isOpen: false }));
    };

    return React.createElement(
      'div',
      { className: 'desktop' },
      React.createElement(
        'div',
        { className: 'desktop-icons' },
        React.createElement(
          'div',
          {
            className: 'desktop-icon',
            onDoubleClick: (e) => {
              openPongModal(e.currentTarget.getBoundingClientRect());
            },
            onClick: (e) => {
              if (e.detail === 2) {
                openPongModal(e.currentTarget.getBoundingClientRect());
              }
            },
            onTouchEnd: (e) => {
              openPongModal(e.currentTarget.getBoundingClientRect());
            },
          },
          'UE5 Pong Arch'
        )
      ),
      React.createElement('button', {
        className: 'ps5-play-btn',
        onClick: (e) => {
          openPongModal(e.currentTarget.getBoundingClientRect());
        },
      }, 'More information'),
      React.createElement(MarkdownModal, {
        isOpen: pongModal.isOpen,
        originRect: pongModal.originRect,
        zIndex: pongModal.zIndex,
        onClose: closePongModal,
      })
    );
  }

  const results = [];
  const rootEl = win.document.getElementById('root');
  const root = ReactDOM.createRoot(rootEl);

  // [TEST 1] Initial Desktop Mount
  await act(async () => {
    root.render(React.createElement(DesktopWithFixedModal));
  });
  const modalInitiallyInDom = !!win.document.querySelector('.markdown-modal-window');
  results.push({
    id: 'T1',
    name: 'Initial Modal Closed State',
    pass: !modalInitiallyInDom,
    detail: `Modal in DOM at startup: ${modalInitiallyInDom}`,
  });

  // [TEST 2] Trigger B Double-Click & Entrance Tween
  gsapLog.fromTo.length = 0;
  gsapLog.to.length = 0;
  const pongShortcut = win.document.querySelector('.desktop-icon');
  await act(async () => {
    pongShortcut.dispatchEvent(new win.MouseEvent('dblclick', { bubbles: true }));
  });
  const modalOpen1 = !!win.document.querySelector('.markdown-modal-window');
  const entranceTweenCount1 = gsapLog.fromTo.length;
  results.push({
    id: 'T2',
    name: 'Trigger B Open & GSAP Entrance Animation',
    pass: modalOpen1 && entranceTweenCount1 > 0,
    detail: `Modal in DOM: ${modalOpen1}, gsap.fromTo calls: ${entranceTweenCount1}`,
  });

  // [TEST 3] Modal First Close via Close Button
  const closeBtn1 = win.document.querySelector('.win-btn.close');
  let firstCloseTriggered = false;
  if (closeBtn1) {
    await act(async () => {
      closeBtn1.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
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

  // [TEST 4] Modal Re-Open (Second Open Attempt)
  gsapLog.fromTo.length = 0;
  await act(async () => {
    pongShortcut.dispatchEvent(new win.MouseEvent('dblclick', { bubbles: true }));
  });
  const modalOpen2 = !!win.document.querySelector('.markdown-modal-window');
  const entranceTweenCount2 = gsapLog.fromTo.length;
  results.push({
    id: 'T4',
    name: 'Modal Re-Open State & Entrance Tween',
    pass: modalOpen2 && entranceTweenCount2 > 0,
    detail: `Modal in DOM: ${modalOpen2}, gsap.fromTo calls: ${entranceTweenCount2}`,
  });

  // [TEST 5] Modal Second Close Attempt (isClosing Bug Check)
  const closeBtn2 = win.document.querySelector('.win-btn.close');
  let secondCloseTriggered = false;
  if (closeBtn2) {
    await act(async () => {
      closeBtn2.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 350));
    const modalAfterClose2 = !!win.document.querySelector('.markdown-modal-window');
    secondCloseTriggered = !modalAfterClose2;
  }
  results.push({
    id: 'T5',
    name: 'Modal Second Close (isClosing state reset)',
    pass: secondCloseTriggered,
    detail: `Modal successfully closed second time: ${secondCloseTriggered}`,
  });

  // [TEST 6] Trigger A: Projects Catalog Play Button
  await act(async () => {
    root.render(null);
  });
  await act(async () => {
    root.render(React.createElement(DesktopWithFixedModal));
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
  results.push({
    id: 'T6',
    name: 'Trigger A (Projects Catalog) Open & Entrance Tween',
    pass: triggerAOpened && triggerAEntranceTween > 0,
    detail: `Modal opened: ${triggerAOpened}, gsap.fromTo count: ${triggerAEntranceTween}`,
  });

  // [TEST 7] originRect Fallbacks Handling
  const isolatedContainer = win.document.createElement('div');
  win.document.body.appendChild(isolatedContainer);
  const isolatedRoot = ReactDOM.createRoot(isolatedContainer);
  let nullCrash = false, undefCrash = false, zeroCrash = false;
  try {
    await act(async () => {
      isolatedRoot.render(React.createElement(MarkdownModal, { isOpen: true, originRect: null, onClose: () => {} }));
    });
  } catch (e) { nullCrash = true; }
  try {
    await act(async () => {
      isolatedRoot.render(React.createElement(MarkdownModal, { isOpen: true, originRect: undefined, onClose: () => {} }));
    });
  } catch (e) { undefCrash = true; }
  try {
    await act(async () => {
      isolatedRoot.render(React.createElement(MarkdownModal, { isOpen: true, originRect: { left: 0, top: 0, width: 0, height: 0 }, onClose: () => {} }));
    });
  } catch (e) { zeroCrash = true; }
  results.push({
    id: 'T7',
    name: 'originRect Null / Undefined / Zero-Bounds Fallbacks',
    pass: !nullCrash && !undefCrash && !zeroCrash,
    detail: `null crash: ${nullCrash}, undefined crash: ${undefCrash}, zero-bounds crash: ${zeroCrash}`,
  });

  // [TEST 8] Keyboard ESC Key Handling
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

  // [TEST 9] Backdrop Click vs Inner Window Click
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
  const innerWin = isolatedContainer.querySelector('.markdown-modal-window');
  let innerClickClosed = false;
  if (innerWin) {
    await act(async () => {
      innerWin.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 100));
    innerClickClosed = backdropFired;
  }
  const overlay = isolatedContainer.querySelector('.markdown-modal-overlay');
  if (overlay) {
    await act(async () => {
      overlay.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 350));
  }
  results.push({
    id: 'T9',
    name: 'Backdrop Click Closes, Inner Click Preserved',
    pass: !innerClickClosed && backdropFired,
    detail: `Inner click dismissed: ${innerClickClosed}, Overlay click dismissed: ${backdropFired}`,
  });

  // [TEST 10] Window Header Dragging & Maximize Toggle
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
  let maximizedBefore = modalEl.classList.contains('maximized');
  await act(async () => {
    maxBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });
  let maximizedAfter = modalEl.classList.contains('maximized');
  await act(async () => {
    maxBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });
  let restoredAfter = modalEl.classList.contains('maximized');
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
  results.push({
    id: 'T10',
    name: 'Window Dragging & Maximize/Restore Toggle',
    pass: !maximizedBefore && maximizedAfter && !restoredAfter && draggedMoved,
    detail: `Max toggle passed: ${!maximizedBefore && maximizedAfter && !restoredAfter}, Drag coordinates updated: ${draggedMoved}`,
  });

  await act(async () => {
    isolatedRoot.unmount();
  });
  isolatedContainer.remove();

  console.log('\n================================================================');
  console.log('                   FINAL VERIFICATION RESULTS                   ');
  console.log('================================================================');
  let passedCount = 0;
  for (const r of results) {
    const status = r.pass ? '✓ PASS' : '✗ FAIL';
    console.log(`${status} [${r.id}] ${r.name}: ${r.detail}`);
    if (r.pass) passedCount++;
  }
  console.log(`TOTAL: ${passedCount} / ${results.length} PASSED`);
  console.log(`OVERALL EMPIRICAL VERDICT: ${passedCount === results.length ? 'PASS' : 'FAIL'}`);

  await act(async () => {
    root.unmount();
  });
  await viteServer.close();
}

runTestSuite().catch(e => {
  console.error(e);
  process.exit(1);
});
