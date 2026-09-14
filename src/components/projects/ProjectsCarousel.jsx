import { useState } from 'react';
import { projectsData } from '../../data/projects';

export default function ProjectsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fading, setFading] = useState(false);

  const activate = (i) => {
    if (i === activeIndex) return;
    setFading(true);
    setTimeout(() => {
      setActiveIndex(i);
      setFading(false);
    }, 140);
  };

  const proj = projectsData[activeIndex];

  return (
    <div className="ps-root">
      <div className="ps-tile-row">
        {projectsData.map((p, i) => (
          <div
            key={p.id}
            className={`ps-tile${i === activeIndex ? ' active' : ''}`}
            onMouseEnter={() => activate(i)}
            onClick={() => activate(i)}
          >
            <div className="ps-tile-art" style={{ background: p.gradient }}>
              <span className="ps-tile-icon">{p.icon}</span>
            </div>
            <span className="ps-tile-label">{p.title}</span>
          </div>
        ))}
      </div>

      <div className="ps-divider" />

      <div className="ps-info-panel">
        <div className={`ps-info-inner${fading ? ' ps-fade' : ''}`}>
          <p className="ps-info-category">{proj.category}</p>
          <h2 className="ps-info-title">{proj.title}</h2>
          <div className="ps-info-badges">
            {proj.tags.map((tag) => (
              <span key={tag} className="ps-badge">{tag}</span>
            ))}
          </div>
          <p className="ps-info-desc">{proj.desc}</p>
          <div className="ps-info-actions">
            {proj.playUrl && (
              <a href={proj.playUrl} target="_blank" rel="noreferrer" className="ps-btn ps-btn-primary">
                ▷ Play Demo
              </a>
            )}
            {proj.codeUrl && (
              <a href={proj.codeUrl} target="_blank" rel="noreferrer" className="ps-btn">
                {'{ } Source Code'}
              </a>
            )}
            {!proj.playUrl && !proj.codeUrl && (
              <span className="ps-coming-label">— Coming soon —</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
