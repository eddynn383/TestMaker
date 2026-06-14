import SkeletonCard from "@/components/SkeletonCard";
import Link from "next/link";

export default function HomeLoading() {
  return (
    <div className="min-h-screen" style={{ background: "#e0e5ee" }}>
      <header className="border-b" style={{ background: "#e0e5ee", borderColor: "#c8d0dc" }}>
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "#3d4a5c" }}>TestMaker</h1>
            <p className="text-xs mt-0.5" style={{ color: "#8896aa" }}>Your personal test library</p>
          </div>
          <Link
            href="/upload"
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-xl"
            style={{ background: "linear-gradient(145deg, #6e7ff0, #5458e8)", boxShadow: "5px 5px 12px rgba(84,88,232,0.4), -3px -3px 8px rgba(255,255,255,0.3)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Test
          </Link>
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
