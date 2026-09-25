#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/bootstrap-dataverse-application-user.sh \
    --environment <dataverse-environment-url-or-id> \
    --app-id <entra-application-client-id> \
    --role <existing-dataverse-security-role>

Prerequisite:
  Authenticate PAC CLI with an administrator identity that can assign application users.

The role is mandatory. The script has no System Administrator default.
EOF
}

ENVIRONMENT=""
APP_ID=""
ROLE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --environment) ENVIRONMENT="$2"; shift 2 ;;
    --app-id) APP_ID="$2"; shift 2 ;;
    --role) ROLE="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$ENVIRONMENT" || -z "$APP_ID" || -z "$ROLE" ]]; then
  usage
  exit 1
fi

command -v pac >/dev/null 2>&1 || {
  echo "Power Platform CLI (pac) is required." >&2
  exit 1
}

pac auth who

pac admin assign-user   --environment "$ENVIRONMENT"   --user "$APP_ID"   --role "$ROLE"   --application-user

echo "Dataverse application user assigned with role: $ROLE"
