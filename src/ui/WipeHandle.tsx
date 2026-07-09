import { useRef } from 'react';

export function WipeHandle({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const setFromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const v = (clientX - rect.left) / rect.width;
    onChange(Math.min(1, Math.max(0, v)));
  };

  return (
    <div
      ref={trackRef}
      className="wipe-track"
      style={{ position: 'absolute', inset: 0 }}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        setFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (e.buttons === 1) setFromClientX(e.clientX);
      }}
    >
      <div
        className="wipe-handle"
        data-testid="wipe-handle"
        style={{ left: `calc(${value * 100}% - 1px)` }}
      />
    </div>
  );
}
