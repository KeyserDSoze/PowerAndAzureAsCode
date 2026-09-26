# Azure hosting

## Default topology

```text
Microsoft Entra user
        |
        v
Azure Static Web Apps (Standard)
        |
        +-- React static assets
        |
        +-- /api/*
               |
               v
      linked Azure App Service
       ASP.NET Core .NET 10
               |
               v
            Dataverse
```

## Why App Service for the default API

The goal is a conventional .NET 10 API with predictable middleware, dependency injection, diagnostics and deployment.

Azure Functions .NET 10 isolated is a valid alternative. Use it when serverless execution is a better fit. On Linux, .NET 10 Functions should use Flex Consumption rather than the old Consumption plan.

## Static Web Apps authentication

`src/hosting/azure/staticwebapp.config.template.json` protects `/*` and `/api/*` with the built-in `authenticated` role and redirects 401 responses to the Microsoft Entra sign-in route.

The built-in Entra provider is simple but can authenticate Microsoft accounts beyond one tenant. For enterprise single-tenant deployments, configure a custom Microsoft Entra provider and restrict the issuer to the customer tenant.

Treat this as a production readiness item.

For a tenant-restricted deployment, use `scripts/bootstrap-swa-entra.sh`, then set `AZURE_SWA_AUTH_MODE=singletenant` and `AZURE_SWA_ENTRA_TENANT_ID` in the GitHub Environment.

## Linked backend

Static Web Apps Standard can link an Azure App Service backend. Requests under `/api` are proxied to the linked App Service.

Azure configures the linked App Service so that by default it accepts traffic proxied through the linked Static Web App.

The API receives the authenticated client principal in `x-ms-client-principal`. The starter middleware maps that header to a `ClaimsPrincipal`.

Never trust a client-supplied copy of this header on an internet-exposed backend that is not protected by the linked-backend configuration.

## Infrastructure

Deploy:

```text
infra/azure/main.bicep
```

It creates:

- Static Web Apps Standard;
- Linux App Service Plan;
- Linux App Service configured for .NET 10;
- system-assigned Managed Identity on App Service;
- Azure Key Vault with RBAC authorization;
- Key Vault access for the App Service Managed Identity;
- Log Analytics workspace;
- workspace-based Application Insights.

The infrastructure workflow links the backend after provisioning, runs `az staticwebapp backends validate`, displays the linked backend, and configures Application Insights for the API. The validation step makes the linked-backend trust assumption an explicit deployment check rather than an undocumented prerequisite.

## Frontend deployment

The Static Web Apps deployment action uses a deployment token.

Required secret:

- `AZURE_STATIC_WEB_APPS_API_TOKEN`

Repository variable for automatic DEV deployment:

- `AZURE_FRONTEND_AUTO_DEPLOY`

The token is a deployment credential. Never store it in source code.

## API deployment

Azure API deployment uses `azure/login` with GitHub OIDC/FIC.

Required variables:

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_API_WEBAPP_NAME`

Repository variable for automatic DEV API deployment:

- `AZURE_API_AUTO_DEPLOY`

No Azure client secret is required for the GitHub deployment identity when OIDC is configured.

## Infrastructure deployment variables

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_RESOURCE_GROUP`
- `AZURE_LOCATION`
- `AZURE_STATIC_WEB_APP_LOCATION` (optional; falls back to `AZURE_LOCATION`)
- `AZURE_STATIC_WEB_APP_NAME`
- `AZURE_API_WEBAPP_NAME`
- `AZURE_KEY_VAULT_NAME`
- `AZURE_LOG_ANALYTICS_WORKSPACE_NAME`
- `AZURE_APP_INSIGHTS_NAME`
- `AZURE_APP_SERVICE_SKU_NAME` (optional; defaults to `B1`)
- `AZURE_APP_SERVICE_SKU_TIER` (optional; defaults to `Basic`)
- `AZURE_APP_SERVICE_PLAN_CAPACITY` (optional; defaults to `1`)
- `AZURE_KEY_VAULT_PUBLIC_NETWORK_ACCESS` (optional; `Enabled` or `Disabled`, defaults to `Enabled`)

The B1 defaults are a low-cost development baseline, not a universal production recommendation. Set the SKU/tier/capacity explicitly in production according to workload and organization policy.

The deployment principal needs appropriate Azure RBAC on the resource group/subscription scope.

## Runtime Dataverse configuration

Configure on App Service:

- `Dataverse__Url`
- `Dataverse__ClientId`
- `Dataverse__ClientSecret`
- `Dataverse__BoilerplatePingApiName` for the neutral cross-host example

The default runtime path uses an App Service Key Vault reference resolved through the App Service Managed Identity.

Use `scripts/bootstrap-runtime-dataverse-identity.sh` for the one-time runtime identity bootstrap, then `configure-azure-runtime.yml` for repeatable non-secret configuration.

These are **runtime** values. They are not frontend Vite values.

## Network isolation constraint

The linked App Service model is an application-layer integration, not a private-network topology. The backend must remain publicly reachable at the network layer for Static Web Apps to proxy requests. The link configures App Service Authentication with the `Azure Static Web Apps (Linked)` provider so only proxied traffic from the linked Static Web App is accepted by default.

Do not add IP restrictions, Private Link or service-endpoint isolation to this specific topology and expect the SWA link to keep working.

If a customer requires a private/network-isolated API, record a separate architecture decision and use an Azure topology that supports that requirement.

## Production recommendations

- custom single-tenant Entra provider for the Static Web App;
- protected GitHub production Environment;
- Key Vault for Dataverse runtime secret/certificate;
- Application Insights;
- least-privilege Dataverse application user;
- custom domain and TLS policy;
- linked App Service kept publicly reachable at the network layer as required by Static Web Apps bring-your-own API integration, while App Service Authentication restricts API access to the linked Static Web App;
- if a customer requires a network-isolated/private backend, select a different Azure ingress/backend topology rather than weakening or forcing the linked-SWA model;
- explicit backup/disaster recovery strategy for the systems that store business data.

## End-to-end bootstrap

Follow `17-identity-bootstrap.md` for the complete Azure/Entra/Dataverse sequence.

## Microsoft documentation

- https://learn.microsoft.com/azure/static-web-apps/authentication-authorization
- https://learn.microsoft.com/azure/static-web-apps/apis-app-service
- https://learn.microsoft.com/azure/static-web-apps/user-information
- https://learn.microsoft.com/azure/azure-functions/dotnet-isolated-process-guide
