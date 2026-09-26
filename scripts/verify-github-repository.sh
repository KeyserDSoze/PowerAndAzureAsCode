#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/verify-github-repository.sh --repository <owner/repo> [--branch main]

Verifies repository settings expected by docs/20-github-repository-hardening.md.
The authenticated GitHub identity needs repository administration read access for
branch-protection verification.
EOF
}

REPOSITORY=""
BRANCH="main"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repository) REPOSITORY="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ ! "$REPOSITORY" =~ ^[^/]+/[^/]+$ ]]; then
  usage
  exit 1
fi

command -v gh >/dev/null 2>&1 || {
  echo "GitHub CLI (gh) is required." >&2
  exit 1
}

gh auth status >/dev/null

expect_repo_setting() {
  local field="$1"
  local expected="$2"
  local actual

  actual="$(gh api "repos/$REPOSITORY" --jq ".$field")"
  if [[ "$actual" != "$expected" ]]; then
    echo "Repository drift: $field expected '$expected', found '$actual'." >&2
    return 1
  fi
}

failures=0
expect_repo_setting is_template true || failures=$((failures + 1))
expect_repo_setting delete_branch_on_merge true || failures=$((failures + 1))
expect_repo_setting allow_auto_merge true || failures=$((failures + 1))
expect_repo_setting allow_update_branch true || failures=$((failures + 1))

required_checks=(
  tooling
  frontend
  azure-api
  dataverse-plugin
  bicep
  rebrand-smoke
)

protection_json="$(gh api "repos/$REPOSITORY/branches/$BRANCH/protection")"
for check in "${required_checks[@]}"; do
  if ! jq -e --arg check "$check"     '.required_status_checks.contexts // [] | index($check) != null'     <<<"$protection_json" >/dev/null; then
    echo "Branch protection drift: required check '$check' is missing on $BRANCH." >&2
    failures=$((failures + 1))
  fi
done

if [[ "$(jq -r '.required_pull_request_reviews != null' <<<"$protection_json")" != "true" ]]; then
  echo "Branch protection drift: pull-request reviews are not required on $BRANCH." >&2
  failures=$((failures + 1))
fi

if [[ "$(jq -r '.required_conversation_resolution.enabled // false' <<<"$protection_json")" != "true" ]]; then
  echo "Branch protection drift: conversation resolution is not required on $BRANCH." >&2
  failures=$((failures + 1))
fi

if (( failures > 0 )); then
  echo "GitHub repository verification failed with $failures drift item(s)." >&2
  exit 1
fi

echo "GitHub repository settings match the documented baseline."
