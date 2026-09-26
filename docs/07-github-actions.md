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

### Azure runtime configuration

`.github/workflows/configure-azure-runtime.yml`

Manually applies Dataverse URL/client ID and the Key Vault reference to App Service after the runtime identity has been bootstrapped.

### Dataverse Application User bootstrap

`.github/workflows/bootstrap-dataverse-application-user.yml`

Protected manual workflow that assigns the runtime application to Dataverse with an explicitly supplied security role using PAC CLI federation.

### Power Platform solution

`.github/workflows/deploy-powerplatform-solution.yml`

Builds the derived Dataverse solution project and imports the selected managed/unmanaged package using PAC CLI + GitHub OIDC/FIC. The generic template intentionally has no product solution project until `scripts/bootstrap-powerplatform-solution.sh` is run in a derived repository.

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
- `POWERPLATFORM_SOLUTION_AUTO_DEPLOY`

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


## Privileged bootstrap scripts

Creation of Entra app registrations is intentionally not performed by normal CI. Tenant administrators use the scripts documented in `17-identity-bootstrap.md`, then GitHub Actions operate with OIDC/FIC and least-privilege runtime identities.


## Concurrency

Deployment workflows use environment-scoped concurrency groups.

- Azure workflows share the `azure-<environment>` group.
- Power Platform/Power Apps/Power Pages workflows share the `powerplatform-<environment>` group.
- active deployments are not cancelled when a newer run is queued;
- CI and CodeQL cancel superseded runs for the same ref.

This prevents overlapping infrastructure/application changes in the same target environment.

## GitHub Actions supply chain

External GitHub Actions are pinned to immutable 40-character commit SHAs. The major version remains in an inline comment for readability.

Dependabot is configured for the `github-actions` ecosystem and can propose updates to those pinned commits.

Do not replace SHA pins with mutable `@vN` tags in a derived repository unless the organization explicitly accepts that supply-chain trade-off.

## Repository bootstrap

Run:

```bash
bash scripts/bootstrap-github-repository.sh \
  --repository owner/repository \
  --branch main \
  --approvals 1
```

with a GitHub administrator identity to:

- mark the repository as a template;
- enable branch cleanup after merge;
- enable auto-merge/update-branch support;
- protect `main`;
- require CI checks;
- create the deployment Environments.

See `20-github-repository-hardening.md`.
