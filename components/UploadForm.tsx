"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";

const PROCESSING_STEPS = [
  "Reading your PDF…",
  "Identifying questions…",
  "Extracting answers…",
  "Building your test…",
];

export default function UploadForm() {
  const router = useRouter();
  const [testName, setTestName] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!processing) { setProcessingStep(0); return; }
    const interval = setInterval(() => {
      setProcessingStep((prev) => (prev + 1) % PROCESSING_STEPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [processing]);

  async function handleCreate() {
    if (!uploadedUrl || !testName.trim()) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfUrl: uploadedUrl, testName: testName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to extract");
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setProcessing(false);
    }
  }

  const canCreate = !!uploadedUrl && !!testName.trim() && !processing;

  return (
    <div className="space-y-4">
      {/* Step 1 — Name */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
          <span className="text-sm font-medium text-gray-800">Name your test</span>
        </div>
        <input
          type="text"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          placeholder="e.g. Math Final Exam 2024"
          disabled={processing}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>

      {/* Step 2 — Upload */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${uploadedUrl ? "bg-green-500 text-white" : "bg-indigo-600 text-white"}`}>
            {uploadedUrl ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : "2"}
          </span>
          <span className="text-sm font-medium text-gray-800">Upload your PDF</span>
        </div>

        {!uploadedUrl ? (
          <UploadDropzone
            endpoint="pdfUploader"
            onClientUploadComplete={(res) => {
              setUploadedUrl(res[0].ufsUrl);
              setUploadedName(res[0].name);
            }}
            onUploadError={(err) => setError(err.message)}
            appearance={{
              container: "border-2 border-dashed border-gray-200 rounded-xl min-h-[140px] flex flex-col items-center justify-center gap-2 p-6 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors cursor-pointer",
              uploadIcon: "text-indigo-400",
              label: "text-sm text-gray-600 font-medium",
              allowedContent: "text-xs text-gray-400",
              button: "bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors mt-1",
            }}
          />
        ) : (
          <div className="flex items-center gap-3 p-3.5 bg-green-50 border border-green-200 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm text-green-800 font-medium truncate flex-1">{uploadedName}</span>
            <button
              onClick={() => { setUploadedUrl(null); setUploadedName(""); }}
              disabled={processing}
              className="shrink-0 text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Processing indicator */}
      {processing && (
        <div className="flex items-center gap-4 bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-indigo-900">{PROCESSING_STEPS[processingStep]}</p>
            <p className="text-xs text-indigo-500 mt-0.5">Claude AI is analyzing your PDF</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-700">Something went wrong</p>
            <p className="text-xs text-red-500 mt-0.5 break-words">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-red-400 hover:text-red-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Create button */}
      <button
        onClick={handleCreate}
        disabled={!canCreate}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Creating…
          </span>
        ) : "Create Test"}
      </button>
    </div>
  );
}
