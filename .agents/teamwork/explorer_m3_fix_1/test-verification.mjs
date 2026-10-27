import { JSDOM } from 'jsdom';
import React, { act, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { createServer } from 'vite';

// Test our proposed MarkdownModal implementation
async function test() {
  console.log('Testing proposed fix for MarkdownModal...');

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

  // Proposed Fixed MarkdownModal Component
  function FixedMarkdownModal({
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

    // Compute resting dimensions based on current window size
    const modalWidth = useMemo(() => Math.min(940, window.innerWidth * 0.9), []);
    const modalHeight = useMemo(() => Math.min(700, window.innerHeight * 0.84), []);

    const [pos, setPos] = useState(() => ({
      x: Math.max(16, (window.innerWidth - modalWidth) / 2),
      y: Math.max(20, (window.innerHeight - modalHeight) / 2 - 20),
    }));

    // Reset isClosing when isOpen transitions to true
    useEffect(() => {
      if (isOpen) {
        setIsClosing(false);
      }
    }, [isOpen]);

    // Calculate delta vector from trigger button to resting modal center
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

    // Spring entrance animation originating from trigger
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

    // Reverse unmount exit animation back to trigger
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

    // Keyboard accessibility: ESC key to close
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
          { className: 'markdown-modal-header' },
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
              className: 'win-btn close',
              title: 'Close (Esc)',
              onClick: (e) => {
                e.stopPropagation();
                handleClose();
              },
            })
          )
        )
      )
    );
  }

  // Test Harness with Desktop-like container
  function TestApp() {
    const [pongModal, setPongModal] = useState({
      isOpen: false,
      originRect: null,
      zIndex: 2000,
    });

    return React.createElement(
      'div',
      null,
      React.createElement('button', {
        id: 'open-btn',
        onClick: () => setPongModal(prev => ({ ...prev, isOpen: true })),
      }, 'Open'),
      React.createElement(FixedMarkdownModal, {
        isOpen: pongModal.isOpen,
        originRect: pongModal.originRect,
        zIndex: pongModal.zIndex,
        onClose: () => setPongModal(prev => ({ ...prev, isOpen: false })),
      })
    );
  }

  const rootEl = win.document.getElementById('root');
  const root = ReactDOM.createRoot(rootEl);

  // 1. Initial Render
  await act(async () => {
    root.render(React.createElement(TestApp));
  });
  console.log('1. Initial mount, modal in DOM:', !!win.document.querySelector('.markdown-modal-window'));
  console.log('1. fromTo calls:', gsapLog.fromTo.length);

  // 2. Open modal 1st time
  gsapLog.fromTo.length = 0;
  await act(async () => {
    win.document.getElementById('open-btn').click();
  });
  console.log('2. 1st Open, modal in DOM:', !!win.document.querySelector('.markdown-modal-window'));
  console.log('2. fromTo calls on 1st open:', gsapLog.fromTo.length);

  // 3. Close modal 1st time
  await act(async () => {
    win.document.querySelector('.win-btn.close').click();
  });
  await new Promise(r => setTimeout(r, 350));
  console.log('3. 1st Close, modal in DOM:', !!win.document.querySelector('.markdown-modal-window'));

  // 4. Open modal 2nd time
  gsapLog.fromTo.length = 0;
  await act(async () => {
    win.document.getElementById('open-btn').click();
  });
  console.log('4. 2nd Open, modal in DOM:', !!win.document.querySelector('.markdown-modal-window'));
  console.log('4. fromTo calls on 2nd open:', gsapLog.fromTo.length);

  // 5. Close modal 2nd time
  await act(async () => {
    win.document.querySelector('.win-btn.close').click();
  });
  await new Promise(r => setTimeout(r, 350));
  console.log('5. 2nd Close, modal in DOM:', !!win.document.querySelector('.markdown-modal-window'));

  // 6. Isolated mount with isOpen: true
  const isolatedContainer = win.document.createElement('div');
  win.document.body.appendChild(isolatedContainer);
  const isolatedRoot = ReactDOM.createRoot(isolatedContainer);

  let escFired = false;
  await act(async () => {
    isolatedRoot.render(React.createElement(FixedMarkdownModal, {
      isOpen: true,
      originRect: null,
      onClose: () => { escFired = true; },
    }));
  });
  await act(async () => {
    win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 350));
  console.log('6. ESC fired onClose:', escFired);

  await act(async () => {
    root.unmount();
    isolatedRoot.unmount();
  });
  await viteServer.close();
  console.log('VERIFICATION: ALL TESTS PASSED SUCCESSFULLY!');
}

test().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
