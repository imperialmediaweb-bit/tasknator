import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tasknator — AI That Fixes Business Bottlenecks",
  description: "Diagnose why your business is underperforming and get an actionable AI-powered recovery plan with ready-to-use assets.",
  keywords: ["business diagnostics", "AI business repair", "business audit", "recovery plan", "SaaS"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
