# Power Platform solution ALM

This runbook covers the Dataverse backend lifecycle: plug-in package, Custom APIs and other solution components.

## Why this is separate from frontend deployment

The React Code App and Power Pages Code Site are frontend delivery units.

Authoritative cross-host operations belong in Dataverse solution components:

```text
Dataverse solution
  ├── plug-in package
  ├── Custom APIs
  ├── tables/columns when the product owns them
  ├── environment variables
  └── other product components
```

Those components require their own Power Platform ALM path.

## 1. Bootstrap the solution project

In a **derived product repository**, choose the publisher once and run:

```bash
bash scripts/bootstrap-powerplatform-solution.sh \
  --solution-name "ContosoWorkspace" \
  --publisher-name "Contoso" \
  --publisher-prefix "ctw"
```

The helper creates a Dataverse solution project and adds a project reference to:

```text
src/backends/dataverse/PowerAndAzureAsCode.Dataverse.Plugins
```

Do not change the publisher prefix after components have been created.

## 2. Build the solution

The plug-in project uses `Microsoft.PowerApps.MSBuild.Plugin` and builds as a Dataverse plug-in package.

The solution project references that package project.

Build locally:

```bash
dotnet build src/backends/dataverse/solution/<solution>/<solution>.cdsproj -c Release
```

The solution project produces solution ZIP artifacts under its Release output.

## 3. Create the real product components in DEV

The generic boilerplate cannot hard-code a publisher prefix or customer-specific Dataverse components.

In the derived product:

1. import/build the solution into the development environment;
2. create the actual Custom API definitions and parameters;
3. bind each Custom API to the intended plug-in type;
4. create product-owned tables/columns/environment variables if required;
5. validate the operations from Power Apps, Power Pages and Azure.

The generic `BoilerplatePingPlugin` exists only to demonstrate the shape.

## 4. Sync the solution back to source control

From the solution project, authenticate PAC CLI to DEV and use the current PAC solution synchronization flow to bring environment changes back into the local solution project.

Review the generated diff and commit it.

The repository should then contain the authoritative source for:

- Custom API definitions;
- plug-in/package references;
- other Dataverse solution components owned by the product.

## 5. GitHub Environment configuration

The workflow `deploy-powerplatform-solution.yml` uses:

GitHub Environment variables:

```text
POWERPLATFORM_DEPLOY_TENANT_ID
POWERPLATFORM_DEPLOY_CLIENT_ID
POWERPLATFORM_DEPLOY_ENVIRONMENT_URL
POWERPLATFORM_SOLUTION_PATH
POWERPLATFORM_SOLUTION_PACKAGE_TYPE
POWERPLATFORM_SOLUTION_SETTINGS_FILE
```

`POWERPLATFORM_SOLUTION_PATH` defaults to:

```text
src/backends/dataverse/solution
```

`POWERPLATFORM_SOLUTION_PACKAGE_TYPE` is:

```text
unmanaged
```

or:

```text
managed
```

`POWERPLATFORM_SOLUTION_SETTINGS_FILE` is optional. When configured, it must point to a committed PAC deployment settings JSON file for the target GitHub Environment. Use it for environment variables and connection references that differ between environments. Generate the initial file with `pac solution create-settings`, review it, and commit only non-secret deployment values; secret values should follow the product's secure injection strategy.

Repository-level automatic deployment guard:

```text
POWERPLATFORM_SOLUTION_AUTO_DEPLOY
```

Keep it unset/false in a fresh template.

## 6. Deployment identity

Use a dedicated Power Platform OIDC/FIC deployment identity.

The repository contains:

```text
scripts/bootstrap-powerplatform-deployment-identity.sh
```

Give that identity only the environment/Dataverse privileges required for solution deployment.

Do not reuse the Azure runtime Dataverse identity.

## 7. Promotion

Typical enterprise promotion:

```text
DEV
  -> unmanaged solution for development

TEST/UAT
  -> managed or unmanaged according to product governance

PROD
  -> normally managed solution
```

The exact managed/unmanaged policy belongs to the derived product's ALM governance.

Prefer promotion of the same Git commit through environments.

## 8. Power Apps generated Custom API clients

Once a real Custom API exists in the target environment:

```bash
cd src/frontend
npx --no-install pa app find-dataverse-api --search "YourOperation"
npx --no-install pa app add dataverse-api --api-name <publisher-prefix>_YourOperation
```

Generated TypeScript is client transport code. Keep it behind application repositories/use-cases.

## 9. Power Pages Server Logic

Power Pages Server Logic metadata is part of the **Code Site**, not the Dataverse solution path described here.

After the Code Site has its `.powerpages-site` metadata, install the generic templates with:

```bash
node scripts/install-powerpages-server-logic-example.mjs ...
```

and commit the generated site metadata.

See `04-power-pages.md` and `src/backends/powerpages/README.md`.

## Release readiness

Before promotion verify:

- plug-in package builds;
- solution project builds;
- Custom API is present in the solution source;
- security roles/privileges are documented;
- Power Apps generated clients match the Custom API contract;
- Power Pages Server Logic calls the expected Custom API name;
- Azure API calls the expected Custom API name;
- non-production smoke tests pass.
