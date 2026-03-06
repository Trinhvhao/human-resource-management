'use client';

import { useState, useEffect, memo } from 'react';

interface LiveClockProps {
  className?: string;
}

/**
 * Isolated clock component — only this component re-renders every second,
 * preventing the parent (EmployeeDashboard) from re-rendering on each tick.
 */
const LiveClock = memo(function LiveClock({ className }: LiveClockProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className={className}>
        {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <p className="text-blue-200 text-sm mt-1">
        {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </>
  );
});

export default LiveClock;
