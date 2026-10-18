import { Loader2 } from "lucide-react";

export function PageLoading({ label = "Loading your workspace…" }: { label?: string }) {
  return <div className="grid min-h-[60vh] place-items-center"><div className="flex items-center gap-3 text-sm font-medium text-slate-500"><Loader2 className="animate-spin text-coral" size={19} />{label}</div></div>;
}

