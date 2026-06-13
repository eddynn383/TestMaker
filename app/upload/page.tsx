import Link from "next/link";
import UploadForm from "@/components/UploadForm";

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-xl mx-auto px-4 py-5 flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">New Test</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-10">
        <p className="text-sm text-gray-500 mb-8">
          Upload a PDF with your test or exam. We'll automatically extract all questions and answers.
        </p>
        <UploadForm />
      </main>
    </div>
  );
}
