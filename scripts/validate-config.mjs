import { access, readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { assertNoForbiddenChatCitationTokens } from "./forbidden-chat-citations.mjs";

const requiredFiles = [
  "brand.config.json",
  "package-lock.json",
  ".node-version",
  ".nvmrc",
  "global.json",
  "src/frontend/.env.powerapps",
  "src/frontend/.env.powerpages",
  "src/frontend/.env.azure",
  "src/hosting/azure/staticwebapp.config.template.json",
  "src/hosting/azure/staticwebapp.singletenant.config.template.json",
  "infra/azure/main.bicep",
  "infra/azure/app-service.bicep",
  "infra/azure/key-vault.bicep",
  "infra/azure/observability.bicep",
  "scripts/bootstrap-runtime-dataverse-identity.sh",
  "scripts/bootstrap-dataverse-application-user.sh",
  "scripts/bootstrap-swa-entra.sh",
  "scripts/bootstrap-azure-deployment-identity.sh",
  "scripts/bootstrap-powerplatform-deployment-identity.sh",
  "scripts/bootstrap-powerplatform-solution.sh",
  "scripts/bootstrap-github-repository.sh",
  "scripts/verify-github-repository.sh",
  "scripts/install-powerpages-server-logic-example.mjs",
  "docs/20-github-repository-hardening.md",
  ".github/workflows/deploy-powerplatform-solution.yml",
  "src/backends/powerpages/README.md",
  "src/backends/azure-api/PowerAndAzureAsCode.Api/PowerAndAzureAsCode.Api.csproj",
  "src/backends/azure-api/PowerAndAzureAsCode.Api/packages.lock.json",
  "src/backends/dataverse/PowerAndAzureAsCode.Dataverse.Plugins/PowerAndAzureAsCode.Dataverse.Plugins.csproj",
  "src/backends/dataverse/PowerAndAzureAsCode.Dataverse.Plugins/packages.lock.json",
  "src/backends/powerpages/server-logic/health/server.js"
];

for (const file of requiredFiles) {
  await access(resolve(file));
}

const brand = JSON.parse(await readFile(resolve("brand.config.json"), "utf8"));
for (const key of ["productName", "shortName", "npmScope", "description"]) {
  if (!brand[key] || typeof brand[key] !== "string") {
    throw new Error(`brand.config.json is missing a valid ${key}`);
  }
}

if (!/^@[a-z0-9][a-z0-9._-]*$/i.test(brand.npmScope)) {
  throw new Error("brand.config.json npmScope must be a valid npm scope.");
}

const rootPackage = JSON.parse(await readFile(resolve("package.json"), "utf8"));
const frontendPackage = JSON.parse(
  await readFile(resolve("src/frontend/package.json"), "utf8")
);

if (rootPackage.version !== frontendPackage.version) {
  throw new Error(
    `Root/frontend versions differ: ${rootPackage.version} vs ${frontendPackage.version}`
  );
}

if (frontendPackage.name !== `${brand.npmScope}/web`) {
  throw new Error(
    `Frontend package name must be ${brand.npmScope}/web; found ${frontendPackage.name}`
  );
}

if (
  !Array.isArray(rootPackage.workspaces) ||
  !rootPackage.workspaces.includes("src/frontend")
) {
  throw new Error("Root package.json must include src/frontend as a workspace.");
}

const nodeVersion = (await readFile(resolve(".node-version"), "utf8")).trim();
const nvmVersion = (await readFile(resolve(".nvmrc"), "utf8")).trim();

if (!nodeVersion || nodeVersion !== nvmVersion) {
  throw new Error(
    `.node-version and .nvmrc must match exactly; found '${nodeVersion}' and '${nvmVersion}'.`
  );
}

const globalJson = JSON.parse(await readFile(resolve("global.json"), "utf8"));
if (!/^10\.0\.\d+$/.test(globalJson?.sdk?.version ?? "")) {
  throw new Error("global.json must pin an explicit .NET 10 SDK version.");
}

for (const envFile of [
  "src/frontend/.env.powerapps",
  "src/frontend/.env.powerpages",
  "src/frontend/.env.azure"
]) {
  const lines = (await readFile(resolve(envFile), "utf8"))
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  for (const line of lines) {
    const key = line.split("=", 1)[0];
    if (/(secret|password|token|private|certificate|connectionstring)/i.test(key)) {
      throw new Error(`${envFile} contains secret-like frontend key '${key}'.`);
    }
  }
}

const workflowDir = resolve(".github/workflows");
for (const entry of await readdir(workflowDir, { withFileTypes: true })) {
  if (!entry.isFile() || !/\.ya?ml$/i.test(entry.name)) continue;

  const workflowPath = resolve(workflowDir, entry.name);
  const workflow = await readFile(workflowPath, "utf8");

  for (const line of workflow.split(/\r?\n/)) {
    const match = line.match(/^\s*-?\s*uses:\s*([^\s#]+)@([^\s#]+)/);
    if (!match) continue;

    const [, action, ref] = match;
    if (action.startsWith("./")) continue;

    if (!/^[0-9a-f]{40}$/i.test(ref)) {
      throw new Error(
        `.github/workflows/${entry.name} uses unpinned action '${action}@${ref}'. Use a 40-character commit SHA.`
      );
    }
  }
}

await assertNoForbiddenChatCitationTokens(resolve("."));

console.log("Configuration and template invariants validation passed.");
