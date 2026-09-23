import { useEffect, useState } from 'react';

function read() {
  if (typeof window === 'undefined') return { w: 1024, h: 768 };
  return { w: Math.max(320, window.innerWidth), h: Math.max(320, window.innerHeight) };
}

export function useViewport() {
  const [vp, setVp] = useState(read);
  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const next = read();
        setVp((prev) => (prev.w === next.w && prev.h === next.h ? prev : next));
      });
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  return vp;
}
