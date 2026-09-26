# Getting started

## Purpose

This repository is a template, not a finished business application. It provides a shared React frontend and the host-specific seams required to deploy that frontend to Power Apps, Power Pages or Azure.

Do not begin by adding business tables or customer identifiers to this repository. Create a new repository from the template, rebrand it, choose the target hosts, configure environments, then add domain code.

## Prerequisites

Common:

- Git.
- Node.js 22 LTS or later compatible version.
- npm.
- access to the target Microsoft tenant/environment.

Azure target:

- .NET 10 SDK.
- Azure subscription.
- Azure CLI for local infrastructure work.

Power Pages target:

- Power Platform CLI (PAC CLI).
- a Power Platform environment that supports Power Pages Code Sites.
- permissions to create/manage the Power Pages site.

Power Apps target:

- npm Power Apps CLI.
- Power Apps Code Apps enabled in the environment.

Install Power Apps CLI locally when needed:

```bash
npm install --global @microsoft/power-apps-cli
npm install --global @microsoft/power-apps
```

## First bootstrap

```bash
git clone <derived-repository>
cd <derived-repository>
npm ci
npm run validate
npm run build:powerapps
npm run build:powerpages
npm run build:azure
dotnet build src/backends/azure-api/PowerAndAzureAsCode.Api/PowerAndAzureAsCode.Api.csproj
```

## Rebrand before first deployment

```bash
npm run rebrand -- --name "Contoso Workspace" --scope "@contoso"
```

Review every changed file after rebranding. The script only changes repository-controlled names. It intentionally does not rename cloud resources.

## Choose the host

Read `02-target-selection.md`.

You may use one host or more than one. Delete unused deployment workflows only in the derived product repository, not in this generic template.

## Local frontend development

The default `npm run dev` starts the Azure mode because it behaves like a conventional browser SPA.

```bash
npm run dev
```

For a Power Apps Code App, use the Power Apps local host after initializing the app:

```bash
cd src/frontend
pa app init --display-name "Contoso Workspace" --environment-id <environment-id>
pa app run
```

For Power Pages, regular Vite development is useful for UI work, but Power Pages session, CSRF and Server Logic behavior must be validated in the real Code Site.

## GitHub Environments

Create these GitHub Environments as needed:

- `development`
- `test`
- `production`

Put target-specific variables and secrets in each environment. Protect `production` with required reviewers if the repository governance model supports it.

See `08-secrets-variables.md`.

## Azure zero-to-production bootstrap

If Azure is a target, complete `17-identity-bootstrap.md`. It covers GitHub OIDC, Key Vault, Managed Identity, the Dataverse runtime App Registration/Application User and single-tenant Static Web Apps authentication.

## Before first deployment

Run:

```bash
npm run validate
npm run build:powerapps
npm run build:powerpages
npm run build:azure
dotnet build src/backends/azure-api/PowerAndAzureAsCode.Api/PowerAndAzureAsCode.Api.csproj -c Release
```

Then follow the target-specific guide.
