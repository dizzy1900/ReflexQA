import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { ReactNode } from "react";
import "./globals.css";


export const metadata: Metadata = {
  title: "ReflexQA · Recursive self-improving QA",
  description: "A self-healing QA agent that sees the page, trips on regressions, and repairs the test with whole-repo context.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-background font-sans text-fg antialiased">{children}</body>
    </html>
  );
}
