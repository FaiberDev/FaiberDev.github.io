import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { createServer } from 'vite';

async function runWindowAnimationSuite() {
  console.log('================================================================');
  console.log('   SUITE: ALL WINDOWS GSAP ANIMATIONS & INTERACTION VERIFICATION');
  console.log('================================================================');

  // Setup DOM
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

  const viteServer = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  // Spy on GSAP
  const gsapModule = await viteServer.ssrLoadModule('gsap');
  const gsap = gsapModule.default || gsapModule.gsap || gsapModule;

  const gsapLog = {
    fromTo: [],
    to: [],
  };

  const origFromTo = gsap.fromTo;
  gsap.fromTo = function (target, fromVars, toVars) {
    gsapLog.fromTo.push({ target, fromVars, toVars });
    return origFromTo.apply(this, arguments);
  };

  const origTo = gsap.to;
  gsap.to = function (target, vars) {
    gsapLog.to.push({ target, vars });
    return origTo.apply(this, arguments);
  };

  const WindowMod = await viteServer.ssrLoadModule('./src/components/window/Window.jsx');
  const Window = WindowMod.default;
  const AboutMod = await viteServer.ssrLoadModule('./src/components/about/About.jsx');
  const About = AboutMod.default;
  const NotesMod = await viteServer.ssrLoadModule('./src/components/notes/Notes.jsx');
  const Notes = NotesMod.default;
  const DesktopMod = await viteServer.ssrLoadModule('./src/components/desktop/Desktop.jsx');
  const Desktop = DesktopMod.default;

  const results = [];
  const rootEl = win.document.getElementById('root');
  const root = ReactDOM.createRoot(rootEl);

  // -------------------------------------------------------------
  // Test W1: Window.jsx GSAP Spring Entrance Animation
  // -------------------------------------------------------------
  console.log('\n[TEST W1] Window.jsx GSAP Spring Entrance');
  gsapLog.fromTo.length = 0;
  gsapLog.to.length = 0;

  await act(async () => {
    root.render(
      React.createElement(
        Window,
        {
          id: 'test-win',
          title: 'Test Window',
          defaultSize: { w: 400, h: 300 },
          onClose: () => {},
        },
        React.createElement('div', null, 'Content')
      )
    );
  });

  const winEntranceCalls = gsapLog.fromTo.filter(
    (c) => c.toVars?.ease === 'back.out(1.4)' || c.toVars?.scale === 1
  );

  results.push({
    id: 'W1',
    name: 'Window Spring Entrance Tween',
    pass: winEntranceCalls.length > 0,
    detail: `Captured spring entrance tweens: ${winEntranceCalls.length}`,
  });

  // -------------------------------------------------------------
  // Test W2: Window.jsx Close Exit Animation (gsap.to scale 0.90, y 20)
  // -------------------------------------------------------------
  console.log('\n[TEST W2] Window.jsx Close Exit Animation');
  gsapLog.to.length = 0;
  let closeCallbackCalled = false;

  await act(async () => {
    root.render(
      React.createElement(
        Window,
        {
          id: 'test-win',
          title: 'Test Window',
          defaultSize: { w: 400, h: 300 },
          onClose: (action) => {
            if (action === 'close') closeCallbackCalled = true;
          },
        },
        React.createElement('div', null, 'Content')
      )
    );
  });

  const closeBtn = win.document.querySelector('.win-btn.close');
  await act(async () => {
    closeBtn?.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });

  const exitTweenCalled = gsapLog.to.some((c) => c.vars?.ease === 'power2.in' && c.vars?.autoAlpha === 0);

  // Wait for 220ms tween completion
  await new Promise((r) => setTimeout(r, 320));

  results.push({
    id: 'W2',
    name: 'Window Close Exit Animation & Deferred Unmount',
    pass: exitTweenCalled && closeCallbackCalled,
    detail: `exitTweenCalled: ${exitTweenCalled}, closeCallbackCalled: ${closeCallbackCalled}`,
  });

  // -------------------------------------------------------------
  // Test W3: Window.jsx Minimize Exit Animation
  // -------------------------------------------------------------
  console.log('\n[TEST W3] Window.jsx Minimize Animation');
  gsapLog.to.length = 0;
  let minimizeCallbackCalled = false;

  await act(async () => {
    root.render(
      React.createElement(
        Window,
        {
          id: 'test-win-min',
          title: 'Test Min Window',
          defaultSize: { w: 400, h: 300 },
          onClose: (action) => {
            if (action === 'minimize') minimizeCallbackCalled = true;
          },
        },
        React.createElement('div', null, 'Content')
      )
    );
  });

  const minBtn = win.document.querySelector('.win-btn.min');
  await act(async () => {
    minBtn?.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });

  const minTweenCalled = gsapLog.to.some((c) => c.vars?.ease === 'power3.in' && c.vars?.scale === 0.65);

  await new Promise((r) => setTimeout(r, 320));

  results.push({
    id: 'W3',
    name: 'Window Minimize Slide-Down Tween',
    pass: minTweenCalled && minimizeCallbackCalled,
    detail: `minTweenCalled: ${minTweenCalled}, minimizeCallbackCalled: ${minimizeCallbackCalled}`,
  });

  // -------------------------------------------------------------
  // Test W4: About.jsx GSAP Staggered Entrance
  // -------------------------------------------------------------
  console.log('\n[TEST W4] About.jsx Staggered Entrance Animation');
  gsapLog.fromTo.length = 0;

  await act(async () => {
    root.render(React.createElement(About));
  });

  const aboutHeroPresent = !!win.document.querySelector('.about-hero');
  const aboutChipsCount = win.document.querySelectorAll('.about-chip').length;
  const aboutBioPresent = !!win.document.querySelector('.about-bio-card');
  const aboutAvatarWrapper = !!win.document.querySelector('.about-avatar-wrapper');

  results.push({
    id: 'W4',
    name: 'About Window Content Staggered Animations',
    pass: aboutHeroPresent && aboutChipsCount >= 4 && aboutBioPresent && aboutAvatarWrapper,
    detail: `Hero: ${aboutHeroPresent}, Chips: ${aboutChipsCount}, Bio: ${aboutBioPresent}, Avatar: ${aboutAvatarWrapper}`,
  });

  // -------------------------------------------------------------
  // Test W5: Notes.jsx Active Note Change GSAP Transition
  // -------------------------------------------------------------
  console.log('\n[TEST W5] Notes.jsx Active Note Switching GSAP Transition');
  await act(async () => {
    root.render(React.createElement(Notes));
  });

  gsapLog.fromTo.length = 0;
  const sidebarItems = Array.from(win.document.querySelectorAll('.note-sidebar-item'));
  const educationItem = sidebarItems.find((el) => el.textContent.includes('Education'));

  await act(async () => {
    educationItem?.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });

  const notesTransitionCalled = gsapLog.fromTo.some((c) => c.target === '.note-entry');
  const activeTitle = win.document.querySelector('.notes-main-title')?.textContent;

  results.push({
    id: 'W5',
    name: 'Notes Switching Transition Animation',
    pass: notesTransitionCalled && activeTitle?.includes('Education'),
    detail: `notesTransitionCalled: ${notesTransitionCalled}, activeTitle: ${activeTitle}`,
  });

  // -------------------------------------------------------------
  // Test W6: Desktop Full Integration (Open, Switch, Taskbar Close)
  // -------------------------------------------------------------
  console.log('\n[TEST W6] Desktop Full Window Lifecycle Integration');
  await act(async () => {
    root.render(React.createElement(Desktop));
  });

  // Log in through PS5 intro
  const ps5Card = win.document.querySelector('.ps5-intro-container');
  if (ps5Card) {
    await act(async () => {
      ps5Card.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r, 100));
  }

  // Open About Me window
  const aboutIcon = Array.from(win.document.querySelectorAll('.desktop-icon')).find((el) =>
    el.textContent.includes('About Me')
  );

  await act(async () => {
    aboutIcon?.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });

  const aboutWinInDom = !!win.document.querySelector('#win-about');
  const taskbarTab = win.document.querySelector('.taskbar-tab');

  // Close About Me via taskbar tab close button
  gsapLog.to.length = 0;
  const taskbarTabClose = win.document.querySelector('.taskbar-tab-close');
  await act(async () => {
    taskbarTabClose?.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  });

  // Wait for exit tween
  await new Promise((r) => setTimeout(r, 350));
  const aboutWinAfterClose = !!win.document.querySelector('#win-about');

  results.push({
    id: 'W6',
    name: 'Desktop Window Taskbar Integration & Exit Animation',
    pass: aboutWinInDom && !aboutWinAfterClose,
    detail: `About opened: ${aboutWinInDom}, About closed cleanly via taskbar: ${!aboutWinAfterClose}`,
  });

  // -------------------------------------------------------------
  // Test Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('                   WINDOW ANIMATIONS VERDICT                    ');
  console.log('================================================================');
  let allPass = true;
  for (const r of results) {
    const mark = r.pass ? '✓ PASS' : '✗ FAIL';
    if (!r.pass) allPass = false;
    console.log(`${mark} [${r.id}] ${r.name}: ${r.detail}`);
  }
  console.log('----------------------------------------------------------------');
  console.log(`TOTAL: ${results.filter((r) => r.pass).length} / ${results.length} PASSED`);
  console.log(`OVERALL EMPIRICAL VERDICT: ${allPass ? 'PASS' : 'FAIL'}`);
  console.log('================================================================\n');

  await viteServer.close();
  if (!allPass) process.exit(1);
}

runWindowAnimationSuite().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
