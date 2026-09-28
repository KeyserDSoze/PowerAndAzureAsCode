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

## Authentication preflight

The npm Power Apps CLI (`pa`) and PAC CLI (`pac`) maintain separate login state. Before environment-writing commands, run from the repository root:

```bash
bash scripts/check-powerplatform-auth.sh
```

Verify both outputs point at the intended tenant/environment. Never infer the active `pa` account from `pac auth list`, or vice versa.

## 1. Bootstrap an empty solution project

In a **derived product repository**, choose the publisher once and run:

```bash
bash scripts/bootstrap-powerplatform-solution.sh \
  --solution-name "ContosoWorkspace" \
  --publisher-name "Contoso" \
  --publisher-prefix "ctw"
```

The helper deliberately creates an **empty** solution project first. It does not immediately add the plug-in project reference.

It also replaces the floating `Microsoft.PowerApps.MSBuild.Solution` version produced by `pac solution init` with the repository-pinned version and generates `packages.lock.json`. This keeps derived solution builds reproducible.

Do not change the publisher prefix after components have been created.

## 2. First import: empty solution

The first ALM cycle is different from later updates.

Build the empty solution project and import it into the development environment before registering the plug-in package:

```bash
dotnet restore src/backends/dataverse/solution/<solution>/<solution>.cdsproj --locked-mode
dotnet build src/backends/dataverse/solution/<solution>/<solution>.cdsproj -c Release --no-restore
```

Import the generated unmanaged solution ZIP into DEV.

Do **not** add the plug-in project reference before this initial registration sequence. A solution project reference updates an existing Dataverse plug-in registration; it does not create the first registration.

## 3. Build a fresh plug-in package

The Dataverse plug-in project targets `net462`, matching the Dataverse plug-in-package tooling path.

Before first registration or any package push, remove old Release output and force a non-incremental build:

```bash
PLUGIN_DIR=src/backends/dataverse/PowerAndAzureAsCode.Dataverse.Plugins
rm -rf "$PLUGIN_DIR/bin/Release" "$PLUGIN_DIR/obj/Release"
dotnet restore "$PLUGIN_DIR/PowerAndAzureAsCode.Dataverse.Plugins.csproj" --locked-mode
dotnet build "$PLUGIN_DIR/PowerAndAzureAsCode.Dataverse.Plugins.csproj" \
  -c Release \
  --no-restore \
  --no-incremental
```

Inspect the generated `.nupkg` before upload. The repository CI and deployment workflow also require a newly generated package containing at least one DLL.

## 4. One-time plug-in package registration in DEV

The first package registration needs the Plug-in Registration Tool (PRT). `pac plugin push` requires an existing plug-in assembly/package ID, so it is an **update** path, not the first-registration path.

Launch the tool using your supported PAC CLI installation, for example:

```bash
pac tool prt
```

In PRT:

1. connect to the intended DEV environment;
2. register the freshly built NuGet plug-in package;
3. add/select the product solution created in step 2;
4. record the resulting **plug-in package ID**.

Store that GUID as GitHub Environment variable:

```text
POWERPLATFORM_PLUGIN_PACKAGE_ID
```

## 5. Create Custom APIs, sync, then add the project reference

After the package exists in DEV:

1. create the real Custom API definitions and request/response parameters;
2. bind each Custom API to the intended registered plug-in type;
3. create product-owned tables/columns/environment variables as required;
4. validate the operation in DEV;
5. synchronize the solution back to source with the current PAC solution sync flow;
6. review the generated diff;
7. only then add the project reference from the solution project:

```bash
cd src/backends/dataverse/solution/<solution>
pac solution add-reference \
  --path ../../PowerAndAzureAsCode.Dataverse.Plugins
```

Commit the synchronized solution source, the `.cdsproj`, its `packages.lock.json`, and the project reference.

This ordering is required for the **first** registration. Once the package exists, subsequent updates use the repeatable CI path below.

## 6. Subsequent plug-in and solution updates

The GitHub workflow `deploy-powerplatform-solution.yml` performs this order:

```text
PAC OIDC authentication
  -> clean/non-incremental plug-in package build
  -> verify fresh .nupkg contents
  -> pac plugin push --pluginId <registered package id> --pluginFile <fresh nupkg>
  -> locked solution restore/build
  -> solution import
```

This prevents an incremental build from accidentally publishing a stale NuGet package and ensures the existing Dataverse package registration is updated before the solution is built/imported.

## 7. GitHub Environment configuration

The workflow uses:

```text
POWERPLATFORM_DEPLOY_TENANT_ID
POWERPLATFORM_DEPLOY_CLIENT_ID
POWERPLATFORM_DEPLOY_ENVIRONMENT_URL
POWERPLATFORM_PLUGIN_PACKAGE_ID
POWERPLATFORM_SOLUTION_PATH
POWERPLATFORM_SOLUTION_PACKAGE_TYPE
POWERPLATFORM_SOLUTION_SETTINGS_FILE
```

`POWERPLATFORM_PLUGIN_PACKAGE_ID` is required after the one-time PRT registration.

`POWERPLATFORM_SOLUTION_PATH` defaults to:

```text
src/backends/dataverse/solution
```

`POWERPLATFORM_SOLUTION_PACKAGE_TYPE` is `unmanaged` or `managed`.

`POWERPLATFORM_SOLUTION_SETTINGS_FILE` is optional. When configured, it must point to a committed PAC deployment settings JSON file for the target GitHub Environment. Generate the initial file with `pac solution create-settings`, review it, and commit only non-secret deployment values.

Repository-level automatic deployment guard:

```text
POWERPLATFORM_SOLUTION_AUTO_DEPLOY
```

Keep it unset/false in a fresh template.

## 8. Deployment identity

Use a dedicated Power Platform OIDC/FIC deployment identity.

The repository contains:

```text
scripts/bootstrap-powerplatform-deployment-identity.sh
```

Give that identity only the environment/Dataverse privileges required for solution deployment.

Do not reuse the Azure runtime Dataverse identity.

## 9. Promotion

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

## 10. Power Apps generated Custom API clients

Once a real Custom API exists in the target environment, first verify the active Power Apps CLI account:

```bash
cd src/frontend
npx --no-install pa auth status
npx --no-install pa app find-dataverse-api --search "YourOperation"
npx --no-install pa app add dataverse-api --api-name <publisher-prefix>_YourOperation
```

Generated TypeScript is client transport code. Keep it behind application repositories/use-cases.

## 11. Power Pages Server Logic

Power Pages Server Logic metadata is part of the **Code Site**, not the Dataverse solution path described here.

After the Code Site has its `.powerpages-site` metadata, install the generic templates with:

```bash
node scripts/install-powerpages-server-logic-example.mjs ...
```

and commit the generated site metadata.

See `04-power-pages.md` and `src/backends/powerpages/README.md`.

## Release readiness

Before promotion verify:

- both `pa` and `pac` are authenticated to the intended environment for local/admin work;
- plug-in project targets `net462`;
- a clean/non-incremental build produced a fresh `.nupkg`;
- the package contains the expected plug-in assembly;
- the registered plug-in package ID is configured for CI;
- solution project restore succeeds in locked mode;
- Custom API is present in the solution source;
- security roles/privileges are documented;
- Power Apps generated clients match the Custom API contract;
- Power Pages Server Logic calls the expected Custom API name;
- Azure API calls the expected Custom API name;
- non-production smoke tests pass.
