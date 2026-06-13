"use client";

import { useEffect, useState, useCallback } from "react";

interface TimerProps {
  totalSeconds: number;
  onExpire: () => void;
}

export default function Timer({ totalSeconds, onExpire }: TimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);

  const handleExpire = useCallback(onExpire, [onExpire]);

  useEffect(() => {
    if (remaining <= 0) {
      handleExpire();
      return;
    }
    const id = setInterval(() => setRemaining((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [remaining, handleExpire]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const percent = (remaining / totalSeconds) * 100;
  const isLow = remaining < 60;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-semibold ${isLow ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-700"}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path strokeWidth="2" strokeLinecap="round" d="M12 6v6l4 2" />
      </svg>
      <span>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isLow ? "bg-red-500" : "bg-indigo-500"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
