# AGENTS.md

Persistent engineering context for humans and coding agents working in this repository.

## Mission

Maintain a reusable enterprise boilerplate for one React/TypeScript application that can run as a Power Apps Code App, Power Pages Code Site or Azure Static Web App without duplicating product UI or domain logic.

## Baseline

- React + TypeScript + Vite.
- Node.js 22 LTS baseline.
- Power Apps Code Apps + npm Power Apps CLI.
- Power Pages Code Sites + optional Server Logic.
- Azure Static Web Apps Standard when using a linked backend.
- ASP.NET Core .NET 10.
- Dataverse.
- GitHub Actions.
- Microsoft Entra ID.
- OIDC/Federated Identity Credentials where supported.
- Azure Key Vault + App Service Managed Identity.
- Log Analytics + Application Insights.

## Non-negotiable rules

1. Feature components MUST NOT know their host.
2. Host-specific behavior MUST stay behind `src/frontend/src/platform`.
3. Business rules MUST NOT be reimplemented per host.
4. Browser code MUST NOT contain Dataverse client secrets, certificates, service-principal credentials or deployment tokens.
5. Vite variables are public configuration, never secrets.
6. Azure feature code calls same-origin `/api` routes by default.
7. Power Pages Server Logic calls from the browser MUST use CSRF protection.
8. Power Pages Server Logic is ECMAScript 2023 in a managed sandbox, not Node.js.
9. Azure backend targets .NET 10 unless an ADR changes it.
10. Dataverse access from Azure uses server-side application identity or an explicitly designed delegated/OBO flow.
11. Deployment and runtime identities should be separate.
12. Prefer GitHub OIDC/FIC where supported.
13. Power Apps unattended publishing secrets live only in protected GitHub Environments.
14. Every target is independently deployable.
15. Material architecture changes update docs and normally add an ADR.
16. Fresh template repositories MUST NOT auto-deploy production.
17. Never place real tenant/customer IDs or secrets in documentation.
18. Domain-specific tables/endpoints do not belong in this generic boilerplate.
19. Runtime Entra application credentials MUST be written directly to a server-side secret store; bootstrap scripts MUST NOT print them.
20. Tenant-level Entra application creation MUST remain an explicit admin bootstrap step; do not give normal GitHub deployment identities permanent Graph application-management privileges.
21. Dataverse Application User bootstrap MUST require an explicitly supplied security role; never default to System Administrator.
22. App Service reads Key Vault references through its Managed Identity; do not copy the Dataverse runtime secret into GitHub.
23. Power Apps generated Dataverse services are client transports, not the authoritative backend.
24. Cross-host business invariants belong in Dataverse Custom APIs/plugins under `src/backends/dataverse` unless an ADR explicitly selects another canonical backend.

## Repository map

```text
.github/workflows/                   CI/CD
src/frontend/                            shared React SPA
src/frontend/src/platform/               host adapters
src/backends/powerpages/server-logic/             Server Logic examples
src/backends/azure-api/                       ASP.NET Core .NET 10 API
src/backends/dataverse/                       Dataverse Custom API plug-in backend
src/backends/powerpages/                      Power Pages Server Logic
infra/azure/                         Azure Bicep baseline: SWA, App Service, Key Vault, MI, Insights
scripts/                             validation/rebranding/version helpers
docs/                                runbooks and architecture
docs/adr/                            architecture decisions
brand.config.json                    boilerplate-controlled branding
```

## Host selection

Vite modes select the adapter:

- `powerapps`
- `powerpages`
- `azure`

Feature code MUST use `createPlatformClient()`, never read `VITE_HOST_TARGET` directly.

## Power Apps

Initialize the derived application by running `pa app init` from `src/frontend`. Do not commit fabricated `power.config.json` identifiers in the template.

Generated Dataverse/connector services belong behind application repositories/services rather than being imported throughout the UI.

## Power Pages

Deploy code sites with `pac pages upload-code-site`. Use Server Logic for trusted server-side work. Server Logic records and web-role/table-permission configuration are environment resources and must be provisioned before endpoint use.

## Azure

Default topology:

```text
Entra-authenticated Static Web App
             |
           /api/*
             |
      linked App Service
             |
     ASP.NET Core .NET 10
             |
          Dataverse
```

Static Web Apps Standard is required for linked App Service integration.

Production Azure infrastructure also provisions Key Vault, a system-assigned App Service Managed Identity, Log Analytics and Application Insights. See `docs/17-identity-bootstrap.md` before changing identity provisioning.

## Configuration

Read `docs/08-secrets-variables.md` before modifying workflows. Tenant IDs, client IDs, URLs and resource names are normally variables; client secrets, certificates and deployment tokens are secrets.

## Rebranding

`brand.config.json` controls repository naming. The rebrand script MUST NOT silently rename Entra registrations, Power Platform resources, Dataverse publishers, GitHub repositories or Azure resources.

## Validation

```bash
npm ci
npm run validate
npm run build:powerapps
npm run build:powerpages
npm run build:azure
dotnet build src/backends/azure-api/PowerAndAzureAsCode.Api/PowerAndAzureAsCode.Api.csproj
az bicep build --file infra/azure/main.bicep --stdout > /dev/null
```
