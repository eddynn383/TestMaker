"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./TestCard.module.css";

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

const badgeClass: Record<string, string> = {
  not_started: styles.badgeDefault,
  started: styles.badgeStarted,
  passed: styles.badgePassed,
  failed: styles.badgeFailed,
};

const badgeLabel: Record<string, string> = {
  not_started: "Not Started",
  started: "In Progress",
  passed: "Passed",
  failed: "Failed",
};

const LONG_PRESS_MS = 600;

export default function TestCard({ id, name, questionCount, estimatedDuration, status, score, extractStatus, rawAiResponse, extractionError, onDelete }: TestCardProps) {
  const router = useRouter();
  const isExtractionError = extractStatus === "error";
  const showRestart = status !== "not_started" && !isExtractionError;

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  }

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
        className={`${styles.card} px-5 py-5 sm:px-6`}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerLeave={cancelPress}
        onPointerCancel={cancelPress}
      >
        {/* Row 1: title + action buttons */}
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold leading-snug pt-0.5 min-w-0 flex-1" style={{ color: "var(--tm-text-1)" }}>{name}</h2>
          <div className="flex items-center gap-2.5">
            <button
              className={styles.iconBtn}
              onClick={(e) => { e.stopPropagation(); if (!didLongPress.current) setShowLog(true); }}
              title="View AI log"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>

            {showRestart && (
              <button
                className={styles.iconBtn}
                onClick={() => { if (!didLongPress.current) router.push(`/test/${id}?new=1`); }}
                title="Restart test"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}

            {!isExtractionError && (
              <button
                className={styles.playBtn}
                onClick={() => { if (!didLongPress.current) router.push(`/test/${id}`); }}
                title={status === "started" ? "Continue test" : "Start test"}
              >
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: stats + badge */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-sm" style={{ color: "var(--tm-text-2)" }}>
            <span>{questionCount} questions</span>
            {!isExtractionError && <span>~{estimatedDuration} min</span>}
            {score !== null && <span className="font-semibold" style={{ color: "var(--tm-text-3)" }}>{score.toFixed(0)}%</span>}
          </div>
          {isExtractionError ? (
            <span className={`${styles.badge} ${styles.badgeError}`}>Extraction failed</span>
          ) : (
            <span className={`${styles.badge} ${badgeClass[status] ?? styles.badgeDefault}`}>
              {badgeLabel[status] ?? "Not Started"}
            </span>
          )}
        </div>

        {isExtractionError && extractionError && (
          <p className="mt-2 text-xs line-clamp-2" style={{ color: "var(--tm-wrong-text)" }}>{extractionError}</p>
        )}
      </div>

      {/* ── AI Log modal ───────────────────────────────────────────────── */}
      {showLog && (
        <div
          className="fixed inset-0 flex items-end sm:items-center justify-center z-50"
          style={{ background: "rgba(30,40,60,0.35)" }}
          onClick={() => setShowLog(false)}
        >
          <div
            className="rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[80vh] flex flex-col"
            style={{ background: "var(--tm-surface)", boxShadow: "var(--tm-shadow-card-lg)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--tm-border)" }}>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--tm-text-1)" }}>AI Extraction Log</h3>
                <p className="text-xs mt-0.5 truncate max-w-xs" style={{ color: "var(--tm-text-2)" }}>{name}</p>
              </div>
              <button className={styles.iconBtn} onClick={() => setShowLog(false)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className={`${styles.badge} ${isExtractionError ? styles.badgeError : styles.badgePassed}`}>
                  {isExtractionError ? "Failed" : "Success"}
                </span>
                <span className="text-xs" style={{ color: "var(--tm-text-2)" }}>{questionCount} questions extracted</span>
              </div>

              {extractionError && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold" style={{ color: "var(--tm-wrong-text)" }}>Error</p>
                    <button
                      onClick={() => copyToClipboard(extractionError!, "error")}
                      className="flex items-center gap-1 text-xs transition-all active:scale-90 touch-manipulation"
                      style={{ color: copiedKey === "error" ? "var(--tm-correct-text)" : "var(--tm-text-2)" }}
                    >
                      {copiedKey === "error" ? (
                        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied!</>
                      ) : (
                        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                      )}
                    </button>
                  </div>
                  <pre className="text-xs rounded-xl p-3 whitespace-pre-wrap break-words" style={{ background: "var(--tm-wrong-bg)", color: "var(--tm-wrong-text)", boxShadow: "var(--tm-shadow-inset)" }}>{extractionError}</pre>
                </div>
              )}

              {rawAiResponse && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold" style={{ color: "var(--tm-text-3)" }}>Raw AI Response</p>
                    <button
                      onClick={() => copyToClipboard(rawAiResponse!, "raw")}
                      className="flex items-center gap-1 text-xs transition-all active:scale-90 touch-manipulation"
                      style={{ color: copiedKey === "raw" ? "var(--tm-correct-text)" : "var(--tm-text-2)" }}
                    >
                      {copiedKey === "raw" ? (
                        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied!</>
                      ) : (
                        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                      )}
                    </button>
                  </div>
                  <pre className="text-xs rounded-xl p-3 whitespace-pre-wrap break-words max-h-64 overflow-y-auto" style={{ background: "var(--tm-page)", color: "var(--tm-text-1)", boxShadow: "var(--tm-shadow-inset)" }}>{rawAiResponse}</pre>
                </div>
              )}

              {!extractionError && !rawAiResponse && (
                <p className="text-sm text-center py-4" style={{ color: "var(--tm-text-2)" }}>No log data available.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ────────────────────────────────────────── */}
      {showConfirm && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(30,40,60,0.35)" }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="rounded-2xl p-6 mx-4 max-w-sm w-full"
            style={{ background: "var(--tm-surface)", boxShadow: "var(--tm-shadow-card-lg)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold mb-1" style={{ color: "var(--tm-text-1)" }}>Delete test?</h3>
            <p className="text-sm mb-5" style={{ color: "var(--tm-text-2)" }}>
              <span className="font-medium" style={{ color: "var(--tm-text-3)" }}>&ldquo;{name}&rdquo;</span> and all its attempts will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className={styles.iconBtn}
                style={{ width: "auto", height: "auto", borderRadius: "12px", padding: "10px", flex: 1, fontSize: "0.875rem", fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium transition-all active:scale-95 touch-manipulation disabled:opacity-50"
                style={{ background: "linear-gradient(145deg, #f87171, #dc2626)", boxShadow: "4px 4px 10px rgba(220,38,38,0.4), -2px -2px 6px rgba(255,255,255,0.2)" }}
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
