import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";

export const metadata: Metadata = {
  title: "Secret Santa 2026",
  description: "Pick a shape. Find out who you're buying for. Act surprised.",
};

export const viewport: Viewport = { themeColor: "#0e2a20" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-svh font-sans">{children}</body>
    </html>
  );
}
