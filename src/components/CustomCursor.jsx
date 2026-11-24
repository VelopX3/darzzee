import React, { useEffect, useRef, useState } from 'react';

const INTERACTIVE = 'a, button, select, input, textarea, label, summary, [role="button"], [role="tab"]';

/** Decorative cursor dot for mouse users only. Touch devices, pen/coarse
 *  pointers and reduced-motion users keep the native cursor. */
export default function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const dotRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    const dot = dotRef.current;
    if (!dot) return undefined;
    document.body.classList.add('has-custom-cursor');

    let frame = 0;
    let x = 0;
    let y = 0;
    const onMove = (e) => {
      x = e.clientX;
      y = e.clientY;
      if (!frame) {
        frame = requestAnimationFrame(() => {
          dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          frame = 0;
        });
      }
      dot.style.opacity = '1';
      dot.classList.toggle('hovered', Boolean(e.target?.closest?.(INTERACTIVE)));
    };
    const hide = () => { dot.style.opacity = '0'; };
    const show = () => { dot.style.opacity = '1'; };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', hide);
    document.documentElement.addEventListener('mouseenter', show);
    return () => {
      cancelAnimationFrame(frame);
      document.body.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('mouseleave', hide);
      document.documentElement.removeEventListener('mouseenter', show);
    };
  }, [enabled]);

  if (!enabled) return null;
  return <div ref={dotRef} className="custom-cursor-dot" aria-hidden="true" />;
}
