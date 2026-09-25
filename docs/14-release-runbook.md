# Release runbook

## Before release

1. pull latest `main`;
2. confirm target GitHub Environment;
3. verify secrets/variables inventory;
4. bump version if required;
5. run local validation;
6. merge through required PR controls;
7. deploy DEV manually first for new infrastructure/identity changes;
8. for a new Azure environment, complete `17-identity-bootstrap.md` before enabling automatic deployment.

## Validation commands

```bash
npm install
npm run validate
npm run build:powerapps
npm run build:powerpages
npm run build:azure
dotnet build src/backends/azure-api/PowerAndAzureAsCode.Api/PowerAndAzureAsCode.Api.csproj -c Release
```

## Power Apps release

Preconditions:

- `src/frontend/power.config.json` initialized and committed in derived repo;
- deployment service principal has environment access;
- service principal has edit access to the existing Code App;
- client secret is valid;
- optional solution ID is correct.

Run:

```text
Actions -> Deploy Power Apps Code App -> Run workflow
```

Validate the returned/published app in the intended environment.

## Power Pages release

Preconditions:

- FIC subject matches GitHub Environment;
- PAC deployment app has target environment access;
- site name is correct;
- first-time site activation process understood;
- Server Logic/web roles/table permissions are configured.

Run manual deployment.

After first deployment, activate the Code Site if required.

## Azure infrastructure release

Run infrastructure workflow before application code when resources do not exist or topology changed.

Verify:

- resource group;
- region;
- Static Web Apps Standard;
- App Service .NET 10;
- linked backend;
- Key Vault;
- App Service system-assigned Managed Identity;
- Key Vault access role assignment;
- Log Analytics;
- Application Insights.

## Azure frontend release

Ensure the Static Web Apps deployment token points to the correct environment.

Run frontend workflow and verify Entra authentication.

## Azure API release

Ensure Azure OIDC/FIC and App Service name are correct.

Run API workflow.

Verify the API from the authenticated Static Web App origin using `/api/health`, `/api/me` and `/api/dataverse/health`. The Dataverse connectivity endpoint must succeed before promotion.

## Dataverse runtime readiness

For Azure:

- application user exists;
- least-privilege security role assigned;
- App Service runtime settings/Key Vault references exist;
- credentials are valid.

## Promotion

Prefer the same commit SHA across DEV/TEST/PROD.

Do not rebuild from different source commits while calling them one release.

## Rollback

Frontend:

- redeploy the previous known-good commit/artifact.

Azure API:

- redeploy previous known-good commit or use App Service deployment-slot strategy in a derived product.

Power Apps/Power Pages:

- preserve versioned source commits and redeploy the previous known-good source/configuration through the appropriate supported ALM path.

Data/schema rollback requires a separate Dataverse migration strategy; code rollback alone is not a database rollback.
