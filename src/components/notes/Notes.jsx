import { useState } from 'react';
import './notes.css';

const notesData = [
  {
    id: 'experience',
    title: 'Experience',
    date: '22/01/2026',
    preview: 'Game Programmer & Developer...',
    fullDate: 'January 22, 2026 at 11:35 AM',
    content: (
      <div className="note-body">
        <div className="note-entry">
          <div className="note-entry-header">
            <strong>Game Programmer &amp; Developer</strong>
            <span className="note-entry-date">2023 - 2024</span>
          </div>
          <ul>
            <li>Programmed and streamed a narrative minigame for a Game Jam team project.</li>
          </ul>
        </div>
        <div className="note-entry">
          <div className="note-entry-header">
            <strong>Software Engineer</strong>
            <span className="note-entry-date">2022 - 2023</span>
          </div>
          <ul>
            <li>Designed a decentralized reputation platform in DeFi for P2P financial inclusion.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'education',
    title: 'Education',
    date: '22/01/2026',
    preview: 'Universidad ICESI: Software...',
    fullDate: 'January 22, 2026 at 11:36 AM',
    content: (
      <div className="note-body">
        <div className="note-entry">
          <div className="note-entry-header">
            <strong>Universidad ICESI</strong>
            <span className="note-entry-date">2020 - 2024</span>
          </div>
          <ul>
            <li>Software Engineering.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'hobbies',
    title: 'Hobbies',
    date: '22/01/2026',
    preview: 'Competitive Pokémon VGC team...',
    fullDate: 'January 22, 2026 at 11:37 AM',
    content: (
      <div className="note-body">
        <div className="note-entry">
          <div className="note-entry-header">
            <strong>Interests &amp; Activities</strong>
          </div>
          <ul>
            <li>Competitive Pokémon VGC team building.</li>
            <li>C++ HackerRank challenges.</li>
            <li>DevOps/Linux infrastructure.</li>
            <li>Digital piano.</li>
          </ul>
        </div>
      </div>
    )
  }
];

export default function Notes() {
  const [activeNoteId, setActiveNoteId] = useState('experience');
  const activeNote = notesData.find(n => n.id === activeNoteId);

  return (
    <div className="notes-app">
      <div className="notes-sidebar">
        {notesData.map(note => (
          <div 
            key={note.id} 
            className={`note-sidebar-item ${activeNoteId === note.id ? 'active' : ''}`}
            onClick={() => setActiveNoteId(note.id)}
          >
            <div className="note-item-title">{note.title}</div>
            <div className="note-item-meta">
              <span className="note-item-date">{note.date}</span>
              <span className="note-item-preview">{note.preview}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="notes-main">
        <div className="notes-main-header">
          {activeNote.fullDate}
        </div>
        <h1 className="notes-main-title">{activeNote.title}</h1>
        <div className="notes-main-content">
          {activeNote.content}
        </div>
      </div>
    </div>
  );
}
