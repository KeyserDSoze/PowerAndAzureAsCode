import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  assertNoForbiddenChatCitationTokens,
  containsForbiddenChatCitation
} from "./forbidden-chat-citations.mjs";

test("clean text is accepted", () => {
  assert.equal(containsForbiddenChatCitation("ordinary repository content"), false);
});

test("citation markers are detected without embedding the literal signature", () => {
  const webCitation =
    String.fromCodePoint(0xe200) + "cite" + String.fromCodePoint(0xe202) + "source";
  const memoryCitation =
    String.fromCodePoint(0xe200) + "memcite" + String.fromCodePoint(0xe201);

  assert.equal(containsForbiddenChatCitation(webCitation), true);
  assert.equal(containsForbiddenChatCitation(memoryCitation), true);
});

test("repository scanner rejects a marker in another source file", async () => {
  const root = await mkdtemp(join(tmpdir(), "powerandazure-validation-"));

  try {
    await writeFile(join(root, "clean.md"), "clean\n", "utf8");
    await assertNoForbiddenChatCitationTokens(root);

    const marker =
      String.fromCodePoint(0xe200) + "cite" + String.fromCodePoint(0xe202) + "source";
    await writeFile(join(root, "bad.md"), marker, "utf8");

    await assert.rejects(
      () => assertNoForbiddenChatCitationTokens(root),
      /Chat citation token found in repository file/
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
