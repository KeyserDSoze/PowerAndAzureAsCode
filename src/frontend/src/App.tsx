import { useEffect, useMemo, useState } from "react";
import { createPlatformClient } from "./platform/createPlatform";
import type { HealthResult, UserIdentity } from "./platform/types";

export default function App() {
  const platform = useMemo(() => createPlatformClient(), []);
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [user, setUser] = useState<UserIdentity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pingMessage, setPingMessage] = useState("");
  const [pingReply, setPingReply] = useState<string | null>(null);
  const [pingError, setPingError] = useState<string | null>(null);
  const [pingPending, setPingPending] = useState(false);

  useEffect(() => {
    Promise.all([platform.health(), platform.getCurrentUser()])
      .then(([nextHealth, nextUser]) => {
        setHealth(nextHealth);
        setUser(nextUser);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Unexpected platform error.")
      );
  }, [platform]);

  async function runBoilerplatePing() {
    setPingPending(true);
    setPingReply(null);
    setPingError(null);

    try {
      const result = await platform.boilerplatePing(pingMessage);
      setPingReply(result.reply);
    } catch (err) {
      setPingError(
        err instanceof Error ? err.message : "Boilerplate ping operation failed."
      );
    } finally {
      setPingPending(false);
    }
  }

  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">Multi-host starter</p>
        <h1>PowerAndAzureAsCode</h1>
        <p>
          Shared React code is running through the <strong>{platform.host}</strong> adapter.
        </p>
        <dl>
          <div><dt>Host</dt><dd>{platform.host}</dd></div>
          <div><dt>Health</dt><dd>{health?.status ?? "checking"}</dd></div>
          <div>
            <dt>User</dt>
            <dd>{user?.displayName ?? "host-managed / unavailable in generic starter"}</dd>
          </div>
        </dl>
        {error ? <p className="error">{error}</p> : null}

        <section className="operation">
          <h2>Canonical backend operation</h2>
          <p className="hint">
            This calls the same Dataverse Custom API through the host-specific transport.
          </p>
          <label htmlFor="ping-message">Message</label>
          <div className="operation-row">
            <input
              id="ping-message"
              value={pingMessage}
              maxLength={200}
              onChange={(event) => setPingMessage(event.target.value)}
              placeholder="optional message"
            />
            <button type="button" disabled={pingPending} onClick={runBoilerplatePing}>
              {pingPending ? "Calling…" : "Ping Dataverse"}
            </button>
          </div>
          {pingReply ? <p><strong>Reply:</strong> {pingReply}</p> : null}
          {pingError ? <p className="error">{pingError}</p> : null}
        </section>

        <p className="hint">
          Replace this starter screen with domain features. Keep host-specific code behind
          PlatformClient.
        </p>
      </section>
    </main>
  );
}
