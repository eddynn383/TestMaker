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

type AnswerResult = { isCorrect: boolean; correctAnswer: string; explanation: string | null } | null;

export default function TestPlayer({ testId, testName, questions, initialTimeLimit, attemptId }: TestPlayerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<AnswerResult>(null);
  const [showCorrect, setShowCorrect] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState<{ score: number; correct: number; total: number; status: string } | null>(null);

  const question = questions[currentIndex];
  const options: string[] = JSON.parse(question.options);
  const progress = ((currentIndex + (result ? 1 : 0)) / questions.length) * 100;

  async function submitAnswer() {
    if (!selected || submitting) return;
    setSubmitting(true);
    const res = await fetch(`/api/tests/${testId}/attempt`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "answer", attemptId, questionId: question.id, selectedAnswer: selected }),
    });
    const data = await res.json();
    setResult({ isCorrect: data.isCorrect, correctAnswer: data.correctAnswer, explanation: data.explanation });
    setSubmitting(false);
  }

  async function completeTest() {
    const res = await fetch(`/api/tests/${testId}/attempt`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", attemptId }),
    });
    const data = await res.json();
    setFinalScore({ score: data.score, correct: data.correct, total: data.total, status: data.status });
    setCompleted(true);
  }

  async function nextQuestion() {
    if (currentIndex + 1 >= questions.length) {
      await completeTest();
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setResult(null);
      setShowCorrect(false);
    }
  }

  const handleTimerExpire = useCallback(async () => {
    await completeTest();
  }, [attemptId]);

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
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600 shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-gray-700 truncate">{testName}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-gray-400">{currentIndex + 1}/{questions.length}</span>
            {initialTimeLimit > 0 && <Timer totalSeconds={initialTimeLimit} onExpire={handleTimerExpire} />}
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-2">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <p className="text-xs font-medium text-indigo-600 mb-3">Question {currentIndex + 1}</p>
          <div className="text-gray-900 text-base leading-relaxed mb-6">
            <MathText text={question.text} />
          </div>

          <div className="space-y-3">
            {options.map((opt, i) => {
              let optClass = "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer";
              if (result) {
                if (opt === result.correctAnswer) {
                  optClass = "border-green-400 bg-green-50";
                } else if (opt === selected && !result.isCorrect) {
                  optClass = "border-red-400 bg-red-50";
                } else {
                  optClass = "border-gray-100 opacity-60 cursor-default";
                }
              } else if (selected === opt) {
                optClass = "border-indigo-500 bg-indigo-50";
              }

              return (
                <button
                  key={i}
                  onClick={() => !result && setSelected(opt)}
                  disabled={!!result}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm ${optClass}`}
                >
                  <MathText text={opt} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback */}
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
                className="text-xs font-medium text-gray-500 hover:text-gray-800 underline"
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

        {/* Actions */}
        {!result ? (
          <button
            onClick={submitAnswer}
            disabled={!selected || submitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {submitting ? "Submitting…" : "Submit Answer"}
          </button>
        ) : (
          <button
            onClick={nextQuestion}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            {currentIndex + 1 >= questions.length ? "Finish Test" : "Next Question"}
          </button>
        )}
      </main>
    </div>
  );
}
