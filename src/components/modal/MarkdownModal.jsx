import React, { useRef, useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import pongArchitectureRaw from '../../data/pong-architecture.md?raw';
import './MarkdownModal.css';

gsap.registerPlugin(useGSAP);

export default function MarkdownModal({
  isOpen = false,
  originRect = null,
  onClose,
  zIndex = 2000,
}) {
  const containerRef = useRef(null);
  const windowRef = useRef(null);
  const dragState = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const isClosingRef = useRef(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const getModalBounds = useCallback(() => {
    const vpW = typeof window !== 'undefined' ? (window.innerWidth || 1280) : 1280;
    const vpH = typeof window !== 'undefined' ? (window.innerHeight || 800) : 800;
    const taskbarH = vpW <= 767 ? 52 : 56;
    const w = vpW <= 767
      ? Math.max(280, vpW - 16)
      : Math.min(920, Math.max(320, Math.round(vpW * 0.88)));
    const h = vpW <= 767
      ? Math.max(260, vpH - taskbarH - 16)
      : Math.min(660, Math.max(300, Math.round((vpH - taskbarH) * 0.86)));
    const x = Math.max(8, Math.round((vpW - w) / 2));
    const y = Math.max(8, Math.round((vpH - taskbarH - h) / 2));
    return { w, h, x, y, vpW, vpH, taskbarH };
  }, []);

  const [bounds, setBounds] = useState(getModalBounds);
  const hasDraggedRef = useRef(false);

  const [pos, setPos] = useState(() => {
    const initial = getModalBounds();
    return { x: initial.x, y: initial.y };
  });

  // Synchronize state when isOpen transitions to true
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setIsClosing(false);
      const fresh = getModalBounds();
      setBounds(fresh);
      setPos({ x: fresh.x, y: fresh.y });
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    isClosingRef.current = false;
    hasDraggedRef.current = false;
    const handleResize = () => {
      const next = getModalBounds();
      setBounds(next);
      setPos((prev) => {
        if (!hasDraggedRef.current || next.vpW <= 767) {
          return { x: next.x, y: next.y };
        }
        return {
          x: Math.max(8, Math.min(Math.max(8, next.vpW - next.w - 8), prev.x)),
          y: Math.max(8, Math.min(Math.max(8, next.vpH - next.taskbarH - 60), prev.y)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, getModalBounds]);

  const modalWidth = bounds.w;
  const modalHeight = bounds.h;

  // Calculate delta vector from trigger button to resting modal center
  const getOriginDeltas = useCallback(() => {
    const w = isMaximized ? window.innerWidth : modalWidth;
    const h = isMaximized ? (window.innerHeight - 56) : modalHeight;
    const modalCenterX = isMaximized ? window.innerWidth / 2 : (pos.x + w / 2);
    const modalCenterY = isMaximized ? (window.innerHeight - 56) / 2 : (pos.y + h / 2);

    if (
      !originRect ||
      !Number.isFinite(originRect.left) ||
      !Number.isFinite(originRect.top) ||
      !Number.isFinite(originRect.width) ||
      !Number.isFinite(originRect.height) ||
      originRect.width <= 0 ||
      originRect.height <= 0
    ) {
      return { deltaX: 0, deltaY: 30, scaleStart: 0.94 };
    }

    const triggerCenterX = originRect.left + originRect.width / 2;
    const triggerCenterY = originRect.top + originRect.height / 2;
    const deltaX = triggerCenterX - modalCenterX;
    const deltaY = triggerCenterY - modalCenterY;
    const scaleStart = Math.max(
      0.12,
      Math.min(originRect.width / w, originRect.height / h)
    );

    return { deltaX, deltaY, scaleStart: Number.isFinite(scaleStart) ? scaleStart : 0.94 };
  }, [originRect, isMaximized, modalWidth, modalHeight, pos.x, pos.y]);

  // Spring entrance animation originating from trigger and contextSafe provider
  const { contextSafe } = useGSAP(() => {
    if (!isOpen || !windowRef.current) return;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const { deltaX, deltaY, scaleStart } = getOriginDeltas();

    if (prefersReduced) {
      gsap.fromTo(
        windowRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.15 }
      );
      return;
    }

    gsap.fromTo(
      windowRef.current,
      {
        x: deltaX,
        y: deltaY,
        scale: scaleStart,
        autoAlpha: 0,
        transformOrigin: '50% 50%',
      },
      {
        x: 0,
        y: 0,
        scale: 1,
        autoAlpha: 1,
        duration: 0.38,
        ease: 'back.out(1.4)',
        clearProps: 'transform',
      }
    );
  }, { scope: containerRef, dependencies: [isOpen] });

  // Reverse unmount exit animation back to trigger
  const handleClose = useCallback(() => {
    if (isClosingRef.current || isClosing || !windowRef.current) return;
    isClosingRef.current = true;
    setIsClosing(true);

    const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    const target = windowRef.current;

    contextSafe(() => {
      if (prefersReduced) {
        gsap.to(target, {
          autoAlpha: 0,
          duration: 0.15,
          onComplete: () => {
            isClosingRef.current = false;
            setIsClosing(false);
            onClose?.();
          },
        });
        return;
      }

      const { deltaX, deltaY, scaleStart } = getOriginDeltas();

      gsap.to(target, {
        x: deltaX,
        y: deltaY,
        scale: scaleStart,
        autoAlpha: 0,
        duration: 0.24,
        ease: 'power2.in',
        onComplete: () => {
          isClosingRef.current = false;
          setIsClosing(false);
          onClose?.();
        },
      });
    })();
  }, [isClosing, contextSafe, onClose, getOriginDeltas]);

  // Dragging support for the retro OS window header
  const onHeaderMouseDown = (e) => {
    if (isMaximized) return;
    dragState.current = { startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y };

    const onMouseMove = (moveEvent) => {
      if (!dragState.current) return;
      hasDraggedRef.current = true;
      const { startX, startY, originX, originY } = dragState.current;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 100, originX + moveEvent.clientX - startX)),
        y: Math.max(0, Math.min(window.innerHeight - 100, originY + moveEvent.clientY - startY)),
      });
    };

    const onMouseUp = () => {
      dragState.current = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // Keyboard accessibility: ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  if (!isOpen) return null;

  const style = isMaximized
    ? { top: 0, left: 0, width: '100%', height: 'calc(100% - 56px)' }
    : {
        top: pos.y,
        left: pos.x,
        width: modalWidth,
        height: modalHeight,
      };

  return (
    <div
      ref={containerRef}
      className="markdown-modal-overlay"
      style={{ zIndex }}
      onClick={(e) => {
        if (e.target === containerRef.current) {
          handleClose();
        }
      }}
    >
      <div
        ref={windowRef}
        className={`markdown-modal-window active ${isMaximized ? 'maximized' : ''}`}
        style={style}
      >
        {/* Retro Window Header */}
        <div className="markdown-modal-header" onMouseDown={onHeaderMouseDown}>
          <div className="markdown-modal-title-group">
            <span className="markdown-modal-badge">UE5 C++</span>
            <span className="markdown-modal-title">UE5 Pong Architecture — Deep Dive</span>
          </div>

          <div
            className="markdown-modal-controls"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              className="win-btn min"
              title="Minimize"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
            />
            <button
              className="win-btn max"
              title={isMaximized ? 'Restore' : 'Maximize'}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setIsMaximized((m) => !m);
              }}
            />
            <button
              className="win-btn close"
              title="Close (Esc)"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
            />
          </div>
        </div>

        {/* Scrollable Markdown Prose Container */}
        <div className="markdown-scroll-container">
          <article className="markdown-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {pongArchitectureRaw}
            </ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  );
}
