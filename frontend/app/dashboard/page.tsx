"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, ChevronDown, ChevronRight, CircleAlert, Clock3, FileText, Lightbulb, ListChecks, Sparkles, Target, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { AppFooter } from "@/components/app-footer";
import { useAuth } from "@/components/auth-provider";
import { PageLoading } from "@/components/page-loading";
import { ProgressChart } from "@/components/progress-chart";
import { api } from "@/lib/api";
import { formatDuration, humanize, shortDate } from "@/lib/format";
import type { Dashboard, GeneralTip, Weakness, WeaknessDetail } from "@/lib/types";

function BandValue({ value }: { value: number | null }) {
  return <span>{value === null ? "—" : value.toFixed(1)}</span>;
}

function TrendBadge({ trend }: { trend: Weakness["trend"] }) {
  return <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${trend === "improving" ? "bg-emerald-50 text-emerald-700" : trend === "needs attention" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-500"}`}>{trend === "improving" ? <TrendingDown size={11} /> : trend === "needs attention" ? <TrendingUp size={11} /> : null}{trend}</span>;
}

function WeaknessDetails({ detail }: { detail: WeaknessDetail }) {
  return (
    <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-5 dark:bg-white/[.02] sm:px-5">
      <div className="rounded-lg border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-400/20 dark:bg-violet-400/[.08]">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300"><Lightbulb size={13} />How to improve</p>
        <p className="mt-2 text-xs leading-5 text-slate-600">{detail.tip}</p>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mistakes from your essays</p><span className="text-[10px] text-slate-400">{detail.occurrences} total</span></div>
      <div className="mt-2 max-h-[34rem] space-y-3 overflow-y-auto pr-1">
        {detail.examples.map((example) => (
          <article key={example.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="rounded bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-500">{example.task_type === "task1" ? "Task 1" : "Task 2"}</span><span className="text-[10px] capitalize text-slate-400">{example.topic} · {shortDate(example.submitted_at)}</span></div><span className={`text-[9px] font-bold uppercase ${example.severity === "high" ? "text-red-600" : example.severity === "medium" ? "text-violet-500" : "text-slate-400"}`}>{example.severity}</span></div>
            <p className="mt-3 text-xs leading-5 text-slate-500">…{example.context_before}<mark className="rounded bg-violet-500/15 px-0.5 font-semibold text-ink">{example.text}</mark>{example.context_after}…</p>
            <p className="mt-3 text-xs leading-5 text-slate-600">{example.explanation}</p>
            <div className="mt-3 rounded-md bg-emerald-50 px-3 py-2.5"><span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Try instead</span><p className="mt-1 text-xs font-medium text-emerald-900">{example.suggestion}</p></div>
            <Link href={`/feedback/${example.submission_id}`} className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-ink hover:text-violet-500">Open annotated essay <ArrowUpRight size={12} /></Link>
          </article>
        ))}
      </div>
    </div>
  );
}

function WeaknessesCard({ weaknesses }: { weaknesses: Weakness[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, WeaknessDetail>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<Record<string, string>>({});

  async function toggle(category: string) {
    if (expanded === category) {
      setExpanded(null);
      return;
    }
    setExpanded(category);
    if (details[category] || loading === category) return;
    setLoading(category);
    setDetailError((current) => ({ ...current, [category]: "" }));
    try {
      const detail = await api<WeaknessDetail>(`/dashboard/weaknesses/${encodeURIComponent(category)}`);
      setDetails((current) => ({ ...current, [category]: detail }));
    } catch (err) {
      setDetailError((current) => ({ ...current, [category]: err instanceof Error ? err.message : "Could not load these examples." }));
    } finally {
      setLoading((current) => current === category ? null : current);
    }
  }

  return (
    <article className="card overflow-hidden">
      <div className="p-5 pb-3 sm:p-7 sm:pb-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Across your essays</p><h2 className="mt-1 text-xl font-bold">Recurring weaknesses</h2><p className="mt-2 text-xs leading-5 text-slate-500">Select a pattern to see every saved example and a focused correction strategy.</p></div>
      {weaknesses.length ? <div>
        {weaknesses.map((item) => {
          const isExpanded = expanded === item.category;
          return <div key={item.category} className="border-t border-slate-100">
            <button type="button" onClick={() => void toggle(item.category)} aria-expanded={isExpanded} className="w-full px-5 py-4 text-left transition hover:bg-slate-50 sm:px-7">
              <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{humanize(item.category)}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.occurrences} occurrence{item.occurrences !== 1 && "s"} across {item.essay_count} essay{item.essay_count !== 1 && "s"}</p></div><div className="flex items-center gap-2"><TrendBadge trend={item.trend} /><ChevronDown size={15} className={`text-slate-400 transition ${isExpanded ? "rotate-180" : ""}`} /></div></div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.max(8, item.recent_percentage)}%` }} /></div>
              <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px] text-slate-400"><span>Appeared in {item.recent_percentage}% of your last {item.recent_essay_total} essays</span><span className="font-semibold text-violet-500">{isExpanded ? "Hide" : "View examples & tips"}</span></div>
            </button>
            {isExpanded && (details[item.category] ? <WeaknessDetails detail={details[item.category]} /> : <div className="border-t border-slate-100 px-5 py-5 text-xs text-slate-500 sm:px-7">{loading === item.category ? "Loading your saved examples…" : detailError[item.category] || "No examples found."}</div>)}
          </div>;
        })}
      </div> : <div className="mx-5 mb-5 rounded-lg border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400 sm:mx-7 sm:mb-7">No repeated patterns yet. Keep writing.</div>}
    </article>
  );
}

function GeneralTips({ tips, essayCount }: { tips: GeneralTip[]; essayCount: number }) {
  const icons = [Target, ListChecks, TrendingUp];
  return (
    <section className="card mt-4 overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-7"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Across your full writing record</p><h2 className="mt-1 text-xl font-bold">Your personalised practice plan</h2><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">These recommendations combine patterns and scores from all {essayCount} completed essay{essayCount !== 1 && "s"}, not only your latest response.</p></div>
      <div className="grid gap-px bg-slate-200 dark:bg-white/10 lg:grid-cols-3">
        {tips.map((tip, index) => {
          const Icon = icons[index] || Lightbulb;
          return <article key={tip.title} className="bg-white p-5 sm:p-7"><span className="grid h-9 w-9 place-items-center rounded-lg border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300"><Icon size={17} /></span><h3 className="mt-5 text-sm font-bold">{tip.title}</h3><p className="mt-2 text-xs leading-5 text-slate-600">{tip.guidance}</p><p className="mt-5 border-t border-slate-100 pt-3 text-[10px] leading-4 text-slate-400">Why this matters: {tip.evidence}</p></article>;
        })}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    api<Dashboard>("/dashboard").then(setData).catch((err) => setError(err.message));
  }, [user]);

  if (authLoading || (user && !data && !error)) return <PageLoading label="Reading your writing record…" />;
  if (!user) return null;
  if (error) return <main className="container-page py-20"><div className="card mx-auto max-w-lg p-8 text-center"><CircleAlert className="mx-auto text-coral" /><h1 className="mt-4 text-xl font-bold">We couldn’t load your dashboard</h1><p className="mt-2 text-sm text-slate-500">{error}</p><button onClick={() => location.reload()} className="button-primary mt-6">Try again</button></div></main>;
  if (!data) return null;

  const firstName = user.name.split(" ")[0];
  const hasEssays = data.completed_essays > 0;
  const weaknesses = data.weaknesses.filter((item) => item.recurring).slice(0, 4);
  const visibleWeaknesses = weaknesses.length ? weaknesses : data.weaknesses.slice(0, 4);

  return (
    <>
      <main className="container-page py-9 sm:py-12">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div><p className="eyebrow">Writing overview</p><h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">Good to see you, {firstName}.</h1><p className="mt-3 text-sm text-slate-500">Here’s what your writing record says today.</p></div>
          <Link href="/practice" className="button-primary self-start sm:self-auto">Start a new essay <ArrowRight size={16} /></Link>
        </div>

        {!hasEssays ? (
          <section className="card mt-10 overflow-hidden">
            <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-[1fr_.6fr] lg:items-center"><div><span className="grid h-11 w-11 place-items-center rounded-lg bg-navy text-white"><BookOpen size={20} /></span><h2 className="mt-6 font-display text-3xl">Your writing record starts with one essay.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">Choose a Task 1 visual or Task 2 question, write under a realistic timer, and receive your first criterion breakdown.</p><Link href="/practice" className="button-primary mt-7">Choose a task <ArrowRight size={16} /></Link></div><div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><p className="font-display text-5xl text-slate-300">—</p><p className="mt-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Awaiting first estimate</p></div></div>
          </section>
        ) : (
          <>
            <section className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <article className="card p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Completed</span><FileText size={17} className="text-slate-400" /></div><p className="mt-4 font-display text-4xl">{data.completed_essays}</p><p className="mt-1 text-xs text-slate-500">essays in your record</p></article>
              <article className="card bg-navy p-5 text-white"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-white/55">Average estimate</span><Sparkles size={17} className="text-coral" /></div><p className="mt-4 font-display text-4xl"><BandValue value={data.average_band} /></p><p className="mt-1 text-xs text-white/55">across all submissions</p></article>
              <article className="card p-5"><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Task 1 average</span><p className="mt-4 font-display text-4xl"><BandValue value={data.task1_average} /></p><p className="mt-1 text-xs text-slate-500">Academic visual reports</p></article>
              <article className="card p-5"><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Task 2 average</span><p className="mt-4 font-display text-4xl"><BandValue value={data.task2_average} /></p><p className="mt-1 text-xs text-slate-500">Argumentative essays</p></article>
            </section>

            <section className="mt-4 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
              <article className="card p-5 sm:p-7">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Performance over time</p><h2 className="mt-1 text-xl font-bold">Criterion-level progress</h2></div><span className="self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Estimated bands</span></div>
                <div className="mt-4"><ProgressChart data={data.trend} /></div>
                <div className="mt-5 grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-2"><div className="bg-slate-50 p-4"><p className="text-[11px] uppercase tracking-wider text-slate-400">Strongest criterion</p><p className="mt-1 text-sm font-semibold">{data.strongest_criterion}</p></div><div className="bg-slate-50 p-4"><p className="text-[11px] uppercase tracking-wider text-slate-400">Focus criterion</p><p className="mt-1 text-sm font-semibold">{data.weakest_criterion}</p></div></div>
              </article>

              <WeaknessesCard weaknesses={visibleWeaknesses} />
            </section>

            {data.general_tips.length > 0 && <GeneralTips tips={data.general_tips} essayCount={data.completed_essays} />}

            <section className="card mt-4 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-7"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Writing record</p><h2 className="mt-1 text-xl font-bold">Recent essays</h2></div><Link className="flex items-center gap-1 text-sm font-semibold text-navy" href="/history">View all <ChevronRight size={15} /></Link></div>
              <div className="divide-y divide-slate-100">
                {data.recent_essays.map((essay) => <Link href={`/feedback/${essay.id}`} key={essay.id} className="grid gap-3 px-5 py-4 transition hover:bg-slate-50 sm:grid-cols-[1fr_120px_90px_32px] sm:items-center sm:px-7"><div><div className="flex items-center gap-2"><span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">{essay.task_type === "task1" ? "Task 1" : "Task 2"}</span><span className="text-xs capitalize text-slate-400">{essay.topic}</span></div><p className="mt-1.5 truncate text-sm font-semibold">{essay.title}</p></div><div className="text-xs text-slate-500"><Clock3 size={13} className="mr-1.5 inline" />{formatDuration(essay.duration_seconds)}</div><div><span className="font-display text-2xl">{essay.overall_band?.toFixed(1) ?? "—"}</span><span className="ml-1 text-[10px] text-slate-400">band</span></div><ChevronRight size={16} className="hidden text-slate-300 sm:block" /></Link>)}
              </div>
            </section>
          </>
        )}
      </main>
      <AppFooter />
    </>
  );
}
