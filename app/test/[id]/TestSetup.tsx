"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TestPlayer from "@/components/TestPlayer";

interface Question {
  id: string;
  text: string;
  options: string;
  correctAnswer: string;
  explanation: string | null;
  order: number;
}

interface Test {
  id: string;
  name: string;
  questions: Question[];
}

interface ExistingAttempt {
  id: string;
  timeLimit: number | null;
}

export default function TestSetup({ test, existingAttempt }: { test: Test; existingAttempt: ExistingAttempt | null }) {
  const router = useRouter();

  // If resuming an in-progress attempt, skip the setup screen entirely
  const [started, setStarted] = useState(!!existingAttempt);
  const [attemptId, setAttemptId] = useState<string | null>(existingAttempt?.id ?? null);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(30);
  const [starting, setStarting] = useState(false);

  const totalSeconds = hours * 3600 + minutes * 60;
  const estimatedMinutes = Math.ceil(test.questions.length * 1.5);
  const resumeTimeLimit = existingAttempt?.timeLimit ?? 0;

  async function handleStart() {
    setStarting(true);
    const res = await fetch(`/api/tests/${test.id}/attempt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeLimit: totalSeconds > 0 ? totalSeconds : null }),
    });
    const data = await res.json();
    setAttemptId(data.id);
    setStarted(true);
    setStarting(false);
  }

  if (started && attemptId) {
    return (
      <TestPlayer
        testId={test.id}
        testName={test.name}
        questions={test.questions}
        initialTimeLimit={existingAttempt ? resumeTimeLimit : totalSeconds}
        attemptId={attemptId}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-md w-full">
        <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600 mb-6 block">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <h1 className="text-xl font-bold text-gray-900 mb-1">{test.name}</h1>
        <p className="text-sm text-gray-400 mb-8">
          {test.questions.length} questions · ~{estimatedMinutes} min estimated
        </p>

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">Set timer (optional)</label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Hours</label>
              <input
                type="number"
                min={0}
                max={23}
                value={hours}
                onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-center text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <span className="text-gray-400 font-bold mt-4">:</span>
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Minutes</label>
              <input
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-center text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          {totalSeconds === 0 && (
            <p className="text-xs text-gray-400 mt-2">No timer — you can take as long as you need.</p>
          )}
        </div>

        <button
          onClick={handleStart}
          disabled={starting}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors"
        >
          {starting ? "Starting…" : "Start Test"}
        </button>
      </div>
    </div>
  );
}
