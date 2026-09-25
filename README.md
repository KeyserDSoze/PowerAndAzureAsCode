# PowerAndAzureAsCode

Production-oriented, multi-host starter repository for building **one React/TypeScript application** that can be delivered as:

- a **Power Apps Code App**;
- a **Power Pages Code Site**;
- an **Azure Static Web App** with an ASP.NET Core **.NET 10** backend on Azure App Service.

The repository is intentionally a **boilerplate**. It contains no customer data, tenant IDs, application IDs, Dataverse URLs, environment GUIDs, secrets, business tables, or product-specific domain logic.

## Core idea

```text
                         Shared React application
                                  |
                    PlatformClient / host adapters
                 +----------------+----------------+
                 |                |                |
            Power Apps       Power Pages          Azure
             Code App          Code Site       Static Web App
                 |                |                |
       generated connectors   Server Logic      /api -> .NET 10
                 |                |                |
                 +----------------+----------------+
                                  |
                               Dataverse
```

UI, routing, state, validation, domain models and application use-cases belong in shared code. Host-specific authentication, transport and deployment details stay behind adapters.

## Included

- React + TypeScript + Vite frontend.
- Explicit builds for `powerapps`, `powerpages` and `azure`.
- Host adapter boundary under `apps/web/src/platform`.
- Power Pages Server Logic scaffold and CSRF-aware transport.
- Azure Static Web Apps authenticated route configuration.
- ASP.NET Core .NET 10 API starter for a linked Azure App Service backend.
- Dataverse connection boundary for Azure.
- GitHub Actions for CI and independent deployment to each host.
- OIDC/Federated Identity guidance where supported.
- Complete secrets/variables inventory.
- Rebranding, versioning and validation scripts.
- Architecture decisions and operational runbooks.

## Start here

Read [docs/00-getting-started.md](docs/00-getting-started.md), then choose the host using [docs/02-target-selection.md](docs/02-target-selection.md).

```bash
npm install
npm run validate
npm run dev
```

Build a target:

```bash
npm run build:powerapps
npm run build:powerpages
npm run build:azure
dotnet build src/azure-api/PowerAndAzureAsCode.Api/PowerAndAzureAsCode.Api.csproj
```

Before starting a real application:

```bash
npm run rebrand -- --name "Contoso Workspace" --scope "@contoso"
```

## Deployment

| Target | Workflow | Deployment identity |
|---|---|---|
| Power Apps Code App | `deploy-powerapps.yml` | Power Apps CLI service principal |
| Power Pages Code Site | `deploy-powerpages.yml` | PAC CLI + GitHub OIDC/FIC |
| Azure frontend | `deploy-azure-frontend.yml` | Static Web Apps deployment token |
| Azure .NET API | `deploy-azure-api.yml` | Azure OIDC/FIC |
| Azure infrastructure | `deploy-azure-infra.yml` | Azure OIDC/FIC |

Fresh template repositories do **not** deploy automatically until the relevant `*_AUTO_DEPLOY` GitHub Environment variable is explicitly enabled. Manual deployments remain available.

## Security

1. No runtime secret belongs in React, Vite variables, IndexedDB, service workers or source control.
2. Prefer GitHub OIDC/FIC to long-lived deployment secrets where supported.
3. Power Apps Code Apps unattended publishing currently uses a service-principal client secret; store it only in a protected GitHub Environment.
4. Power Pages end-user authorization is enforced by the Power Pages session, web roles/table permissions and CSRF.
5. Azure Static Web Apps protects routes with Microsoft Entra ID; a linked App Service is reachable through the Static Web App integration.
6. Dataverse application users must receive least-privilege security roles.
7. Cross-host business rules should live in a canonical backend such as Dataverse Custom APIs/plugins, not in three adapters.

See [docs/README.md](docs/README.md) for the full documentation index.
