"use client";

import Link from "next/link";
import { useSettings } from "@/contexts/SettingsContext";

export default function SettingsPage() {
  const { style, theme, setStyle, setTheme } = useSettings();

  return (
    <div className="min-h-screen" style={{ background: "var(--tm-page)" }}>
      {/* Header */}
      <header className="px-4 py-3 sticky top-0 z-10" style={{ background: "var(--tm-page)", boxShadow: "var(--tm-shadow-header)" }}>
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link
            href="/"
            className="w-8 h-8 flex items-center justify-center rounded-full touch-manipulation"
            style={{ background: "var(--tm-surface)", boxShadow: "var(--tm-icon-shadow)", color: "var(--tm-text-2)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-base font-semibold" style={{ color: "var(--tm-text-1)" }}>Settings</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-8">
        {/* Style Section */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--tm-text-2)" }}>Style</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Neumorphism card */}
            <button
              onClick={() => setStyle("neumorphism")}
              className="p-4 rounded-2xl text-left transition-all touch-manipulation"
              style={style === "neumorphism"
                ? { background: "var(--tm-surface)", boxShadow: "var(--tm-shadow-inset)", outline: "2px solid #6366f1", outlineOffset: "2px" }
                : { background: "var(--tm-surface)", boxShadow: "var(--tm-shadow-card)" }}
            >
              {/* Preview: 3 raised circles */}
              <div className="flex gap-2 mb-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full"
                    style={{ background: "var(--tm-page)", boxShadow: "3px 3px 6px #b8c0cc, -3px -3px 6px #ffffff" }}
                  />
                ))}
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--tm-text-1)" }}>Neumorphism</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--tm-text-2)" }}>Soft 3D surfaces</p>
            </button>

            {/* Minimalist card */}
            <button
              onClick={() => setStyle("minimalist")}
              className="p-4 rounded-2xl text-left transition-all touch-manipulation"
              style={style === "minimalist"
                ? { background: "var(--tm-surface)", boxShadow: "var(--tm-shadow-inset)", outline: "2px solid #6366f1", outlineOffset: "2px" }
                : { background: "var(--tm-surface)", boxShadow: "var(--tm-shadow-card)" }}
            >
              {/* Preview: 3 flat bordered boxes */}
              <div className="flex gap-2 mb-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded"
                    style={{ background: "var(--tm-page)", border: "1px solid var(--tm-border)" }}
                  />
                ))}
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--tm-text-1)" }}>Minimalist</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--tm-text-2)" }}>Clean &amp; flat</p>
            </button>
          </div>
        </section>

        {/* Theme Section */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--tm-text-2)" }}>Theme</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setTheme("light")}
              className="p-4 rounded-2xl text-left transition-all touch-manipulation"
              style={theme === "light"
                ? { background: "var(--tm-surface)", boxShadow: "var(--tm-shadow-inset)", outline: "2px solid #6366f1", outlineOffset: "2px" }
                : { background: "var(--tm-surface)", boxShadow: "var(--tm-shadow-card)" }}
            >
              <div
                className="w-8 h-8 rounded-full mb-3 flex items-center justify-center"
                style={{ background: "#fef9c3", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
              >
                <svg className="w-4 h-4" style={{ color: "#ca8a04" }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.166 17.834a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 001.061-1.06l-1.59-1.591zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.166 6.166a.75.75 0 011.06 0l1.591 1.59a.75.75 0 11-1.06 1.061L6.166 7.227a.75.75 0 010-1.06z" />
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--tm-text-1)" }}>Light</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--tm-text-2)" }}>Bright interface</p>
            </button>

            <button
              onClick={() => setTheme("dark")}
              className="p-4 rounded-2xl text-left transition-all touch-manipulation"
              style={theme === "dark"
                ? { background: "var(--tm-surface)", boxShadow: "var(--tm-shadow-inset)", outline: "2px solid #6366f1", outlineOffset: "2px" }
                : { background: "var(--tm-surface)", boxShadow: "var(--tm-shadow-card)" }}
            >
              <div
                className="w-8 h-8 rounded-full mb-3 flex items-center justify-center"
                style={{ background: "#1e293b", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
              >
                <svg className="w-4 h-4" style={{ color: "#94a3b8" }} fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-semibold" style={{ color: "var(--tm-text-1)" }}>Dark</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--tm-text-2)" }}>Easy on the eyes</p>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
