import React, { useState, useEffect } from 'react';
import { ps5ProjectsData } from '../../data/ps5Projects';
import './PS5Projects.css';

export default function PS5Projects() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Preload backgrounds and covers
  useEffect(() => {
    let loadedCount = 0;
    const totalImages = ps5ProjectsData.length * 2; // cover + background for each

    const handleImageLoad = () => {
      loadedCount++;
      if (loadedCount >= totalImages) {
        setImagesLoaded(true);
      }
    };

    ps5ProjectsData.forEach((project) => {
      const bgImg = new Image();
      bgImg.src = project.backgroundUrl;
      bgImg.onload = handleImageLoad;
      bgImg.onerror = handleImageLoad; // proceed even on error

      const coverImg = new Image();
      coverImg.src = project.coverUrl;
      coverImg.onload = handleImageLoad;
      coverImg.onerror = handleImageLoad;
    });
  }, []);

  const activeProject = ps5ProjectsData[activeIndex];

  return (
    <div className="ps5-container">
      {/* Preloader Overlay */}
      <div className={`ps5-loader ${imagesLoaded ? 'hidden' : ''}`}>
        Loading System Software...
      </div>

      {/* Crossfading Backgrounds */}
      <div className="ps5-backgrounds">
        {ps5ProjectsData.map((project, index) => (
          <img
            key={project.id}
            src={project.backgroundUrl}
            alt={`${project.title} background`}
            className={`ps5-bg-layer ${index === activeIndex ? 'active' : ''}`}
          />
        ))}
        <div className="ps5-gradient-overlay" />
      </div>

      <div className="ps5-content-wrapper">
        {/* Top Carousel */}
        <div className="ps5-carousel">
          {ps5ProjectsData.map((project, index) => (
            <img
              key={project.id}
              src={project.coverUrl}
              alt={`${project.title} cover`}
              className={`ps5-icon ${index === activeIndex ? 'active' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>

        {/* Info Section (re-mounts on index change to trigger CSS animation) */}
        <div key={activeIndex} className="ps5-info-section ps5-animate-enter">
          {activeProject.logoUrl ? (
            <img 
              src={activeProject.logoUrl} 
              alt={activeProject.title} 
              className="ps5-logo" 
            />
          ) : (
            <h2 className="ps5-title">{activeProject.title}</h2>
          )}
          <p className="ps5-description">{activeProject.description}</p>
          <button className="ps5-play-btn">Play Game</button>
        </div>
      </div>
    </div>
  );
}
