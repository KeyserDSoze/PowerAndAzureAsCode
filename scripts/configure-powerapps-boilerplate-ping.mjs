import { access, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  renderBoilerplatePingBridge,
  serviceNameForApi
} from "./powerapps-bridge.mjs";

const args = process.argv.slice(2);
const apiNameIndex = args.indexOf("--api-name");
const apiName = apiNameIndex >= 0 ? args[apiNameIndex + 1] : undefined;

if (!apiName) {
  console.error(
    "Usage: node scripts/configure-powerapps-boilerplate-ping.mjs --api-name <publisher-prefix>_BoilerplatePing"
  );
  process.exit(1);
}

let serviceName;
try {
  serviceName = serviceNameForApi(apiName);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Invalid Dataverse API name.");
  process.exit(1);
}

const servicePath = resolve(
  "src/frontend/src/generated/services",
  `${serviceName}.ts`
);

try {
  await access(servicePath);
} catch {
  console.error(
    `Generated service not found: ${servicePath}\nRun from src/frontend: npx --no-install pa app add dataverse-api --api-name ${apiName}`
  );
  process.exit(1);
}

const bridgePath = resolve(
  "src/frontend/src/platform/powerapps/boilerplatePingBridge.ts"
);

await writeFile(bridgePath, renderBoilerplatePingBridge(apiName), "utf8");
console.log(`Power Apps BoilerplatePing bridge configured for ${apiName}.`);
