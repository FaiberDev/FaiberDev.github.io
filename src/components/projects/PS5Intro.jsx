import React, { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import './PS5Intro.css';

gsap.registerPlugin(useGSAP);

export default function PS5Intro({ onLogin }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const centerRef = useRef(null);
  const shockwaveRef = useRef(null);
  const hasTriggeredRef = useRef(false);

  // Background floating golden/white bokeh stardust
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Warm golden/amber and white embers, with soft bokeh
    const PARTICLE_COUNT = 55;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => {
      const isLargeBokeh = Math.random() < 0.18;
      return {
        x: Math.random() * width,
        y: height * 0.3 + Math.random() * height * 0.7,
        size: isLargeBokeh ? Math.random() * 4.5 + 3.0 : Math.random() * 2.0 + 0.8,
        speedY: isLargeBokeh ? Math.random() * 0.25 + 0.1 : Math.random() * 0.45 + 0.2,
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.65 + 0.25,
        baseOpacity: Math.random() * 0.65 + 0.25,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        angle: Math.random() * Math.PI * 2,
        isGold: Math.random() > 0.35,
      };
    });

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y -= p.speedY;
        p.angle += p.pulseSpeed;
        p.x += Math.sin(p.angle) * 0.3 + p.speedX;
        p.opacity = p.baseOpacity + Math.sin(p.angle * 2) * 0.15;

        if (p.y < -15) {
          p.y = height + 15;
          p.x = Math.random() * width;
        }
        if (p.x < -15) p.x = width + 15;
        if (p.x > width + 15) p.x = -15;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.isGold
          ? `rgba(235, 195, 125, ${Math.max(0.08, p.opacity)})`
          : `rgba(255, 255, 255, ${Math.max(0.08, p.opacity)})`;
        ctx.shadowBlur = p.isGold ? 12 : 6;
        ctx.shadowColor = p.isGold ? '#ebc37d' : '#ffffff';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  // GSAP Entrance
  useGSAP(
    () => {
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

      if (prefersReduced) {
        gsap.set(centerRef.current, { autoAlpha: 1 });
        return;
      }

      gsap.fromTo(
        centerRef.current,
        { scale: 0.92, autoAlpha: 0, y: 12 },
        {
          scale: 1,
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
        }
      );
    },
    { scope: containerRef }
  );

  // Smooth start transition on click or any keypress
  const handleStart = useCallback(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (prefersReduced) {
      onLogin?.();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        onLogin?.();
      },
    });

    // Expanding shockwave ripple
    if (shockwaveRef.current) {
      gsap.set(shockwaveRef.current, { scale: 0.8, autoAlpha: 0.9 });
      tl.to(
        shockwaveRef.current,
        {
          scale: 3.5,
          autoAlpha: 0,
          duration: 0.5,
          ease: 'power2.out',
        },
        0
      );
    }

    // Smooth forward cinematic zoom and dissolve
    tl.to(
      centerRef.current,
      {
        scale: 1.1,
        autoAlpha: 0,
        duration: 0.45,
        ease: 'power2.inOut',
      },
      0
    ).to(
      containerRef.current,
      {
        autoAlpha: 0,
        duration: 0.35,
        ease: 'power2.inOut',
      },
      '-=0.2'
    );
  }, [onLogin]);

  // Press any button on keyboard or controller
  useEffect(() => {
    const handleKeyDown = () => {
      handleStart();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleStart]);

  return (
    <div
      ref={containerRef}
      className="ps5-intro-container"
      onClick={handleStart}
      tabIndex={0}
      role="button"
      aria-label="Click or press any button to start"
    >
      <div className="ps5-intro-light-beam" />
      <canvas ref={canvasRef} className="ps5-intro-particles" />
      <div ref={shockwaveRef} className="ps5-intro-shockwave" />

      <div ref={centerRef} className="ps5-intro-center">
        {/* Minimalist prompt matching official PS5 boot phrasing */}
        <div className="ps5-intro-prompt">
          Press any button or click to start.
        </div>

        {/* Glowing Circular Avatar */}
        <div className="ps5-intro-avatar-circle">
          <div className="ps5-intro-avatar-ring" />
          <img
            src="/assets/icons/faiberpfp.jpeg"
            alt="Faiber Piedrahita"
            className="ps5-intro-avatar-img"
          />
        </div>

        {/* Minimalist Profile Identification */}
        <div className="ps5-intro-profile-info">
          <div className="ps5-intro-name">Faiber Piedrahita</div>
          <div className="ps5-intro-role">Gameplay Programmer</div>
        </div>
      </div>
    </div>
  );
}
