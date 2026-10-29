import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Research Playground",
  description: "A simple playground for exploring Parallel's APIs.",
};

// The root layout wraps every page and loads the shared CSS.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
