import { getContext } from "@microsoft/power-apps/app";
import type { PlatformClient } from "../types";

export function createHostPlatformClient(): PlatformClient {
  return {
    host: "powerapps",
    async getCurrentUser() {
      const context = await getContext();
      const id = context.user.objectId ?? context.user.userPrincipalName;
      if (!id) return null;

      return {
        id,
        displayName: context.user.fullName ?? context.user.userPrincipalName ?? id
      };
    },
    async health() {
      try {
        await getContext();
        return {
          status: "ok",
          host: "powerapps",
          detail: "Power Apps host context is reachable."
        };
      } catch (error) {
        return {
          status: "degraded",
          host: "powerapps",
          detail: error instanceof Error ? error.message : "Power Apps host context is unavailable."
        };
      }
    }
  };
}
