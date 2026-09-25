import type { PlatformClient } from "../types";

async function getCsrfToken(): Promise<string> {
  const response = await fetch("/_layout/tokenhtml", { credentials: "same-origin" });
  if (!response.ok) throw new Error(`Unable to obtain Power Pages CSRF token: ${response.status}`);

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const token = doc.querySelector<HTMLInputElement>('input[name="__RequestVerificationToken"]')?.value;
  if (!token) throw new Error("Power Pages CSRF token was not present.");
  return token;
}

async function safeServerLogicFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("__RequestVerificationToken", await getCsrfToken());
  headers.set("Accept", "application/json");
  return fetch(path, { ...init, headers, credentials: "same-origin" });
}

export function createPowerPagesPlatformClient(): PlatformClient {
  return {
    host: "powerpages",
    async getCurrentUser() {
      return null;
    },
    async health() {
      try {
        const response = await safeServerLogicFetch("/_api/serverlogics/health");
        if (!response.ok) {
          return { status: "degraded", host: "powerpages", detail: `Health Server Logic returned HTTP ${response.status}. Configure the health record/web role or replace this starter check.` };
        }
        return { status: "ok", host: "powerpages", detail: "Power Pages session and Server Logic are reachable." };
      } catch (error) {
        return { status: "degraded", host: "powerpages", detail: error instanceof Error ? error.message : "Power Pages health check failed." };
      }
    }
  };
}
