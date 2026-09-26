# GitHub repository hardening

This runbook covers repository-level governance that is intentionally not encoded in application source.

The scripts and this document describe the **desired baseline**. They do not prove that the live GitHub repository currently matches it. Repository/organization administrators may intentionally apply different rulesets, and settings can drift after bootstrap.

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

GitHub Environments can enforce reviewers, branch restrictions and other deployment protection rules before secrets are made available to a job. See https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments.

## Bootstrap script

Run with an administrator GitHub identity:

```bash
bash scripts/bootstrap-github-repository.sh \
  --repository owner/repository \
  --branch main \
  --approvals 1
```

The script uses GitHub CLI and configures:

- the repository template setting;
- automatic deletion of merged branches;
- auto-merge and update-branch support;

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

The bootstrap finishes by running the repository verifier. You can also run it independently:

```bash
bash scripts/verify-github-repository.sh \
  --repository owner/repository \
  --branch main
```

The verifier checks template/merge settings plus the expected branch-protection checks. It requires a GitHub identity with enough administration read access to inspect branch protection. If organization rulesets intentionally replace the classic branch-protection baseline, review the verifier expectations instead of blindly applying duplicate rules.

## Production reviewers

The script does not guess user/team IDs.

Configure the `production` Environment in GitHub Settings with:

- required reviewers;
- prevent self-review when required;
- deployment branch/tag rules;
- environment variables/secrets.

GitHub supports required reviewers and prevention of self-review as Environment protection rules. See https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments.

## CODEOWNERS

The boilerplate repository may contain a maintainer-specific `.github/CODEOWNERS`.

A derived repository must replace that file with the owning team/user for the product.

Do not enable `require_code_owner_reviews` until CODEOWNERS has been customized for the derived repository.

## Rulesets vs classic branch protection

The bootstrap uses the branch-protection API because it is widely available and simple to automate.

Organizations that centrally manage GitHub should normally prefer organization/repository rulesets. Rulesets can layer with classic branch protection, and the most restrictive applicable rules are enforced. See https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets.

Useful ruleset options include:

- require pull requests;
- require status checks;
- block force pushes;
- require code scanning results;
- require secret-scanning alerts to be resolved.

Reference: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets.

If organization rulesets already provide those controls, do not duplicate stricter repository rules without reviewing the combined effect.

## Required status check naming

GitHub Actions status checks use the job name as the required-check context. See https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/troubleshooting-rules.

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
10. Run `scripts/verify-github-repository.sh` and resolve or explicitly document any intended drift.
