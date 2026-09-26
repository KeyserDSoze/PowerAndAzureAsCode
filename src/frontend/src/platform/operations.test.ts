import assert from "node:assert/strict";
import test from "node:test";

import {
  isHealthyPayload,
  parseBoilerplatePingPayload,
  readApplicationError,
  validateBoilerplatePingMessage
} from "./operations.ts";

test("health requires an explicit ok application status", () => {
  assert.equal(isHealthyPayload({ status: "ok" }), true);
  assert.equal(isHealthyPayload({ status: "error" }), false);
  assert.equal(isHealthyPayload({}), false);
  assert.equal(isHealthyPayload("ok"), false);
});

test("application errors are distinct from HTTP transport success", () => {
  assert.equal(
    readApplicationError({ status: "error", message: "backend failed" }),
    "backend failed"
  );
  assert.equal(readApplicationError({ status: "ok" }), null);
});

test("ping parser accepts normalized and Dataverse output property names", () => {
  assert.deepEqual(parseBoilerplatePingPayload({ reply: "pong" }), { reply: "pong" });
  assert.deepEqual(parseBoilerplatePingPayload({ Reply: "pong:hello" }), {
    reply: "pong:hello"
  });
});

test("ping parser rejects application errors and malformed payloads", () => {
  assert.throws(
    () => parseBoilerplatePingPayload({ status: "error", message: "denied" }),
    /denied/
  );
  assert.throws(
    () => parseBoilerplatePingPayload({ status: "ok" }),
    /did not contain a reply/
  );
});

test("ping request validation enforces the shared size limit", () => {
  assert.equal(validateBoilerplatePingMessage(""), "");
  assert.equal(validateBoilerplatePingMessage("hello"), "hello");
  assert.throws(
    () => validateBoilerplatePingMessage("x".repeat(201)),
    /at most 200/
  );
});
