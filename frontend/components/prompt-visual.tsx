"use client";

import { ArrowDown, Compass, RotateCcw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Prompt } from "@/lib/types";

type Series = { key: string; label: string; color: string };
type CartesianData = { xKey: string; series: Series[]; rows: Array<Record<string, string | number>>; unit?: string };
type TableData = { columns: string[]; rows: Array<Array<string | number>> };
type PieData = { charts: Array<{ label: string; values: Array<{ name: string; value: number }> }> };
type ProcessData = { cyclical?: boolean; steps: Array<{ title: string; description: string; phase?: string }> };
type MapFeature = { name: string; x: number; y: number; w: number; h: number; kind: string };
type MapData = { maps: Array<{ label: string; features: MapFeature[] }> };

const pieColors = ["#8b5cf6", "#38bdf8", "#34d399", "#f59e0b", "#a1a1aa"];
const seriesColors = ["#8b5cf6", "#38bdf8", "#34d399", "#f59e0b"];

export function PromptVisual({ prompt, compact = false }: { prompt: Prompt; compact?: boolean }) {
  if (!prompt.visualization_type || !prompt.data) return null;
  const height = compact ? 270 : 330;

  if (prompt.visualization_type === "line" || prompt.visualization_type === "bar") {
    const data = prompt.data as CartesianData;
    const Chart = prompt.visualization_type === "line" ? LineChart : BarChart;
    return (
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={data.rows} margin={{ top: 12, right: 8, bottom: 4, left: -12 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis dataKey={data.xKey} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--chart-text)" }} dy={8} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--chart-text)" }} />
            <Tooltip contentStyle={{ color: "var(--ink)", backgroundColor: "var(--chart-tooltip)", fontSize: 12, border: "1px solid var(--border)", borderRadius: 8 }} formatter={(value) => [`${value}${data.unit?.startsWith("%") ? "%" : ""}`, data.unit || "Value"]} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 14 }} />
            {data.series.map((series, index) => prompt.visualization_type === "line" ? <Line key={series.key} type="monotone" dataKey={series.key} name={series.label} stroke={seriesColors[index % seriesColors.length]} strokeWidth={2.5} dot={{ r: 3 }} /> : <Bar key={series.key} dataKey={series.key} name={series.label} fill={seriesColors[index % seriesColors.length]} radius={[3, 3, 0, 0]} />)}
          </Chart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (prompt.visualization_type === "table") {
    const data = prompt.data as TableData;
    return <div className="max-w-full overflow-x-auto"><table className="prompt-table min-w-[620px] w-full border-collapse text-xs"><thead><tr>{data.columns.map((column, index) => <th key={column} scope="col" className={`px-3 py-3 font-bold ${index === 0 ? "text-left" : "text-right"}`}>{column}</th>)}</tr></thead><tbody>{data.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className={`px-3 py-3 ${cellIndex === 0 ? "text-left font-medium" : "text-right tabular-nums"}`}>{cell}</td>)}</tr>)}</tbody></table></div>;
  }

  if (prompt.visualization_type === "pie") {
    const data = prompt.data as PieData;
    return <div className="grid gap-4 sm:grid-cols-2">{data.charts.map((chart) => <div key={chart.label} className="text-center"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{chart.label}</p><div className={compact ? "h-56" : "h-64"}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chart.values} dataKey="value" nameKey="name" innerRadius="35%" outerRadius="70%" paddingAngle={1} label={({ value }) => `${value}%`} labelLine={false}>{chart.values.map((_, index) => <Cell key={index} fill={pieColors[index % pieColors.length]} />)}</Pie><Tooltip contentStyle={{ color: "var(--ink)", backgroundColor: "var(--chart-tooltip)", border: "1px solid var(--border)", borderRadius: 8 }} formatter={(value) => `${value}%`} /><Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} /></PieChart></ResponsiveContainer></div></div>)}</div>;
  }

  if (prompt.visualization_type === "process") {
    const data = prompt.data as ProcessData;
    return <div className="mx-auto max-w-xl"><div>{data.steps.map((step, index) => <div key={`${step.title}-${index}`} className="grid grid-cols-[38px_minmax(0,1fr)] gap-3"><div className="flex flex-col items-center"><span className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-violet-400/30 bg-violet-500/15 text-xs font-bold text-violet-700 dark:text-violet-300">{index + 1}</span>{index < data.steps.length - 1 && <div className="flex min-h-10 flex-1 flex-col items-center"><span className="h-full w-px bg-gradient-to-b from-violet-400/60 to-violet-400/15" /><ArrowDown className="-mt-2 shrink-0 text-violet-500" size={14} /></div>}</div><article className={`rounded-lg border border-slate-200 bg-white px-4 py-3.5 dark:border-zinc-800 ${index < data.steps.length - 1 ? "mb-3" : ""}`}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-bold">{step.title}</h3>{step.phase && <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">{step.phase}</span>}</div><p className="mt-1.5 text-xs leading-5 text-slate-500">{step.description}</p></article></div>)}</div>{data.cyclical && <div className="ml-[50px] mt-3 flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"><RotateCcw size={13} />Used products return to collection and the cycle begins again.</div>}</div>;
  }

  if (prompt.visualization_type === "map") {
    const data = prompt.data as MapData;
    const kindClass: Record<string, string> = {
      building: "border-violet-400/40 bg-violet-500/20 text-violet-950 dark:text-violet-100",
      gallery: "border-violet-400/40 bg-violet-500/20 text-violet-950 dark:text-violet-100",
      books: "border-sky-400/40 bg-sky-500/20 text-sky-950 dark:text-sky-100",
      technology: "border-cyan-400/40 bg-cyan-500/20 text-cyan-950 dark:text-cyan-100",
      children: "border-amber-400/45 bg-amber-400/20 text-amber-950 dark:text-amber-100",
      hall: "border-indigo-400/35 bg-indigo-400/15 text-indigo-950 dark:text-indigo-100",
      service: "border-orange-400/40 bg-orange-400/20 text-orange-950 dark:text-orange-100",
      entrance: "border-rose-400/50 bg-rose-400/20 text-rose-950 dark:text-rose-100",
      lot: "border-slate-400/50 bg-slate-400/25 text-slate-900 dark:text-slate-100",
      green: "border-emerald-400/45 bg-emerald-500/20 text-emerald-950 dark:text-emerald-100",
      road: "rounded-full border-stone-400/50 bg-stone-400/30 text-stone-900 dark:text-stone-100",
      water: "border-sky-400/45 bg-sky-500/25 text-sky-950 dark:text-sky-100",
    };
    const kindLabel: Record<string, string> = { building: "Building", gallery: "Gallery", books: "Book area", technology: "Technology", children: "Children", hall: "Shared space", service: "Service", entrance: "Entrance", lot: "Parking", green: "Green space", road: "Road / path", water: "Water" };
    const kinds = Array.from(new Set(data.maps.flatMap((map) => map.features.map((feature) => feature.kind))));
    return <div><div className="grid gap-5 xl:grid-cols-2">{data.maps.map((map) => <figure key={map.label} className="min-w-0"><figcaption className="mb-2 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider text-slate-500"><span>{map.label}</span><span className="inline-flex items-center gap-1 text-[9px] tracking-normal"><Compass size={12} />N</span></figcaption><div className="prompt-map-canvas relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-300 dark:border-zinc-700" role="img" aria-label={`${prompt.title}, ${map.label}`}>{map.features.map((feature, index) => <div key={`${feature.name}-${index}`} className={`absolute grid place-items-center border p-1 text-center text-[10px] font-semibold leading-tight shadow-sm ${kindClass[feature.kind] || "border-slate-400/40 bg-slate-400/20"}`} style={{ left: `${feature.x}%`, top: `${feature.y}%`, width: `${feature.w}%`, height: `${feature.h}%` }}>{feature.name}</div>)}</div></figure>)}</div><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{kinds.map((kind) => <span key={kind} className="inline-flex items-center gap-1.5 text-[9px] font-semibold text-slate-500"><span className={`h-2.5 w-2.5 rounded-sm border ${kindClass[kind] || "border-slate-400/40 bg-slate-400/20"}`} />{kindLabel[kind] || kind.replaceAll("_", " ")}</span>)}</div></div>;
  }
  return null;
}
