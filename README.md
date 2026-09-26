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
                         PlatformClient / adapters
                     +--------------+--------------+
                     |              |              |
                Power Apps     Power Pages        Azure
                 Code App        Code Site     Static Web App
                     |              |              |
              generated client  Server Logic   /api -> .NET 10
                     |              |              |
                     +--------------+--------------+
                                    |
                          Dataverse application surface
                         /                          \
                simple table CRUD          business operations
                                                |
                                       Dataverse Custom APIs
                                                |
                                        Dataverse plug-ins
```

UI, routing, state, validation, domain models and application use-cases belong in shared code. Host-specific authentication, transport and deployment details stay behind adapters.

## Included

- React + TypeScript + Vite frontend.
- Explicit builds for `powerapps`, `powerpages` and `azure`.
- Host adapter boundary under `src/frontend/src/platform`.
- Power Pages Server Logic scaffold and CSRF-aware transport.
- Azure Static Web Apps authenticated route configuration.
- ASP.NET Core .NET 10 API starter for a linked Azure App Service backend.
- Dataverse connection boundary for Azure, including a real `WhoAmI` connectivity endpoint.
- Dataverse plug-in backend scaffold for shared Custom API business operations.
- Neutral `BoilerplatePing` vertical slice demonstrating one canonical Custom API through Power Apps, Power Pages and Azure transports.
- Azure Key Vault, App Service Managed Identity, Log Analytics and Application Insights Bicep baseline.
- Admin bootstrap scripts for Entra runtime/deployment identities and Static Web Apps single-tenant auth.
- GitHub Actions for CI and independent deployment to each host.
- OIDC/Federated Identity guidance where supported.
- Complete secrets/variables inventory.
- Rebranding, versioning and validation scripts.
- Template-owned behavioral tests for repository validation, host response contracts and Static Web Apps principal parsing.
- Architecture decisions and operational runbooks.

## Start here

Read [docs/00-getting-started.md](docs/00-getting-started.md), then choose the host using [docs/02-target-selection.md](docs/02-target-selection.md).

```bash
npm ci
npm run validate
npm run dev
```

Build a target:

```bash
npm run build:powerapps
npm run build:powerpages
npm run build:azure
dotnet build src/backends/azure-api/PowerAndAzureAsCode.Api/PowerAndAzureAsCode.Api.csproj
```

Before starting a real application:

```bash
npm run rebrand -- --name "Contoso Workspace" --scope "@contoso" --code-owner "@contoso/platform"
```

## Deployment

| Target | Workflow | Deployment identity |
|---|---|---|
| Power Apps Code App | `deploy-powerapps.yml` | Power Apps CLI service principal |
| Power Pages Code Site | `deploy-powerpages.yml` | PAC CLI + GitHub OIDC/FIC |
| Azure frontend | `deploy-azure-frontend.yml` | Static Web Apps deployment token |
| Azure .NET API | `deploy-azure-api.yml` | Azure OIDC/FIC |
| Azure infrastructure | `deploy-azure-infra.yml` | Azure OIDC/FIC |
| Azure runtime configuration | `configure-azure-runtime.yml` | Azure OIDC/FIC |
| Dataverse Application User bootstrap | `bootstrap-dataverse-application-user.yml` | Power Platform OIDC/FIC |
| Dataverse solution | `deploy-powerplatform-solution.yml` | Power Platform OIDC/FIC |

Fresh template repositories do **not** deploy automatically until the relevant `*_AUTO_DEPLOY` repository-level GitHub variable is explicitly enabled. Manual deployments remain available.

## Security

1. No runtime secret belongs in React, Vite variables, IndexedDB, service workers or source control.
2. Prefer GitHub OIDC/FIC to long-lived deployment secrets where supported.
3. Power Apps Code Apps unattended publishing currently uses a service-principal client secret; store it only in a protected GitHub Environment.
4. Power Pages end-user authorization is enforced by the Power Pages session, web roles/table permissions and CSRF.
5. Azure Static Web Apps protects routes with Microsoft Entra ID; a linked App Service is reachable through the Static Web App integration.
6. Dataverse application users must receive least-privilege security roles.
7. Cross-host business rules should live in a canonical backend such as Dataverse Custom APIs/plugins, not in three adapters.
8. Azure runtime credentials belong in Key Vault and are resolved by App Service through its Managed Identity.
9. Tenant-administrator bootstrap of Entra application registrations is performed interactively; CI identities are not granted permanent Microsoft Graph application-management rights.

For the complete Azure/Entra/Dataverse bootstrap, follow [docs/17-identity-bootstrap.md](docs/17-identity-bootstrap.md).

Power Apps generated Dataverse services are client transports; shared authoritative business operations belong in `src/backends/dataverse` as Dataverse Custom APIs/plug-ins.

See [docs/README.md](docs/README.md) for the full documentation index.


## Final owner readiness

Before treating a derived repository as production-ready, complete these owner-level checks:

- run `scripts/bootstrap-github-repository.sh` and then `scripts/verify-github-repository.sh` with a GitHub identity that can read/apply repository administration settings;
- make an explicit licensing decision (approved open-source license or proprietary notice) rather than assuming a public repository grants reuse rights;
- validate the neutral `BoilerplatePing` slice in a real DEV environment through every host you intend to support: Power Apps, Power Pages and/or Azure.

These are deliberately not auto-completed by the generic template because they depend on repository administration, legal/owner policy and real tenant resources.

## Licensing

This repository currently does **not** declare an open-source license.

Before distributing or reusing a derived product outside the owning organization, select the appropriate organization-approved license or proprietary notice. A public GitHub repository by itself does not define reuse rights.
