"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Clock3, Info, Lightbulb, RotateCcw, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppFooter } from "@/components/app-footer";
import { useAuth } from "@/components/auth-provider";
import { HighlightedEssay } from "@/components/highlighted-essay";
import { PageLoading } from "@/components/page-loading";
import { api } from "@/lib/api";
import { criterionLabels, formatDuration, shortDate } from "@/lib/format";
import type { EssayDetail } from "@/lib/types";

export default function FeedbackPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [essay, setEssay] = useState<EssayDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) api<EssayDetail>(`/essays/${id}`).then(setEssay).catch((err) => setError(err.message));
  }, [id, user]);

  if (authLoading || (user && !essay && !error)) return <PageLoading label="Opening your feedback…" />;
  if (!user) return null;
  if (error) return <main className="container-page py-20"><div className="card mx-auto max-w-md p-8 text-center"><AlertTriangle className="mx-auto text-coral" /><h1 className="mt-4 text-xl font-bold">Feedback unavailable</h1><p className="mt-2 text-sm text-slate-500">{error}</p><Link href="/history" className="button-primary mt-6">Open history</Link></div></main>;
  if (!essay) return null;

  if (essay.status !== "completed") return <main className="container-page py-16"><Link href="/history" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft size={15} />Writing history</Link><div className="card mt-8 p-8 sm:p-12"><AlertTriangle className="text-coral" /><h1 className="mt-5 font-display text-3xl">Your essay is saved, but analysis is incomplete.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">{essay.evaluation_error || "The evaluation service did not finish successfully."} Your original response remains in your history.</p><Link href="/practice" className="button-primary mt-7">Start another practice</Link></div></main>;

  return (
    <>
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="container-page py-8 sm:py-12">
            <Link href="/history" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-ink"><ArrowLeft size={14} />Writing history</Link>
            <div className="mt-7 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
              <div className="max-w-3xl"><div className="flex flex-wrap items-center gap-2"><span className="rounded bg-navy px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">{essay.task_type === "task1" ? "Academic Task 1" : "Writing Task 2"}</span><span className="text-xs capitalize text-slate-400">{essay.topic} · {shortDate(essay.submitted_at)}</span>{essay.is_revision && <span className="inline-flex items-center gap-1 rounded bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-400/10 dark:text-violet-300"><RotateCcw size={11} />Revision · excluded from statistics</span>}{essay.evaluation_mode === "demo" && <span className="rounded bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">Demo evaluation</span>}</div><h1 className="mt-4 font-display text-3xl tracking-tight sm:text-4xl">{essay.title}</h1><p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{essay.prompt.instructions}</p></div>
              <div className="flex shrink-0 items-end gap-6 rounded-xl bg-navy px-6 py-5 text-white"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/55">{essay.is_revision ? "Possible band" : "Estimated overall band"}</p><p className="mt-1 font-display text-5xl">{essay.overall_band?.toFixed(1)}</p></div><Sparkles className="mb-2 text-coral" size={21} /></div>
            </div>
            <div className="mt-7 flex flex-wrap gap-5 border-t border-slate-100 pt-5 text-xs text-slate-500"><span><strong className="text-ink">{essay.word_count}</strong> words</span><span className="flex items-center gap-1.5"><Clock3 size={13} /><strong className="text-ink">{formatDuration(essay.duration_seconds)}</strong> writing time</span><span><strong className="text-ink">{essay.mistakes.length}</strong> inline issues</span></div>
          </div>
        </section>

        <section className="container-page py-10 sm:py-12">
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="eyebrow">Criterion breakdown</p><h2 className="mt-1 font-display text-3xl">How this response performed</h2></div><p className="flex items-center gap-1.5 text-[11px] text-slate-400"><Info size={13} />{essay.is_revision ? "This possible band is excluded from your progress and weakness statistics." : "All bands are estimates, not official IELTS scores."}</p></div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {essay.criteria.map((criterion) => <article key={criterion.criterion} className="card flex flex-col p-5"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-bold leading-5">{criterionLabels[criterion.criterion] || criterion.criterion}</h3><span className="font-display text-3xl text-coral">{criterion.band.toFixed(1)}</span></div><p className="mt-4 text-xs leading-5 text-slate-500">{criterion.explanation}</p><div className="mt-5 border-t border-slate-100 pt-4"><p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sage"><Lightbulb size={12} />Next step</p><p className="mt-2 text-xs leading-5 text-slate-600">{criterion.recommendation}</p></div></article>)}
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <article className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-6"><h2 className="flex items-center gap-2 text-sm font-bold text-emerald-900"><CheckCircle2 size={18} />Strengths</h2><ul className="mt-4 space-y-3">{essay.strengths.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-emerald-900/75"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />{item}</li>)}</ul></article>
            <article className="rounded-xl border border-amber-200 bg-amber-50/70 p-6"><h2 className="flex items-center gap-2 text-sm font-bold text-amber-900"><Lightbulb size={18} />Things to improve</h2><ul className="mt-4 space-y-3">{essay.improvements.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-amber-900/75"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600" />{item}</li>)}</ul></article>
          </div>

          <section className="mt-12">
            <div className="mb-5"><p className="eyebrow">In context</p><h2 className="mt-1 font-display text-3xl">Your annotated response</h2><p className="mt-2 text-sm text-slate-500">Use the legend below to identify each issue type, then select a highlighted phrase for details.</p></div>
            <HighlightedEssay text={essay.essay_text} mistakes={essay.mistakes} />
          </section>

          <section className="mt-12 flex flex-col items-start justify-between gap-6 rounded-xl bg-navy p-7 text-white sm:flex-row sm:items-center sm:p-9"><div><p className="text-xs font-bold uppercase tracking-wider text-coral">{essay.is_revision ? "Keep refining" : "Apply your feedback"}</p><h2 className="mt-2 font-display text-2xl">{essay.is_revision ? "Make another revision without changing your statistics." : "Improve this response and see its possible band."}</h2></div><div className="flex flex-wrap gap-3"><Link href="/dashboard" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold hover:bg-white/5">View progress</Link><Link href={`/practice/${essay.prompt.id}?source=${essay.id}`} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-navy hover:bg-slate-100"><RotateCcw size={15} />{essay.is_revision ? "Revise again" : "Revise this essay"} <ArrowRight size={15} /></Link></div></section>
        </section>
      </main>
      <AppFooter />
    </>
  );
}
