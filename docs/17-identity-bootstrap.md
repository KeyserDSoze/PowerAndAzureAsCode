# Identity bootstrap: zero to production

This runbook covers the one-time identities required by the multi-host boilerplate.

The repository intentionally separates:

1. end-user identities;
2. GitHub deployment identities;
3. Azure API runtime identity;
4. Azure Static Web Apps authentication registration.

This separation prevents one credential from becoming a universal key.

## Why Entra application creation is not a normal GitHub Action

Creating app registrations and credentials requires privileged Microsoft Entra / Microsoft Graph permissions.

The boilerplate does **not** grant those permissions permanently to a CI identity.

Instead, tenant administrators run the bootstrap scripts interactively. GitHub Actions then use the resulting identities through OIDC or consume resources that were safely provisioned.

This reduces the blast radius of a compromised GitHub workflow.

---

## 1. Azure deployment identity: GitHub -> Azure

Prerequisites:

- Azure CLI authenticated as an administrator;
- target resource group already exists;
- permission to create Entra applications/service principals;
- permission to create Azure role assignments.

Run:

```bash
bash scripts/bootstrap-azure-deployment-identity.sh \
  --app-name "Contoso Workspace GitHub Azure" \
  --repository "owner/repository" \
  --subscription-id "<subscription-guid>" \
  --resource-group "<resource-group>"
```

The script creates/reuses:

- Entra app registration;
- service principal;
- GitHub Federated Identity Credential for `development`;
- GitHub Federated Identity Credential for `test`;
- GitHub Federated Identity Credential for `production`.

It grants at resource-group scope:

- `Contributor`;
- `Role Based Access Control Administrator`.

The second role is required because the Bicep template creates the Key Vault role assignment for the App Service managed identity. It is narrower than using `Owner`.

No Azure deployment client secret is created.

Store in each GitHub Environment:

```text
AZURE_TENANT_ID
AZURE_CLIENT_ID
AZURE_SUBSCRIPTION_ID
```

Also configure the Azure resource-name variables documented in `08-secrets-variables.md`.

---

## 2. Deploy Azure infrastructure

Run the GitHub Action:

```text
Deploy Azure Infrastructure
```

The Bicep deployment creates:

- Azure Static Web Apps Standard;
- Linux App Service Plan;
- ASP.NET Core .NET 10 App Service;
- system-assigned Managed Identity on the App Service;
- Azure Key Vault with RBAC authorization;
- Key Vault Secrets User assignment for the App Service managed identity;
- Log Analytics workspace;
- workspace-based Application Insights.

The workflow then:

- links App Service to Static Web Apps;
- puts the Application Insights connection string into App Service settings.

At this point no Dataverse runtime secret exists yet.

---

## 3. Runtime App Registration: .NET API -> Dataverse

Prerequisites:

- infrastructure from step 2 exists;
- Azure CLI authenticated as a tenant administrator or identity allowed to create Entra application credentials;
- caller can write secrets to the Key Vault.

Run:

```bash
bash scripts/bootstrap-runtime-dataverse-identity.sh \
  --app-name "Contoso Workspace Dataverse Runtime" \
  --resource-group "<resource-group>" \
  --webapp-name "<api-app-service-name>" \
  --key-vault-name "<key-vault-name>" \
  --dataverse-url "https://contoso.crm4.dynamics.com"
```

The script:

1. creates/reuses a single-tenant Entra app registration;
2. creates the service principal if needed;
3. creates a runtime client credential;
4. writes the credential directly to Key Vault as `dataverse-client-secret`;
5. configures App Service:
   - `Dataverse__Url`;
   - `Dataverse__ClientId`;
   - `Dataverse__ClientSecret` as a Key Vault reference.

The credential is not printed.

Set the resulting Application (client) ID as the GitHub Environment variable:

```text
DATAVERSE_RUNTIME_CLIENT_ID
```

The application credential remains a runtime secret in Key Vault, not in GitHub.

### Rotation

Re-run the bootstrap script to create a new credential and update the Key Vault secret.

Because the Key Vault reference does not pin a secret version, App Service uses the current secret version after its Key Vault reference refresh/restart.

Periodically remove old Entra application credentials according to the organization's rotation policy.

---

## 4. Dataverse Application User

Create a **custom least-privilege Dataverse security role** before assigning the application user.

Do not use `System Administrator` as a convenience default.

### Local/admin path

Authenticate PAC CLI as an administrator, then run:

```bash
bash scripts/bootstrap-dataverse-application-user.sh \
  --environment "https://contoso.crm4.dynamics.com" \
  --app-id "<runtime-application-client-id>" \
  --role "Contoso Workspace Backend"
```

The script uses:

```text
pac admin assign-user --application-user --role ...
```

### Protected GitHub workflow path

A manually triggered alternative exists:

```text
Bootstrap Dataverse Application User
```

Configure a dedicated privileged Power Platform bootstrap identity with GitHub federation.

GitHub Environment variables:

```text
POWERPLATFORM_BOOTSTRAP_TENANT_ID
POWERPLATFORM_BOOTSTRAP_CLIENT_ID
DATAVERSE_URL
```

The workflow requires the runtime client ID and role as explicit inputs.

There is intentionally no automatic production bootstrap on push.

---

## 5. Test the real Dataverse connection

Deploy the .NET API and browse the Azure Static Web App as an authenticated user.

Check:

```http
GET /api/health
GET /api/me
GET /api/dataverse/health
```

Expected Dataverse health response:

```json
{
  "status": "ok",
  "connected": true
}
```

The endpoint performs a real Dataverse `WhoAmI` organization request but deliberately does not return the Dataverse user GUID.

A failure returns HTTP 503 without returning raw Dataverse faults or credentials.

---

## 6. Static Web Apps single-tenant Entra registration

The built-in Static Web Apps Entra provider permits a broader Microsoft-account audience.

For an enterprise deployment, prefer the boilerplate's custom single-tenant mode.

After the Static Web App exists:

```bash
bash scripts/bootstrap-swa-entra.sh \
  --app-name "Contoso Workspace Web Login" \
  --resource-group "<resource-group>" \
  --static-web-app-name "<static-web-app-name>"
```

The script:

1. creates/reuses a single-tenant Entra app registration;
2. configures the SWA login callback URI;
3. creates a credential;
4. writes the client ID and credential directly to SWA application settings.

Set GitHub Environment variables:

```text
AZURE_SWA_AUTH_MODE=singletenant
AZURE_SWA_ENTRA_TENANT_ID=<tenant-guid>
```

The Azure frontend build then renders the custom Entra provider into `staticwebapp.config.json`.

If a custom domain is later introduced, add:

```text
https://<custom-domain>/.auth/login/aad/callback
```

to the same Entra app registration.

---

## 7. Power Platform GitHub federation

For PAC CLI deployments, a separate OIDC deployment identity can be bootstrapped:

```bash
bash scripts/bootstrap-powerplatform-deployment-identity.sh \
  --app-name "Contoso Workspace GitHub Power Platform" \
  --repository "owner/repository" \
  --environment "https://contoso.crm4.dynamics.com" \
  --role "<existing-deployment-security-role>"
```

The role must be explicitly supplied.

The script creates/reuses the Entra app and service principal, creates environment-scoped GitHub FIC entries, and assigns the application user to Dataverse.

No deployment client secret is created.

---

## Identity inventory

A typical Azure + Dataverse deployment therefore has distinct identities:

```text
Human user
  -> Static Web Apps custom single-tenant Entra registration

GitHub Actions
  -> Azure deployment OIDC app
  -> Power Platform deployment OIDC app (when needed)

ASP.NET Core runtime
  -> Dataverse runtime App Registration / Application User

App Service
  -> system-assigned Managed Identity
  -> Key Vault Secrets User
```

Do not merge them into one app registration merely to reduce setup work.

## Secrets inventory

Long-lived secret material in the default Azure path:

- Dataverse runtime application credential -> Azure Key Vault;
- SWA custom authentication credential -> Azure Static Web Apps application settings;
- Static Web Apps deployment token -> GitHub Environment secret.

GitHub OIDC deployment identities have no client secret.

See `08-secrets-variables.md` for the full matrix.
