/**
 * CountUpNumber Component
 * Animates a numeric value from 0 to target over 600ms on initial mount.
 * Formats as Indian Rupees (INR) or standard numbers with tabular numerals.
 */

import React, { useEffect, useState } from 'react';

interface CountUpNumberProps {
  value: number;
  duration?: number;
  isCurrency?: boolean;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({
  value,
  duration = 600,
  isCurrency = true,
  prefix = isCurrency ? '₹' : '',
  suffix = '',
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    // Check for prefers-reduced-motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(value);
      return;
    }

    let startTimestamp: number | null = null;
    const startValue = 0;
    const targetValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease-out quad curve
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(startValue + (targetValue - startValue) * easeProgress);
      setDisplayValue(current);

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration]);

  const formatted = displayValue.toLocaleString('en-IN');

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
