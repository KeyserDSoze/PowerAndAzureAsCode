export interface BoilerplatePingResult {
  reply: string;
}

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Host operation returned an invalid JSON payload.");
  }
  return value as JsonRecord;
}

export function readApplicationError(payload: unknown): string | null {
  const record = asRecord(payload);
  if (record.status !== "error") return null;

  return typeof record.message === "string" && record.message.trim()
    ? record.message
    : "Host operation failed.";
}

export function parseBoilerplatePingPayload(payload: unknown): BoilerplatePingResult {
  const record = asRecord(payload);
  const applicationError = readApplicationError(record);
  if (applicationError) throw new Error(applicationError);

  const reply = record.reply ?? record.Reply;
  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("Boilerplate ping response did not contain a reply.");
  }

  return { reply };
}

export function isHealthyPayload(payload: unknown): boolean {
  try {
    return asRecord(payload).status === "ok";
  } catch {
    return false;
  }
}
