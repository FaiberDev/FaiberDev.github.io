import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { createServer } from 'vite';

// Configure React act environment
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

async function runAdversarialSuite() {
  console.log('================================================================');
  console.log('   CHALLENGER M3-2 GEN 3: ADVERSARIAL STRESS & ORACLE SUITE    ');
  console.log('================================================================');

  // Setup DOM environment
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

  let reducedMotionPref = false;
  win.matchMedia = (query) => ({
    matches: query.includes('prefers-reduced-motion') ? reducedMotionPref : false,
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
      top: 100,
      left: 150,
      bottom: 200,
      right: 270,
      width: 120,
      height: 100,
      x: 150,
      y: 100,
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
    gsapLog.fromTo.push({ target, fromVars: { ...fromVars }, toVars: { ...toVars } });
    return origFromTo.apply(this, arguments);
  };

  const origTo = gsap.to;
  gsap.to = function(target, vars) {
    gsapLog.to.push({ target, vars: { ...vars } });
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
  // Test S1: Multi-Cycle Rapid Open/Close Stress (20 iterations)
  // -------------------------------------------------------------
  console.log('\n[STRESS 1] 20 Sequential Open / Close Cycles (State Latching & Leak Check)');
  let s1Passed = true;
  let s1Detail = '';

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

  const getDesktopIcon = (name) => {
    return Array.from(win.document.querySelectorAll('.desktop-icon'))
      .find(el => el.textContent.includes(name));
  };

  // Open Projects Catalog
  const projectsIconS1 = getDesktopIcon('Projects');
  await act(async () => {
    projectsIconS1?.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });

  for (let cycle = 1; cycle <= 20; cycle++) {
    gsapLog.fromTo.length = 0;
    gsapLog.to.length = 0;

    const playBtn = win.document.querySelector('.ps5-play-btn');
    if (!playBtn) {
      s1Passed = false;
      s1Detail = `Cycle ${cycle}: Projects play button not found`;
      break;
    }

    await act(async () => {
      playBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });

    const isOpenInDom = !!win.document.querySelector('.markdown-modal-window');
    const fromToFired = gsapLog.fromTo.length > 0;

    if (!isOpenInDom || !fromToFired) {
      s1Passed = false;
      s1Detail = `Cycle ${cycle}: failed to open (inDOM: ${isOpenInDom}, fromTo: ${fromToFired})`;
      break;
    }

    // Close via close button
    const closeBtn = win.document.querySelector('.markdown-modal-window .win-btn.close');
    if (!closeBtn) {
      s1Passed = false;
      s1Detail = `Cycle ${cycle}: close button missing`;
      break;
    }

    await act(async () => {
      closeBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });

    await new Promise(r => setTimeout(r, 350));
    const isClosedInDom = !win.document.querySelector('.markdown-modal-window');

    if (!isClosedInDom) {
      s1Passed = false;
      s1Detail = `Cycle ${cycle}: modal failed to unmount (closure lockup)`;
      break;
    }
  }

  if (s1Passed) {
    s1Detail = 'Successfully executed 20 open/close cycles with 100% GSAP triggers and 0 closures retained';
  }

  results.push({
    id: 'S1',
    name: '20-Cycle Open/Close Rapid Stress Harness',
    pass: s1Passed,
    detail: s1Detail,
  });

  // -------------------------------------------------------------
  // Test S2: Alternating Close Method Stress (Close Button <-> Escape Key <-> Minimize)
  // -------------------------------------------------------------
  console.log('\n[STRESS 2] Alternating Close Method Stress (ESC <-> Close Button <-> Minimize)');
  let s2Passed = true;
  let s2Detail = '';

  for (let i = 0; i < 5; i++) {
    const playBtn = win.document.querySelector('.ps5-play-btn');
    if (!playBtn) {
      s2Passed = false;
      s2Detail = `Iteration ${i}: PS5 Play button not rendered in projects window`;
      break;
    }

    // Open from Play button
    await act(async () => {
      playBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
    if (!win.document.querySelector('.markdown-modal-window')) {
      s2Passed = false;
      s2Detail = `Iteration ${i}: Failed opening from Projects Play button`;
      break;
    }

    // Close via Escape key
    await act(async () => {
      win.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 350));
    if (win.document.querySelector('.markdown-modal-window')) {
      s2Passed = false;
      s2Detail = `Iteration ${i}: Failed closing via ESC`;
      break;
    }

    // Open again
    gsapLog.fromTo.length = 0;
    await act(async () => {
      playBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });

    const modalFromA = !!win.document.querySelector('.markdown-modal-window');
    const fromToCountA = gsapLog.fromTo.length;
    if (!modalFromA || fromToCountA === 0) {
      s2Passed = false;
      s2Detail = `Iteration ${i}: Failed re-opening modal (inDOM: ${modalFromA}, fromTo: ${fromToCountA})`;
      break;
    }

    // Close via Minimize button on the markdown modal
    const minBtn = win.document.querySelector('.markdown-modal-window .win-btn.min');
    await act(async () => {
      minBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
    await new Promise(r => setTimeout(r, 350));
    if (win.document.querySelector('.markdown-modal-window')) {
      s2Passed = false;
      s2Detail = `Iteration ${i}: Failed closing via Minimize button`;
      break;
    }
  }

  if (s2Passed) {
    s2Detail = 'Seamless alternation between ESC and Minimize close methods across 5 cycles';
  }

  results.push({
    id: 'S2',
    name: 'Alternating Trigger & Close Method Interleaved Navigation',
    pass: s2Passed,
    detail: s2Detail,
  });

  // -------------------------------------------------------------
  // Test S3: Adversarial originRect Geometries (NaN, Negative, Infinite, Malformed)
  // -------------------------------------------------------------
  console.log('\n[STRESS 3] Adversarial originRect Edge Cases');
  const isolatedContainer = win.document.createElement('div');
  win.document.body.appendChild(isolatedContainer);
  const isolatedRoot = ReactDOM.createRoot(isolatedContainer);

  const edgeRects = [
    { name: 'Negative coordinates', rect: { left: -1000, top: -1000, width: 50, height: 50 } },
    { name: 'Ultra-huge coordinates', rect: { left: 999999, top: 999999, width: 10000, height: 10000 } },
    { name: 'Zero dimensions', rect: { left: 100, top: 100, width: 0, height: 0 } },
    { name: 'NaN dimensions', rect: { left: NaN, top: NaN, width: NaN, height: NaN } },
    { name: 'Empty object', rect: {} },
    { name: 'Null prototype object', rect: Object.create(null) },
  ];

  let s3Passed = true;
  let s3Errors = [];

  for (const tc of edgeRects) {
    try {
      gsapLog.fromTo.length = 0;
      await act(async () => {
        isolatedRoot.render(React.createElement(MarkdownModal, {
          isOpen: true,
          originRect: tc.rect,
          onClose: () => {},
        }));
      });
      // Check that window element exists
      const wEl = isolatedContainer.querySelector('.markdown-modal-window');
      if (!wEl) {
        s3Errors.push(`${tc.name}: element not rendered`);
      }
    } catch (err) {
      s3Passed = false;
      s3Errors.push(`${tc.name} caused crash: ${err.message}`);
    }
  }

  results.push({
    id: 'S3',
    name: 'Adversarial originRect Geometry Injection',
    pass: s3Passed && s3Errors.length === 0,
    detail: s3Errors.length === 0 ? 'All 6 adversarial originRect structures handled safely without crash' : s3Errors.join('; '),
  });

  // -------------------------------------------------------------
  // Test S4: prefers-reduced-motion Branch Verification
  // -------------------------------------------------------------
  console.log('\n[STRESS 4] prefers-reduced-motion Branch & Timing');
  await act(async () => {
    isolatedRoot.render(null);
  });
  reducedMotionPref = true; // Turn ON prefers-reduced-motion
  gsapLog.fromTo.length = 0;
  gsapLog.to.length = 0;

  let reducedCloseFired = false;
  await act(async () => {
    isolatedRoot.render(React.createElement(MarkdownModal, {
      isOpen: true,
      originRect: { left: 100, top: 100, width: 200, height: 200 },
      onClose: () => { reducedCloseFired = true; },
    }));
  });

  // In reduced motion, gsap.fromTo should animate { autoAlpha: 0 } -> { autoAlpha: 1, duration: 0.15 }
  const reducedFromTo = gsapLog.fromTo.slice();
  const usesAlphaOnly = reducedFromTo.some(call =>
    call.fromVars && call.fromVars.autoAlpha === 0 &&
    call.toVars && call.toVars.autoAlpha === 1 &&
    call.toVars.duration === 0.15 &&
    !call.toVars.ease // No back.out spring curve in reduced motion
  );

  // Now trigger close
  const closeBtnReduced = isolatedContainer.querySelector('.win-btn.close');
  await act(async () => {
    closeBtnReduced.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });
  await new Promise(r => setTimeout(r, 250));

  const reducedTo = gsapLog.to.slice();
  const usesAlphaExit = reducedTo.some(call =>
    call.vars && call.vars.autoAlpha === 0 && call.vars.duration === 0.15
  );

  reducedMotionPref = false; // Reset to false

  const s4Pass = usesAlphaOnly && usesAlphaExit && reducedCloseFired;
  results.push({
    id: 'S4',
    name: 'prefers-reduced-motion Accessibility Compliance',
    pass: s4Pass,
    detail: `Entrance autoAlpha: ${usesAlphaOnly}, Exit autoAlpha: ${usesAlphaExit}, onClose triggered: ${reducedCloseFired}`,
  });

  // -------------------------------------------------------------
  // Test S5: Dragging Bounds & Maximize Interaction Stress
  // -------------------------------------------------------------
  console.log('\n[STRESS 5] Window Dragging Boundary Clamping & Maximize Constraint');
  await act(async () => {
    isolatedRoot.render(React.createElement(MarkdownModal, {
      isOpen: true,
      originRect: null,
      onClose: () => {},
    }));
  });

  const header = isolatedContainer.querySelector('.markdown-modal-header');
  const maxBtn = isolatedContainer.querySelector('.win-btn.max');
  const modalWin = isolatedContainer.querySelector('.markdown-modal-window');

  // Drag far off to negative territory
  await act(async () => {
    header.dispatchEvent(new win.MouseEvent('mousedown', { clientX: 500, clientY: 500, bubbles: true }));
    win.document.dispatchEvent(new win.MouseEvent('mousemove', { clientX: -2000, clientY: -2000, bubbles: true }));
    win.document.dispatchEvent(new win.MouseEvent('mouseup', { bubbles: true }));
  });

  // Check top and left are clamped at >= 0
  const leftClampedMin = parseFloat(modalWin.style.left) >= 0;
  const topClampedMin = parseFloat(modalWin.style.top) >= 0;

  // Maximize the window
  await act(async () => {
    maxBtn.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });
  const isMax = modalWin.classList.contains('maximized');

  // Attempt to drag while maximized (should be blocked)
  const preDragLeft = modalWin.style.left;
  await act(async () => {
    header.dispatchEvent(new win.MouseEvent('mousedown', { clientX: 200, clientY: 200, bubbles: true }));
    win.document.dispatchEvent(new win.MouseEvent('mousemove', { clientX: 400, clientY: 400, bubbles: true }));
    win.document.dispatchEvent(new win.MouseEvent('mouseup', { bubbles: true }));
  });
  const postDragLeft = modalWin.style.left;
  const dragIgnoredWhenMaximized = preDragLeft === postDragLeft;

  const s5Pass = leftClampedMin && topClampedMin && isMax && dragIgnoredWhenMaximized;
  results.push({
    id: 'S5',
    name: 'Window Dragging Boundary Clamping & Maximize Lock',
    pass: s5Pass,
    detail: `Left clamp min >= 0: ${leftClampedMin}, Top clamp min >= 0: ${topClampedMin}, Maximize drag locked: ${dragIgnoredWhenMaximized}`,
  });

  // -------------------------------------------------------------
  // Test S6: Pathological & Adversarial Markdown Parsing
  // -------------------------------------------------------------
  console.log('\n[STRESS 6] Pathological Markdown AST Parsing & Syntax Highlighting');
  const ReactMarkdownMod = await viteServer.ssrLoadModule('react-markdown');
  const ReactMarkdown = ReactMarkdownMod.default;
  const remarkGfmMod = await viteServer.ssrLoadModule('remark-gfm');
  const remarkGfm = remarkGfmMod.default;
  const rehypeHighlightMod = await viteServer.ssrLoadModule('rehype-highlight');
  const rehypeHighlight = rehypeHighlightMod.default;

  const pathologicalSamples = [
    {
      name: 'GFM table with unbalanced columns & pipes',
      md: '| H1 | H2 |\n|---|---|\n| cell 1 | cell 2 | overflow |\n| only one |',
    },
    {
      name: 'Escaped pipe characters in table cells',
      md: '| Method | Signature |\n|---|---|\n| Func | `void Foo(int a \\| b)` |\n| Bitwise | `A \\| B` |',
    },
    {
      name: 'Deeply nested blockquotes (10 levels)',
      md: '> > > > > > > > > > Level 10 deeply nested quote',
    },
    {
      name: 'Unknown code fence language with C++ syntax',
      md: '```totally_unknown_lang_12345\nvoid Test() { int x = 10; }\n```',
    },
    {
      name: 'Unclosed formatting & raw HTML injection attempt',
      md: '**Unclosed bold tag and *unclosed italic with <script>alert("xss")</script> and <img src=x onerror=alert(1)>',
    },
    {
      name: 'Math formulas and LaTeX expressions',
      md: '$$\\text{ExactBeat} = \\int_0^T \\frac{\\text{BPM}}{60} dt$$\n\nInline formula: $\\Delta t = 0.05$',
    },
    {
      name: 'Huge line without spaces (word-break test)',
      md: 'A'.repeat(5000),
    },
    {
      name: 'Empty code blocks and isolated backticks',
      md: '```\n```\n\n```cpp\n\n```\n\n`\n``\n',
    },
  ];

  let s6Passed = true;
  let s6Detail = [];

  for (const sample of pathologicalSamples) {
    try {
      await act(async () => {
        isolatedRoot.render(
          React.createElement('div', { className: 'test-md-prose' },
            React.createElement(ReactMarkdown, {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeHighlight],
            }, sample.md)
          )
        );
      });
      // Verify no script tags leaked into DOM
      const scripts = isolatedContainer.querySelectorAll('script');
      if (scripts.length > 0) {
        s6Passed = false;
        s6Detail.push(`${sample.name}: XSS script element created in DOM!`);
      }
    } catch (err) {
      s6Passed = false;
      s6Detail.push(`${sample.name} crashed: ${err.message}`);
    }
  }

  if (s6Passed) {
    s6Detail.push('All 8 pathological markdown snippets rendered with 0 exceptions and 0 script injections');
  }

  results.push({
    id: 'S6',
    name: 'Pathological Markdown Stress & XSS Neutralization',
    pass: s6Passed,
    detail: s6Detail.join('; '),
  });

  // -------------------------------------------------------------
  // Test S7: Real-world pong-architecture.md Structural Integrity Check
  // -------------------------------------------------------------
  console.log('\n[STRESS 7] Full-Size pong-architecture.md Render & DOM Inspection');
  const pongArchRaw = (await viteServer.ssrLoadModule('./src/data/pong-architecture.md?raw')).default;
  let s7Passed = true;
  let s7Detail = '';

  try {
    await act(async () => {
      isolatedRoot.render(
        React.createElement('div', { className: 'full-pong-prose' },
          React.createElement(ReactMarkdown, {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeHighlight],
          }, pongArchRaw)
        )
      );
    });

    const renderedTables = isolatedContainer.querySelectorAll('.full-pong-prose table');
    const renderedPreCode = isolatedContainer.querySelectorAll('.full-pong-prose pre code');
    const highlightedCode = isolatedContainer.querySelectorAll('.full-pong-prose .hljs-keyword, .full-pong-prose .hljs-title');
    const headings = isolatedContainer.querySelectorAll('.full-pong-prose h1, .full-pong-prose h2, .full-pong-prose h3');

    console.log(`- Tables rendered: ${renderedTables.length}`);
    console.log(`- Code blocks: ${renderedPreCode.length}`);
    console.log(`- Syntax tokens highlighted: ${highlightedCode.length}`);
    console.log(`- Headings: ${headings.length}`);

    if (renderedTables.length === 0 || renderedPreCode.length === 0 || highlightedCode.length === 0 || headings.length === 0) {
      s7Passed = false;
      s7Detail = `Missing critical elements (tables: ${renderedTables.length}, code: ${renderedPreCode.length}, hljs: ${highlightedCode.length}, headings: ${headings.length})`;
    } else {
      s7Detail = `Rendered ${renderedTables.length} tables, ${renderedPreCode.length} code blocks (${highlightedCode.length} syntax tokens), ${headings.length} headings cleanly`;
    }
  } catch (err) {
    s7Passed = false;
    s7Detail = `Crash rendering pong-architecture.md: ${err.message}`;
  }

  results.push({
    id: 'S7',
    name: 'Complete pong-architecture.md AST & Syntax Verification',
    pass: s7Passed,
    detail: s7Detail,
  });

  // -------------------------------------------------------------
  // Teardown and Final Verdict
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('              ADVERSARIAL STRESS SUITE RESULTS                  ');
  console.log('================================================================');

  let passedTotal = 0;
  for (const r of results) {
    const status = r.pass ? '✓ PASS' : '✗ FAIL';
    console.log(`${status} [${r.id}] ${r.name}: ${r.detail}`);
    if (r.pass) passedTotal++;
  }

  const allPassed = passedTotal === results.length;
  console.log('\n----------------------------------------------------------------');
  console.log(`TOTAL: ${passedTotal} / ${results.length} PASSED`);
  console.log(`ADVERSARIAL EMPIRICAL VERDICT: ${allPassed ? 'PASS' : 'FAIL'}`);
  console.log('----------------------------------------------------------------\n');

  await act(async () => {
    root.unmount();
    isolatedRoot.unmount();
  });
  isolatedContainer.remove();
  await viteServer.close();

  process.exit(allPassed ? 0 : 1);
}

runAdversarialSuite().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
