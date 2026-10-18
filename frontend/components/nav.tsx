"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "./auth-provider";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/practice", label: "Practice" },
  { href: "/history", label: "History" },
];

export function Nav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (!user) return null;
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={`rounded-md px-4 py-2 text-sm font-medium transition ${pathname.startsWith(link.href) ? "bg-slate-100 text-ink" : "text-slate-600 hover:text-ink"}`}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <div className="text-right">
            <p className="text-sm font-semibold leading-tight text-ink">{user.name}</p>
            {user.is_demo && <p className="text-[11px] font-semibold uppercase tracking-wider text-coral">Demo profile</p>}
          </div>
          <button onClick={logout} aria-label="Log out" className="rounded-md border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-ink"><LogOut size={17} /></button>
        </div>
        <button onClick={() => setOpen(!open)} className="rounded-md p-2 md:hidden" aria-label="Toggle navigation">{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className="container-page space-y-1 border-t border-slate-100 py-3 md:hidden">
          {links.map((link) => <Link onClick={() => setOpen(false)} key={link.href} href={link.href} className="block rounded-md px-3 py-2 text-sm font-medium">{link.label}</Link>)}
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-coral"><LogOut size={16} /> Log out</button>
        </div>
      )}
    </header>
  );
}
