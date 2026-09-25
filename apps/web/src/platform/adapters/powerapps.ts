import type { PlatformClient } from "../types";

export function createPowerAppsPlatformClient(): PlatformClient {
  return {
    host: "powerapps",
    async getCurrentUser() {
      // Authentication belongs to the Power Apps host.
      // Map only the application-safe identity projection here in a derived application.
      return null;
    },
    async health() {
      return {
        status: "ok",
        host: "powerapps",
        detail: "Power Apps host loaded. Add Dataverse/connectors with the Power Apps CLI and keep generated services behind application repositories."
      };
    }
  };
}
