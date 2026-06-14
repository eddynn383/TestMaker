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

  const pillStyle = isLow
    ? { background: "#fde8e8", boxShadow: "inset 3px 3px 6px #e8b8b8, inset -3px -3px 6px #fff0f0", color: "#b91c1c" }
    : { background: "#e0e5ee", boxShadow: "inset 3px 3px 6px #b8c0cc, inset -3px -3px 6px #ffffff", color: "#5a6a80" };

  const trackStyle = isLow
    ? { background: "#f8d4d4", boxShadow: "inset 1px 1px 2px #e8b8b8, inset -1px -1px 2px #fff0f0" }
    : { background: "#d4d9e4", boxShadow: "inset 1px 1px 2px #b8c0cc, inset -1px -1px 2px #ffffff" };

  const fillStyle = isLow
    ? { background: "#ef4444", width: `${percent}%` }
    : { background: "linear-gradient(90deg, #6366f1, #4f46e5)", width: `${percent}%` };

  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-semibold" style={pillStyle}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path strokeWidth="2" strokeLinecap="round" d="M12 6v6l4 2" />
      </svg>
      <span>
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={trackStyle}>
        <div className="h-full rounded-full transition-all duration-1000" style={fillStyle} />
      </div>
    </div>
  );
}
