import { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import './notes.css';

gsap.registerPlugin(useGSAP);

const notesData = [
  {
    id: 'experience',
    title: 'Experience',
    date: '14/10/2026',
    preview: 'Gameplay Programmer, World Athletics, Soporte TITA...',
    fullDate: 'October 14, 2026 at 4:30 PM',
    content: (
      <div className="note-body">
        <div className="note-entry">
          <div className="note-entry-header">
            <strong>Gameplay Programmer &amp; Systems Developer</strong>
            <span className="note-entry-date">2023 – Present</span>
          </div>
          <p style={{ margin: '0 0 6px', color: '#6e6e73', fontSize: '0.9rem' }}>Remote / Indie · C++ &amp; Unreal Engine 5</p>
          <ul>
            <li>Engineered framerate-independent, sample-accurate rhythm gameplay systems using Unreal Engine 5 C++ and the Quartz Audio DSP Subsystem.</li>
            <li>Eliminated physics delta-time integration drift through closed-form parametric trajectory equations synchronized directly with Quartz audio clocks.</li>
            <li>Architected a decoupled, zero-pointer-overhead world subsystem data bus (<code>URhythmStoreSubsystem</code>) for dynamic multicast event distribution.</li>
            <li>Built a custom JSON parser and 5-tier graded timing evaluation engine (Max ≤45ms to Normal ≤230ms) with anti-mash cooldown state machines.</li>
          </ul>
        </div>

        <div className="note-entry">
          <div className="note-entry-header">
            <strong>Student Volunteer — World Athletics</strong>
            <span className="note-entry-date">Jun 2022 – Oct 2022</span>
          </div>
          <p style={{ margin: '0 0 6px', color: '#6e6e73', fontSize: '0.9rem' }}>Cali, Colombia · On-site · Seasonal</p>
          <ul>
            <li>Coordinated volunteer schedules and competition logistics, streamlining operational workflows across world championship events.</li>
            <li>Managed setup, technical coordination, and breakdown of international athletic competition venues.</li>
            <li>Liaised with multilingual delegations and athletes to foster an inclusive, structured championship environment.</li>
            <li>Implemented and enforced health, safety, and security protocols across competition days.</li>
          </ul>
        </div>

        <div className="note-entry">
          <div className="note-entry-header">
            <strong>Soporte Técnico TITA — Institución Educativa INEM Jorge Isaacs</strong>
            <span className="note-entry-date">Ene 2021 – Nov 2022</span>
          </div>
          <p style={{ margin: '0 0 6px', color: '#6e6e73', fontSize: '0.9rem' }}>Cali, Colombia · On-site</p>
          <ul>
            <li>Delivered technical support to faculty and students across digital educational platforms and computer laboratory systems.</li>
            <li>Performed preventive and corrective maintenance on computing hardware, network connections, and classroom peripherals.</li>
            <li>Installed, configured, and managed software packages and operating system images across institution computer labs.</li>
            <li>Collaborated in IT asset management and inventory tracking to maximize system uptime for academic activities.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'education',
    title: 'Education & Academics',
    date: '14/10/2026',
    preview: 'Universidad Icesi (Software Engineering), INEM Jorge Isaacs...',
    fullDate: 'October 14, 2026 at 4:32 PM',
    content: (
      <div className="note-body">
        <div className="note-entry">
          <div className="note-entry-header">
            <strong>Universidad Icesi</strong>
            <span className="note-entry-date">Feb 2022 – Feb 2028 (Graduation)</span>
          </div>
          <p style={{ margin: '0 0 6px', color: '#6e6e73', fontSize: '0.9rem' }}>Pregrado en Ingeniería de Software (B.S. Software Systems Engineering) · Cali, Colombia</p>
          <ul>
            <li>Currently in 6th semester with high academic standing.</li>
            <li>Active member of the <strong>IEEE Student Branch</strong>.</li>
          </ul>
        </div>

        <div className="note-entry">
          <div className="note-entry-header">
            <strong>INEM Jorge Isaacs</strong>
            <span className="note-entry-date">Graduated Dec 2021</span>
          </div>
          <p style={{ margin: '0 0 6px', color: '#6e6e73', fontSize: '0.9rem' }}>Educación Secundaria con Profundización en Sistemas y Computación · Cali, Colombia</p>
        </div>

        <div className="note-entry">
          <div className="note-entry-header">
            <strong>Core Coursework (Cursos Relevantes)</strong>
          </div>
          <ul>
            <li><strong>Computación en Internet II:</strong> Web application design implementing client-server, multi-tier, and microservice architectures with modern REST patterns.</li>
            <li><strong>Matemáticas Aplicadas III:</strong> Advanced numerical analysis, linear algebra, multivariate optimization methods, and mathematical modeling for high-performance computing.</li>
            <li><strong>Proyecto Integrador I:</strong> Full-cycle real-world software engineering applying agile (SCRUM), requirements validation, UI/UX design, configuration management, automated testing, and client deliverables.</li>
            <li><strong>Computación y Estructuras Discretas II:</strong> Formal language theory, deterministic/nondeterministic finite automata (DFA/NFA), pushdown automata, Turing machines, Pyformlang modeling, and computational decidability.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'skills',
    title: 'Technical Skills & Stack',
    date: '14/10/2026',
    preview: 'C++, Unreal Engine 5, Java, React, Docker, Spring Boot...',
    fullDate: 'October 14, 2026 at 4:35 PM',
    content: (
      <div className="note-body">
        <div className="note-entry">
          <div className="note-entry-header">
            <strong>Programming &amp; Game Development</strong>
          </div>
          <ul>
            <li><strong>Languages:</strong> C++, Java, JavaScript (ES6+), TypeScript, Python, SQL, HTML5, CSS3.</li>
            <li><strong>Game Engine:</strong> Unreal Engine 5 (UE5 C++, Quartz Audio Subsystem, Blueprints, Niagara VFX, Physics &amp; Collision).</li>
          </ul>
        </div>

        <div className="note-entry">
          <div className="note-entry-header">
            <strong>Backend, DevOps &amp; Databases</strong>
          </div>
          <ul>
            <li><strong>Backend Frameworks:</strong> Spring Boot, Node.js (Express), Django, RESTful APIs.</li>
            <li><strong>Databases:</strong> PostgreSQL, MongoDB, Oracle Database.</li>
            <li><strong>DevOps &amp; Infrastructure:</strong> Docker, Git / GitHub, GitHub Actions (CI/CD), Linux (Ubuntu/Debian, SSH/SCP).</li>
          </ul>
        </div>

        <div className="note-entry">
          <div className="note-entry-header">
            <strong>Frontend, Methodologies &amp; Languages</strong>
          </div>
          <ul>
            <li><strong>Frontend:</strong> React 19, GSAP (GreenSock), Tailwind CSS, Bootstrap, Vite.</li>
            <li><strong>Methodologies:</strong> SCRUM, Design Thinking, Software Architecture Patterns, Object-Oriented Design (OOD).</li>
            <li><strong>Spoken Languages:</strong> Spanish (Native), English (C1 – Advanced Professional Proficiency).</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'about-contact',
    title: 'Profile & Social Links',
    date: '14/10/2026',
    preview: 'LinkedIn, GitHub, Contact info, Professional bio...',
    fullDate: 'October 14, 2026 at 4:38 PM',
    content: (
      <div className="note-body">
        <div className="note-entry">
          <div className="note-entry-header">
            <strong>Faiber Piedrahita Perlaza</strong>
          </div>
          <p style={{ margin: '0 0 12px', fontSize: '1.05rem', lineHeight: '1.6', color: '#1a1a1a' }}>
            Software Engineering student at Universidad Icesi passionate about high-performance interactive experiences, gameplay mechanics, and distributed systems. Committed to continuous learning, architectural discipline, and engineering innovative, high-impact products.
          </p>
          <ul>
            <li>
              <strong>LinkedIn:</strong>{' '}
              <a
                href="https://www.linkedin.com/in/faiber-piedrahita-113911231"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#0a66c2', textDecoration: 'underline' }}
              >
                linkedin.com/in/faiber-piedrahita-113911231
              </a>
            </li>
            <li>
              <strong>GitHub:</strong>{' '}
              <a
                href="https://github.com/Fazb3r"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#24292e', textDecoration: 'underline' }}
              >
                github.com/Fazb3r
              </a>
            </li>
            <li>
              <strong>Email:</strong>{' '}
              <a
                href="mailto:faiberpiedrahita@gmail.com"
                style={{ color: '#d97706', textDecoration: 'underline' }}
              >
                faiberpiedrahita@gmail.com
              </a>{' '}
              / contact@faiber.dev
            </li>
            <li><strong>Location:</strong> Cali, Valle del Cauca, Colombia</li>
            <li><strong>Phone:</strong> +57 302 248 3544</li>
            <li><strong>Interests:</strong> Digital piano, narrative anime, competitive Pokémon VGC, and rhythm gaming mechanics.</li>
          </ul>
        </div>
      </div>
    )
  }
];

export default function Notes() {
  const [activeNoteId, setActiveNoteId] = useState('experience');
  const activeNote = notesData.find(n => n.id === activeNoteId) || notesData[0];
  const mainRef = useRef(null);

  useGSAP(
    () => {
      if (!mainRef.current) return;
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

      if (prefersReduced) return;

      gsap.fromTo(
        '.notes-main-title',
        { y: -8, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.25, ease: 'power2.out' }
      );

      gsap.fromTo(
        '.note-entry',
        { y: 12, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out', delay: 0.05 }
      );
    },
    { scope: mainRef, dependencies: [activeNoteId] }
  );

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
      <div ref={mainRef} className="notes-main">
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
