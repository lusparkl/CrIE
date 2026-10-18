import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "CrIE — Cracking IELTS Essays",
  description: "Practice IELTS-style writing, understand recurring mistakes, and improve over time.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider><AuthProvider><AppShell>{children}</AppShell></AuthProvider></ThemeProvider>
      </body>
    </html>
  );
}
