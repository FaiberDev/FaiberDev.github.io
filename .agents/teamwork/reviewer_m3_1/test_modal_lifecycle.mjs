import { JSDOM } from 'jsdom';

// Setup DOM environment
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
});
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.matchMedia = () => ({ matches: false });

import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import MarkdownModal from '../../../src/components/modal/MarkdownModal.jsx';

function Harness() {
  const [isOpen, setIsOpen] = useState(false);
  const [log, setLog] = useState([]);

  return (
    <div>
      <button id="open-btn" onClick={() => setIsOpen(true)}>Open</button>
      <button id="close-direct" onClick={() => setIsOpen(false)}>Close Direct</button>
      <div id="is-open-indicator">{isOpen ? 'OPEN' : 'CLOSED'}</div>
      <MarkdownModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        originRect={{ left: 100, top: 100, width: 200, height: 50 }}
      />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Harness />);

setTimeout(() => {
  console.log('--- Initial Mount ---');
  console.log('Window rendered:', !!document.querySelector('.markdown-modal-window'));

  console.log('\n--- First Open ---');
  document.getElementById('open-btn').click();

  setTimeout(() => {
    const win = document.querySelector('.markdown-modal-window');
    console.log('Window rendered after open:', !!win);
    const closeBtn = document.querySelector('.win-btn.close');
    console.log('Close button found:', !!closeBtn);

    console.log('\n--- First Close ---');
    if (closeBtn) closeBtn.click();

    setTimeout(() => {
      console.log('Status after first close:', document.getElementById('is-open-indicator').textContent);
      console.log('Window rendered after close:', !!document.querySelector('.markdown-modal-window'));

      console.log('\n--- Second Open ---');
      document.getElementById('open-btn').click();

      setTimeout(() => {
        console.log('Status after second open:', document.getElementById('is-open-indicator').textContent);
        const win2 = document.querySelector('.markdown-modal-window');
        console.log('Window rendered after second open:', !!win2);
        const closeBtn2 = document.querySelector('.win-btn.close');

        console.log('\n--- Second Close Attempt ---');
        if (closeBtn2) closeBtn2.click();

        setTimeout(() => {
          console.log('Status after second close attempt:', document.getElementById('is-open-indicator').textContent);
          console.log('Was modal closed on second attempt?', document.getElementById('is-open-indicator').textContent === 'CLOSED');
          process.exit(0);
        }, 350);
      }, 50);
    }, 350);
  }, 50);
}, 50);
