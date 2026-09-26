import type { BoilerplatePingResult } from "../operations";

/**
 * Template seam for the Power Apps generated Dataverse Custom API service.
 *
 * After initializing the Code App and adding the Custom API with:
 *
 *   pa app add dataverse-api --api-name <publisher-prefix>_BoilerplatePing
 *
 * replace this implementation with a thin wrapper around the generated service.
 * Keep the generated transport behind this file so shared feature code never
 * imports tenant/environment generated code directly.
 */
export async function invokeBoilerplatePing(
  _message: string
): Promise<BoilerplatePingResult> {
  throw new Error(
    "Power Apps BoilerplatePing is not configured. Add the Dataverse Custom API with Power Apps CLI and wire the generated service in platform/powerapps/boilerplatePingBridge.ts."
  );
}
