"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, ChevronRight, Clock3, FileText, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppFooter } from "@/components/app-footer";
import { useAuth } from "@/components/auth-provider";
import { PageLoading } from "@/components/page-loading";
import { api } from "@/lib/api";
import { formatDuration, shortDate } from "@/lib/format";
import type { EssayListItem } from "@/lib/types";

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [essays, setEssays] = useState<EssayListItem[] | null>(null);
  const [filter, setFilter] = useState<"all" | "task1" | "task2">("all");
  const [error, setError] = useState("");

  useEffect(() => { if (user) api<EssayListItem[]>("/essays").then(setEssays).catch((err) => setError(err.message)); }, [user]);
  const visible = useMemo(() => (essays || []).filter((essay) => filter === "all" || essay.task_type === filter), [essays, filter]);

  if (authLoading || (user && !essays && !error)) return <PageLoading label="Opening your writing history…" />;
  if (!user) return null;
  return (
    <>
      <main className="container-page py-10 sm:py-14">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="eyebrow">Writing record</p><h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">Essay history</h1><p className="mt-3 text-sm text-slate-500">Revisit every response, estimate and inline explanation.</p></div><Link href="/practice" className="button-primary self-start">Write another essay <ArrowRight size={16} /></Link></div>
        <div className="mt-9 flex gap-2">{(["all", "task1", "task2"] as const).map((item) => <button key={item} onClick={() => setFilter(item)} className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${filter === item ? "border-navy bg-navy text-white" : "border-slate-200 bg-white text-slate-500"}`}>{item === "all" ? "All essays" : item === "task1" ? "Task 1" : "Task 2"}</button>)}</div>
        {error && <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {essays?.length === 0 ? <div className="card mt-8 p-10 text-center sm:p-16"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-navy"><BookOpen size={21} /></span><h2 className="mt-5 font-display text-2xl">No essays yet</h2><p className="mt-2 text-sm text-slate-500">Complete your first practice session to start this record.</p><Link href="/practice" className="button-primary mt-6">Choose a task</Link></div> : (
          <section className="card mt-6 overflow-hidden">
            <div className="hidden grid-cols-[1fr_100px_110px_100px_80px_28px] border-b border-slate-200 bg-slate-50 px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 md:grid"><span>Essay</span><span>Date</span><span>Writing time</span><span>Words</span><span>Band</span><span /></div>
            <div className="divide-y divide-slate-100">
              {visible.map((essay) => <Link key={essay.id} href={`/feedback/${essay.id}`} className="group grid gap-4 px-5 py-5 transition hover:bg-slate-50 md:grid-cols-[1fr_100px_110px_100px_80px_28px] md:items-center md:px-6"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">{essay.task_type === "task1" ? "Task 1" : "Task 2"}</span><span className="text-[11px] capitalize text-slate-400">{essay.topic}</span>{essay.is_revision && <span className="inline-flex items-center gap-1 rounded bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"><RotateCcw size={10} />Revision · not in stats</span>}{essay.status !== "completed" && <span className="text-[10px] font-bold uppercase text-coral">Analysis incomplete</span>}</div><h2 className="mt-2 text-sm font-bold group-hover:text-coral">{essay.title}</h2></div><div className="text-xs text-slate-500 md:text-slate-600"><span className="mr-2 text-[10px] uppercase text-slate-400 md:hidden">Date</span>{shortDate(essay.submitted_at).replace(/, \d{4}/, "")}</div><div className="text-xs text-slate-500"><Clock3 className="mr-1.5 inline" size={13} />{formatDuration(essay.duration_seconds)}</div><div className="text-xs text-slate-500"><FileText className="mr-1.5 inline" size={13} />{essay.word_count}</div><div><span className="font-display text-2xl">{essay.overall_band?.toFixed(1) ?? "—"}</span>{essay.is_revision && <p className="text-[9px] uppercase text-slate-400">possible</p>}</div><ChevronRight className="hidden text-slate-300 transition group-hover:translate-x-1 group-hover:text-coral md:block" size={17} /></Link>)}
            </div>
            {visible.length === 0 && <div className="p-12 text-center text-sm text-slate-400">No essays match this filter.</div>}
          </section>
        )}
      </main>
      <AppFooter />
    </>
  );
}
