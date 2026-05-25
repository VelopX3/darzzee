import React, { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is touch or mobile
    const checkDevice = () => {
      const mobile = window.matchMedia("(max-width: 768px)").matches || 
                     ('ontouchstart' in window) || 
                     (navigator.maxTouchPoints > 0);
      setIsMobile(mobile);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);

    if (isMobile) return;

    const dot = document.querySelector('.custom-cursor-dot');
    if (!dot) return;

    const handleMouseMove = (e) => {
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      dot.style.opacity = '1';

      // Dynamic hover state check
      const target = e.target;
      if (target) {
        const isInteractive = target.closest('a, button, select, input, textarea, [role="button"], [class*="card"], [class*="btn"], [class*="option"], [class*="dot"], [class*="indicator"], .gallery-item, .logo-container, .nav-item');
        if (isInteractive) {
          dot.classList.add('hovered');
        } else {
          dot.classList.remove('hovered');
        }
      }
    };

    const handleMouseLeave = () => {
      dot.style.opacity = '0';
    };

    const handleMouseEnter = () => {
      dot.style.opacity = '1';
    };

    // Reset hover classes on clicks to avoid stuck cursor states during HMR/state navigation
    const handleMouseClick = () => {
      dot.classList.remove('hovered');
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('click', handleMouseClick);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('click', handleMouseClick);
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <div className="custom-cursor-dot" />
  );
}
