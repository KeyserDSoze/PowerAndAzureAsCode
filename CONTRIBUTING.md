# Contributing

Use short-lived branches and pull requests for material changes.

Before a pull request:

```bash
npm install
npm run validate
npm run build:powerapps
npm run build:powerpages
npm run build:azure
dotnet build src/backends/azure-api/PowerAndAzureAsCode.Api/PowerAndAzureAsCode.Api.csproj -c Release
dotnet build src/backends/dataverse/PowerAndAzureAsCode.Dataverse.Plugins/PowerAndAzureAsCode.Dataverse.Plugins.csproj -c Release
az bicep build --file infra/azure/main.bicep --stdout > /dev/null
```

Architecture, security, identity or deployment changes must update `docs/`. Add an ADR under `docs/adr/` when a long-lived architectural decision changes.

Never commit credentials, deployment tokens, local `.env` files, certificates or production data.
