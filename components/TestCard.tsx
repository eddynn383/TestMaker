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
  extractStatus: string;
  rawAiResponse: string | null;
  extractionError: string | null;
  onDelete: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  not_started: { label: "Not Started", className: "bg-gray-100 text-gray-600" },
  started: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  passed: { label: "Passed", className: "bg-green-100 text-green-700" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700" },
};

const LONG_PRESS_MS = 600;

export default function TestCard({ id, name, questionCount, estimatedDuration, status, score, extractStatus, rawAiResponse, extractionError, onDelete }: TestCardProps) {
  const router = useRouter();
  const isExtractionError = extractStatus === "error";
  const cfg = statusConfig[status] ?? statusConfig.not_started;
  const showRestart = status !== "not_started" && !isExtractionError;

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showLog, setShowLog] = useState(false);
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
      const res = await fetch(`/api/tests/${id}`, { method: "DELETE" });
      if (res.ok) {
        setShowConfirm(false);
        onDelete();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div
        className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-4 sm:px-6 sm:py-5 hover:shadow-md transition-shadow select-none"
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
      >
        {/* Row 1: title + action buttons */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900 leading-snug pt-0.5 min-w-0 flex-1">{name}</h2>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); if (!didLongPress.current) setShowLog(true); }}
              className="w-9 h-9 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-colors"
              title="View AI log"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
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
            {!isExtractionError && (
              <button
                onClick={() => { if (!didLongPress.current) router.push(`/test/${id}`); }}
                className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors shadow-sm"
                title={status === "started" ? "Continue test" : "Start test"}
              >
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: stats + status badge */}
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{questionCount} questions</span>
            {!isExtractionError && <span>~{estimatedDuration} min</span>}
            {score !== null && <span className="font-medium text-gray-700">{score.toFixed(0)}%</span>}
          </div>
          {isExtractionError ? (
            <span className="shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Extraction failed</span>
          ) : (
            <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>{cfg.label}</span>
          )}
        </div>

        {isExtractionError && extractionError && (
          <p className="mt-2 text-xs text-red-500 line-clamp-2">{extractionError}</p>
        )}
      </div>

      {showLog && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
          onClick={() => setShowLog(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[80vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">AI Extraction Log</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{name}</p>
              </div>
              <button
                onClick={() => setShowLog(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${isExtractionError ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                  {isExtractionError ? "Failed" : "Success"}
                </span>
                <span className="text-xs text-gray-400">{questionCount} questions extracted</span>
              </div>

              {extractionError && (
                <div>
                  <p className="text-xs font-medium text-red-700 mb-1.5">Error</p>
                  <pre className="text-xs bg-red-50 border border-red-100 rounded-xl p-3 text-red-800 whitespace-pre-wrap break-words">{extractionError}</pre>
                </div>
              )}

              {rawAiResponse && (
                <div>
                  <p className="text-xs font-medium text-gray-600 mb-1.5">Raw AI Response</p>
                  <pre className="text-xs bg-gray-50 border border-gray-100 rounded-xl p-3 text-gray-700 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">{rawAiResponse}</pre>
                </div>
              )}

              {!extractionError && !rawAiResponse && (
                <p className="text-sm text-gray-400 text-center py-4">No log data available.</p>
              )}
            </div>
          </div>
        </div>
      )}

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
