import type { HostTarget, PlatformClient } from "./types";
import { createAzurePlatformClient } from "./adapters/azure";
import { createPowerAppsPlatformClient } from "./adapters/powerapps";
import { createPowerPagesPlatformClient } from "./adapters/powerpages";

export function createPlatformClient(): PlatformClient {
  const target = import.meta.env.VITE_HOST_TARGET as HostTarget | undefined;

  switch (target) {
    case "powerapps": return createPowerAppsPlatformClient();
    case "powerpages": return createPowerPagesPlatformClient();
    case "azure": return createAzurePlatformClient();
    default:
      throw new Error("VITE_HOST_TARGET must be powerapps, powerpages or azure.");
  }
}
