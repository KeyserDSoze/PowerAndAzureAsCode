export function serviceNameForApi(apiName) {
  if (!apiName || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(apiName)) {
    throw new Error("Invalid Dataverse API name.");
  }

  return `${apiName[0].toUpperCase()}${apiName.slice(1)}Service`;
}

export function renderBoilerplatePingBridge(apiName) {
  const serviceName = serviceNameForApi(apiName);

  return `import { parseBoilerplatePingPayload } from "../operations";
import type { BoilerplatePingResult } from "../operations";
import { ${serviceName} } from "../../generated/services/${serviceName}";

export async function invokeBoilerplatePing(
  message: string
): Promise<BoilerplatePingResult> {
  const result = await ${serviceName}.${apiName}(message);

  if (!result.success) {
    throw result.error ?? new Error("Power Apps Dataverse operation failed.");
  }

  return parseBoilerplatePingPayload(result.data);
}
`;
}
