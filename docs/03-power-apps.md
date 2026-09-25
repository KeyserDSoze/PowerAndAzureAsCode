# Power Apps Code Apps

## What this target is

Power Apps Code Apps allow a code-first SPA to be built with normal web tooling and published into Power Apps.

This repository does not wrap React inside a Canvas App. The derived application becomes a real Code App.

## Initialize a derived application

From `apps/web`:

```bash
pa app init --display-name "Contoso Workspace" --environment-id <environment-id>
```

This creates `power.config.json`.

For a real derived product repository, commit the generated metadata if it is required by your CI/CD process. Review the file first and confirm it contains no secret.

Do not copy a fake `power.config.json` from another tenant.

## Local host

```bash
pa app run
```

Open the Local Play URL using the same browser profile used for the Power Platform tenant.

## Dataverse and connectors

Use Power Apps CLI commands to add data sources/actions/functions to the initialized app.

Generated client code should be wrapped by application services/repositories. Avoid direct generated-service calls from dozens of React components.

Example layering:

```text
Feature -> BookingRepository -> generated Dataverse service
```

not:

```text
Feature -> generated Dataverse service
```

## Authentication

Authentication is owned by the Power Apps host. Do not add a second MSAL login flow merely to identify the same Power Apps user.

## Unattended publishing

Current Code Apps publishing supports service-principal authentication for `pa app push --non-interactive`.

Required values (target IDs/secrets are GitHub Environment-scoped; the auto-deploy guard is a repository variable):

Variables:

- `POWERAPPS_TENANT_ID`
- `POWERAPPS_CLIENT_ID`
- `POWERAPPS_SOLUTION_ID` (optional)
- `POWERAPPS_AUTO_DEPLOY`

Secret:

- `POWERAPPS_CLIENT_SECRET`

Before the service principal can update an existing Code App, an app maker must grant it **edit** access. Use the Enterprise Application object ID when sharing the app, not the App Registration object ID.

Typical one-time maker operation:

```bash
pa auth login --account <maker>
pa app share --principal <enterprise-application-object-id> --access edit
```

The CI job then publishes:

```bash
pa app push --non-interactive
```

## Solution-aware publishing

If `POWERAPPS_SOLUTION_ID` is set, the workflow uses:

```bash
pa app push --non-interactive --solution-id <solution-id>
```

## First deployment sequence

1. create/choose Power Platform environment;
2. enable Code Apps if required;
3. initialize `apps/web`;
4. publish once interactively as maker;
5. share edit access with deployment service principal;
6. add GitHub Environment values;
7. manually run `Deploy Power Apps Code App`;
8. only then consider setting `POWERAPPS_AUTO_DEPLOY=true`.

## Microsoft documentation

- https://learn.microsoft.com/power-apps/developer/code-apps/how-to/npm-quickstart
- https://learn.microsoft.com/power-apps/developer/code-apps/reference/cli
- https://learn.microsoft.com/power-apps/developer/code-apps/how-to/use-service-principal
