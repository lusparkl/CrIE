"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, Clock3, FileCheck2, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Logo } from "@/components/logo";
import { PageLoading } from "@/components/page-loading";
import { PromptVisual } from "@/components/prompt-visual";
import { ThemeToggle } from "@/components/theme-toggle";
import { api, ApiError } from "@/lib/api";
import type { EssayDetail, Prompt } from "@/lib/types";

const MAX_SUBMISSION_DURATION_SECONDS = 24 * 60 * 60;

function clock(seconds: number) {
  const minutes = Math.floor(Math.max(0, seconds) / 60).toString().padStart(2, "0");
  const remainder = Math.max(0, seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function WritingWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [revisionSource, setRevisionSource] = useState<EssayDetail | null>(null);
  const [essay, setEssay] = useState("");
  const [draftKey, setDraftKey] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [expired, setExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [draftNotice, setDraftNotice] = useState("");
  const router = useRouter();
  const startedMs = useRef(0);

  useEffect(() => {
    if (!user) return;
    const officialRequest = api<EssayDetail>(`/essays/official?prompt_id=${id}`).catch((err) => {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    });
    Promise.all([api<Prompt>(`/prompts/${id}`), officialRequest]).then(async ([result, official]) => {
      const sourceId = new URLSearchParams(window.location.search).get("source");
      let source = official;
      if (sourceId && Number(sourceId) !== official?.id) {
        const requested = await api<EssayDetail>(`/essays/${sourceId}`);
        if (requested.prompt.id !== result.id) throw new Error("This revision does not belong to the selected prompt.");
        source = requested;
      }
      setPrompt(result);
      setRevisionSource(source);
      setExpired(false);
      setDraftNotice("");
      const start = new Date();
      const nextDraftKey = source ? `essaytrace_revision_draft_${id}` : `essaytrace_draft_${id}`;
      setDraftKey(nextDraftKey);
      const saved = localStorage.getItem(nextDraftKey);
      if (saved) {
        try {
          const draft = JSON.parse(saved) as { essay: string; startedAt: string };
          setEssay(draft.essay || "");
          const restored = new Date(draft.startedAt);
          const restoredMs = restored.getTime();
          const ageMs = start.getTime() - restoredMs;
          const canRestoreTimer = Number.isFinite(restoredMs) && ageMs >= 0 && ageMs < MAX_SUBMISSION_DURATION_SECONDS * 1000;
          const sessionStart = canRestoreTimer ? restored : start;
          setStartedAt(sessionStart);
          startedMs.current = sessionStart.getTime();
          if (!canRestoreTimer) setDraftNotice("Your saved essay was restored. Its practice timer restarted because the previous session was over 24 hours old.");
        } catch {
          setEssay(source?.essay_text || ""); setStartedAt(start); startedMs.current = start.getTime();
        }
      } else {
        setEssay(source?.essay_text || ""); setStartedAt(start); startedMs.current = start.getTime();
      }
    }).catch((err) => setError(err.message));
  }, [id, user]);

  useEffect(() => {
    if (!prompt || !startedAt) return;
    const total = prompt.task_type === "task1" ? 20 * 60 : 40 * 60;
    const update = () => {
      const elapsed = Math.floor((Date.now() - startedMs.current) / 1000);
      const left = Math.max(0, total - elapsed);
      setRemaining(left);
      if (left === 0) setExpired(true);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [prompt, startedAt]);

  useEffect(() => {
    if (!startedAt || !prompt || !draftKey) return;
    const timer = window.setTimeout(() => localStorage.setItem(draftKey, JSON.stringify({ essay, startedAt: startedAt.toISOString() })), 500);
    return () => window.clearTimeout(timer);
  }, [draftKey, essay, prompt, startedAt]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (essay.trim() && !submitting) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [essay, submitting]);

  const wordCount = useMemo(() => essay.trim() ? essay.trim().split(/\s+/).length : 0, [essay]);
  const minimum = prompt?.task_type === "task1" ? 150 : 250;

  async function submit() {
    if (!prompt || !startedAt || !essay.trim()) return;
    setSubmitting(true); setError("");
    try {
      const submittedAt = new Date();
      const durationSeconds = Math.min(MAX_SUBMISSION_DURATION_SECONDS, Math.max(0, Math.floor((submittedAt.getTime() - startedAt.getTime()) / 1000)));
      const result = await api<EssayDetail>("/essays", { method: "POST", body: JSON.stringify({ prompt_id: prompt.id, essay_text: essay, started_at: startedAt.toISOString(), submitted_at: submittedAt.toISOString(), duration_seconds: durationSeconds }) });
      if (draftKey) localStorage.removeItem(draftKey);
      router.push(`/feedback/${result.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit your essay. Your local draft is still safe.");
      setSubmitting(false);
    }
  }

  if (authLoading || (user && !prompt && !error)) return <PageLoading label="Preparing your writing workspace…" />;
  if (!user) return null;
  if (error && !prompt) return <main className="grid min-h-screen place-items-center p-6"><div className="card max-w-md p-8 text-center"><AlertTriangle className="mx-auto text-coral" /><h1 className="mt-4 text-xl font-bold">Couldn’t open this prompt</h1><p className="mt-2 text-sm text-slate-500">{error}</p><Link className="button-primary mt-6" href="/practice">Back to prompts</Link></div></main>;
  if (!prompt) return null;

  return (
    <main className="min-h-screen bg-[#f3f3ef]">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4"><Logo /><span className="hidden h-5 w-px bg-slate-200 sm:block" /><Link href="/practice" className="hidden items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-ink sm:flex"><ArrowLeft size={14} />Exit session</Link></div>
          <div className="flex items-center gap-3 sm:gap-6">
            <ThemeToggle className="hidden sm:grid" />
            <div className="text-right"><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Words</p><p className={`text-sm font-bold ${wordCount >= minimum ? "text-sage" : "text-ink"}`}>{wordCount} <span className="hidden font-normal text-slate-400 sm:inline">/ {minimum} recommended</span></p></div>
            <div className={`min-w-24 rounded-lg border px-3 py-2 ${expired ? "border-red-200 bg-red-50 text-red-700" : remaining < 300 ? "border-coral/30 bg-coral/5 text-coral" : "border-slate-200 bg-slate-50"}`}><p className="flex items-center justify-center gap-1.5 font-mono text-base font-bold tabular-nums"><Clock3 size={15} />{clock(remaining)}</p></div>
            <button onClick={submit} disabled={submitting || !essay.trim()} className="button-primary !px-4 !py-2.5"><span className="hidden sm:inline">{revisionSource ? "Check revision" : "Submit essay"}</span><span className="sm:hidden">{revisionSource ? "Check" : "Submit"}</span></button>
          </div>
        </div>
        {revisionSource && <div className="border-t border-violet-400/20 bg-violet-500/10 px-4 py-2 text-center text-xs font-medium text-violet-700 dark:text-violet-300">Revision mode: this produces a possible band and feedback, but it will not change your statistics or recurring weaknesses.</div>}
        {draftNotice && <div className="border-t border-amber-400/20 bg-amber-500/10 px-4 py-2 text-center text-xs font-medium text-amber-700 dark:text-amber-300">{draftNotice}</div>}
        {expired && <div className="bg-red-50 px-4 py-2 text-center text-xs font-semibold text-red-700">Time has expired. Your writing is safe—you can finish your sentence and submit when ready.</div>}
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(380px,46%)_1fr]">
        <section className="min-w-0 border-b border-slate-200 bg-white p-5 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center gap-2"><span className="rounded bg-navy px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">{prompt.task_type === "task1" ? "Academic Task 1" : "Writing Task 2"}</span><span className="text-xs capitalize text-slate-400">{prompt.topic} · {prompt.category.replaceAll("_", " ")}</span></div>
            <h1 className="mt-5 font-display text-2xl tracking-tight sm:text-3xl">{prompt.title}</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">{prompt.instructions}</p>
            {prompt.visualization_type && <div className="mt-8 rounded-xl border border-slate-200 bg-[#fbfbf8] p-4 sm:p-6"><PromptVisual prompt={prompt} compact /></div>}
            <div className="mt-8 border-l-2 border-coral pl-4 text-xs leading-5 text-slate-500"><strong className="text-ink">{revisionSource ? "Improve the response using your previous feedback." : `Write at least ${minimum} words.`}</strong> {revisionSource ? "Your original attempt remains the only version counted in progress statistics." : "You may still submit a shorter response. Spelling and grammar assistance are disabled in the editor."}</div>
          </div>
        </section>

        <section className="flex min-h-[70vh] flex-col p-4 sm:p-7 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:min-h-0">
          <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{revisionSource ? "Your revision" : "Your response"}</p><p className="text-[10px] text-slate-400">Draft saved locally</p></div>
            <textarea
              value={essay}
              onChange={(event) => setEssay(event.target.value)}
              placeholder="Begin writing here…"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="sentences"
              className="min-h-[60vh] flex-1 resize-none bg-white p-6 font-serif text-[17px] leading-8 text-slate-800 outline-none sm:p-8"
              aria-label="Essay response"
            />
            {error && <div className="border-t border-red-100 bg-red-50 px-5 py-3 text-xs text-red-700">{error}</div>}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-400"><span>{wordCount < minimum ? `${minimum - wordCount} words below recommendation` : "Recommended length reached"}</span><span>{prompt.task_type === "task1" ? "20-minute task" : "40-minute task"}</span></div>
          </div>
        </section>
      </div>

      {submitting && <div className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-6 backdrop-blur-sm"><div className="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-2xl"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-coral/10 text-coral"><FileCheck2 size={23} /></span><Loader2 className="mx-auto mt-6 animate-spin text-navy" /><h2 className="mt-4 text-lg font-bold">{revisionSource ? "Checking your revision" : "Analysing your response"}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{revisionSource ? "Estimating a possible band and comparing the revised response without changing your progress record…" : "Checking each criterion, locating specific issues and updating your writing patterns…"}</p></div></div>}
    </main>
  );
}
