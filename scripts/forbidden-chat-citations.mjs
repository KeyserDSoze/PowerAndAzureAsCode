import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "bin",
  "obj",
  "dist",
  "artifacts"
]);

const textFilePattern = /\.(md|txt|json|ya?ml|mjs|js|ts|tsx|cs|csproj|bicep|sh|html)$/i;

export const forbiddenChatCitationTokens = [
  String.fromCodePoint(0xe200) + "cite" + String.fromCodePoint(0xe202),
  String.fromCodePoint(0xe200) + "memcite" + String.fromCodePoint(0xe201)
];

export function containsForbiddenChatCitation(text) {
  return forbiddenChatCitationTokens.some((token) => text.includes(token));
}

async function walkTextFiles(directory) {
  const result = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const full = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await walkTextFiles(full)));
    } else if (textFilePattern.test(entry.name)) {
      result.push(full);
    }
  }

  return result;
}

export async function assertNoForbiddenChatCitationTokens(directory) {
  for (const file of await walkTextFiles(directory)) {
    const text = await readFile(file, "utf8");
    if (containsForbiddenChatCitation(text)) {
      throw new Error(`Chat citation token found in repository file: ${file}`);
    }
  }
}
