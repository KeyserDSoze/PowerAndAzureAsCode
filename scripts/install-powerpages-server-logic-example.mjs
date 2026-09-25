import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const values = new Map();

for (let index = 0; index < args.length; index += 2) {
  values.set(args[index], args[index + 1]);
}

const name = values.get("--name");
const roleName = values.get("--web-role-name");
const roleIdInput = values.get("--web-role-id");
const publisherPrefix = values.get("--publisher-prefix");

if (!["health", "boilerplate-ping"].includes(name) || (!roleName && !roleIdInput)) {
  console.error(
    'Usage: node scripts/install-powerpages-server-logic-example.mjs --name <health|boilerplate-ping> (--web-role-name "Authenticated Users" | --web-role-id <guid>) [--publisher-prefix abc]'
  );
  process.exit(1);
}

if (
  name === "boilerplate-ping" &&
  (!publisherPrefix || !/^[A-Za-z][A-Za-z0-9]{1,7}$/.test(publisherPrefix))
) {
  throw new Error(
    "--publisher-prefix is required for boilerplate-ping and must be 2-8 alphanumeric characters starting with a letter."
  );
}

const projectRoot = resolve("src/frontend");
const metadataRoot = resolve(projectRoot, ".powerpages-site");
const rolesRoot = resolve(metadataRoot, "web-roles");
const outputRoot = resolve(metadataRoot, "server-logic", name);
const templatePath = resolve(
  "src/backends/powerpages/server-logic",
  name,
  "server.js"
);

await readdir(metadataRoot).catch(() => {
  throw new Error(
    "src/frontend/.powerpages-site does not exist. Deploy or download the Power Pages code site locally once, commit the generated metadata, then install server logic."
  );
});

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else {
      files.push(full);
    }
  }

  return files;
}

let roleId = roleIdInput;

if (!roleId && roleName) {
  const roleFiles = (await walk(rolesRoot)).filter((file) =>
    file.endsWith(".webrole.yml")
  );

  for (const file of roleFiles) {
    const yaml = await readFile(file, "utf8");
    const fileName = yaml.match(/^name:\s*(.+)$/m)?.[1]?.trim();

    if (fileName === roleName) {
      roleId = yaml.match(
        /^id:\s*([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/m
      )?.[1];

      if (roleId) break;
    }
  }
}

if (
  !roleId ||
  !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(roleId)
) {
  throw new Error("Unable to resolve a valid Power Pages web-role GUID.");
}

function stableGuid(value) {
  const chars = createHash("sha256").update(value).digest("hex").slice(0, 32).split("");
  chars[12] = "5";
  chars[16] = ["8", "9", "a", "b"][parseInt(chars[16], 16) % 4];

  const compact = chars.join("");
  return [
    compact.slice(0, 8),
    compact.slice(8, 12),
    compact.slice(12, 16),
    compact.slice(16, 20),
    compact.slice(20)
  ].join("-");
}

let source = await readFile(templatePath, "utf8");

if (publisherPrefix) {
  source = source.replaceAll("<publisher-prefix>", publisherPrefix);
}

const descriptions = {
  health: "Boilerplate server-side health endpoint.",
  "boilerplate-ping": "Boilerplate facade over a Dataverse Custom API."
};

const displayNames = {
  health: "Boilerplate Health",
  "boilerplate-ping": "Boilerplate Dataverse Ping"
};

const metadata = [
  "adx_serverlogic_adx_webrole:",
  "  - " + roleId,
  "description: " + descriptions[name],
  "display_name: " + displayNames[name],
  "id: " + stableGuid("PowerAndAzureAsCode:server-logic:" + name),
  "name: " + name,
  ""
].join("\n");

await mkdir(outputRoot, { recursive: true });
await writeFile(resolve(outputRoot, name + ".js"), source);
await writeFile(resolve(outputRoot, name + ".serverlogic.yml"), metadata);

console.log(
  "Installed Power Pages Server Logic '" +
    name +
    "' under src/frontend/.powerpages-site/server-logic/" +
    name +
    "."
);
