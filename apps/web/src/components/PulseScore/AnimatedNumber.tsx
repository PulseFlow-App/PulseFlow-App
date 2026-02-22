import { useState, useEffect, useRef } from 'react';

type AnimatedNumberProps = {
  value: number;
  /** When set, first animation runs from this value to `value` (e.g. previous score before check-in). */
  initialValue?: number;
  duration?: number;
  delay?: number;
};

export function AnimatedNumber({
  value,
  initialValue,
  duration = 1800,
  delay = 0,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(initialValue ?? 0);
  const prevTargetRef = useRef<number>(initialValue ?? 0);

  useEffect(() => {
    if (value === prevTargetRef.current) return;
    const from = prevTargetRef.current;
    prevTargetRef.current = value;

    let start: number | null = null;
    let frame: number;

    const step = (timestamp: number) => {
      if (start == null) start = timestamp;
      const elapsed = timestamp - start - delay;
      if (elapsed < 0) {
        frame = requestAnimationFrame(step);
        return;
      }
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + eased * (value - from));
      setDisplay(current);
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration, delay]);

  return <>{display}</>;
}
