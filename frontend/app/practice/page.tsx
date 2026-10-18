"use client";

import { ArrowRight, BarChart3, BookOpenText, CheckCircle2, Clock3, Loader2, RotateCcw, Shuffle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppFooter } from "@/components/app-footer";
import { useAuth } from "@/components/auth-provider";
import { PageLoading } from "@/components/page-loading";
import { api } from "@/lib/api";
import { humanize } from "@/lib/format";
import type { EssayListItem, Prompt } from "@/lib/types";

export default function PracticeSelectionPage() {
  const { user, loading: authLoading } = useAuth();
  const [task, setTask] = useState<"task1" | "task2">("task2");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [officials, setOfficials] = useState<Record<number, EssayListItem>>({});
  const [topic, setTopic] = useState("all");
  const [loading, setLoading] = useState(true);
  const [randomLoading, setRandomLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    api<Prompt[]>(`/prompts?task_type=${task}`).then(setPrompts).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [task, user]);

  useEffect(() => {
    if (!user) return;
    api<EssayListItem[]>("/essays/officials").then((items) => setOfficials(Object.fromEntries(items.map((item) => [item.prompt_id, item])))).catch((err) => setError(err.message));
  }, [user]);

  function selectTask(nextTask: "task1" | "task2") {
    if (nextTask === task) return;
    setLoading(true);
    setError("");
    setTopic("all");
    setTask(nextTask);
  }

  const topics = useMemo(() => ["all", ...Array.from(new Set(prompts.map((prompt) => prompt.topic))).sort()], [prompts]);
  const visible = topic === "all" ? prompts : prompts.filter((prompt) => prompt.topic === topic);

  async function randomPrompt() {
    setRandomLoading(true);
    try {
      const prompt = await api<Prompt>(`/prompts/random?task_type=${task}`);
      const official = officials[prompt.id];
      router.push(`/practice/${prompt.id}${official ? `?source=${official.id}` : ""}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not choose a prompt"); }
    finally { setRandomLoading(false); }
  }

  if (authLoading) return <PageLoading />;
  if (!user) return null;
  return (
    <>
      <main className="container-page py-10 sm:py-14">
        <div className="max-w-3xl"><p className="eyebrow">New practice session</p><h1 className="mt-2 font-display text-4xl tracking-tight sm:text-5xl">Choose your writing task.</h1><p className="mt-4 text-sm leading-6 text-slate-500">Each prompt contributes one official attempt to your statistics. Reopen a completed prompt to revise your response and receive a possible band without changing your record.</p></div>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <button onClick={() => selectTask("task1")} className={`relative overflow-hidden rounded-xl border p-6 text-left transition sm:p-7 ${task === "task1" ? "border-navy bg-navy text-white shadow-card" : "border-slate-200 bg-white hover:border-slate-300"}`}>
            <div className={`mb-8 grid h-11 w-11 place-items-center rounded-lg ${task === "task1" ? "bg-white/10 text-coral" : "bg-slate-100 text-navy"}`}><BarChart3 size={21} /></div>
            <span className={`text-xs font-bold uppercase tracking-widest ${task === "task1" ? "text-white/55" : "text-slate-400"}`}>IELTS Academic</span><h2 className="mt-2 text-xl font-bold">Writing Task 1</h2><p className={`mt-2 text-sm leading-6 ${task === "task1" ? "text-white/65" : "text-slate-500"}`}>Summarise an original chart, table, process or map.</p><div className={`mt-5 flex items-center gap-2 text-xs font-semibold ${task === "task1" ? "text-white/70" : "text-slate-500"}`}><Clock3 size={14} />20 minutes · 150 words recommended</div>
          </button>
          <button onClick={() => selectTask("task2")} className={`relative overflow-hidden rounded-xl border p-6 text-left transition sm:p-7 ${task === "task2" ? "border-navy bg-navy text-white shadow-card" : "border-slate-200 bg-white hover:border-slate-300"}`}>
            <div className={`mb-8 grid h-11 w-11 place-items-center rounded-lg ${task === "task2" ? "bg-white/10 text-coral" : "bg-slate-100 text-navy"}`}><BookOpenText size={21} /></div>
            <span className={`text-xs font-bold uppercase tracking-widest ${task === "task2" ? "text-white/55" : "text-slate-400"}`}>IELTS Writing</span><h2 className="mt-2 text-xl font-bold">Writing Task 2</h2><p className={`mt-2 text-sm leading-6 ${task === "task2" ? "text-white/65" : "text-slate-500"}`}>Develop an argument in response to an essay question.</p><div className={`mt-5 flex items-center gap-2 text-xs font-semibold ${task === "task2" ? "text-white/70" : "text-slate-500"}`}><Clock3 size={14} />40 minutes · 250 words recommended</div>
          </button>
        </section>

        <section className="mt-10">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Prompt library</p><h2 className="mt-1 text-2xl font-bold">{task === "task1" ? "Academic visual reports" : "Essay questions"}</h2></div><button onClick={randomPrompt} disabled={randomLoading} className="button-secondary self-start sm:self-auto">{randomLoading ? <Loader2 className="animate-spin" size={16} /> : <Shuffle size={16} />}Choose at random</button></div>
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">{topics.map((item) => <button key={item} onClick={() => setTopic(item)} className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition ${topic === item ? "border-navy bg-navy text-white" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>{item}</button>)}</div>
          {error && <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
          {loading ? <div className="mt-8 grid place-items-center py-20 text-sm text-slate-400"><Loader2 className="mb-3 animate-spin" />Loading prompts…</div> : (
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {visible.map((prompt) => {
                const official = officials[prompt.id];
                return <button key={prompt.id} onClick={() => router.push(`/practice/${prompt.id}${official ? `?source=${official.id}` : ""}`)} className="group card flex min-h-44 flex-col p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-300 sm:p-6"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider"><span className="rounded bg-coral/10 px-2 py-1 text-coral">{humanize(prompt.category)}</span><span className="text-slate-400">{prompt.topic}</span>{official && <span className="ml-auto inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-emerald-700"><CheckCircle2 size={11} />Completed</span>}</div><h3 className="mt-4 text-lg font-bold group-hover:text-coral">{prompt.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{prompt.instructions}</p><span className="mt-auto flex items-center gap-1.5 pt-5 text-xs font-bold text-navy">{official ? <><RotateCcw size={14} />Revise response</> : <>Open prompt <ArrowRight size={14} className="transition group-hover:translate-x-1" /></>}</span></button>;
              })}
            </div>
          )}
        </section>
      </main>
      <AppFooter />
    </>
  );
}
