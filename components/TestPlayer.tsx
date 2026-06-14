"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Timer from "./Timer";
import styles from "./TestPlayer.module.css";

const MathText = dynamic(() => import("./MathText"), { ssr: false });

interface Question {
  id: string;
  text: string;
  options: string;
  correctAnswer: string; // JSON array
  questionType: string;  // "single" | "multiple"
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
  correctAnswer: string;   // JSON array string
  explanation: string | null;
  selectedAnswer: string;  // JSON array string
};

function parseAnswerArray(raw: string): string[] {
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.map(String) : [String(p)];
  } catch {
    return [raw];
  }
}

export default function TestPlayer({ testId, testName, questions, initialTimeLimit, attemptId }: TestPlayerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  // For single-answer questions
  const [selected, setSelected] = useState<string | null>(null);
  // For multiple-answer questions
  const [selectedSet, setSelectedSet] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<AnswerRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState<{ score: number; correct: number; total: number; status: string } | null>(null);
  const [answeredMap, setAnsweredMap] = useState<Record<number, AnswerRecord>>({});
  const [showDrawer, setShowDrawer] = useState(false);

  const question = questions[currentIndex];
  const options: string[] = JSON.parse(question.options);
  const isMultiple = question.questionType === "multiple";
  const answeredCount = Object.keys(answeredMap).length;
  const progress = (answeredCount / questions.length) * 100;
  const canSubmit = !result && !submitting && (isMultiple ? selectedSet.size > 0 : selected !== null);

  const correctAnswersForResult = useMemo(() => {
    if (!result) return [];
    return parseAnswerArray(result.correctAnswer);
  }, [result]);

  async function submitAnswer() {
    if (!canSubmit) return;
    setSubmitting(true);

    const answerPayload = isMultiple
      ? JSON.stringify([...selectedSet])
      : JSON.stringify([selected!]);

    const res = await fetch(`/api/tests/${testId}/attempt`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "answer", attemptId, questionId: question.id, selectedAnswer: answerPayload }),
    });
    const data = await res.json();
    const record: AnswerRecord = {
      isCorrect: data.isCorrect,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation,
      selectedAnswer: answerPayload,
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

  function loadQuestion(index: number, record?: AnswerRecord) {
    const q = questions[index];
    const qIsMultiple = q.questionType === "multiple";
    setCurrentIndex(index);
    setResult(record ?? null);
    if (record) {
      const sel = parseAnswerArray(record.selectedAnswer);
      if (qIsMultiple) {
        setSelectedSet(new Set(sel));
        setSelected(null);
      } else {
        setSelected(sel[0] ?? null);
        setSelectedSet(new Set());
      }
    } else {
      setSelected(null);
      setSelectedSet(new Set());
    }
  }

  async function nextQuestion() {
    if (currentIndex + 1 >= questions.length) {
      await completeTest();
    } else {
      const nextIdx = currentIndex + 1;
      loadQuestion(nextIdx, answeredMap[nextIdx]);
    }
  }

  function navigateToQuestion(index: number) {
    const record = answeredMap[index];
    if (!record) return;
    loadQuestion(index, record);
    setShowDrawer(false);
  }

  const handleTimerExpire = useCallback(async () => {
    await completeTest();
  }, [completeTest]);

  function toggleOption(opt: string) {
    if (result) return;
    if (isMultiple) {
      setSelectedSet((prev) => {
        const next = new Set(prev);
        if (next.has(opt)) next.delete(opt);
        else next.add(opt);
        return next;
      });
    } else {
      setSelected(opt);
    }
  }

  if (completed && finalScore) {
    const passed = finalScore.status === "passed";
    return (
      <div className={`${styles.page} flex items-center justify-center p-4`}>
        <div className={styles.scoreCard}>
          <div className={passed ? styles.scoreIconPassed : styles.scoreIconFailed}>
            {passed ? (
              <svg className="w-10 h-10" style={{ color: "var(--tm-correct-text)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-10 h-10" style={{ color: "var(--tm-wrong-text)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--tm-text-1)" }}>
            {passed ? "Test Passed!" : "Test Failed"}
          </h2>
          <p className="mb-6 text-sm" style={{ color: "var(--tm-text-2)" }}>
            You answered {finalScore.correct} out of {finalScore.total} questions correctly.
          </p>
          <div className="text-5xl font-bold mb-8" style={{ color: passed ? "var(--tm-correct-text)" : "var(--tm-wrong-text)" }}>
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
        style={{ background: "var(--tm-page)", boxShadow: "var(--tm-shadow-drawer)" }}
      >
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: "1px solid var(--tm-border)" }}>
          <div>
            <h2 className="font-semibold text-sm" style={{ color: "var(--tm-text-1)" }}>Questions</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--tm-text-2)" }}>{answeredCount} of {questions.length} answered</p>
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
                  style={isCurrent ? { outline: "2px solid var(--tm-accent)", outlineOffset: "2px" } : undefined}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 py-3 flex items-center gap-4" style={{ borderTop: "1px solid var(--tm-border)" }}>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--tm-text-2)" }}>
            <span className="w-3 h-3 rounded inline-block" style={{ background: "var(--tm-drawer-correct-bg)" }} />
            Correct
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--tm-text-2)" }}>
            <span className="w-3 h-3 rounded inline-block" style={{ background: "var(--tm-drawer-wrong-bg)" }} />
            Incorrect
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--tm-text-2)" }}>
            <span className="w-3 h-3 rounded inline-block" style={{ background: "var(--tm-drawer-pending-bg)" }} />
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
            <span className="text-sm font-medium truncate" style={{ color: "var(--tm-text-1)" }}>{testName}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs" style={{ color: "var(--tm-text-2)" }}>{currentIndex + 1}/{questions.length}</span>
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
            <span className="text-xs font-medium tracking-wide uppercase" style={{ color: "var(--tm-text-2)" }}>Time remaining</span>
            <Timer totalSeconds={initialTimeLimit} onExpire={handleTimerExpire} />
          </div>
        </div>
      )}

      {/* Content */}
      <main className={`max-w-2xl mx-auto px-4 py-8 ${initialTimeLimit > 0 ? "pb-24" : ""}`}>
        <div className={styles.questionCard}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium" style={{ color: "var(--tm-accent)" }}>Question {currentIndex + 1} of {questions.length}</p>
              {isMultiple && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--tm-option-sel-bg)", color: "var(--tm-option-sel-text)" }}>
                  Multiple answers
                </span>
              )}
            </div>
            {result && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={result.isCorrect
                  ? { background: "var(--tm-correct-bg)", color: "var(--tm-correct-text)" }
                  : { background: "var(--tm-wrong-bg)", color: "var(--tm-wrong-text)" }}
              >
                {result.isCorrect ? "Correct" : "Incorrect"}
              </span>
            )}
          </div>
          <div className="text-base leading-relaxed mb-6" style={{ color: "var(--tm-text-1)" }}>
            <MathText text={question.text} />
          </div>

          <div className="space-y-3">
            {options.map((opt, i) => {
              const isOptSelected = isMultiple ? selectedSet.has(opt) : selected === opt;
              let optVariant = styles.optionDefault;
              if (result) {
                optVariant = isOptSelected ? styles.optionSelected : styles.optionDimmed;
              } else if (isOptSelected) {
                optVariant = styles.optionSelected;
              }

              return (
                <button
                  key={i}
                  onClick={() => toggleOption(opt)}
                  disabled={!!result}
                  className={`${styles.optionBase} ${optVariant} touch-manipulation`}
                >
                  <span className="flex items-center gap-3">
                    {isMultiple && (
                      <span
                        className="w-4 h-4 shrink-0 rounded flex items-center justify-center border"
                        style={isOptSelected
                          ? { background: "var(--tm-accent)", borderColor: "var(--tm-accent)" }
                          : { borderColor: "var(--tm-text-2)", background: "transparent" }}
                      >
                        {isOptSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                    )}
                    <MathText text={opt} />
                  </span>
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
                  <svg className="w-5 h-5" style={{ color: "var(--tm-correct-text)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-semibold" style={{ color: "var(--tm-correct-text)" }}>Correct!</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" style={{ color: "var(--tm-wrong-text)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="font-semibold" style={{ color: "var(--tm-wrong-text)" }}>Incorrect</span>
                </>
              )}
            </div>
            <div className="text-sm space-y-1 mt-1" style={{ color: "var(--tm-text-3)" }}>
              {correctAnswersForResult.length === 1 ? (
                <p>
                  <span className="font-medium">Correct answer: </span>
                  <MathText text={correctAnswersForResult[0]} />
                </p>
              ) : (
                <div>
                  <p className="font-medium mb-1">Correct answers:</p>
                  <ul className="space-y-1 pl-2">
                    {correctAnswersForResult.map((ans, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--tm-correct-text)" }} />
                        <MathText text={ans} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.explanation && (
                <p style={{ color: "var(--tm-text-2)" }}>
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
            disabled={!canSubmit}
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
