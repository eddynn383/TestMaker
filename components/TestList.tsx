"use client";

import { useState } from "react";
import Link from "next/link";
import TestCard from "./TestCard";

type Test = {
  id: string;
  name: string;
  questionCount: number;
  estimatedDuration: number;
  status: string;
  score: number | null;
};

export default function TestList({ initialTests }: { initialTests: Test[] }) {
  const [tests, setTests] = useState(initialTests);

  function removeTest(id: string) {
    setTests((prev) => prev.filter((t) => t.id !== id));
  }

  if (tests.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">No tests yet</h2>
        <p className="text-sm text-gray-400 mb-6">Upload a PDF to create your first test.</p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Upload PDF
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tests.map((test) => (
        <TestCard key={test.id} {...test} onDelete={() => removeTest(test.id)} />
      ))}
    </div>
  );
}
