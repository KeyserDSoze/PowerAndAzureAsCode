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

`azure/staticwebapp.config.template.json` protects `/*` and `/api/*` with the built-in `authenticated` role and redirects 401 responses to the Microsoft Entra sign-in route.

The built-in Entra provider is simple but can authenticate Microsoft accounts beyond one tenant. For enterprise single-tenant deployments, configure a custom Microsoft Entra provider and restrict the issuer to the customer tenant.

Treat this as a production readiness item.

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
- Linux App Service configured for .NET 10.

The infrastructure workflow links the backend after provisioning.

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
- `AZURE_API_AUTO_DEPLOY`

No Azure client secret is required for the GitHub deployment identity when OIDC is configured.

## Infrastructure deployment variables

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_RESOURCE_GROUP`
- `AZURE_LOCATION`
- `AZURE_STATIC_WEB_APP_NAME`
- `AZURE_API_WEBAPP_NAME`

The deployment principal needs appropriate Azure RBAC on the resource group/subscription scope.

## Runtime Dataverse configuration

Configure on App Service:

- `Dataverse__Url`
- `Dataverse__ClientId`
- `Dataverse__ClientSecret`

Prefer an App Service Key Vault reference for the secret.

These are **runtime** values. They are not frontend Vite values.

## Production recommendations

- custom single-tenant Entra provider for the Static Web App;
- protected GitHub production Environment;
- Key Vault for Dataverse runtime secret/certificate;
- Application Insights;
- least-privilege Dataverse application user;
- custom domain and TLS policy;
- network/private endpoint requirements assessed per customer;
- explicit backup/disaster recovery strategy for the systems that store business data.

## Microsoft documentation

- https://learn.microsoft.com/azure/static-web-apps/authentication-authorization
- https://learn.microsoft.com/azure/static-web-apps/apis-app-service
- https://learn.microsoft.com/azure/static-web-apps/user-information
- https://learn.microsoft.com/azure/azure-functions/dotnet-isolated-process-guide
