import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

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
  const [pos, setPos] = useState({ x: 100, y: 50 });
  const [isMaximized, setIsMaximized] = useState(startMaximized);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef(null);
  const isExiting = useRef(false);

  useEffect(() => {
    if (defaultSize) {
      setPos({
        x: Math.max(20, (window.innerWidth - defaultSize.w) / 2),
        y: Math.max(20, (window.innerHeight - defaultSize.h) / 2 - 30),
      });
    }
  }, []);

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
    setIsDragging(true);
    const { startX, startY, originX, originY } = dragState.current;
    setPos({
      x: Math.max(10, Math.min(window.innerWidth - 80, originX + e.clientX - startX)),
      y: Math.max(10, Math.min(window.innerHeight - 80, originY + e.clientY - startY)),
    });
  };

  const onMouseUp = () => {
    dragState.current = null;
    setIsDragging(false);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  const onHeaderMouseDown = (e) => {
    if (isMaximized) return;
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
    if (allowMaximize) {
      setIsMaximized((m) => !m);
    }
  };

  useEffect(() => () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }, []);

  const style = isMaximized
    ? { top: 0, left: 0, width: '100%', height: 'calc(100% - 56px)', zIndex }
    : {
        top: pos.y,
        left: pos.x,
        width: defaultSize?.w ?? 500,
        height: defaultSize?.h ?? 400,
        zIndex,
      };

  if (isMinimized) return null;

  return (
    <div
      ref={windowRef}
      id={`win-${id}`}
      className={`window active ${isMaximized ? 'maximized' : ''} ${isDragging ? 'is-dragging' : ''} ${className}`.trim()}
      style={style}
      onMouseDown={() => onFocus?.()}
    >
      <div
        className="window-header"
        onMouseDown={onHeaderMouseDown}
        onDoubleClick={onHeaderDoubleClick}
        title={allowMaximize ? 'Double click to toggle maximize/restore' : undefined}
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
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => handleClose(e, 'minimize')}
          />
          <button
            className={`win-btn max ${!allowMaximize ? 'disabled' : ''}`}
            title={isMaximized ? 'Restore' : 'Maximize'}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (allowMaximize) setIsMaximized((m) => !m);
            }}
            style={{
              opacity: allowMaximize ? undefined : 0.3,
              cursor: allowMaximize ? 'pointer' : 'default',
            }}
          />
          <button
            className="win-btn close"
            title="Close"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => handleClose(e, 'close')}
          />
        </div>
      </div>
      <div
        className="window-content"
        style={{ flex: 1, overflowY: 'auto', position: 'relative' }}
      >
        {children}
      </div>
    </div>
  );
}
