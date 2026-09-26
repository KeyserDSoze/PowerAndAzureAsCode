# Secrets and variables

This is the authoritative configuration inventory for GitHub Actions and runtime configuration.

## Rule

Use a **GitHub Variable** for non-secret configuration and a **GitHub Secret** only for confidential material.

Client IDs, tenant IDs, environment URLs, resource names and subscription IDs are identifiers; they are not normally secrets.

Client secrets, private certificates, deployment tokens and passwords are secrets.

Prefer GitHub **Environment** values over repository-wide values so DEV/TEST/PROD can differ. The `*_AUTO_DEPLOY` guard flags are the exception: they are repository-level variables because GitHub evaluates the job guard before Environment-scoped variables are available.

---

## Power Apps Code App

### Variables

#### `POWERAPPS_TENANT_ID`

Microsoft Entra Directory/Tenant ID containing the Code App deployment service principal.

Used by:

```text
PA_CLI_SP_TENANT_ID
```

#### `POWERAPPS_CLIENT_ID`

Application (client) ID of the service principal used by the npm Power Apps CLI.

Used by:

```text
PA_CLI_SP_CLIENT_ID
```

This is the App Registration application/client ID, not the Enterprise Application object ID.

#### `POWERAPPS_SOLUTION_ID`

Optional.

Power Platform Solution ID used when publishing the Code App into a solution:

```bash
pa app push --solution-id <value>
```

Leave empty if the application is not being pushed into a solution.

#### `POWERAPPS_AUTO_DEPLOY` (repository-level variable)

Set to the literal string:

```text
true
```

only when pushes to `main` should publish automatically.

Keep false/undefined in a new repository.

### Secrets

#### `POWERAPPS_CLIENT_SECRET`

Client secret of the Power Apps CLI deployment service principal.

Mapped to:

```text
PA_CLI_SP_CLIENT_SECRET
```

This is needed because current unattended Code App publishing uses service-principal credentials.

Rotation:

1. create a new Entra client secret;
2. update the GitHub Environment secret;
3. test manual deployment;
4. revoke the previous secret.

Never write this into `power.config.json`.

### One-time non-GitHub value

The **Enterprise Application object ID** is needed when a maker shares edit access with the deployment service principal:

```bash
pa app share --principal <enterprise-application-object-id> --access edit
```

Do not confuse this with the App Registration object ID.

---

## Power Pages Code Site

### Variables

#### `POWERPAGES_TENANT_ID`

Entra tenant ID used by the PAC CLI deployment app.

#### `POWERPAGES_CLIENT_ID`

Application/client ID of the Entra app registration configured with a GitHub Federated Identity Credential.

#### `POWERPAGES_ENVIRONMENT_URL`

Full Dataverse/Power Platform environment URL.

Example format:

```text
https://contoso.crm4.dynamics.com
```

Do not add a fake value to source.

#### `POWERPAGES_SITE_NAME`

Display/site name passed to:

```bash
pac pages upload-code-site --siteName ...
```

The real site name is environment-specific configuration.

#### `POWERPAGES_AUTO_DEPLOY` (repository-level variable)

Set to `true` only after manual DEV deployment succeeds.

### Secrets

None are required by the provided Power Pages deployment workflow when GitHub OIDC/FIC is configured correctly.

### Required external configuration

The Entra app registration must contain the GitHub Federated Identity Credential whose subject matches the GitHub Environment.

The app must also have the Power Platform/Dataverse access required to upload the site.

---

## Azure deployment identity

### Variables

#### `AZURE_TENANT_ID`

Microsoft Entra tenant ID used by `azure/login`.

#### `AZURE_CLIENT_ID`

Application/client ID of the GitHub deployment app registration configured with Federated Identity Credentials.

#### `AZURE_SUBSCRIPTION_ID`

Target Azure subscription GUID.

This is not confidential but should remain environment configuration.

#### `AZURE_RESOURCE_GROUP`

Resource group containing the product resources.

#### `AZURE_LOCATION`

Azure region used by the infrastructure deployment.

Examples depend on customer/region policy; do not hard-code a universal region in the template.

#### `AZURE_STATIC_WEB_APP_LOCATION`

Optional Static Web Apps resource region. If omitted, the infrastructure workflow falls back to `AZURE_LOCATION`. Use this when the selected backend region isn't available for Static Web Apps.

#### `AZURE_STATIC_WEB_APP_NAME`

Static Web Apps resource name.

#### `AZURE_API_WEBAPP_NAME`

Azure App Service resource name hosting the .NET 10 API.

#### `AZURE_KEY_VAULT_NAME`

Azure Key Vault used for runtime secrets.

#### `AZURE_LOG_ANALYTICS_WORKSPACE_NAME`

Log Analytics workspace used by Application Insights.

#### `AZURE_APP_INSIGHTS_NAME`

Workspace-based Application Insights component name.

#### `AZURE_SWA_AUTH_MODE`

Use `preconfigured` or `singletenant` for the Azure Static Web Apps authentication provider.

#### `AZURE_SWA_ENTRA_TENANT_ID`

Required when `AZURE_SWA_AUTH_MODE=singletenant`.

#### `AZURE_FRONTEND_AUTO_DEPLOY` (repository-level variable)

Set to `true` to publish the frontend automatically on matching pushes.

#### `AZURE_API_AUTO_DEPLOY` (repository-level variable)

Set to `true` to publish the API automatically on matching pushes.

### Secrets

#### `AZURE_STATIC_WEB_APPS_API_TOKEN`

Deployment token for the target Azure Static Web App.

Used only by the frontend deployment action.

Obtain/reset from the Static Web App deployment token management experience or Azure tooling.

This is a deployment credential and must never be committed.

### No `AZURE_CLIENT_SECRET`

The provided Azure App Service/API and infrastructure workflows use GitHub OIDC/FIC. Do not create an Azure GitHub client secret merely because older tutorials used one.

---

## Azure runtime -> Dataverse

GitHub Environment variables used by the runtime configuration workflow:

- `DATAVERSE_URL`
- `DATAVERSE_RUNTIME_CLIENT_ID`
- `DATAVERSE_SECRET_NAME` (optional; defaults to `dataverse-client-secret`)

These values belong to **Azure App Service application settings** or Key Vault references, not to the React build.

### `Dataverse__Url`

Dataverse organization URL.

Not a browser Vite variable.

### `Dataverse__ClientId`

Application/client ID of the runtime Dataverse application identity.

This runtime identity should normally be different from the GitHub deployment identity.

### `Dataverse__ClientSecret`

Secret for the Dataverse runtime application identity.

The default path is:

```text
App Service setting -> Key Vault reference -> Key Vault
                       ^
                       |
             App Service Managed Identity
```

The runtime secret does not need to be copied into GitHub.

The starter .NET code reads:

```text
Dataverse:Url
Dataverse:ClientId
Dataverse:ClientSecret
```

ASP.NET Core maps double underscores to nested configuration keys.

---

## Power Platform solution deployment

The Dataverse solution deployment workflow uses GitHub Environment variables:

- `POWERPLATFORM_DEPLOY_TENANT_ID`
- `POWERPLATFORM_DEPLOY_CLIENT_ID`
- `POWERPLATFORM_DEPLOY_ENVIRONMENT_URL`
- `POWERPLATFORM_SOLUTION_PATH` (optional; defaults to `src/backends/dataverse/solution`)
- `POWERPLATFORM_SOLUTION_PACKAGE_TYPE` (optional; `managed` or `unmanaged`)
- `POWERPLATFORM_SOLUTION_SETTINGS_FILE` (optional repository-relative path to a PAC deployment settings JSON file)

Repository-level deployment guard:

- `POWERPLATFORM_SOLUTION_AUTO_DEPLOY`

The deployment identity uses GitHub OIDC/FIC; no client secret is required by this workflow.

---

## Power Platform bootstrap workflow

The optional manual workflow `bootstrap-dataverse-application-user.yml` uses:

- `POWERPLATFORM_BOOTSTRAP_TENANT_ID`
- `POWERPLATFORM_BOOTSTRAP_CLIENT_ID`
- `DATAVERSE_URL`

The runtime app client ID and Dataverse security role are explicit workflow inputs.

---

## Azure Static Web Apps custom Entra provider

The starter ships with the preconfigured Entra route for simplicity. For a single-tenant enterprise deployment, configure a custom Entra provider.

Provider configuration may require app-specific Static Web Apps settings such as the client ID and client secret defined by Microsoft's current Static Web Apps auth schema.

Treat the provider client secret as an **Azure runtime secret**, not a Vite or GitHub build value unless your provisioning model explicitly manages it through a secure deployment mechanism.

---

## Values that MUST NOT exist in source

Never commit real values for:

- client secrets;
- certificate passwords;
- PFX/PEM private keys;
- access tokens;
- refresh tokens;
- Static Web Apps deployment tokens;
- Dataverse runtime secrets;
- customer passwords;
- GitHub PATs.

## Values that may be committed only when deliberately non-sensitive

Examples:

- product display name;
- feature flags with no security meaning;
- API relative paths;
- package versions;
- default UX configuration.

Tenant/customer-specific IDs should still normally stay in GitHub/Azure/Power Platform configuration rather than generic template source, even when they are not secret.

## Production checklist

For every production GitHub Environment verify:

- required reviewers configured;
- OIDC/FIC subject references the production Environment;
- only needed workflow variables exist;
- repository-level auto-deploy guards are intentionally enabled or disabled;
- Power Apps client secret rotation owner is known;
- SWA deployment token rotation owner is known;
- Azure runtime Dataverse secret is in Key Vault or equivalent secure storage;
- no production runtime secret is copied into Vite variables.
