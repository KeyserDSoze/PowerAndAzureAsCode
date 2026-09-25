import { getContext } from "@microsoft/power-apps/app";
import type { PlatformClient } from "../types";

export function createHostPlatformClient(): PlatformClient {
  return {
    host: "powerapps",
    async getCurrentUser() {
      const context = await getContext();
      return {
        id: context.user.objectId,
        displayName: context.user.fullName || context.user.userPrincipalName
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
