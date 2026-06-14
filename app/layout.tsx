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
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
