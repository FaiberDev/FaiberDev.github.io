import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const MOBILE_BREAKPOINT = 767;

function getViewport() {
  if (typeof window === 'undefined') return { w: 1280, h: 800 };
  return {
    w: window.innerWidth || 1280,
    h: window.innerHeight || 800,
  };
}

function getClampedBounds(defaultSize, vp) {
  const taskbarH = vp.w <= MOBILE_BREAKPOINT ? 52 : 56;
  const targetW = defaultSize?.w ?? 600;
  const targetH = defaultSize?.h ?? 460;
  const w = Math.min(targetW, Math.max(280, vp.w - 32));
  const h = Math.min(targetH, Math.max(240, vp.h - taskbarH - 24));
  const x = Math.max(16, Math.round((vp.w - w) / 2));
  const y = Math.max(12, Math.round((vp.h - taskbarH - h) / 2));
  return { w, h, x, y, taskbarH };
}

export default function Window({
  id,
  title,
  children,
  defaultSize,
  onClose,
  onFocus,
  zIndex = 1000,
  isMinimized = false,
  className = '',
  startMaximized = false,
  allowMaximize = true,
  registerController,
}) {
  const windowRef = useRef(null);
  const [viewport, setViewport] = useState(getViewport);
  const [pos, setPos] = useState(() => {
    const initial = getClampedBounds(defaultSize, getViewport());
    return { x: initial.x, y: initial.y };
  });
  const [isMaximized, setIsMaximized] = useState(startMaximized);
  const [isDragging, setIsDragging] = useState(false);
  const hasDraggedRef = useRef(false);
  const dragState = useRef(null);
  const isExiting = useRef(false);

  const isMobile = viewport.w <= MOBILE_BREAKPOINT;
  const bounds = getClampedBounds(defaultSize, viewport);

  const defaultW = defaultSize?.w;
  const defaultH = defaultSize?.h;

  useEffect(() => {
    const handleResize = () => {
      const nextVp = getViewport();
      setViewport(nextVp);
      const nextBounds = getClampedBounds({ w: defaultW, h: defaultH }, nextVp);
      setPos((prev) => {
        if (!hasDraggedRef.current) {
          return { x: nextBounds.x, y: nextBounds.y };
        }
        return {
          x: Math.max(12, Math.min(Math.max(12, nextVp.w - nextBounds.w - 12), prev.x)),
          y: Math.max(12, Math.min(Math.max(12, nextVp.h - nextBounds.taskbarH - 60), prev.y)),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [defaultW, defaultH]);

  // GSAP Spring Entrance Animation
  useGSAP(
    () => {
      if (!windowRef.current || isMinimized) return;
      isExiting.current = false;
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

      if (prefersReduced) {
        gsap.set(windowRef.current, { autoAlpha: 1 });
        return;
      }

      gsap.fromTo(
        windowRef.current,
        { scale: 0.88, autoAlpha: 0, y: 28 },
        {
          scale: 1,
          autoAlpha: 1,
          y: 0,
          duration: 0.38,
          ease: 'back.out(1.4)',
          clearProps: 'transform',
        }
      );
    },
    { scope: windowRef, dependencies: [isMinimized] }
  );

  const handleClose = (e, action = 'close') => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    if (isExiting.current) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (prefersReduced || !windowRef.current) {
      onClose?.(action);
      return;
    }

    isExiting.current = true;

    if (action === 'close') {
      gsap.to(windowRef.current, {
        scale: 0.90,
        y: 20,
        autoAlpha: 0,
        duration: 0.22,
        ease: 'power2.in',
        onComplete: () => {
          isExiting.current = false;
          onClose?.('close');
        },
      });
    } else if (action === 'minimize') {
      gsap.to(windowRef.current, {
        scale: 0.65,
        y: 80,
        autoAlpha: 0,
        duration: 0.24,
        ease: 'power3.in',
        onComplete: () => {
          isExiting.current = false;
          onClose?.('minimize');
        },
      });
    } else {
      isExiting.current = false;
      onClose?.(action);
    }
  };

  // Register imperative controller for taskbar tab interactions
  useEffect(() => {
    if (registerController) {
      registerController(id, {
        close: () => handleClose(null, 'close'),
        minimize: () => handleClose(null, 'minimize'),
      });
    }
    return () => {
      registerController?.(id, null);
    };
  }, [id, registerController]);

  const onMouseMove = (e) => {
    if (!dragState.current) return;
    hasDraggedRef.current = true;
    setIsDragging(true);
    const { startX, startY, originX, originY } = dragState.current;
    setPos({
      x: Math.max(8, Math.min(window.innerWidth - 100, originX + e.clientX - startX)),
      y: Math.max(8, Math.min(window.innerHeight - 96, originY + e.clientY - startY)),
    });
  };

  const onMouseUp = () => {
    dragState.current = null;
    setIsDragging(false);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  const onHeaderMouseDown = (e) => {
    if (isMaximized || isMobile) return;
    onFocus?.();
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onHeaderDoubleClick = (e) => {
    e.stopPropagation();
    if (allowMaximize && !isMobile) {
      setIsMaximized((m) => !m);
    }
  };

  useEffect(() => () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }, []);

  const style = isMobile
    ? {
        top: 8,
        left: 8,
        width: 'calc(100% - 16px)',
        height: 'calc(100% - var(--taskbar-height, 52px) - 16px)',
        zIndex,
      }
    : isMaximized
      ? {
          top: 0,
          left: 0,
          width: '100%',
          height: 'calc(100% - var(--taskbar-height, 56px))',
          zIndex,
        }
      : {
          top: pos.y,
          left: pos.x,
          width: bounds.w,
          height: bounds.h,
          zIndex,
        };

  if (isMinimized) return null;

  return (
    <div
      ref={windowRef}
      id={`win-${id}`}
      className={`window active ${isMaximized ? 'maximized' : ''} ${isMobile ? 'mobile-sheet' : ''} ${isDragging ? 'is-dragging' : ''} ${className}`.trim()}
      style={style}
      onMouseDown={() => onFocus?.()}
    >
      <div
        className="window-header"
        onMouseDown={onHeaderMouseDown}
        onDoubleClick={onHeaderDoubleClick}
        title={allowMaximize && !isMobile ? 'Double click to toggle maximize/restore' : undefined}
      >
        <span className="window-title">{title}</span>
        <div
          className="window-controls"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            className="win-btn min"
            title="Minimize"
            aria-label="Minimize window"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => handleClose(e, 'minimize')}
          />
          <button
            className={`win-btn max ${!allowMaximize || isMobile ? 'disabled' : ''}`}
            title={isMaximized ? 'Restore' : 'Maximize'}
            aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (allowMaximize && !isMobile) setIsMaximized((m) => !m);
            }}
            style={{
              opacity: allowMaximize && !isMobile ? undefined : 0.3,
              cursor: allowMaximize && !isMobile ? 'pointer' : 'default',
            }}
          />
          <button
            className="win-btn close"
            title="Close"
            aria-label="Close window"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => handleClose(e, 'close')}
          />
        </div>
      </div>
      <div className="window-content">
        {children}
      </div>
    </div>
  );
}
