// Production uses a same-origin Next.js rewrite. Local development can still
// provide NEXT_PUBLIC_API_URL=http://localhost:8000/api.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fieldLabel(location: unknown): string | null {
  if (!Array.isArray(location)) return null;
  const field = [...location].reverse().find((part) => typeof part === "string" && part !== "body");
  if (typeof field !== "string") return null;
  if (field === "duration_seconds") return "Writing duration";
  return field.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function detailMessage(detail: unknown): string | null {
  if (typeof detail === "string" && detail.trim()) return detail;
  if (Array.isArray(detail)) {
    const messages = detail.map(detailMessage).filter((message): message is string => Boolean(message));
    return messages.length ? [...new Set(messages)].join(" ") : null;
  }
  if (!isRecord(detail)) return null;

  if (typeof detail.msg === "string" && detail.msg.trim()) {
    const label = fieldLabel(detail.loc);
    return label ? `${label}: ${detail.msg}.` : detail.msg;
  }
  return detailMessage(detail.detail) || detailMessage(detail.message);
}

function apiErrorMessage(body: unknown): string {
  if (!isRecord(body)) return "Something went wrong. Please try again.";
  return detailMessage(body.detail) || detailMessage(body.message) || "Something went wrong. Please try again.";
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("essaytrace_token") : null;
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers, cache: "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401 && token && typeof window !== "undefined") {
      localStorage.removeItem("essaytrace_token");
      localStorage.removeItem("essaytrace_user");
      window.dispatchEvent(new Event("essaytrace-auth-expired"));
    }
    throw new ApiError(apiErrorMessage(body), response.status);
  }
  return response.json() as Promise<T>;
}
