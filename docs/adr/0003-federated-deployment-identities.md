# ADR 0003: Prefer federated deployment identities

Status: Accepted

## Context

Long-lived client secrets in CI increase rotation burden and exposure risk.

## Decision

Use GitHub OIDC/Federated Identity Credentials for:

- PAC CLI Power Platform deployment;
- Azure infrastructure/API deployment.

Use a stored secret only where the current target tooling requires it:

- Power Apps Code App service-principal publishing client secret;
- Azure Static Web Apps deployment token.

Scope credentials to GitHub Environments and grant least privilege.

## Consequences

- fewer long-lived CI credentials;
- more initial Entra federation configuration;
- environment names become part of the trust relationship and must be managed carefully.
