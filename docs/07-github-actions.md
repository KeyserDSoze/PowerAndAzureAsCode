# GitHub Actions and environments

## Workflows

### CI

`.github/workflows/ci.yml`

Runs:

- config validation;
- all three frontend builds;
- .NET 10 restore/build.

### Power Apps

`.github/workflows/deploy-powerapps.yml`

Builds Power Apps mode and publishes with `pa app push --non-interactive`.

### Power Pages

`.github/workflows/deploy-powerpages.yml`

Builds Power Pages mode, authenticates PAC CLI using GitHub federation and uploads the Code Site.

### Azure frontend

`.github/workflows/deploy-azure-frontend.yml`

Builds Azure mode and uploads the prebuilt `dist` to Static Web Apps.

### Azure API

`.github/workflows/deploy-azure-api.yml`

Uses Azure OIDC, publishes .NET 10, deploys to App Service.

### Azure infrastructure

`.github/workflows/deploy-azure-infra.yml`

Creates/updates Azure resources via Bicep and links App Service as the Static Web Apps backend.

### CodeQL

`.github/workflows/codeql.yml`

Analyzes JavaScript/TypeScript and C#.

## GitHub Environments

Create:

- `development`
- `test`
- `production`

Store values at Environment level rather than as one global set whenever target environments differ.

Recommended production controls:

- required reviewers;
- prevent self-review if required by governance;
- environment-specific OIDC/FIC;
- deployment branch restrictions.

## Automatic deployment guard

Each normal code-deploy workflow has a **repository-level GitHub variable** that must be `true` for push-driven DEV deployment. Job-level conditions are evaluated before GitHub Environment-scoped values are loaded, so these guard flags deliberately live at repository scope.

- `POWERAPPS_AUTO_DEPLOY`
- `POWERPAGES_AUTO_DEPLOY`
- `AZURE_FRONTEND_AUTO_DEPLOY`
- `AZURE_API_AUTO_DEPLOY`

Manual `workflow_dispatch` is still available even when automatic deployment is disabled.

This makes a new template safe: copying the repository does not automatically publish to a tenant.

## Why infrastructure is manual

Infrastructure deployment stays manual by default because it can create/change billable cloud resources and linked-backend security configuration.

## OIDC permission

Jobs that use federation need:

```yaml
permissions:
  contents: read
  id-token: write
```

Do not add `id-token: write` to every workflow by habit.

## Branch protection

Recommended:

- PR required before `main`;
- CI required;
- CodeQL required where available;
- disallow force pushes to `main`;
- production Environment approval.

## Versioning

The root package starts at `0.0.1`.

Derived products should bump version for releases. `scripts/write-version.mjs` writes `version.json` into the compiled frontend artifact containing version, commit SHA and build timestamp.
