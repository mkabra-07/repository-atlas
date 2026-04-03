import type { Metadata } from "next";

import { ThemeScript } from "@/components/theme-script";
import { ThemeToggle } from "@/components/theme-toggle";

import "./globals.css";

export const metadata: Metadata = {
  title: "Repository Atlas",
  description: "Analyze public GitHub repositories with a visual structure map and dependency graph.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeScript />
        <div className="app-shell">
          <header className="topbar">
            <div className="topbar-inner">
              <a className="brand-mark" href="/">
                Repository Atlas
              </a>
              <ThemeToggle />
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
