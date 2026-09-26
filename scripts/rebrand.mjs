import { readFile, readdir, rename, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const displayName = valueAfter("--name");
const scope = valueAfter("--scope");

if (!displayName || !scope || !scope.startsWith("@")) {
  console.error('Usage: npm run rebrand -- --name "Product Name" --scope "@company"');
  process.exit(1);
}

const toCodeName = (value) => {
  const compact = value.replace(/[^a-zA-Z0-9]/g, "");
  if (!compact) return "Application";
  return /^[0-9]/.test(compact) ? `App${compact}` : compact;
};

const toPackageName = (value) =>
  value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "application";

const configPath = resolve("brand.config.json");
const config = JSON.parse(await readFile(configPath, "utf8"));

const oldDisplayName = config.productName;
const oldCodeName = toCodeName(oldDisplayName);
const oldScope = config.npmScope;
const newCodeName = toCodeName(displayName);

config.productName = displayName;
config.shortName = newCodeName.slice(0, 24);
config.npmScope = scope;
await writeFile(configPath, JSON.stringify(config, null, 2) + "\n");

const displayFiles = [
  "src/frontend/index.html",
  "src/frontend/src/App.tsx",
  "src/frontend/powerpages.config.json"
];

for (const file of displayFiles) {
  const path = resolve(file);
  let content = await readFile(path, "utf8");
  content = content
    .replaceAll(oldDisplayName, displayName)
    .replaceAll(oldScope, scope);
  await writeFile(path, content);
}

const readmePath = resolve("README.md");
let readme = await readFile(readmePath, "utf8");
readme = readme.replace(
  `# ${oldDisplayName}\n`,
  `# ${displayName}\n`
);
await writeFile(readmePath, readme);

const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  "bin",
  "obj",
  "artifacts",
  ".powerpages-site"
]);

const textExtensions = new Set([
  ".md", ".json", ".ts", ".tsx", ".js", ".mjs", ".yml", ".yaml",
  ".cs", ".csproj", ".bicep", ".sh", ".html", ".xml", ".config"
]);

const displayFileSet = new Set(displayFiles.map((file) => resolve(file)));

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const result = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const full = join(directory, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await walk(full)));
    } else {
      result.push(full);
    }
  }

  return result;
}

const files = await walk(resolve("."));

for (const file of files) {
  if (displayFileSet.has(file) || !textExtensions.has(extname(file))) continue;

  let content = await readFile(file, "utf8");
  const next = content
    .replaceAll(oldCodeName, newCodeName)
    .replaceAll(oldScope, scope);

  if (next !== content) {
    await writeFile(file, next);
  }
}

const rootPackagePath = resolve("package.json");
const rootPackage = JSON.parse(await readFile(rootPackagePath, "utf8"));
rootPackage.name = toPackageName(displayName);
await writeFile(rootPackagePath, JSON.stringify(rootPackage, null, 2) + "\n");

const frontendPackagePath = resolve("src/frontend/package.json");
const frontendPackage = JSON.parse(await readFile(frontendPackagePath, "utf8"));
frontendPackage.name = `${scope}/web`;
await writeFile(frontendPackagePath, JSON.stringify(frontendPackage, null, 2) + "\n");

const packageLockPath = resolve("package-lock.json");
const packageLock = JSON.parse(await readFile(packageLockPath, "utf8"));
packageLock.name = rootPackage.name;

if (packageLock.packages?.[""]) {
  packageLock.packages[""].name = rootPackage.name;
}

if (packageLock.packages?.["src/frontend"]) {
  packageLock.packages["src/frontend"].name = frontendPackage.name;
}

await writeFile(packageLockPath, JSON.stringify(packageLock, null, 2) + "\n");

async function renameMatchingPaths(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const current = join(directory, entry.name);

    if (entry.isDirectory()) {
      await renameMatchingPaths(current);
    }

    if (entry.name.includes(oldCodeName)) {
      const renamed = join(
        directory,
        entry.name.replaceAll(oldCodeName, newCodeName)
      );
      await rename(current, renamed);
    }
  }
}

await renameMatchingPaths(resolve("src"));

console.log(`Display name: ${displayName}`);
console.log(`Code identifier: ${newCodeName}`);
console.log(`npm scope: ${scope}`);
console.log("Repository-controlled source names and project paths updated.");
console.log("External Entra, Power Platform, Azure, GitHub and existing .powerpages-site resources were NOT renamed.");
