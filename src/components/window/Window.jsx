import { useRef, useState, useEffect } from 'react';

export default function Window({
  id, title, children, defaultSize,
  onClose, onFocus, zIndex = 1000, isMinimized = false, className = '', startMaximized = false,
  allowMaximize = true
}) {
  const [pos, setPos] = useState({ x: 100, y: 50 });
  const [isMaximized, setIsMaximized] = useState(startMaximized);
  const dragState = useRef(null);

  useEffect(() => {
    if (defaultSize) {
      setPos({
        x: Math.max(20, (window.innerWidth  - defaultSize.w) / 2),
        y: Math.max(20, (window.innerHeight - defaultSize.h) / 2 - 30),
      });
    }
  }, []);

  const onMouseMove = (e) => {
    if (!dragState.current) return;
    const { startX, startY, originX, originY } = dragState.current;
    setPos({ x: originX + e.clientX - startX, y: originY + e.clientY - startY });
  };

  const onMouseUp = () => {
    dragState.current = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  const onHeaderMouseDown = (e) => {
    if (isMaximized) return;
    onFocus?.();
    dragState.current = { startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  useEffect(() => () => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }, []);

  const style = isMaximized
    ? { top: 0, left: 0, width: '100%', height: 'calc(100% - 60px)', zIndex }
    : {
        top: pos.y, left: pos.x,
        width: defaultSize?.w ?? 500,
        height: defaultSize?.h ?? 400,
        zIndex,
      };

  if (isMinimized) return null;

  return (
    <div
      id={`win-${id}`}
      className={`window active ${isMaximized ? 'maximized' : ''} ${className}`.trim()}
      style={style}
      onMouseDown={() => onFocus?.()}
    >
      <div className="window-header" onMouseDown={onHeaderMouseDown} style={{ justifyContent: className.includes('mac-window') ? 'flex-start' : 'space-between' }}>
        {!className.includes('mac-window') && (
          <span className="window-title">{title}</span>
        )}
        <div className="window-controls" style={{ display: 'flex', gap: '8px' }}>
          <button className="win-btn close" onClick={(e) => { e.stopPropagation(); onClose?.('close'); }} />
          <button className="win-btn min" onClick={(e) => { e.stopPropagation(); onClose?.('minimize'); }} />
          <button 
            className={`win-btn max ${!allowMaximize ? 'disabled' : ''}`} 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (allowMaximize) setIsMaximized(m => !m); 
            }}
            style={{ opacity: allowMaximize ? undefined : 0.3, cursor: allowMaximize ? 'pointer' : 'default' }}
          />
        </div>
        {className.includes('mac-window') && (
          <span className="window-title" style={{ marginLeft: '12px', fontWeight: 600, fontSize: '0.95rem' }}>{title}</span>
        )}
      </div>
      <div className="window-content" style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>{children}</div>
    </div>
  );
}
