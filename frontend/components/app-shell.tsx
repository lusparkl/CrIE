"use client";

import { usePathname } from "next/navigation";
import { Nav } from "./nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const exam = pathname.startsWith("/practice/");
  const publicPage = pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/register");
  return (
    <>
      {!exam && !publicPage && <Nav />}
      {children}
    </>
  );
}

