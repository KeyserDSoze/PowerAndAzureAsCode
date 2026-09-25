import { useEffect, useMemo, useState } from "react";
import { createPlatformClient } from "./platform/createPlatform";
import type { HealthResult, UserIdentity } from "./platform/types";

export default function App() {
  const platform = useMemo(() => createPlatformClient(), []);
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [user, setUser] = useState<UserIdentity | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([platform.health(), platform.getCurrentUser()])
      .then(([nextHealth, nextUser]) => {
        setHealth(nextHealth);
        setUser(nextUser);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unexpected platform error."));
  }, [platform]);

  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">Multi-host starter</p>
        <h1>PowerAndAzureAsCode</h1>
        <p>Shared React code is running through the <strong>{platform.host}</strong> adapter.</p>
        <dl>
          <div><dt>Host</dt><dd>{platform.host}</dd></div>
          <div><dt>Health</dt><dd>{health?.status ?? "checking"}</dd></div>
          <div><dt>User</dt><dd>{user?.displayName ?? "host-managed / unavailable in generic starter"}</dd></div>
        </dl>
        {error ? <p className="error">{error}</p> : null}
        <p className="hint">Replace this starter screen with domain features. Keep host-specific code behind PlatformClient.</p>
      </section>
    </main>
  );
}
