import { access, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const apiNameIndex = args.indexOf("--api-name");
const apiName = apiNameIndex >= 0 ? args[apiNameIndex + 1] : undefined;

if (!apiName || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(apiName)) {
  console.error(
    "Usage: node scripts/configure-powerapps-boilerplate-ping.mjs --api-name <publisher-prefix>_BoilerplatePing"
  );
  process.exit(1);
}

const serviceName = `${apiName}Service`;
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

const content = `import { parseBoilerplatePingPayload } from "../operations";
import type { BoilerplatePingResult } from "../operations";
import { ${serviceName} } from "../../generated/services/${serviceName}";

export async function invokeBoilerplatePing(
  message: string
): Promise<BoilerplatePingResult> {
  const result = await ${serviceName}.${apiName}(message);
  return parseBoilerplatePingPayload(result.value);
}
`;

await writeFile(bridgePath, content, "utf8");
console.log(`Power Apps BoilerplatePing bridge configured for ${apiName}.`);
