// Front-end-only mock auth & history. Replace with a real backend later.
export type MockUser = { email: string; token: string };
export type StoredMessage = { text: string; images: { id: number; type: "image" | "link"; text: string; src: string }[] };
export type Investigation = { id: string; title: string; messages: StoredMessage[]; updatedAt: number };

const AUTH_KEY = "oluyewo.auth";
const historyKey = (email: string) => `oluyewo.history.${email.toLowerCase()}`;

export function loadUser(): MockUser | null {
  try { const raw = localStorage.getItem(AUTH_KEY); return raw ? (JSON.parse(raw) as MockUser) : null; } catch { return null; }
}
export function mockLogin(email: string): MockUser {
  const user = { email: email.trim(), token: `mock-${Date.now().toString(36)}` };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  return user;
}
export function mockLogout() { localStorage.removeItem(AUTH_KEY); }

export function initials(email: string): string {
  const name = email.split("@")[0] ?? "";
  const parts = name.split(/[._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? parts[0]?.[1] ?? "")).toUpperCase() || "U";
}

export function loadHistory(email: string): Investigation[] {
  try { const raw = localStorage.getItem(historyKey(email)); return raw ? (JSON.parse(raw) as Investigation[]) : []; } catch { return []; }
}
export function saveHistory(email: string, list: Investigation[]) {
  try { localStorage.setItem(historyKey(email), JSON.stringify(list)); } catch { /* quota exceeded: ignore */ }
}
