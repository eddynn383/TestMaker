import Link from "next/link";
import UploadForm from "@/components/UploadForm";

export default function UploadPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--tm-page)" }}>
      <header style={{ background: "var(--tm-surface)", borderBottom: "1px solid var(--tm-border)" }}>
        <div className="max-w-xl mx-auto px-4 py-5 flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 flex items-center justify-center rounded-full touch-manipulation"
            style={{ background: "var(--tm-surface)", boxShadow: "var(--tm-icon-shadow)", color: "var(--tm-text-2)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold" style={{ color: "var(--tm-text-1)" }}>New Test</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-10">
        <p className="text-sm mb-8" style={{ color: "var(--tm-text-2)" }}>
          Upload a PDF with your test or exam. We&apos;ll automatically extract all questions and answers.
        </p>
        <UploadForm />
      </main>
    </div>
  );
}
