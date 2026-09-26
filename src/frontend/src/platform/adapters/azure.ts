import {
  isHealthyPayload,
  parseBoilerplatePingPayload,
  validateBoilerplatePingMessage
} from "../operations";
import type { PlatformClient, UserIdentity } from "../types";

interface StaticWebAppsMe {
  clientPrincipal?: {
    userId?: string;
    userDetails?: string;
    userRoles?: string[];
  };
}

async function readUser(): Promise<UserIdentity | null> {
  const response = await fetch("/.auth/me", { credentials: "same-origin" });
  if (!response.ok) return null;

  const payload = (await response.json()) as StaticWebAppsMe;
  const principal = payload.clientPrincipal;
  if (!principal?.userId) return null;

  return {
    id: principal.userId,
    displayName: principal.userDetails ?? principal.userId,
    roles: principal.userRoles ?? []
  };
}

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as Record<string, unknown>;
    const message = payload.detail ?? payload.title ?? payload.message;
    return typeof message === "string" && message.trim() ? message : fallback;
  } catch {
    return fallback;
  }
}

export function createHostPlatformClient(): PlatformClient {
  return {
    host: "azure",
    getCurrentUser: readUser,
    async health() {
      try {
        const response = await fetch("/api/health", {
          credentials: "same-origin",
          headers: { Accept: "application/json" }
        });

        if (!response.ok) {
          return {
            status: "degraded",
            host: "azure",
            detail: `Azure API returned HTTP ${response.status}.`
          };
        }

        const payload = await response.json();
        if (!isHealthyPayload(payload)) {
          return {
            status: "degraded",
            host: "azure",
            detail: "Azure API returned an unhealthy application payload."
          };
        }

        return {
          status: "ok",
          host: "azure",
          detail: "Azure Static Web App and linked .NET API are reachable."
        };
      } catch (error) {
        return {
          status: "degraded",
          host: "azure",
          detail: error instanceof Error ? error.message : "Azure API health check failed."
        };
      }
    },
    async boilerplatePing(message) {
      const normalizedMessage = validateBoilerplatePingMessage(message);
      const response = await fetch("/api/boilerplate-ping", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: normalizedMessage })
      });

      if (!response.ok) {
        throw new Error(
          await readError(
            response,
            `Azure boilerplate ping returned HTTP ${response.status}.`
          )
        );
      }

      return parseBoilerplatePingPayload(await response.json());
    }
  };
}
