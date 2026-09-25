# Dataverse integration

## Goal

Keep Dataverse integration consistent across delivery hosts without coupling the shared UI to one transport.

## Recommended business boundary

For operations that must behave identically in Power Apps, Power Pages and Azure, prefer a canonical operation such as a Dataverse Custom API implemented by a plugin.

Example conceptual operations:

```text
CreateReservation
CancelReservation
GetAvailability
SubmitRequest
ApproveRequest
```

The generic boilerplate intentionally does not include any business-specific Custom API.

## Why not write directly from every UI

A direct table write can be valid for simple CRUD, but cross-host products often need rules such as:

- concurrency checks;
- authorization beyond UI visibility;
- multi-table transactions;
- duplicate prevention;
- auditing;
- side effects;
- invariant validation.

Putting those rules in React creates inconsistent behavior and weakens security.

## Power Apps path

```text
React feature
 -> application repository
 -> generated Power Apps Dataverse service/action
 -> Dataverse
```

Use Power Apps CLI to add the required Dataverse data sources/actions/functions after the derived app is initialized.

## Power Pages path

```text
React feature
 -> Power Pages adapter
 -> /_api/serverlogics/<operation>
 -> Server.Connector.Dataverse
 -> Dataverse operation
```

Apply web roles and table permissions. Server-side validation remains authoritative.

## Azure path

```text
React feature
 -> /api/<operation>
 -> ASP.NET Core service
 -> Dataverse ServiceClient
 -> Dataverse operation
```

The Azure browser never receives a Dataverse application-user credential.

## Runtime identity

The default Azure starter uses application identity for Dataverse.

Create:

1. Entra app/service principal;
2. Dataverse Application User;
3. minimal custom Dataverse security role;
4. server-side credential.

Do not assign System Administrator merely to make development easy.

The repository includes a local bootstrap script and a protected manual GitHub workflow based on `pac admin assign-user --application-user --role`. The role is always explicit.

## End-user attribution

Client-credential calls are performed in Dataverse as the application user.

If the real user must be recorded:

- pass the authenticated user identifier through the application command;
- validate it against the trusted server-side principal;
- record an immutable business audit field or audit event.

Do not trust an arbitrary user ID supplied by the browser.

For scenarios that require Dataverse to authorize as the end user, design a delegated/On-Behalf-Of flow explicitly rather than mixing it accidentally with application credentials.

## Real connectivity check

The Azure starter exposes:

```http
GET /api/dataverse/health
```

It opens a real Dataverse `ServiceClient` connection and executes `WhoAmI`. Success returns only connectivity status; the Dataverse user identifier and raw server faults are not returned.

## Connection factory

The starter `DataverseConnectionFactory` proves the server-only boundary. It does not make arbitrary Dataverse tables accessible from the frontend.

Derived applications should add narrow services, for example:

```text
IReservationService
IAvailabilityService
IProfileService
```

instead of exposing a generic entity-patch proxy.

## Bootstrap

Follow `17-identity-bootstrap.md` for the runtime App Registration, Key Vault, Dataverse Application User and validation sequence.

## Secrets

See `08-secrets-variables.md`.

Dataverse client secrets never belong in:

- Vite config;
- Static Web Apps static assets;
- Power Pages browser code;
- IndexedDB/localStorage;
- GitHub artifacts.
