export type User = { id: number; name: string; email: string; is_demo: boolean };

export type Prompt = {
  id: number;
  task_type: "task1" | "task2";
  title: string;
  instructions: string;
  category: string;
  topic: string;
  visualization_type: "line" | "bar" | "pie" | "table" | "process" | "map" | null;
  data: Record<string, unknown> | null;
};

export type Criterion = {
  criterion: string;
  band: number;
  explanation: string;
  recommendation: string;
};

export type Mistake = {
  id: number;
  text: string;
  start: number;
  end: number;
  category: string;
  severity: "low" | "medium" | "high";
  explanation: string;
  suggestion: string;
};

export type EssayListItem = {
  id: number;
  prompt_id: number;
  submitted_at: string;
  task_type: "task1" | "task2";
  topic: string;
  title: string;
  overall_band: number | null;
  word_count: number;
  duration_seconds: number;
  status: string;
  is_revision: boolean;
  revision_of_id: number | null;
};

export type EssayDetail = EssayListItem & {
  prompt: Prompt;
  essay_text: string;
  started_at: string;
  evaluation_mode: string | null;
  evaluation_error: string | null;
  criteria: Criterion[];
  strengths: string[];
  improvements: string[];
  mistakes: Mistake[];
};

export type Weakness = {
  category: string;
  occurrences: number;
  essay_count: number;
  recent_essay_total: number;
  recent_percentage: number;
  trend: "improving" | "stable" | "needs attention";
  recurring: boolean;
};

export type WeaknessExample = {
  id: number;
  submission_id: number;
  submitted_at: string;
  task_type: "task1" | "task2";
  topic: string;
  title: string;
  text: string;
  context_before: string;
  context_after: string;
  severity: "low" | "medium" | "high";
  explanation: string;
  suggestion: string;
};

export type WeaknessDetail = {
  category: string;
  occurrences: number;
  essay_count: number;
  tip: string;
  examples: WeaknessExample[];
};

export type GeneralTip = {
  title: string;
  guidance: string;
  evidence: string;
};

export type Dashboard = {
  completed_essays: number;
  average_band: number | null;
  task1_average: number | null;
  task2_average: number | null;
  strongest_criterion: string | null;
  weakest_criterion: string | null;
  trend: Array<{
    id: number;
    date: string;
    task_type: "task1" | "task2";
    overall: number;
    task: number;
    coherence: number;
    lexical: number;
    grammar: number;
  }>;
  weaknesses: Weakness[];
  general_tips: GeneralTip[];
  recent_essays: EssayListItem[];
};
