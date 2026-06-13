"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/lib/uploadthing";

export default function UploadForm() {
  const router = useRouter();
  const [testName, setTestName] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Test name</label>
        <input
          type="text"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          placeholder="e.g. Math Final Exam 2024"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
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
            container: "border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:border-indigo-400 transition-colors cursor-pointer",
            uploadIcon: "text-indigo-400",
            label: "text-gray-600 text-sm",
            allowedContent: "text-gray-400 text-xs",
            button: "bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium mt-2",
          }}
        />
      ) : (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
          <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-green-800 font-medium truncate">{uploadedName}</span>
          <button onClick={() => { setUploadedUrl(null); setUploadedName(""); }} className="ml-auto text-xs text-gray-500 hover:text-red-500">
            Remove
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={!uploadedUrl || !testName.trim() || processing}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Extracting questions…
          </span>
        ) : (
          "Create Test"
        )}
      </button>
    </div>
  );
}
