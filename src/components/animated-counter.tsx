import { useEffect, useRef, useState } from "react";

/**
 * Count-up animation that runs once when the target value first becomes truthy,
 * and re-runs whenever the target changes by a meaningful amount.
 */
export function AnimatedCounter({
  value,
  duration = 1200,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  const from = useRef(0);

  useEffect(() => {
    if (!Number.isFinite(value)) return;
    const start = performance.now();
    const startVal = from.current;
    const delta = value - startVal;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(startVal + delta * eased));
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else from.current = value;
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, duration]);

  return <span className={className}>{display.toLocaleString()}</span>;
}