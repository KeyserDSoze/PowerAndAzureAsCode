# Azure infrastructure

The baseline provisions:

- Azure Static Web Apps Standard;
- Linux App Service Plan;
- ASP.NET Core .NET 10 App Service.

Deploy with `deploy-azure-infra.yml` or Azure CLI/Bicep. After provisioning, link the App Service backend to the Static Web App. The workflow performs this with `az staticwebapp backends link`.

Runtime Dataverse credentials are deliberately not defined in Bicep. Configure App Service application settings (prefer Key Vault references) for:

- `Dataverse__Url`
- `Dataverse__ClientId`
- `Dataverse__ClientSecret`

Never expose these values through Vite.
