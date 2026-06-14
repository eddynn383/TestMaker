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
  not_started: { label: "Not Started", className: "bg-gray-200/70 text-gray-500" },
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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  }
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
        className="bg-gray-50 rounded-2xl px-4 py-4 sm:px-6 sm:py-5 shadow-[6px_6px_12px_#c8cfd8,-6px_-6px_12px_#ffffff] transition-shadow select-none"
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
              className="w-9 h-9 rounded-full bg-gray-50 shadow-[3px_3px_6px_#c8cfd8,-3px_-3px_6px_#ffffff] active:shadow-[inset_3px_3px_6px_#c8cfd8,inset_-3px_-3px_6px_#ffffff] text-gray-400 hover:text-gray-600 flex items-center justify-center transition-all touch-manipulation"
              title="View AI log"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
            {showRestart && (
              <button
                onClick={() => { if (!didLongPress.current) router.push(`/test/${id}?new=1`); }}
                className="w-9 h-9 rounded-full bg-gray-50 shadow-[3px_3px_6px_#c8cfd8,-3px_-3px_6px_#ffffff] active:shadow-[inset_3px_3px_6px_#c8cfd8,inset_-3px_-3px_6px_#ffffff] text-gray-400 hover:text-gray-600 flex items-center justify-center transition-all touch-manipulation"
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
                className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-all shadow-[3px_3px_8px_rgba(67,56,202,0.45),-2px_-2px_6px_rgba(255,255,255,0.25)] active:shadow-[inset_2px_2px_5px_rgba(67,56,202,0.5)] touch-manipulation"
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
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all active:scale-90 touch-manipulation"
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
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-red-700">Error</p>
                    <button
                      onClick={() => copyToClipboard(extractionError!, "error")}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-all active:scale-90 touch-manipulation"
                    >
                      {copiedKey === "error" ? (
                        <>
                          <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-xs bg-red-50 border border-red-100 rounded-xl p-3 text-red-800 whitespace-pre-wrap break-words">{extractionError}</pre>
                </div>
              )}

              {rawAiResponse && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-gray-600">Raw AI Response</p>
                    <button
                      onClick={() => copyToClipboard(rawAiResponse!, "raw")}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-all active:scale-90 touch-manipulation"
                    >
                      {copiedKey === "raw" ? (
                        <>
                          <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
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
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all active:scale-95 touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium transition-all active:scale-95 touch-manipulation"
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
