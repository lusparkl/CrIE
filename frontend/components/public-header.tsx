"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "./auth-provider";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function PublicHeader() {
  const { user } = useAuth();
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="container-page flex h-16 items-center justify-between sm:h-20">
        <Logo />
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 text-xs font-medium text-slate-500 dark:text-white/40 lg:flex">
          <a href="#product" className="transition hover:text-ink dark:hover:text-white">Product</a>
          <a href="#method" className="transition hover:text-ink dark:hover:text-white">Method</a>
          <Link href="/practice" className="transition hover:text-ink dark:hover:text-white">Practice</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Link href="/dashboard" className="button-primary !py-2.5">Open dashboard <ArrowRight size={16} /></Link>
          ) : (
            <>
              <Link href="/login" className="hidden px-4 py-2 text-sm font-semibold text-ink sm:block">Log in</Link>
              <Link href="/register" className="button-primary !px-4 !py-2">Get started <ArrowRight size={14} /></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
