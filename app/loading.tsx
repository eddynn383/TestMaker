import SkeletonCard from "@/components/SkeletonCard";
import Link from "next/link";

export default function HomeLoading() {
  return (
    <div className="min-h-screen" style={{ background: "var(--tm-page)" }}>
      <header className="border-b" style={{ background: "var(--tm-page)", borderColor: "var(--tm-border)" }}>
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--tm-text-1)" }}>TestMaker</h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--tm-text-2)" }}>Your personal test library</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/settings"
              className="w-9 h-9 flex items-center justify-center rounded-full touch-manipulation"
              style={{ background: "var(--tm-surface)", boxShadow: "var(--tm-icon-shadow)", color: "var(--tm-text-2)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <Link
              href="/upload"
              className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-xl"
              style={{ background: "linear-gradient(145deg, #6e7ff0, #5458e8)", boxShadow: "var(--tm-btn-shadow)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Test
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
