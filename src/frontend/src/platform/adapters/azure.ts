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

export function createHostPlatformClient(): PlatformClient {
  return {
    host: "azure",
    getCurrentUser: readUser,
    async health() {
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

      return { status: "ok", host: "azure", detail: "Azure Static Web App and linked .NET API are reachable." };
    }
  };
}
