export type AppSession = {
  user_id: string;
  company_id: string;
  username: string;
  full_name: string;
  role: string;
  master_admin?: boolean;
  company_admin?: boolean;
  company_name?: string;
  owner_company?: boolean;
  subscription_status?: string;
  subscription_due_date?: string;
  company_blocked?: boolean;
};

const KEY = "fixora_session";

export function setSession(session: AppSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(session));
  localStorage.setItem("fixora_last_username", session.username || "");
}

export function getSession(): AppSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
