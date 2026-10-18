import Link from "next/link";
import { ArrowRight, BarChart3, BookOpenCheck, ChevronRight, Clock3, Command, Sparkles, TrendingUp } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { Logo } from "@/components/logo";

function ProductPreview() {
  const criteria = [
    ["Task response", "7.0", "#a78bfa"],
    ["Coherence", "6.5", "#38bdf8"],
    ["Lexical resource", "6.5", "#34d399"],
    ["Grammar", "6.0", "#fb7185"],
  ];
  return (
    <div className="relative mx-auto mt-16 w-full max-w-[1180px] px-3 sm:px-8">
      <div className="absolute left-1/2 top-1/3 -z-10 h-[420px] w-[75%] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[110px]" />
      <div className="overflow-hidden rounded-xl border border-white/[.12] bg-[#0d0e10] shadow-[0_35px_120px_rgba(0,0,0,.65)] ring-1 ring-white/[.03]">
        <div className="flex h-12 items-center border-b border-white/[.08] px-4">
          <div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-white/10" /><span className="h-2.5 w-2.5 rounded-full bg-white/10" /><span className="h-2.5 w-2.5 rounded-full bg-white/10" /></div>
          <p className="mx-auto flex items-center gap-2 text-[11px] font-medium text-white/35"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />CrIE workspace · Essay 12</p>
          <Command size={13} className="text-white/25" />
        </div>
        <div className="grid min-h-[560px] lg:grid-cols-[190px_minmax(0,1fr)_270px]">
          <aside className="hidden border-r border-white/[.08] bg-white/[.015] p-3 lg:block">
            <div className="flex items-center gap-2 px-2 py-2 text-xs font-semibold text-white/80"><span className="grid h-5 w-5 place-items-center rounded bg-violet-500 text-[9px] text-white">C</span>CrIE</div>
            <div className="mt-5 space-y-1 text-[11px] text-white/45">
              {[['Overview', BarChart3], ['Practice', BookOpenCheck], ['History', Clock3]].map(([label, Icon], index) => {
                const IconComponent = Icon as typeof BarChart3;
                return <div key={label as string} className={`flex items-center gap-2 rounded-md px-2 py-2 ${index === 0 ? 'bg-white/[.07] text-white/85' : ''}`}><IconComponent size={13} />{label as string}</div>;
              })}
            </div>
            <p className="mb-2 mt-7 px-2 text-[9px] font-semibold uppercase tracking-[.16em] text-white/25">Writing intelligence</p>
            <div className="space-y-1 text-[11px] text-white/45">
              <div className="flex items-center gap-2 px-2 py-2"><span className="h-1.5 w-1.5 rounded-full bg-violet-400" />Article usage</div>
              <div className="flex items-center gap-2 px-2 py-2"><span className="h-1.5 w-1.5 rounded-full bg-sky-400" />Idea development</div>
              <div className="flex items-center gap-2 px-2 py-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Vocabulary range</div>
            </div>
          </aside>

          <section className="min-w-0 p-5 sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-white/[.08] pb-5">
              <div><div className="flex items-center gap-2 text-[10px] font-medium text-white/35"><span className="rounded border border-violet-400/25 bg-violet-400/10 px-2 py-1 text-violet-300">TASK 2</span><span>Education</span><span>·</span><span>Today</span></div><h3 className="mt-3 text-base font-semibold text-white/90">Should university education be free?</h3></div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-semibold text-emerald-300">Analysis complete</span>
            </div>
            <div className="mt-7 max-w-2xl font-serif text-[13px] leading-7 text-white/55 sm:text-sm sm:leading-8">
              <p>University education has become increasingly important in a competitive world. Some people argue that it should be available to everyone without cost, while others believe <span className="rounded-sm border-b border-violet-400 bg-violet-400/10 px-0.5 text-white/80">the students should pay</span> for their own studies.</p>
              <p className="mt-4">Public funding can create a more equal society because talented learners are not excluded by their financial background. <span className="rounded-sm border-b border-sky-400 bg-sky-400/10 px-0.5 text-white/80">This gives many benefits</span>, including a more skilled workforce and greater social mobility.</p>
              <p className="mt-4">However, completely free education places pressure on public budgets. A balanced system could provide grants according to need while asking graduates with higher incomes to contribute later.</p>
              <p className="mt-4">In conclusion, access should not depend on wealth, but carefully designed contributions can make the system sustainable.</p>
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-white/[.08] pt-4 text-[10px] text-white/25"><span>286 words</span><span>34:18 writing time</span></div>
          </section>

          <aside className="border-t border-white/[.08] bg-white/[.018] p-5 lg:border-l lg:border-t-0">
            <p className="text-[9px] font-semibold uppercase tracking-[.16em] text-white/30">Estimated band</p>
            <div className="mt-3 flex items-end gap-2"><span className="text-5xl font-medium tracking-[-.05em] text-white">6.5</span><span className="mb-1 text-[10px] text-emerald-300">+0.5</span></div>
            <div className="mt-7 space-y-4">
              {criteria.map(([label, score, color]) => <div key={label}><div className="flex justify-between text-[10px]"><span className="text-white/40">{label}</span><span className="font-medium text-white/80">{score}</span></div><div className="mt-2 h-px bg-white/[.08]"><div className="h-px" style={{ background: color, width: `${(Number(score) / 9) * 100}%` }} /></div></div>)}
            </div>
            <div className="mt-8 rounded-lg border border-white/[.08] bg-white/[.025] p-4">
              <p className="flex items-center gap-2 text-[10px] font-medium text-white/75"><Sparkles size={12} className="text-violet-400" />Recurring pattern</p>
              <p className="mt-3 text-xs font-medium text-white/80">Article usage</p>
              <p className="mt-1 text-[10px] leading-4 text-white/35">Appeared in 4 of your last 6 essays</p>
              <div className="mt-3 flex items-center gap-1 text-[9px] text-emerald-300"><TrendingUp size={10} />Improving</div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

const principles = [
  { number: "01", title: "Practice under pressure", text: "Original Task 1 visuals and Task 2 questions, realistic timers, live word counts, and a focused editor." },
  { number: "02", title: "Feedback in context", text: "Every concrete issue stays attached to the sentence that caused it, with an explanation and a useful next step." },
  { number: "03", title: "Patterns over time", text: "CrIE connects separate essays to reveal recurring weaknesses, criterion trends, and genuine improvement." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfaf7] dark:bg-[#08090a]">
      <PublicHeader />
      <section className="relative overflow-hidden border-b border-slate-200 pt-36 dark:border-white/[.08] sm:pt-44">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[700px] bg-[radial-gradient(circle_at_50%_15%,rgba(139,92,246,.13),transparent_52%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[.22] [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />
        <div className="container-page relative text-center">
          <Link href="/register" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-medium text-slate-500 backdrop-blur dark:border-white/10 dark:bg-white/[.035] dark:text-white/45">CrIE 1.0 · Your writing record is ready <ChevronRight size={12} /></Link>
          <h1 className="mx-auto mt-8 max-w-5xl bg-gradient-to-b from-ink to-slate-500 bg-clip-text text-5xl font-semibold leading-[1.02] tracking-[-.055em] text-transparent dark:from-white dark:to-white/35 sm:text-7xl lg:text-[88px]">
            The writing system for your next band.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-500 dark:text-white/45 sm:text-lg">
            Practice IELTS-style writing, understand every correction, and turn feedback from separate essays into one continuous path forward.
          </p>
          <div className="mt-9 flex justify-center">
            <Link href="/register" className="button-primary !px-6 !py-3.5">Start writing <ArrowRight size={16} /></Link>
          </div>
        </div>
        <ProductPreview />
        <div className="h-24 bg-gradient-to-b from-transparent to-white/40 dark:to-white/[.015]" />
      </section>

      <section id="product" className="container-page py-24 sm:py-32">
        <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
          <div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400 dark:text-white/30">One connected writing record</p><div className="mt-5 flex items-center gap-2 text-xs text-slate-500 dark:text-white/40"><span className="h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_18px_#8b5cf6]" />Built for deliberate practice</div></div>
          <h2 className="text-4xl font-medium leading-[1.08] tracking-[-.04em] text-ink dark:text-white sm:text-6xl">A score is a snapshot. Your patterns are the system.</h2>
        </div>
        <div className="mt-16 grid overflow-hidden rounded-xl border border-slate-200 bg-slate-200 dark:border-white/[.08] dark:bg-white/[.08] lg:grid-cols-3">
          {principles.map((item) => <article key={item.number} className="relative bg-white p-7 dark:bg-[#0d0e10] sm:p-9"><p className="font-mono text-[10px] text-slate-400 dark:text-white/25">FIG {item.number}</p><div className="my-10 h-px bg-gradient-to-r from-violet-500/70 via-violet-500/10 to-transparent" /><h3 className="text-lg font-semibold tracking-tight dark:text-white/90">{item.title}</h3><p className="mt-3 text-sm leading-6 text-slate-500 dark:text-white/40">{item.text}</p></article>)}
        </div>
      </section>

      <section id="method" className="border-y border-slate-200 bg-white/40 py-24 dark:border-white/[.08] dark:bg-white/[.015] sm:py-32">
        <div className="container-page grid gap-14 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-coral">Long-term intelligence</p><h2 className="mt-5 text-4xl font-medium leading-tight tracking-[-.04em] sm:text-5xl">Feedback that remembers what matters.</h2><p className="mt-6 max-w-lg text-sm leading-7 text-slate-500 dark:text-white/40">Most tools grade one essay and forget it. CrIE builds a consistent taxonomy of your mistakes, then measures how often each one returns—and whether it is improving.</p><Link href="/register" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">Build your writing record <ArrowRight size={15} /></Link></div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/[.1] dark:bg-[#0d0e10]">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-white/[.08]"><span className="text-xs font-medium">Recurring weaknesses</span><span className="font-mono text-[9px] text-slate-400">LAST 7 ESSAYS</span></div>
            {[['Article usage', '7 occurrences', 'Improving', 72], ['Idea development', '5 occurrences', 'Needs focus', 54], ['Vocabulary repetition', '4 occurrences', 'Improving', 39]].map(([name, count, trend, width], index) => <div key={name as string} className="grid gap-4 border-b border-slate-100 px-5 py-5 last:border-0 dark:border-white/[.06] sm:grid-cols-[1fr_120px_90px] sm:items-center"><div><p className="text-sm font-medium">{name as string}</p><div className="mt-3 h-px bg-slate-100 dark:bg-white/[.08]"><div className={`h-px ${index === 1 ? 'bg-amber-400' : 'bg-violet-400'}`} style={{ width: `${width}%` }} /></div></div><p className="text-[11px] text-slate-400">{count as string}</p><p className={`text-[10px] font-medium ${index === 1 ? 'text-amber-500' : 'text-emerald-500'}`}>{trend as string}</p></div>)}
          </div>
        </div>
      </section>

      <section className="container-page py-24 sm:py-32">
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-ink px-7 py-16 text-white dark:border-white/[.1] dark:bg-[#101113] sm:px-14 sm:py-20">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-violet-600/20 blur-[90px]" />
          <div className="relative flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-violet-300">Cracking IELTS Essays</p><h2 className="mt-5 max-w-3xl text-4xl font-medium leading-[1.08] tracking-[-.04em] sm:text-6xl">Make every essay part of the next one.</h2></div><Link href="/register" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-zinc-100 px-5 py-3 text-sm font-semibold text-black hover:bg-white">Start practicing <ArrowRight size={15} /></Link></div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 dark:border-white/[.08]">
        <div className="container-page flex flex-col gap-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between"><Logo /><p className="max-w-2xl sm:text-right">Independent practice tool. Not affiliated with or endorsed by IELTS, the British Council, IDP, or Cambridge University Press & Assessment.</p></div>
      </footer>
    </main>
  );
}
