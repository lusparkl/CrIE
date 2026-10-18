"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Dashboard } from "@/lib/types";

export function ProgressChart({ data }: { data: Dashboard["trend"] }) {
  const formatted = data.map((point) => ({ ...point, label: new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(point.date)) }));
  if (!data.length) return <div className="grid h-72 place-items-center text-sm text-slate-400">Your criterion trends will appear after your first evaluation.</div>;
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted} margin={{ top: 16, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--chart-text)", fontSize: 11 }} dy={10} />
          <YAxis domain={[3, 9]} ticks={[3, 4, 5, 6, 7, 8, 9]} axisLine={false} tickLine={false} tick={{ fill: "var(--chart-text)", fontSize: 11 }} />
          <Tooltip contentStyle={{ backgroundColor: "var(--chart-tooltip)", color: "var(--ink)", borderRadius: 10, border: "1px solid var(--border)", boxShadow: "0 12px 30px rgba(0,0,0,.18)", fontSize: 12 }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 18 }} />
          <Line name="Task" type="monotone" dataKey="task" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line name="Coherence" type="monotone" dataKey="coherence" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line name="Lexical" type="monotone" dataKey="lexical" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line name="Grammar" type="monotone" dataKey="grammar" stroke="#fb7185" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
