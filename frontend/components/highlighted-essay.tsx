"use client";

import { useMemo, useState } from "react";
import { Check, Lightbulb } from "lucide-react";
import { humanize } from "@/lib/format";
import type { Mistake } from "@/lib/types";

const mistakeGroups = [
  {
    key: "grammar",
    label: "Grammar",
    description: "Form & accuracy",
    categories: ["article_usage", "subject_verb_agreement", "verb_tense", "preposition", "sentence_fragment", "run_on_sentence", "punctuation", "singular_plural", "word_order"],
    highlight: "border-violet-500 bg-violet-500/10 hover:bg-violet-500/20",
    swatch: "border-violet-500 bg-violet-500/15",
    dot: "bg-violet-500",
    badge: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-300",
  },
  {
    key: "vocabulary",
    label: "Vocabulary",
    description: "Word choice & spelling",
    categories: ["repetitive_vocabulary", "incorrect_word_choice", "informal_language", "collocation", "spelling", "limited_vocabulary"],
    highlight: "border-amber-500 bg-amber-500/10 hover:bg-amber-500/20",
    swatch: "border-amber-500 bg-amber-500/15",
    dot: "bg-amber-500",
    badge: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-300",
  },
  {
    key: "coherence",
    label: "Coherence",
    description: "Flow & structure",
    categories: ["weak_paragraph_structure", "unclear_reference", "poor_linking", "excessive_linking_words", "weak_topic_sentence"],
    highlight: "border-sky-500 bg-sky-500/10 hover:bg-sky-500/20",
    swatch: "border-sky-500 bg-sky-500/15",
    dot: "bg-sky-500",
    badge: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-300",
  },
  {
    key: "task",
    label: "Task response",
    description: "Ideas & task coverage",
    categories: ["incomplete_task_response", "weak_idea_development", "irrelevant_information", "weak_example", "missing_overview", "inaccurate_data_description"],
    highlight: "border-rose-500 bg-rose-500/10 hover:bg-rose-500/20",
    swatch: "border-rose-500 bg-rose-500/15",
    dot: "bg-rose-500",
    badge: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300",
  },
] as const;

const groupFor = (category: string) => mistakeGroups.find((group) => group.categories.includes(category as never)) || mistakeGroups[3];

export function HighlightedEssay({ text, mistakes }: { text: string; mistakes: Mistake[] }) {
  const valid = useMemo(() => {
    const sorted = [...mistakes].filter((m) => m.start >= 0 && m.end <= text.length && m.end > m.start).sort((a, b) => a.start - b.start || a.end - b.end);
    return sorted.reduce<{ items: Mistake[]; end: number }>((result, mistake) => {
      if (mistake.start < result.end) return result;
      return { items: [...result.items, mistake], end: mistake.end };
    }, { items: [], end: -1 }).items;
  }, [mistakes, text]);
  const [selected, setSelected] = useState<Mistake | null>(valid[0] || null);
  const selectedGroup = selected ? groupFor(selected.category) : null;
  const segments: React.ReactNode[] = [];
  let cursor = 0;
  valid.forEach((mistake) => {
    if (mistake.start > cursor) segments.push(<span key={`text-${cursor}`}>{text.slice(cursor, mistake.start)}</span>);
    const group = groupFor(mistake.category);
    segments.push(
      <button
        type="button"
        key={mistake.id}
        onClick={() => setSelected(mistake)}
        aria-pressed={selected?.id === mistake.id}
        title={`${group.label}: ${humanize(mistake.category)}`}
        className={`rounded-sm border-b-2 px-0.5 text-left transition ${group.highlight} ${selected?.id === mistake.id ? "ring-2 ring-navy/20 dark:ring-white/25" : ""}`}
      >
        {text.slice(mistake.start, mistake.end)}
      </button>,
    );
    cursor = mistake.end;
  });
  if (cursor < text.length) segments.push(<span key={`text-${cursor}`}>{text.slice(cursor)}</span>);

  return (
    <div>
      <div className="mb-5 grid overflow-hidden rounded-lg border border-slate-200 bg-slate-200 dark:border-white/10 dark:bg-white/10 sm:grid-cols-2 xl:grid-cols-4">
        {mistakeGroups.map((group) => {
          const count = valid.filter((mistake) => groupFor(mistake.category).key === group.key).length;
          return (
            <div key={group.key} className="flex items-center gap-3 bg-white px-4 py-3 dark:bg-[#101113]">
              <span className={`h-5 w-8 shrink-0 rounded-sm border-b-[3px] ${group.swatch}`} />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink">{group.label}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{group.description} · {count} issue{count !== 1 && "s"}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <div className="min-h-96 whitespace-pre-wrap rounded-lg border border-slate-200 bg-[#fffefb] p-6 font-serif text-[16px] leading-8 text-slate-700 sm:p-8">{segments.length ? segments : text}</div>
        <aside className="xl:sticky xl:top-6 xl:self-start">
          {selected && selectedGroup ? (
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${selectedGroup.badge}`}><span className={`h-1.5 w-1.5 rounded-full ${selectedGroup.dot}`} />{selectedGroup.label}</span>
                  <p className="mt-2 text-xs font-semibold text-ink">{humanize(selected.category)}</p>
                </div>
                <span className={`pt-1 text-[10px] font-bold uppercase ${selected.severity === "high" ? "text-red-600" : selected.severity === "medium" ? "text-coral" : "text-slate-400"}`}>{selected.severity}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{selected.explanation}</p>
              <div className="mt-5 rounded-lg bg-sage/[.08] p-4"><p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sage"><Lightbulb size={13} />Try this</p><p className="mt-2 text-sm font-medium leading-6 text-ink">{selected.suggestion}</p></div>
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5"><Check className="text-emerald-700" /><p className="mt-3 text-sm font-semibold text-emerald-900">No inline issues detected.</p><p className="mt-1 text-xs leading-5 text-emerald-700">Review the criterion notes for higher-level improvements.</p></div>
          )}
          {valid.length > 0 && <p className="mt-3 px-1 text-[11px] leading-4 text-slate-400">Select any highlighted phrase to inspect the feedback. {valid.length} inline issue{valid.length !== 1 && "s"} found.</p>}
        </aside>
      </div>
    </div>
  );
}
