import { useState } from 'react';
import './notes.css';

const notesData = [
  {
    id: 'experience',
    title: 'Experience',
    date: '11/10/2026',
    preview: 'Student Volunteer · World Athletics...',
    fullDate: 'October 11, 2026 at 7:15 PM',
    content: (
      <div className="note-body">
        <div className="note-entry">
          <div className="note-entry-header">
            <strong>Student Volunteer — World Athletics</strong>
            <span className="note-entry-date">Jun 2022 – Oct 2022</span>
          </div>
          <p style={{ margin: '0 0 6px', color: '#8e8e93', fontSize: '0.9rem' }}>Cali, Colombia · On-site · Seasonal</p>
          <ul>
            <li>Assisted with event logistics by coordinating volunteer schedules, resulting in streamlined operations during competitions.</li>
            <li>Supported the setup and breakdown of event venues, ensuring a smooth experience for participants and attendees.</li>
            <li>Engaged with diverse participants, fostering an inclusive environment that enhanced community involvement in athletics.</li>
            <li>Collaborated with team members to implement safety protocols during competition days.</li>
          </ul>
        </div>
        <div className="note-entry">
          <div className="note-entry-header">
            <strong>Gameplay Programmer &amp; Systems Developer</strong>
            <span className="note-entry-date">2023 - Present</span>
          </div>
          <ul>
            <li>Engineered data-driven gameplay systems, custom mechanics, and engine components in C++ with Unreal Engine 5.</li>
            <li>Implemented a sample-accurate, framerate-independent rhythm architecture utilizing UE5 Quartz and a custom JSON parser.</li>
          </ul>
        </div>
        <div className="note-entry">
          <div className="note-entry-header">
            <strong>Software Engineer &amp; DevOps</strong>
            <span className="note-entry-date">2022 - Present</span>
          </div>
          <ul>
            <li>Designed decentralized platforms and P2P protocols in DeFi aimed at financial inclusion.</li>
            <li>Configured automated CI/CD pipelines, Docker containerization, and cloud infrastructure on Linux and AWS environments.</li>
            <li>Built scalable backend services and microservice architectures with Spring Boot, NestJS, and Node.js.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'education',
    title: 'Education',
    date: '11/10/2026',
    preview: 'Universidad ICESI — Software Engineering...',
    fullDate: 'October 11, 2026 at 7:16 PM',
    content: (
      <div className="note-body">
        <div className="note-entry">
          <div className="note-entry-header">
            <strong>Universidad ICESI</strong>
            <span className="note-entry-date">Feb 2023 – Feb 2028</span>
          </div>
          <p style={{ margin: '0 0 6px', color: '#8e8e93', fontSize: '0.9rem' }}>Associate of Science — Software Systems Engineering</p>
          <ul>
            <li>Core coursework in software architecture, object-oriented design, distributed systems, and DevOps engineering.</li>
            <li>IEEE Student Branch — Active Member.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'hobbies',
    title: 'Hobbies',
    date: '11/10/2026',
    preview: 'Piano, Anime, Games...',
    fullDate: 'October 11, 2026 at 7:17 PM',
    content: (
      <div className="note-body">
        <div className="note-entry">
          <div className="note-entry-header">
            <strong>Interests &amp; Passions</strong>
          </div>
          <ul>
            <li><strong>Piano:</strong> Playing digital piano and learning pieces I enjoy.</li>
            <li><strong>Anime:</strong> Big fan of storytelling and character-driven narratives.</li>
            <li><strong>Games:</strong> Passionate about gameplay mechanics, rhythm games, RPGs, and competitive Pokémon VGC.</li>
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
