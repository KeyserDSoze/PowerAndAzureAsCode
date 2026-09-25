# Configuration, observability and versioning

## Frontend configuration

Only host-selection configuration is committed by default:

```text
apps/web/.env.powerapps
apps/web/.env.powerpages
apps/web/.env.azure
```

These contain no secrets.

Never place secret values in any `VITE_*` variable. Vite embeds them into the browser artifact.

## Backend configuration

ASP.NET Core reads:

```text
Dataverse:Url
Dataverse:ClientId
Dataverse:ClientSecret
```

Environment variable form:

```text
Dataverse__Url
Dataverse__ClientId
Dataverse__ClientSecret
```

## Power Platform configuration

Environment/site/app identifiers belong in:

- generated Code App metadata where required;
- Power Pages configuration records;
- GitHub Environment variables;
- Power Platform environment variables/site settings.

They do not belong in reusable domain code.

## Version

The repository begins at:

```text
0.0.1
```

Use semantic versioning unless the derived product adopts another documented scheme.

Every build script writes:

```text
dist/version.json
```

with:

- package version;
- Git commit SHA;
- build UTC timestamp.

This supports diagnostics and forced-update logic later without coupling it to one host.

## Version bump policy

A derived product should bump version as part of a release change.

Suggested:

- patch: bug fix/internal compatible change;
- minor: backward-compatible feature;
- major: breaking external behavior/data contract.

## Observability boundary

Frontend telemetry should depend on an abstraction, not directly on an Azure-only library if the application must run in Power Apps and Power Pages too.

Example conceptual interface:

```ts
interface Telemetry {
  event(name: string, properties?: Record<string, string>): void;
  error(error: unknown, context?: Record<string, string>): void;
}
```

Each host can supply its implementation.

## Correlation IDs

Generate or propagate a correlation ID for user-triggered backend operations.

Recommended flow:

```text
React command
  -> transport header/body
  -> Server Logic/.NET API
  -> Dataverse Custom API/plugin
  -> logs
```

Never use a sensitive business identifier as a correlation ID.

## Diagnostics page

Derived products should add a non-sensitive diagnostics view exposing:

- app version;
- host target;
- environment label;
- current authentication state;
- backend health;
- feature flags.

Do not expose tenant secrets, access tokens or raw auth headers.
