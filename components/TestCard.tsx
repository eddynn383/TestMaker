"use client";

import { useRouter } from "next/navigation";

interface TestCardProps {
  id: string;
  name: string;
  questionCount: number;
  estimatedDuration: number;
  status: string;
  score: number | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  not_started: { label: "Not Started", className: "bg-gray-100 text-gray-600" },
  started: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  passed: { label: "Passed", className: "bg-green-100 text-green-700" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700" },
};

export default function TestCard({ id, name, questionCount, estimatedDuration, status, score }: TestCardProps) {
  const router = useRouter();
  const cfg = statusConfig[status] ?? statusConfig.not_started;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-gray-900 truncate">{name}</h2>
        <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
          <span>{questionCount} questions</span>
          <span>~{estimatedDuration} min</span>
          {score !== null && <span className="font-medium text-gray-700">{score.toFixed(0)}%</span>}
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4 shrink-0">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${cfg.className}`}>{cfg.label}</span>
        <button
          onClick={() => router.push(`/test/${id}`)}
          className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors shadow-sm"
          title="Start test"
        >
          <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
