import { useRef, useState, useEffect } from 'react';

export default function Window({
  id, title, children, defaultSize,
  onClose, onFocus, zIndex = 1000, isMinimized = false, className = '',
}) {
  const [pos, setPos] = useState({ x: 100, y: 50 });
  const [isMaximized, setIsMaximized] = useState(false);
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
      <div className="window-header" onMouseDown={onHeaderMouseDown}>
        <span className="window-title">{title}</span>
        <div className="window-controls">
          <button className="win-btn min" onClick={(e) => { e.stopPropagation(); onClose?.('minimize'); }} />
          <button className="win-btn max" onClick={(e) => { e.stopPropagation(); setIsMaximized(m => !m); }} />
          <button className="win-btn close" onClick={(e) => { e.stopPropagation(); onClose?.('close'); }} />
        </div>
      </div>
      <div className="window-content">{children}</div>
    </div>
  );
}
