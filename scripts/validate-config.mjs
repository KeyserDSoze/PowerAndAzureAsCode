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
  "scripts/check-powerplatform-auth.sh",
  "scripts/pin-powerplatform-solution-package-cli.mjs",
  "scripts/powerapps-deployment-target.mjs",
  "scripts/validate-powerapps-deployment-target.mjs",
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
if (!/^10\.0\.4\d{2}$/.test(globalJson?.sdk?.version ?? "")) {
  throw new Error("global.json must pin the .NET 10.0.4xx SDK feature band.");
}

if (globalJson?.sdk?.rollForward !== "latestPatch") {
  throw new Error("global.json must keep rollForward=latestPatch for the pinned 10.0.4xx feature band.");
}

if (!frontendPackage.scripts?.dev?.includes("--mode powerapps") ||
    !frontendPackage.scripts?.dev?.includes("--port 3000") ||
    !frontendPackage.scripts?.dev?.includes("--strictPort")) {
  throw new Error("src/frontend npm dev must start the Power Apps Vite host on strict port 3000.");
}

if (!rootPackage.scripts?.["dev:powerapps"] || !frontendPackage.scripts?.["dev:azure"]) {
  throw new Error("Root/frontend package scripts must expose explicit Power Apps and Azure dev commands.");
}

const pluginProject = await readFile(
  resolve("src/backends/dataverse/PowerAndAzureAsCode.Dataverse.Plugins/PowerAndAzureAsCode.Dataverse.Plugins.csproj"),
  "utf8"
);

if (!pluginProject.includes("<TargetFramework>net462</TargetFramework>")) {
  throw new Error("Dataverse plug-in package must target net462 for package/solution compatibility.");
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


const powerAppsDeployWorkflow = await readFile(
  resolve(".github/workflows/deploy-powerapps.yml"),
  "utf8"
);

for (const requiredSnippet of [
  "POWERAPPS_ENVIRONMENT_NAME",
  "POWERAPPS_SOLUTION_ID",
  "--solution-id",
  "validate-powerapps-deployment-target.mjs"
]) {
  if (!powerAppsDeployWorkflow.includes(requiredSnippet)) {
    throw new Error(
      `Power Apps deployment workflow is missing field-tested guard '${requiredSnippet}'.`
    );
  }
}


const powerAppsTargetValidator = await readFile(
  resolve("scripts/powerapps-deployment-target.mjs"),
  "utf8"
);

for (const requiredSnippet of [
  "Default-",
  "POWERAPPS_SOLUTION_ID",
  "dedicated non-default environment"
]) {
  if (!powerAppsTargetValidator.includes(requiredSnippet)) {
    throw new Error(
      `Power Apps deployment target validation is missing field-tested guard '${requiredSnippet}'.`
    );
  }
}

if (powerAppsDeployWorkflow.includes("pa app push --non-interactive\n")) {
  throw new Error(
    "Power Apps deployment workflow must never fall back to pa app push without --solution-id."
  );
}

const solutionDeployWorkflow = await readFile(
  resolve(".github/workflows/deploy-powerplatform-solution.yml"),
  "utf8"
);

for (const requiredSnippet of [
  "POWERPLATFORM_PLUGIN_PACKAGE_ID",
  "pac plugin push",
  "--no-incremental",
  "--locked-mode"
]) {
  if (!solutionDeployWorkflow.includes(requiredSnippet)) {
    throw new Error(
      `Power Platform solution workflow is missing field-tested guard '${requiredSnippet}'.`
    );
  }
}

const codeqlWorkflow = await readFile(
  resolve(".github/workflows/codeql.yml"),
  "utf8"
);

if (!codeqlWorkflow.includes("actions: read")) {
  throw new Error("CodeQL workflow must request actions: read for private repositories.");
}

if (!codeqlWorkflow.includes("CODEQL_ENABLED")) {
  throw new Error(
    "CodeQL workflow must explicitly gate private-repository analysis on CODEQL_ENABLED."
  );
}

await assertNoForbiddenChatCitationTokens(resolve("."));

console.log("Configuration and template invariants validation passed.");
