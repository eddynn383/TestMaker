"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Timer from "./Timer";
import styles from "./TestPlayer.module.css";

const MathText = dynamic(() => import("./MathText"), { ssr: false });

interface Question {
  id: string;
  text: string;
  options: string;
  correctAnswer: string;
  explanation: string | null;
  order: number;
}

interface TestPlayerProps {
  testId: string;
  testName: string;
  questions: Question[];
  initialTimeLimit: number;
  attemptId: string;
}

type AnswerRecord = {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string | null;
  selectedAnswer: string;
};

export default function TestPlayer({ testId, testName, questions, initialTimeLimit, attemptId }: TestPlayerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState<{ score: number; correct: number; total: number; status: string } | null>(null);
  const [answeredMap, setAnsweredMap] = useState<Record<number, AnswerRecord>>({});
  const [showDrawer, setShowDrawer] = useState(false);

  const question = questions[currentIndex];
  const options: string[] = JSON.parse(question.options);
  const answeredCount = Object.keys(answeredMap).length;
  const progress = (answeredCount / questions.length) * 100;

  async function submitAnswer() {
    if (!selected || submitting) return;
    setSubmitting(true);
    const res = await fetch(`/api/tests/${testId}/attempt`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "answer", attemptId, questionId: question.id, selectedAnswer: selected }),
    });
    const data = await res.json();
    const record: AnswerRecord = {
      isCorrect: data.isCorrect,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation,
      selectedAnswer: selected,
    };
    setAnsweredMap((prev) => ({ ...prev, [currentIndex]: record }));
    setResult(record);
    setSubmitting(false);
  }

  const completeTest = useCallback(async () => {
    const res = await fetch(`/api/tests/${testId}/attempt`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", attemptId }),
    });
    const data = await res.json();
    setFinalScore({ score: data.score, correct: data.correct, total: data.total, status: data.status });
    setCompleted(true);
  }, [testId, attemptId]);

  async function nextQuestion() {
    if (currentIndex + 1 >= questions.length) {
      await completeTest();
    } else {
      const nextIdx = currentIndex + 1;
      const existing = answeredMap[nextIdx];
      setCurrentIndex(nextIdx);
      setSelected(existing?.selectedAnswer ?? null);
      setResult(existing ?? null);
    }
  }

  function navigateToQuestion(index: number) {
    const record = answeredMap[index];
    if (!record) return;
    setCurrentIndex(index);
    setSelected(record.selectedAnswer);
    setResult(record);
    setShowDrawer(false);
  }

  const handleTimerExpire = useCallback(async () => {
    await completeTest();
  }, [completeTest]);

  if (completed && finalScore) {
    const passed = finalScore.status === "passed";
    return (
      <div className={`${styles.page} flex items-center justify-center p-4`}>
        <div className={styles.scoreCard}>
          <div className={passed ? styles.scoreIconPassed : styles.scoreIconFailed}>
            {passed ? (
              <svg className="w-10 h-10" style={{ color: "#15803d" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-10 h-10" style={{ color: "#b91c1c" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "#3d4a5c" }}>
            {passed ? "Test Passed!" : "Test Failed"}
          </h2>
          <p className="mb-6 text-sm" style={{ color: "#8896aa" }}>
            You answered {finalScore.correct} out of {finalScore.total} questions correctly.
          </p>
          <div className="text-5xl font-bold mb-8" style={{ color: passed ? "#15803d" : "#b91c1c" }}>
            {finalScore.score.toFixed(0)}%
          </div>
          <button onClick={() => router.push("/")} className={styles.primaryBtn}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Drawer backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${showDrawer ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(0,0,0,0.3)" }}
        onClick={() => setShowDrawer(false)}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-72 flex flex-col transform transition-transform duration-300 ease-in-out ${showDrawer ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "#e0e5ee", boxShadow: "8px 0 24px #b8c0cc, 2px 0 6px rgba(255,255,255,0.3)" }}
      >
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid #c8d0dc" }}>
          <div>
            <h2 className="font-semibold text-sm" style={{ color: "#3d4a5c" }}>Questions</h2>
            <p className="text-xs mt-0.5" style={{ color: "#8896aa" }}>{answeredCount} of {questions.length} answered</p>
          </div>
          <button onClick={() => setShowDrawer(false)} className={styles.iconBtn}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-5 gap-2">
            {questions.map((_, i) => {
              const record = answeredMap[i];
              const isCurrent = i === currentIndex;
              const isAnswered = !!record;
              const btnVariant = !isAnswered
                ? styles.drawerBtnPending
                : record.isCorrect
                ? styles.drawerBtnCorrect
                : styles.drawerBtnWrong;
              return (
                <button
                  key={i}
                  onClick={() => navigateToQuestion(i)}
                  disabled={!isAnswered}
                  className={`${styles.drawerBtnBase} ${btnVariant} touch-manipulation`}
                  style={isCurrent ? { outline: "2px solid #6366f1", outlineOffset: "2px" } : undefined}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 py-3 flex items-center gap-4" style={{ borderTop: "1px solid #c8d0dc" }}>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "#8896aa" }}>
            <span className="w-3 h-3 rounded inline-block" style={{ background: "#dcfce7" }} />
            Correct
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "#8896aa" }}>
            <span className="w-3 h-3 rounded inline-block" style={{ background: "#fee2e2" }} />
            Incorrect
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "#8896aa" }}>
            <span className="w-3 h-3 rounded inline-block" style={{ background: "#d4d9e4" }} />
            Pending
          </span>
        </div>
      </div>

      {/* Header */}
      <header className={`${styles.header} px-4 py-3`}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push("/")} className={styles.iconBtn}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium truncate" style={{ color: "#3d4a5c" }}>{testName}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs" style={{ color: "#8896aa" }}>{currentIndex + 1}/{questions.length}</span>
            <button onClick={() => setShowDrawer(true)} className={styles.iconBtn} title="Question navigation">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        <div className="max-w-2xl mx-auto mt-3">
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      {/* Sticky timer footer */}
      {initialTimeLimit > 0 && (
        <div className={`fixed bottom-0 left-0 right-0 z-30 ${styles.timerFooter}`}>
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <span className="text-xs font-medium tracking-wide uppercase" style={{ color: "#8896aa" }}>Time remaining</span>
            <Timer totalSeconds={initialTimeLimit} onExpire={handleTimerExpire} />
          </div>
        </div>
      )}

      {/* Content */}
      <main className={`max-w-2xl mx-auto px-4 py-8 ${initialTimeLimit > 0 ? "pb-24" : ""}`}>
        <div className={styles.questionCard}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium" style={{ color: "#6366f1" }}>Question {currentIndex + 1} of {questions.length}</p>
            {result && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={result.isCorrect
                  ? { background: "#dcfce7", color: "#15803d" }
                  : { background: "#fee2e2", color: "#b91c1c" }}
              >
                {result.isCorrect ? "Correct" : "Incorrect"}
              </span>
            )}
          </div>
          <div className="text-base leading-relaxed mb-6" style={{ color: "#3d4a5c" }}>
            <MathText text={question.text} />
          </div>

          <div className="space-y-3">
            {options.map((opt, i) => {
              let optVariant = styles.optionDefault;
              if (result) {
                optVariant = opt === selected ? styles.optionSelected : styles.optionDimmed;
              } else if (selected === opt) {
                optVariant = styles.optionSelected;
              }

              return (
                <button
                  key={i}
                  onClick={() => !result && setSelected(opt)}
                  disabled={!!result}
                  className={`${styles.optionBase} ${optVariant} touch-manipulation`}
                >
                  <MathText text={opt} />
                </button>
              );
            })}
          </div>
        </div>

        {result && (
          <div className={result.isCorrect ? styles.feedbackCorrect : styles.feedbackWrong}>
            <div className="flex items-center gap-2 mb-2">
              {result.isCorrect ? (
                <>
                  <svg className="w-5 h-5" style={{ color: "#15803d" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-semibold" style={{ color: "#15803d" }}>Correct!</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" style={{ color: "#b91c1c" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="font-semibold" style={{ color: "#b91c1c" }}>Incorrect</span>
                </>
              )}
            </div>
            <div className="text-sm space-y-1 mt-1" style={{ color: "#5a6a80" }}>
              <p>
                <span className="font-medium">Correct answer: </span>
                <MathText text={result.correctAnswer} />
              </p>
              {result.explanation && (
                <p style={{ color: "#8896aa" }}>
                  <span className="font-medium">Explanation: </span>
                  {result.explanation}
                </p>
              )}
            </div>
          </div>
        )}

        {!result ? (
          <button
            onClick={submitAnswer}
            disabled={!selected || submitting}
            className={styles.primaryBtn}
          >
            {submitting ? "Submitting…" : "Submit Answer"}
          </button>
        ) : (
          <button onClick={nextQuestion} className={styles.primaryBtn}>
            {currentIndex + 1 >= questions.length ? "Finish Test" : "Next Question →"}
          </button>
        )}
      </main>
    </div>
  );
}
