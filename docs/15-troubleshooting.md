# Troubleshooting

## CI: npm lockfile mismatch

The template commits `package-lock.json` and CI uses:

```bash
npm ci
```

If `npm ci` reports that `package.json` and `package-lock.json` are out of sync, update dependencies intentionally with npm, review the lockfile diff, and commit both files together. Do not switch CI back to floating `npm install`.

## Power Apps workflow says power.config.json is missing

Run from `src/frontend`:

```bash
npx --no-install pa app init --display-name "<app-name>" --environment-id <environment-id>
```

Review and commit the generated metadata in the derived product repository.

## Power Apps service principal cannot publish

Check:

- tenant/client ID;
- client secret validity;
- service principal environment access;
- existing Code App was shared with the service principal using **edit** access;
- sharing used the **Enterprise Application object ID**.

## Power Pages PAC federation fails

Check:

- workflow job has `id-token: write`;
- FIC issuer is GitHub Actions;
- subject matches the exact repository and GitHub Environment;
- tenant/client ID correct;
- application user/environment permissions exist;
- Environment name case/spelling matches.

## Power Pages health is degraded

The generic frontend expects a Server Logic record named `health`.

Create/configure it or replace the starter health implementation in the derived application.

Also check:

- user signed in;
- correct Web Role;
- Server Logic enabled;
- CSRF token endpoint available.

## Power Pages upload rejects JavaScript

Some Dataverse environments block `.js` attachments. Follow the current Microsoft Code Site prerequisite documentation and update blocked attachment configuration where approved.

## Azure frontend loops to sign-in

Check `staticwebapp.config.json` in the deployed artifact.

Also check Entra provider configuration. For enterprise deployments, verify the custom provider issuer/tenant if one is configured.

## Azure /api returns 401

Verify:

- request goes through the Static Web App origin;
- App Service is linked as backend;
- route `/api/*` requires authenticated user;
- `x-ms-client-principal` reaches the linked backend;
- App Service direct-access auth was not manually weakened/broken.

## Static Web Apps single-tenant sign-in fails

Check the GitHub Environment auth mode/tenant, the SWA application settings, and the Entra callback URI. Re-run `scripts/bootstrap-swa-entra.sh` after replacing the Static Web App or changing its hostname.

## Azure API says Dataverse is not configured

Set App Service configuration:

```text
Dataverse__Url
Dataverse__ClientId
Dataverse__ClientSecret
```

Prefer Key Vault reference for the secret.

## Dataverse health returns HTTP 503

Check the Key Vault reference, App Service Managed Identity, Key Vault RBAC assignment, runtime App Registration and Dataverse Application User. Use Application Insights/server logs rather than exposing raw Dataverse faults in the browser.

## Dataverse returns insufficient privilege

Fix the application user's custom security role. Do not solve routine privilege gaps by assigning System Administrator.

## Bicep App Service runtime error

Azure API/runtime schema can evolve. Confirm the current supported Linux runtime string for .NET 10 in the target region and update the Bicep/API version if Microsoft changes the platform contract.

## GitHub push did not deploy

Normal push deployment is guarded.

Set the correct repository-level variable to the literal `true`:

- `POWERAPPS_AUTO_DEPLOY`
- `POWERPAGES_AUTO_DEPLOY`
- `AZURE_FRONTEND_AUTO_DEPLOY`
- `AZURE_API_AUTO_DEPLOY`
- `POWERPLATFORM_SOLUTION_AUTO_DEPLOY`

Or run the workflow manually.


## Power Apps local host times out or starts the Azure adapter

The frontend workspace `npm run dev` must remain the Power Apps-specific dev command:

```text
vite --mode powerapps --port 3000 --strictPort
```

Run `npx --no-install pa app run` from `src/frontend`. Repository-root `npm run dev` intentionally uses Azure mode; `npm run dev:powerapps` starts only the Power Apps Vite process for diagnostics.

If Vite reports an unsupported `development` mode while Power Apps CLI is inspecting the config, verify the repository's current `vite.config.ts` fallback has not been removed.

## pa and pac point at different tenants

They are separate CLIs with separate authentication state.

From the repository root run:

```bash
bash scripts/check-powerplatform-auth.sh
```

Do this before commands that create/share/push Code Apps, register/sync/import solutions, or otherwise mutate Power Platform resources.

## Power Apps unattended deploy fails in a Default-* environment

The template does not support CI Code App deployment to the Power Platform default environment. Use a dedicated non-default environment.

Configure:

```text
POWERAPPS_ENVIRONMENT_NAME=<dedicated environment name>
POWERAPPS_SOLUTION_ID=<product solution guid>
```

The deployment workflow rejects `Default-*` and a missing solution GUID before publishing.

## Rebrand stopped halfway

A local editor/process may have locked a path during rename.

Close the locking process, inspect `git status`, preserve any intentional work, then reset a disposable working tree if appropriate:

```bash
git restore .
git clean -fd
```

Rerun the same rebrand command. The script writes `brand.config.json` last specifically so the original name remains available after a partial failure.

## Dataverse plug-in package is rejected or stale

The template plug-in project must target `net462`.

Before registration/update, delete Release output and build non-incrementally:

```bash
PLUGIN_DIR=src/backends/dataverse/PowerAndAzureAsCode.Dataverse.Plugins
rm -rf "$PLUGIN_DIR/bin/Release" "$PLUGIN_DIR/obj/Release"
dotnet restore "$PLUGIN_DIR/PowerAndAzureAsCode.Dataverse.Plugins.csproj" --locked-mode
dotnet build "$PLUGIN_DIR/PowerAndAzureAsCode.Dataverse.Plugins.csproj" -c Release --no-restore --no-incremental
```

Inspect the newly generated `.nupkg`. The CI/deployment workflows do the same clean build to avoid reusing an older package.

## First solution build fails because the plug-in is not registered

Do not add the plug-in project reference during the first solution bootstrap.

Follow the first-time sequence in `19-power-platform-alm.md`: import the empty solution, register the NuGet package once with PRT, create/bind Custom APIs, sync the solution, then add the plug-in project reference. Subsequent updates use `pac plugin push --pluginId ...`.

## CodeQL fails only in a private repository

Private repositories need `actions: read` and code scanning must be enabled.

The template includes `actions: read`. Enable GitHub Code Security/code scanning for the private repository and set:

```text
CODEQL_ENABLED=true
```

Without that variable the private-repository CodeQL job is intentionally skipped.

## A compatible .NET SDK was not found

The repository pins the **10.0.4xx** SDK feature band in `global.json` with `rollForward=latestPatch`.

Install a 10.0.4xx SDK and verify:

```bash
dotnet --list-sdks
dotnet --info
```

A generic 10.0.3xx install does not satisfy this repository pin.
