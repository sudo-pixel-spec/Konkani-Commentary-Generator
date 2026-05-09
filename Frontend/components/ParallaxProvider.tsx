import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

interface ParallaxContextType {
  scrollY: number;
  viewportHeight: number;
  progress: number;
}

const ParallaxContext = createContext<ParallaxContextType>({
  scrollY: 0,
  viewportHeight: 0,
  progress: 0,
});

export function useParallax() {
  return useContext(ParallaxContext);
}

export function useParallaxOffset(speed: number = 0.5) {
  const { scrollY } = useParallax();
  return scrollY * speed;
}

export function useElementProgress(ref: React.RefObject<HTMLElement | null>) {
  const { scrollY, viewportHeight } = useParallax();
  if (!ref.current) return 0;
  const rect = ref.current.getBoundingClientRect();
  const elementTop = rect.top + scrollY;
  const start = elementTop - viewportHeight;
  const end = elementTop + rect.height;
  const progress = (scrollY - start) / (end - start);
  return Math.max(0, Math.min(1, progress));
}

interface Props {
  children: React.ReactNode;
}

export default function ParallaxProvider({ children }: Props) {
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  const handleScroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const y = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      setScrollY(y);
      setProgress(maxScroll > 0 ? y / maxScroll : 0);
    });
  }, []);

  useEffect(() => {
    setViewportHeight(window.innerHeight);
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', () => setViewportHeight(window.innerHeight));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll]);

  return (
    <ParallaxContext.Provider value={{ scrollY, viewportHeight, progress }}>
      {children}
    </ParallaxContext.Provider>
  );
}
