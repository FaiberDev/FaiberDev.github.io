import React, { useState, useEffect, useRef } from 'react';
import { ps5ProjectsData } from '../../data/ps5Projects';
import './PS5Projects.css';

export default function PS5Projects({ onOpenArchitecture }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const iconRefs = useRef([]);

  // Preload backgrounds, covers, and logos for zero-flicker switching
  useEffect(() => {
    const imagesToLoad = [];
    ps5ProjectsData.forEach((project) => {
      if (project.backgroundUrl) imagesToLoad.push(project.backgroundUrl);
      if (project.coverUrl) imagesToLoad.push(project.coverUrl);
      if (project.logoUrl) imagesToLoad.push(project.logoUrl);
    });

    if (imagesToLoad.length === 0) {
      setImagesLoaded(true);
      return;
    }

    let loadedCount = 0;
    const handleImageLoad = () => {
      loadedCount++;
      if (loadedCount >= imagesToLoad.length) {
        setImagesLoaded(true);
      }
    };

    imagesToLoad.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = handleImageLoad;
      img.onerror = handleImageLoad;
    });
  }, []);

  // Keep active cover tile visible when navigating on compact/mobile containers
  useEffect(() => {
    const el = iconRefs.current[activeIndex];
    el?.scrollIntoView?.({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [activeIndex]);

  const handleHoverSelect = (index) => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(hover: none)')?.matches) {
      return;
    }
    setActiveIndex(index);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % ps5ProjectsData.length);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + ps5ProjectsData.length) % ps5ProjectsData.length);
    }
  };

  const activeProject = ps5ProjectsData[activeIndex] || {};

  return (
    <div
      className="ps5-container"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Preloader Overlay */}
      <div className={`ps5-loader ${imagesLoaded ? 'hidden' : ''}`}>
        Loading System Software...
      </div>

      {/* Crossfading Backgrounds */}
      <div className="ps5-backgrounds">
        {ps5ProjectsData.map((project, index) => (
          project.backgroundUrl ? (
            <img
              key={project.id}
              src={project.backgroundUrl}
              alt={`${project.title} background`}
              className={`ps5-bg-layer ${index === activeIndex ? 'active' : ''}`}
            />
          ) : (
            <div
              key={project.id}
              className={`ps5-bg-layer ps5-bg-fallback ${index === activeIndex ? 'active' : ''}`}
              style={project.backgroundGradient ? { background: project.backgroundGradient } : undefined}
            />
          )
        ))}
        <div className="ps5-gradient-overlay" />
      </div>

      <div className="ps5-content-wrapper">
        {/* Top Carousel */}
        <div className="ps5-carousel" role="tablist" aria-label="Projects">
          {ps5ProjectsData.map((project, index) => (
            project.coverUrl ? (
              <img
                key={project.id}
                ref={(el) => { iconRefs.current[index] = el; }}
                src={project.coverUrl}
                alt={project.title}
                title={project.title}
                role="tab"
                aria-selected={index === activeIndex}
                className={`ps5-icon ${index === activeIndex ? 'active' : ''}`}
                onMouseEnter={() => handleHoverSelect(index)}
                onClick={() => setActiveIndex(index)}
              />
            ) : (
              <div
                key={project.id}
                ref={(el) => { iconRefs.current[index] = el; }}
                role="tab"
                aria-selected={index === activeIndex}
                title={project.title}
                className={`ps5-icon ps5-icon-fallback ${index === activeIndex ? 'active' : ''}`}
                onMouseEnter={() => handleHoverSelect(index)}
                onClick={() => setActiveIndex(index)}
              >
                <span className="ps5-icon-fallback-text">
                  {project.coverText || project.shortTitle || project.title}
                </span>
              </div>
            )
          ))}
        </div>

        {/* Info Section (re-mounts on index change to trigger CSS animation) */}
        <div key={activeIndex} className="ps5-info-section ps5-animate-enter">
          <div className="ps5-brand-slot">
            {activeProject.logoUrl ? (
              <img 
                src={activeProject.logoUrl} 
                alt={activeProject.title} 
                className="ps5-logo" 
              />
            ) : (
              <div className="ps5-text-logo-wrapper">
                <h1 className="ps5-text-logo">
                  {activeProject.logoText || activeProject.title}
                </h1>
                {activeProject.subtitle && (
                  <div className="ps5-subtitle">{activeProject.subtitle}</div>
                )}
              </div>
            )}
          </div>
          <p className="ps5-description">{activeProject.description}</p>
          {activeProject.playUrl ? (
            <a 
              href={activeProject.playUrl}
              target="_blank"
              rel="noreferrer"
              className="ps5-play-btn"
              style={{ textDecoration: 'none' }}
            >
              {activeProject.buttonText || activeProject.playText || 'More information'}
            </a>
          ) : (
            <button 
              type="button"
              className="ps5-play-btn"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onOpenArchitecture?.({
                  id: activeProject.id,
                  originRect: rect,
                });
              }}
            >
              {activeProject.buttonText || activeProject.playText || 'More information'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
