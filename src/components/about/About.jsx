import { useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  CppIcon,
  UnrealEngineIcon,
  QuartzDspIcon,
  ReactIcon,
  GitBranchIcon,
  LocationPinIcon,
  AcademicCapIcon,
  MailIcon,
  LinkedInIcon,
  GitHubIcon,
  ArrowRightFlowIcon,
  CheckmarkIcon,
} from '../common/Icons';
import './About.css';

gsap.registerPlugin(useGSAP);

export default function About() {
  const containerRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // GSAP Staggered Entrance Animation for About Window Content
  useGSAP(
    () => {
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

      if (prefersReduced) return;

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        '.about-avatar-wrapper',
        { scale: 0.8, autoAlpha: 0, rotation: -6 },
        { scale: 1, autoAlpha: 1, rotation: 0, duration: 0.45, ease: 'back.out(1.4)' }
      )
        .fromTo(
          '.about-name-row, .about-role, .about-location',
          { y: 12, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.35, stagger: 0.06 },
          '-=0.25'
        )
        .fromTo(
          '.about-chip',
          { scale: 0.85, autoAlpha: 0, y: 8 },
          { scale: 1, autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.04, ease: 'back.out(1.2)' },
          '-=0.2'
        )
        .fromTo(
          '.about-bio-card',
          { y: 16, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.35 },
          '-=0.2'
        )
        .fromTo(
          '.about-framework-card',
          { y: 14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.3, stagger: 0.05 },
          '-=0.2'
        )
        .fromTo(
          '.about-actions-bar .about-btn',
          { y: 10, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.3, stagger: 0.05 },
          '-=0.2'
        );
    },
    { scope: containerRef }
  );

  const handleCopyEmail = (e) => {
    e.preventDefault();
    navigator.clipboard?.writeText('contact@faiber.dev');
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div ref={containerRef} className="about-container">
      {/* Hero Profile Section */}
      <div className="about-hero">
        <div className="about-avatar-wrapper">
          <div className="about-avatar-ring" />
          <div className="about-avatar">
            <img src="/assets/icons/faiberpfp.jpeg" alt="Faiber Piedrahita" />
          </div>
          <span className="about-status-dot" title="Available for work" />
        </div>

        <div className="about-meta">
          <div className="about-name-row">
            <h1 className="about-name">Faiber Piedrahita</h1>
            <span className="about-badge">
              <span className="about-badge-dot" />
              Available
            </span>
          </div>
          <div className="about-role">Gameplay Programmer &amp; Systems Developer</div>
          <div className="about-location">
            <span className="about-loc-item">
              <LocationPinIcon size={14} /> Cali, Colombia
            </span>
            <span>·</span>
            <span className="about-loc-item">
              <AcademicCapIcon size={14} /> Universidad Icesi (B.S. Software Eng.)
            </span>
          </div>
        </div>
      </div>

      {/* Highlights / Core Specializations (Clean SVGs, No Emojis, No Java) */}
      <div className="about-chips-row">
        <span className="about-chip">
          <CppIcon size={16} /> C++
        </span>
        <span className="about-chip">
          <UnrealEngineIcon size={16} /> Unreal Engine 5
        </span>
        <span className="about-chip">
          <QuartzDspIcon size={16} /> Quartz Audio DSP
        </span>
        <span className="about-chip">
          <ReactIcon size={16} /> React 19 &amp; GSAP
        </span>
        <span className="about-chip">
          <GitBranchIcon size={15} /> Git &amp; Architecture
        </span>
      </div>

      {/* Bio Box */}
      <div className="about-bio-card">
        <p className="about-bio-text">
          Hi! I am a <strong>Gameplay Programmer</strong> with a strong focus on low-level gameplay systems, <strong>Unreal Engine 5 C++</strong>, and sample-accurate audio DSP clock synchronization. I specialize in deterministic game logic, clean subsystem architecture, and building responsive interactive desktop environments.
        </p>
        <p className="about-bio-text" style={{ marginBottom: 0 }}>
          Welcome to my workspace. Feel free to explore my playable projects, read the architectural deep-dive for my rhythm game, or review my technical notes.
        </p>
      </div>

      {/* Relevant Frameworks Section (Separated by Language -> Framework/Subsystem) */}
      <div className="about-frameworks-section">
        <div className="about-section-header">
          <h2 className="about-section-title">Relevant Frameworks</h2>
          <span className="about-section-subtitle">
            Core language pipelines &amp; engine subsystem specializations
          </span>
        </div>

        <div className="about-frameworks-grid">
          {/* C++ -> Quartz Audio DSP */}
          <div className="about-framework-card">
            <div className="about-pipeline-badge">
              <span className="about-tech-tag">
                <CppIcon size={16} /> C++
              </span>
              <span className="about-flow-arrow">
                <ArrowRightFlowIcon size={14} />
              </span>
              <span className="about-framework-name">
                <QuartzDspIcon size={16} /> Quartz Audio DSP
              </span>
            </div>
            <p className="about-framework-desc">
              Sample-accurate audio clocking, musical quantization delegates, zero-latency timing grading.
            </p>
          </div>

          {/* C++ -> Unreal Engine 5 */}
          <div className="about-framework-card">
            <div className="about-pipeline-badge">
              <span className="about-tech-tag">
                <CppIcon size={16} /> C++
              </span>
              <span className="about-flow-arrow">
                <ArrowRightFlowIcon size={14} />
              </span>
              <span className="about-framework-name">
                <UnrealEngineIcon size={16} /> Unreal Engine 5
              </span>
            </div>
            <p className="about-framework-desc">
              Custom Actor lifecycles, <code>URhythmStoreSubsystem</code> data bus, gameplay state machines.
            </p>
          </div>

          {/* C++ -> Chaos Physics */}
          <div className="about-framework-card">
            <div className="about-pipeline-badge">
              <span className="about-tech-tag">
                <CppIcon size={16} /> C++
              </span>
              <span className="about-flow-arrow">
                <ArrowRightFlowIcon size={14} />
              </span>
              <span className="about-framework-name">
                Chaos Physics &amp; Sweeps
              </span>
            </div>
            <p className="about-framework-desc">
              Discrete trajectory calculations, paddle collision sweeps, deterministic reflection vectors.
            </p>
          </div>

          {/* TypeScript / JS -> React & GSAP */}
          <div className="about-framework-card">
            <div className="about-pipeline-badge">
              <span className="about-tech-tag">
                TypeScript / JS
              </span>
              <span className="about-flow-arrow">
                <ArrowRightFlowIcon size={14} />
              </span>
              <span className="about-framework-name">
                <ReactIcon size={16} /> React 19 &amp; GSAP
              </span>
            </div>
            <p className="about-framework-desc">
              Physics spring animations, reactive state management, simulation tooling &amp; web UI.
            </p>
          </div>
        </div>
      </div>

      {/* Actions / Social Bar */}
      <div className="about-actions-bar">
        <a
          href="mailto:contact@faiber.dev"
          className="about-btn about-btn-primary"
          onClick={handleCopyEmail}
          title="Click to copy email address"
        >
          <MailIcon size={16} />
          <span>Copy Email</span>
        </a>
        {copied && (
          <span className="about-copied-toast">
            <CheckmarkIcon size={14} /> Copied to clipboard!
          </span>
        )}

        <a
          href="https://www.linkedin.com/in/faiber-piedrahita-113911231"
          target="_blank"
          rel="noreferrer"
          className="about-btn about-btn-secondary"
        >
          <LinkedInIcon size={16} />
          <span>LinkedIn</span>
        </a>

        <a
          href="https://github.com/Fazb3r"
          target="_blank"
          rel="noreferrer"
          className="about-btn about-btn-secondary"
        >
          <GitHubIcon size={16} />
          <span>GitHub</span>
        </a>
      </div>
    </div>
  );
}
