# GitHub repository hardening

This runbook covers repository-level governance that is intentionally not encoded in application source.

## Current boilerplate expectation

The repository should eventually have:

- `main` protected;
- pull requests required;
- CI checks required;
- force pushes blocked;
- deletion of `main` blocked;
- conversations resolved before merge;
- `development`, `test` and `production` GitHub Environments;
- production approvals according to organization policy;
- environment-scoped secrets/variables;
- secret scanning/push protection where available;
- Dependabot security updates enabled.

GitHub Environments can enforce reviewers, branch restrictions and other deployment protection rules before secrets are made available to a job. citeturn318028search1turn318028search2

## Bootstrap script

Run with an administrator GitHub identity:

```bash
bash scripts/bootstrap-github-repository.sh \
  --repository owner/repository \
  --branch main \
  --approvals 1
```

The script uses GitHub CLI and configures:

- required checks:
  - `tooling`
  - `frontend`
  - `azure-api`
  - `dataverse-plugin`
  - `bicep`
  - `rebrand-smoke`
- pull requests;
- stale review dismissal;
- conversation resolution;
- no force push;
- no branch deletion;
- administrator enforcement;
- deployment environments.

The number of approvals is explicit because a solo repository and an enterprise repository have different governance needs.

## Production reviewers

The script does not guess user/team IDs.

Configure the `production` Environment in GitHub Settings with:

- required reviewers;
- prevent self-review when required;
- deployment branch/tag rules;
- environment variables/secrets.

GitHub supports required reviewers and prevention of self-review as Environment protection rules. citeturn318028search1turn318028search2

## CODEOWNERS

The boilerplate repository may contain a maintainer-specific `.github/CODEOWNERS`.

A derived repository must replace that file with the owning team/user for the product.

Do not enable `require_code_owner_reviews` until CODEOWNERS has been customized for the derived repository.

## Rulesets vs classic branch protection

The bootstrap uses the branch-protection API because it is widely available and simple to automate.

Organizations that centrally manage GitHub should normally prefer organization/repository rulesets. Rulesets can layer with classic branch protection, and the most restrictive applicable rules are enforced. citeturn129561search6

Useful ruleset options include:

- require pull requests;
- require status checks;
- block force pushes;
- require code scanning results;
- require secret-scanning alerts to be resolved. citeturn129561search0

If organization rulesets already provide those controls, do not duplicate stricter repository rules without reviewing the combined effect.

## Required status check naming

GitHub Actions status checks use the job name as the required-check context. citeturn129561search5

The boilerplate therefore keeps stable CI job names. Renaming a required CI job requires updating branch protection/rulesets at the same time.

## Security features

Where available, enable:

- secret scanning;
- push protection;
- Dependabot alerts;
- Dependabot security updates;
- CodeQL/code scanning.

The committed Dependabot configuration handles routine version updates; repository security settings handle vulnerability/security alert behavior.

## Fresh derived repository checklist

1. Rebrand the source.
2. Replace CODEOWNERS.
3. Run the GitHub hardening bootstrap.
4. Create/configure Environment variables and secrets.
5. Add production reviewers.
6. Configure OIDC/FIC subjects using the exact Environment names.
7. Verify a test PR cannot merge until required checks pass.
8. Verify production deployment stops for approval where configured.
9. Verify force push/delete of `main` is blocked.
