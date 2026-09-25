# Azure infrastructure

The production-oriented baseline provisions:

- Azure Static Web Apps Standard;
- Linux App Service Plan;
- ASP.NET Core .NET 10 App Service;
- system-assigned Managed Identity on App Service;
- Azure Key Vault with RBAC authorization;
- Key Vault read access for the App Service Managed Identity;
- Log Analytics workspace;
- workspace-based Application Insights.

Files:

```text
infra/azure/
  main.bicep
  app-service.bicep
  key-vault.bicep
  observability.bicep
```

Deploy with `.github/workflows/deploy-azure-infra.yml` or Azure CLI/Bicep.

The GitHub workflow also links App Service as the Static Web Apps backend and configures the Application Insights connection string on the API.

## Dataverse runtime configuration

Runtime Dataverse configuration is deliberately kept outside the Bicep deployment history.

Use:

```bash
bash scripts/bootstrap-runtime-dataverse-identity.sh ...
```

The runtime App Registration is connected to App Service through:

```text
Dataverse__Url
Dataverse__ClientId
Dataverse__ClientSecret -> Key Vault reference
```

The App Service resolves Key Vault references with its system-assigned Managed Identity.

## Validation

CI validates the Bicep graph with:

```bash
az bicep build --file infra/azure/main.bicep --stdout
```

See `docs/17-identity-bootstrap.md` for the complete sequence.
