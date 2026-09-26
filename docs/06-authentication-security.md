# Authentication and security

## Separate three identities

Do not collapse these concepts.

### End-user identity

Used by the person operating the application.

- Power Apps -> Power Apps host/Entra.
- Power Pages -> Power Pages session/Entra + web roles.
- Azure -> Static Web Apps/Entra.

### Runtime workload identity

Used by a server component to call another service.

Example:

```text
Azure .NET API -> Dataverse application user
```

### Deployment identity

Used by GitHub Actions.

Examples:

- GitHub OIDC -> Azure deployment app;
- GitHub OIDC -> Power Platform deployment app;
- Power Apps CLI -> Code App publishing service principal.

Keep these identities separate unless there is a documented reason not to.

## Browser rules

Never put in browser source:

- client secrets;
- certificates/private keys;
- Dataverse application-user secrets;
- Static Web Apps deployment tokens;
- Azure deployment credentials;
- Power Apps publishing credentials.

Anything prefixed `VITE_` becomes browser-visible after build.

## Power Apps

The host authenticates the user. Do not duplicate sign-in.

Use Power Platform authorization and Dataverse security for the data operations exposed to that user.

## Power Pages

Protect Server Logic with:

- authenticated site session;
- appropriate Web Role;
- table permissions;
- CSRF token;
- server-side validation.

Browser validation is UX, not security.

## Azure

The Static Web App must require the `authenticated` role for application routes.

For single-tenant enterprise scenarios, replace the broad preconfigured provider behavior with a custom Entra provider scoped to the intended tenant.

The linked backend must stay linked/protected. The App Service is publicly reachable at the network layer for the SWA proxy integration, but the `Azure Static Web Apps (Linked)` App Service authentication provider restricts access to traffic proxied by the linked Static Web App by default.

Do not later remove/relax that App Service authentication or add anonymous direct access without an explicit API authentication design. If a customer requires private network isolation, use a different backend topology rather than treating the linked-SWA model as a private endpoint solution.

## Azure Key Vault and Managed Identity

The Azure baseline gives the API App Service a system-assigned Managed Identity. That identity receives Key Vault read access so App Service can resolve the Dataverse runtime credential through a Key Vault reference. The GitHub deployment identity does not need the runtime credential.

Tenant-level creation of Entra application registrations stays an explicit administrator bootstrap step. Normal CI identities are not granted permanent Microsoft Graph application-management permissions.

## Dataverse application user

If the Azure API uses client credentials:

- create a dedicated Entra application/service principal;
- create the Dataverse application user;
- assign a minimal custom security role;
- keep the runtime credential in Key Vault;
- rotate it independently from deployment identities.

The Dataverse audit identity will be the application user for operations performed with client credentials. If business auditing must capture the real end user, store the application user context explicitly in domain records/commands or design an On-Behalf-Of/delegated flow.

## OIDC/FIC

GitHub federation is preferred because there is no long-lived GitHub client secret.

Use environment-scoped federation subjects where practical, for example:

```text
repo:owner/repository:environment:production
```

That lets production require a different Federated Identity Credential and GitHub approval boundary.

## Least privilege

Deployment rights, runtime rights and business-user rights are different.

Avoid:

- System Administrator for runtime application users;
- subscription Owner for normal code deployment;
- one app registration reused for every concern.

## Logging

Never log:

- bearer tokens;
- client secrets;
- raw authentication headers;
- full `x-ms-client-principal` payloads if they are not required;
- personal/business data merely for diagnostics.

Use correlation IDs and structured event names instead.
