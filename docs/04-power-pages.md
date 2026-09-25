# Power Pages Code Sites

## What this target is

A Power Pages Code Site hosts the compiled SPA inside Power Pages while preserving a source-code-first development model.

The build is created from the same React source used by Power Apps and Azure.

## Build

```bash
npm run build:powerpages
```

Output:

```text
apps/web/dist/
```

The repository contains `apps/web/powerpages.config.json` for Code Site bundle behavior.

## Upload

Power Pages Code Sites are managed with PAC CLI:

```bash
pac pages upload-code-site \
  --rootPath apps/web \
  --compiledPath apps/web/dist \
  --siteName "Contoso Workspace"
```

A first upload can create/produce an inactive site depending on the lifecycle. Activate the site in Power Pages before user testing. Later uploads update the active site.

## Authentication

Use Microsoft Entra ID as the Power Pages identity provider when the application is intended for Entra users.

Do not add client-credential MSAL logic to the browser.

Runtime authorization is based on:

- authenticated Power Pages session;
- web roles;
- table permissions;
- Server Logic permissions.

## Server Logic

Use Server Logic for trusted operations such as:

- server-side validation;
- Dataverse operations that must not be browser-controlled;
- external API calls;
- secret-backed integrations;
- invoking Dataverse business operations.

Server Logic runs native ECMAScript 2023 in a Microsoft-managed sandbox, not Node.js.

Do not use Node-only APIs such as `fs`, `require`, process control or arbitrary dynamic execution.

## CSRF

Browser requests to Server Logic must contain the Power Pages CSRF token. The starter Power Pages adapter retrieves the token from `/_layout/tokenhtml`.

The sample health endpoint is under:

```text
powerpages/server-logic/health/server.js
```

Create a Server Logic record named `health`, apply the intended web role, and place the source in that record. The sample frontend deliberately reports `degraded` until the endpoint exists.

## CI/CD authentication

The Power Pages workflow uses PAC CLI GitHub federation:

```bash
pac auth create \
  --tenant <tenant-id> \
  --applicationId <client-id> \
  --githubFederated \
  --environment <environment-url>
```

This avoids storing a Power Platform deployment client secret in GitHub.

Required variables:

- `POWERPAGES_TENANT_ID`
- `POWERPAGES_CLIENT_ID`
- `POWERPAGES_ENVIRONMENT_URL`
- `POWERPAGES_SITE_NAME`
- `POWERPAGES_AUTO_DEPLOY`

No Power Pages deployment client secret is required by this boilerplate when OIDC/FIC is correctly configured.

## Federated credential

Create a Federated Identity Credential on the deployment app registration for the GitHub Environment subject.

For example, for the production environment the subject is typically based on:

```text
repo:<owner>/<repository>:environment:production
```

Grant the corresponding application user only the Power Platform/Dataverse rights required to deploy.

## First deployment sequence

1. prepare Power Platform environment;
2. verify Code Sites prerequisites;
3. configure Entra provider for the site;
4. configure GitHub OIDC/FIC deployment identity;
5. set GitHub Environment variables;
6. run the manual deployment workflow;
7. activate the site if it is the first deployment;
8. configure Server Logic records and web roles;
9. test with a real authenticated user;
10. enable auto-deploy only after DEV works.

## Microsoft documentation

- https://learn.microsoft.com/power-pages/configure/create-code-sites
- https://learn.microsoft.com/power-pages/configure/server-logic-overview
- https://learn.microsoft.com/power-platform/developer/cli/reference/auth
- https://learn.microsoft.com/power-platform/alm/tutorials/github-actions-oidc-fic
