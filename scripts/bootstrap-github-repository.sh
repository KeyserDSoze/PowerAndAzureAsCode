#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/bootstrap-github-repository.sh \
    --repository <owner/repo> \
    [--branch main] \
    [--approvals 1]

Configures repository governance with GitHub CLI:
  - protects the target branch;
  - requires the boilerplate CI checks;
  - requires pull requests;
  - blocks force pushes and branch deletion;
  - requires conversation resolution;
  - creates development/test/production deployment environments;
  - restricts test/production deployments to protected branches.

The authenticated GitHub identity must have repository Administration write access.

This script intentionally does NOT configure:
  - repository/environment secrets or variables;
  - production required reviewers (user/team IDs are organization-specific);
  - CODEOWNERS identities;
  - organization/enterprise rulesets.
EOF
}

REPOSITORY=""
BRANCH="main"
APPROVALS="1"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repository) REPOSITORY="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    --approvals) APPROVALS="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$REPOSITORY" ]]; then
  usage
  exit 1
fi

if [[ ! "$REPOSITORY" =~ ^[^/]+/[^/]+$ ]]; then
  echo "--repository must use owner/repo format." >&2
  exit 1
fi

if [[ ! "$APPROVALS" =~ ^[0-6]$ ]]; then
  echo "--approvals must be an integer from 0 to 6." >&2
  exit 1
fi

command -v gh >/dev/null 2>&1 || {
  echo "GitHub CLI (gh) is required." >&2
  exit 1
}

gh auth status >/dev/null

echo "Protecting $REPOSITORY branch '$BRANCH'..."

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "repos/$REPOSITORY/branches/$BRANCH/protection" \
  --input - <<JSON
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "tooling",
      "frontend",
      "azure-api",
      "dataverse-plugin",
      "bicep",
      "rebrand-smoke"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": $APPROVALS,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
JSON

echo "Creating/updating deployment environments..."

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "repos/$REPOSITORY/environments/development" \
  --input - <<'JSON'
{
  "deployment_branch_policy": null
}
JSON

for environment in test production; do
  gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    "repos/$REPOSITORY/environments/$environment" \
    --input - <<'JSON'
{
  "deployment_branch_policy": {
    "protected_branches": true,
    "custom_branch_policies": false
  }
}
JSON
done

cat <<EOF

GitHub repository baseline configured.

Repository: $REPOSITORY
Protected branch: $BRANCH
Required approvals: $APPROVALS

Manual follow-up:
  1. Configure production required reviewers and prevent self-review when governance requires it.
  2. Replace/customize .github/CODEOWNERS for the derived repository.
  3. Add GitHub Environment variables/secrets from docs/08-secrets-variables.md.
  4. Enable secret scanning/push protection and Dependabot security updates where available.
  5. If your organization uses repository/organization rulesets, layer them on top of this baseline.
EOF
