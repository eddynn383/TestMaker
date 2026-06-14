"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface TestCardProps {
  id: string;
  name: string;
  questionCount: number;
  estimatedDuration: number;
  status: string;
  score: number | null;
  onDelete: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  not_started: { label: "Not Started", className: "bg-gray-100 text-gray-600" },
  started: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  passed: { label: "Passed", className: "bg-green-100 text-green-700" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700" },
};

const LONG_PRESS_MS = 600;

export default function TestCard({ id, name, questionCount, estimatedDuration, status, score, onDelete }: TestCardProps) {
  const router = useRouter();
  const cfg = statusConfig[status] ?? statusConfig.not_started;
  const showRestart = status !== "not_started";

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  function startPress() {
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setShowConfirm(true);
    }, LONG_PRESS_MS);
  }

  function cancelPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/tests/${id}`, { method: "DELETE" });
      setShowConfirm(false);
      onDelete();
    } catch {
      // network error — keep modal open so user can retry
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow select-none"
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
      >
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{name}</h2>
          <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
            <span>{questionCount} questions</span>
            <span>~{estimatedDuration} min</span>
            {score !== null && <span className="font-medium text-gray-700">{score.toFixed(0)}%</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4 shrink-0">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${cfg.className}`}>{cfg.label}</span>

          {showRestart && (
            <button
              onClick={() => { if (!didLongPress.current) router.push(`/test/${id}?new=1`); }}
              className="w-9 h-9 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors"
              title="Restart test"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}

          <button
            onClick={() => { if (!didLongPress.current) router.push(`/test/${id}`); }}
            className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors shadow-sm"
            title={status === "started" ? "Continue test" : "Start test"}
          >
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
          </button>
        </div>
      </div>

      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-gray-900 mb-1">Delete test?</h3>
            <p className="text-sm text-gray-500 mb-5">
              <span className="font-medium text-gray-700">&ldquo;{name}&rdquo;</span> and all its attempts will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
