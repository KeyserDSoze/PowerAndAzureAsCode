import type { BoilerplatePingResult } from "./operations";

export type HostTarget = "powerapps" | "powerpages" | "azure";

export interface UserIdentity {
  id: string;
  displayName: string;
  roles?: string[];
}

export interface HealthResult {
  status: "ok" | "degraded";
  host: HostTarget;
  detail?: string;
}

export interface PlatformClient {
  readonly host: HostTarget;
  getCurrentUser(): Promise<UserIdentity | null>;
  health(): Promise<HealthResult>;
  boilerplatePing(message: string): Promise<BoilerplatePingResult>;
}
