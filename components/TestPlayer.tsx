"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Timer from "./Timer";

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
  const [showCorrect, setShowCorrect] = useState(false);
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
      setShowCorrect(false);
    }
  }

  function navigateToQuestion(index: number) {
    const record = answeredMap[index];
    if (!record) return;
    setCurrentIndex(index);
    setSelected(record.selectedAnswer);
    setResult(record);
    setShowCorrect(false);
    setShowDrawer(false);
  }

  const handleTimerExpire = useCallback(async () => {
    await completeTest();
  }, [completeTest]);

  if (completed && finalScore) {
    const passed = finalScore.status === "passed";
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 max-w-md w-full text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${passed ? "bg-green-100" : "bg-red-100"}`}>
            {passed ? (
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{passed ? "Test Passed!" : "Test Failed"}</h2>
          <p className="text-gray-500 mb-6">
            You answered {finalScore.correct} out of {finalScore.total} questions correctly.
          </p>
          <div className={`text-5xl font-bold mb-8 ${passed ? "text-green-600" : "text-red-600"}`}>
            {finalScore.score.toFixed(0)}%
          </div>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all active:scale-[0.97] touch-manipulation"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Drawer backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${showDrawer ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setShowDrawer(false)}
      />

      {/* Drawer */}
      <div className={`fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out ${showDrawer ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Questions</h2>
            <p className="text-xs text-gray-400 mt-0.5">{answeredCount} of {questions.length} answered</p>
          </div>
          <button
            onClick={() => setShowDrawer(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all active:scale-90 touch-manipulation"
          >
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
              return (
                <button
                  key={i}
                  onClick={() => navigateToQuestion(i)}
                  disabled={!isAnswered}
                  className={[
                    "w-full aspect-square rounded-lg text-xs font-semibold transition-all flex items-center justify-center touch-manipulation",
                    isCurrent ? "ring-2 ring-indigo-500 ring-offset-1" : "",
                    !isAnswered
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                      : record.isCorrect
                      ? "bg-green-100 text-green-700 hover:bg-green-200 active:scale-90 cursor-pointer"
                      : "bg-red-100 text-red-700 hover:bg-red-200 active:scale-90 cursor-pointer",
                  ].join(" ")}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded bg-green-100 border border-green-200 inline-block" />
            Correct
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" />
            Incorrect
          </span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200 inline-block" />
            Pending
          </span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600 shrink-0 active:scale-90 transition-transform touch-manipulation">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-700 truncate">{testName}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-400">{currentIndex + 1}/{questions.length}</span>
            <button
              onClick={() => setShowDrawer(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all active:scale-90 touch-manipulation"
              title="Question navigation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        <div className="max-w-2xl mx-auto mt-2">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      {/* Sticky timer footer */}
      {initialTimeLimit > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-gray-400 tracking-wide uppercase">Time remaining</span>
            <Timer totalSeconds={initialTimeLimit} onExpire={handleTimerExpire} />
          </div>
        </div>
      )}

      {/* Content */}
      <main className={`max-w-2xl mx-auto px-4 py-8 ${initialTimeLimit > 0 ? "pb-24" : ""}`}>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-indigo-600">Question {currentIndex + 1} of {questions.length}</p>
            {result && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${result.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {result.isCorrect ? "Correct" : "Incorrect"}
              </span>
            )}
          </div>
          <div className="text-gray-900 text-base leading-relaxed mb-6">
            <MathText text={question.text} />
          </div>

          <div className="space-y-3">
            {options.map((opt, i) => {
              let optClass = "border-gray-200 text-gray-800 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer";
              if (result) {
                if (opt === result.correctAnswer) {
                  optClass = "border-green-400 bg-green-50 text-green-900";
                } else if (opt === selected && !result.isCorrect) {
                  optClass = "border-red-400 bg-red-50 text-red-900";
                } else {
                  optClass = "border-gray-100 bg-gray-50 text-gray-400 opacity-60 cursor-default";
                }
              } else if (selected === opt) {
                optClass = "border-indigo-500 bg-indigo-50 text-indigo-900";
              }

              return (
                <button
                  key={i}
                  onClick={() => !result && setSelected(opt)}
                  disabled={!!result}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm touch-manipulation ${!result ? "active:scale-[0.97]" : ""} ${optClass}`}
                >
                  <MathText text={opt} />
                </button>
              );
            })}
          </div>
        </div>

        {result && (
          <div className={`rounded-2xl p-4 mb-4 ${result.isCorrect ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.isCorrect ? (
                <>
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-semibold text-green-800">Correct!</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="font-semibold text-red-800">Incorrect</span>
                </>
              )}
            </div>
            {!showCorrect ? (
              <button
                onClick={() => setShowCorrect(true)}
                className="text-xs font-medium text-gray-500 hover:text-gray-800 underline active:scale-95 transition-transform touch-manipulation"
              >
                See correct answer
              </button>
            ) : (
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <span className="font-medium">Correct answer: </span>
                  <MathText text={result.correctAnswer} />
                </p>
                {result.explanation && (
                  <p className="text-gray-500">
                    <span className="font-medium">Explanation: </span>
                    {result.explanation}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {!result ? (
          <button
            onClick={submitAnswer}
            disabled={!selected || submitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all active:scale-[0.97] disabled:active:scale-100 text-sm touch-manipulation"
          >
            {submitting ? "Submitting…" : "Submit Answer"}
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all active:scale-[0.97] text-sm touch-manipulation"
          >
            {currentIndex + 1 >= questions.length ? "Finish Test" : "Next Question →"}
          </button>
        )}
      </main>
    </div>
  );
}
