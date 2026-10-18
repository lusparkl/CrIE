"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

type AuthResponse = { access_token: string; token_type: string; user: User };

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { setSession } = useAuth();
  const router = useRouter();

  async function submit(event: { preventDefault: () => void }, demo = false) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = demo
        ? { email: "demo@crie.app", password: "Demo123!" }
        : mode === "login" ? { email, password } : { name, email, password };
      const result = await api<AuthResponse>(`/auth/${mode === "login" || demo ? "login" : "register"}`, { method: "POST", body: JSON.stringify(body) });
      setSession(result.access_token, result.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not connect to the server.");
    } finally { setBusy(false); }
  }

  const isLogin = mode === "login";
  return (
    <main className="grid min-h-screen lg:grid-cols-[.92fr_1.08fr]">
      <section className="flex flex-col bg-white px-6 py-8 sm:px-12 lg:px-20">
        <div className="flex items-center justify-between"><Logo /><ThemeToggle /></div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <p className="eyebrow">{isLogin ? "Welcome back" : "Start your writing record"}</p>
          <h1 className="mt-3 font-display text-4xl tracking-tight">{isLogin ? "Continue your progress." : "Practice with purpose."}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">{isLogin ? "Log in to review your patterns and begin another timed response." : "Create an account to save essays, feedback and recurring mistake trends."}</p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            {!isLogin && <div><label className="label" htmlFor="name">Name</label><input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" placeholder="Your name" /></div>}
            <div><label className="label" htmlFor="email">Email address</label><input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" /></div>
            <div><label className="label" htmlFor="password">Password</label><input id="password" className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={isLogin ? 1 : 8} autoComplete={isLogin ? "current-password" : "new-password"} placeholder={isLogin ? "Your password" : "At least 8 characters"} /></div>
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button disabled={busy} className="button-primary w-full" type="submit">{busy ? <Loader2 className="animate-spin" size={17} /> : <>{isLogin ? "Log in" : "Create account"}<ArrowRight size={16} /></>}</button>
          </form>
          {isLogin && <><div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-slate-400"><span className="h-px flex-1 bg-slate-200" />or<span className="h-px flex-1 bg-slate-200" /></div><button disabled={busy} onClick={(e) => submit(e, true)} className="button-secondary w-full">Explore with demo account</button></>}
          <p className="mt-7 text-center text-sm text-slate-500">{isLogin ? "New to CrIE?" : "Already have an account?"} <Link className="font-semibold text-ink underline decoration-slate-300 underline-offset-4" href={isLogin ? "/register" : "/login"}>{isLogin ? "Create an account" : "Log in"}</Link></p>
        </div>
      </section>
      <aside className="relative hidden overflow-hidden bg-navy p-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" /><div className="absolute -right-10 -top-10 h-80 w-80 rounded-full border border-white/10" />
        <p className="relative text-xs font-bold uppercase tracking-[.18em] text-coral">Write · Review · Repeat</p>
        <div className="relative max-w-lg"><blockquote className="font-display text-4xl leading-tight">“The useful question isn’t only ‘What band is this?’ It’s ‘What keeps holding my writing back?’”</blockquote><p className="mt-8 border-l-2 border-coral pl-4 text-sm leading-6 text-white/65">CrIE connects feedback across sessions so repeated weaknesses become visible—and measurable.</p></div>
        <p className="relative text-xs leading-5 text-white/45">Independent IELTS-style practice. Scores are estimates, not official results.</p>
      </aside>
    </main>
  );
}
