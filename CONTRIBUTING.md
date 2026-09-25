# Contributing

Use short-lived branches and pull requests for material changes.

Before a pull request:

```bash
npm install
npm run validate
npm run build:powerapps
npm run build:powerpages
npm run build:azure
dotnet build src/azure-api/PowerAndAzureAsCode.Api/PowerAndAzureAsCode.Api.csproj
```

Architecture, security, identity or deployment changes must update `docs/`. Add an ADR under `docs/adr/` when a long-lived architectural decision changes.

Never commit credentials, deployment tokens, local `.env` files, certificates or production data.
