'use client';

import { useEffect, useState } from 'react';

type Props = { value: number; suffix?: string; durationMs?: number };

const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;

export const CountUp = ({ value, suffix = '', durationMs = 1400 }: Props) => {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setShown(value);
      return undefined;
    }

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      setShown(Math.round(value * easeOutCubic(progress)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return (
    <span className="tabular-nums">
      {shown.toLocaleString('en-US')}
      {suffix}
    </span>
  );
};
