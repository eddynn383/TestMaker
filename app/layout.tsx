import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "./api/upload/core";
import { SettingsProvider } from "@/contexts/SettingsContext";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TestMaker",
  description: "Upload a PDF and turn it into an interactive test",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=localStorage.getItem('tm-style')||'neumorphism';var t=localStorage.getItem('tm-theme')||'light';document.documentElement.setAttribute('data-style',s);document.documentElement.setAttribute('data-theme',t);})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        <SettingsProvider>
          <div className="flex flex-col min-h-full">
            <div className="flex-1">{children}</div>
            <footer className="text-center py-2 opacity-30 text-xs select-none pointer-events-none">
              {process.env.VERCEL_GIT_COMMIT_SHA
                ? process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)
                : "dev"}
            </footer>
          </div>
        </SettingsProvider>
      </body>
    </html>
  );
}
