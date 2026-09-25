import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const requiredFiles = [
  "brand.config.json",
  "apps/web/.env.powerapps",
  "apps/web/.env.powerpages",
  "apps/web/.env.azure",
  "azure/staticwebapp.config.template.json",
  "src/azure-api/PowerAndAzureAsCode.Api/PowerAndAzureAsCode.Api.csproj"
];

for (const file of requiredFiles) await access(resolve(file));

const brand = JSON.parse(await readFile(resolve("brand.config.json"), "utf8"));
for (const key of ["productName", "shortName", "npmScope", "description"]) {
  if (!brand[key] || typeof brand[key] !== "string") {
    throw new Error(`brand.config.json is missing a valid ${key}`);
  }
}

console.log("Configuration validation passed.");
