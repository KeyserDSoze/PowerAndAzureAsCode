# ADR 0002: Canonical business logic outside host adapters

Status: Accepted

## Context

Power Apps, Power Pages and Azure have different backend transports. Reimplementing the same rules in generated TypeScript, Server Logic JavaScript and ASP.NET Core would create three authoritative implementations.

## Decision

Host adapters transport application commands but do not own authoritative cross-host business rules.

For Dataverse-centric products, Dataverse Custom APIs/plugins are the preferred default canonical location for transactional cross-host business operations. A derived product may choose a dedicated domain API instead and document that choice.

## Consequences

- consistent validation across delivery channels;
- easier concurrency/idempotency design;
- more server-side testability;
- additional Dataverse plugin/API lifecycle when that option is chosen.
