import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const name = valueAfter("--name");
const scope = valueAfter("--scope");

if (!name || !scope || !scope.startsWith("@")) {
  console.error('Usage: npm run rebrand -- --name "Product Name" --scope "@company"');
  process.exit(1);
}

const configPath = resolve("brand.config.json");
const config = JSON.parse(await readFile(configPath, "utf8"));
const oldName = config.productName;
const oldScope = config.npmScope;

config.productName = name;
config.shortName = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 24) || "Application";
config.npmScope = scope;
await writeFile(configPath, JSON.stringify(config, null, 2) + "\n");

for (const file of [
  "README.md",
  "apps/web/index.html",
  "apps/web/src/App.tsx",
  "apps/web/powerpages.config.json",
  "apps/web/package.json"
]) {
  const path = resolve(file);
  let content = await readFile(path, "utf8");
  content = content.replaceAll(oldName, name).replaceAll(oldScope, scope);
  await writeFile(path, content);
}

console.log("Repository-controlled branding updated.");
console.log("External Entra, Power Platform, Azure and GitHub resources were NOT renamed.");
