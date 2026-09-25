# Troubleshooting

## CI: npm cache complains about missing lock file

This template may initially be copied before the derived application has generated its own lock file. Run:

```bash
npm install
```

and commit the generated `package-lock.json` in the derived repository. Once present, prefer `npm ci` in stricter product pipelines.

## Power Apps workflow says power.config.json is missing

Run from `apps/web`:

```bash
pa app init --display-name "<app-name>" --environment-id <environment-id>
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

## Azure API says Dataverse is not configured

Set App Service configuration:

```text
Dataverse__Url
Dataverse__ClientId
Dataverse__ClientSecret
```

Prefer Key Vault reference for the secret.

## Dataverse returns insufficient privilege

Fix the application user's custom security role. Do not solve routine privilege gaps by assigning System Administrator.

## Bicep App Service runtime error

Azure API/runtime schema can evolve. Confirm the current supported Linux runtime string for .NET 10 in the target region and update the Bicep/API version if Microsoft changes the platform contract.

## GitHub push did not deploy

Normal push deployment is guarded.

Set the correct Environment variable to the literal `true`:

- `POWERAPPS_AUTO_DEPLOY`
- `POWERPAGES_AUTO_DEPLOY`
- `AZURE_FRONTEND_AUTO_DEPLOY`
- `AZURE_API_AUTO_DEPLOY`

Or run the workflow manually.
