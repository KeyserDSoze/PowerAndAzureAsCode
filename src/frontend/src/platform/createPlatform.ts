import { createHostPlatformClient } from "@host-adapter";
import type { PlatformClient } from "./types";

export function createPlatformClient(): PlatformClient {
  return createHostPlatformClient();
}
