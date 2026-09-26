import {
  isHealthyPayload,
  parseBoilerplatePingPayload,
  readApplicationError,
  validateBoilerplatePingMessage
} from "../operations";
import type { PlatformClient } from "../types";

type PowerPagesWindow = Window & {
  Microsoft?: {
    Dynamic365?: {
      Portal?: {
        User?: {
          userName?: string;
          firstName?: string;
          lastName?: string;
        };
      };
    };
  };
};

async function getCsrfToken(): Promise<string> {
  const response = await fetch("/_layout/tokenhtml", { credentials: "same-origin" });
  if (!response.ok) {
    throw new Error(`Unable to obtain Power Pages CSRF token: ${response.status}`);
  }

  const html = await response.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const token = doc.querySelector<HTMLInputElement>(
    'input[name="__RequestVerificationToken"]'
  )?.value;

  if (!token) throw new Error("Power Pages CSRF token was not present.");
  return token;
}

async function safeServerLogicFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("__RequestVerificationToken", await getCsrfToken());
  headers.set("Accept", "application/json");
  return fetch(path, { ...init, headers, credentials: "same-origin" });
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error("Power Pages Server Logic returned invalid JSON.");
  }
}

export function createHostPlatformClient(): PlatformClient {
  return {
    host: "powerpages",
    async getCurrentUser() {
      const user = (window as PowerPagesWindow).Microsoft?.Dynamic365?.Portal?.User;
      if (!user?.userName) return null;

      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
      return {
        id: user.userName,
        displayName: fullName || user.userName
      };
    },
    async health() {
      try {
        const response = await safeServerLogicFetch("/_api/serverlogics/health");
        if (!response.ok) {
          return {
            status: "degraded",
            host: "powerpages",
            detail: `Health Server Logic returned HTTP ${response.status}. Configure the health record/web role or replace this starter check.`
          };
        }

        const payload = await readJson(response);
        if (!isHealthyPayload(payload)) {
          const applicationError = readApplicationError(payload);
          return {
            status: "degraded",
            host: "powerpages",
            detail: applicationError ?? "Power Pages Server Logic reported an unhealthy payload."
          };
        }

        return {
          status: "ok",
          host: "powerpages",
          detail: "Power Pages session and Server Logic are reachable."
        };
      } catch (error) {
        return {
          status: "degraded",
          host: "powerpages",
          detail: error instanceof Error ? error.message : "Power Pages health check failed."
        };
      }
    },
    async boilerplatePing(message) {
      const normalizedMessage = validateBoilerplatePingMessage(message);
      const response = await safeServerLogicFetch("/_api/serverlogics/boilerplate-ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: normalizedMessage })
      });

      const payload = await readJson(response);
      if (!response.ok) {
        throw new Error(
          readApplicationError(payload) ??
            `Power Pages boilerplate ping returned HTTP ${response.status}.`
        );
      }

      return parseBoilerplatePingPayload(payload);
    }
  };
}
