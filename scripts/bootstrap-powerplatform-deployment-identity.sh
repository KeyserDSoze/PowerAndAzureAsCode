#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/bootstrap-powerplatform-deployment-identity.sh \
    --app-name <entra-app-name> \
    --repository <owner/repo> \
    --github-environment <development|test|production> \
    --environment <dataverse-environment-url-or-id> \
    --role <existing-dataverse-security-role>

Creates/reuses one Entra application + service principal, creates the GitHub OIDC
federated credential for the explicitly selected GitHub Environment, and assigns
the application user to the target Power Platform environment with the supplied role.

Prerequisites:
  - Azure CLI authenticated with permission to manage Entra applications.
  - PAC CLI authenticated with an administrator identity.
EOF
}

APP_NAME=""
REPOSITORY=""
GITHUB_ENVIRONMENT=""
ENVIRONMENT=""
ROLE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-name) APP_NAME="$2"; shift 2 ;;
    --repository) REPOSITORY="$2"; shift 2 ;;
    --github-environment) GITHUB_ENVIRONMENT="$2"; shift 2 ;;
    --environment) ENVIRONMENT="$2"; shift 2 ;;
    --role) ROLE="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$APP_NAME" || -z "$REPOSITORY" || -z "$GITHUB_ENVIRONMENT" || -z "$ENVIRONMENT" || -z "$ROLE" ]]; then
  usage
  exit 1
fi

case "$GITHUB_ENVIRONMENT" in
  development|test|production) ;;
  *) echo "github-environment must be development, test or production." >&2; exit 1 ;;
esac

for command in az pac; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "Missing required command: $command" >&2
    exit 1
  }
done

mapfile -t APP_IDS < <(az ad app list --display-name "$APP_NAME" --query "[].appId" -o tsv)
if [[ "${#APP_IDS[@]}" -gt 1 ]]; then
  echo "More than one Entra application has display name '$APP_NAME'. Use a unique display name." >&2
  exit 1
fi

APP_ID="${APP_IDS[0]:-}"
if [[ -z "$APP_ID" ]]; then
  APP_ID="$(az ad app create \
    --display-name "$APP_NAME" \
    --sign-in-audience AzureADMyOrg \
    --query appId -o tsv)"
fi

if ! az ad sp show --id "$APP_ID" >/dev/null 2>&1; then
  az ad sp create --id "$APP_ID" --output none
fi

FIC_NAME="github-$GITHUB_ENVIRONMENT"
SUBJECT="repo:$REPOSITORY:environment:$GITHUB_ENVIRONMENT"

EXISTING="$(az ad app federated-credential list \
  --id "$APP_ID" \
  --query "[?name=='$FIC_NAME'].name | [0]" -o tsv)"

if [[ -z "$EXISTING" ]]; then
  TMP_FILE="$(mktemp)"
  trap 'rm -f "$TMP_FILE"' EXIT
  cat > "$TMP_FILE" <<EOF
{
  "name": "$FIC_NAME",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "$SUBJECT",
  "description": "GitHub Actions $GITHUB_ENVIRONMENT environment",
  "audiences": ["api://AzureADTokenExchange"]
}
EOF

  az ad app federated-credential create \
    --id "$APP_ID" \
    --parameters "$TMP_FILE" \
    --output none
fi

pac auth who
pac admin assign-user \
  --environment "$ENVIRONMENT" \
  --user "$APP_ID" \
  --role "$ROLE" \
  --application-user

TENANT_ID="$(az account show --query tenantId -o tsv)"

cat <<EOF
Power Platform GitHub OIDC identity ready for: $GITHUB_ENVIRONMENT

Tenant ID: $TENANT_ID
Application (client) ID: $APP_ID
Target environment: $ENVIRONMENT
Assigned Dataverse role: $ROLE

Use the application/client ID and tenant ID in the '$GITHUB_ENVIRONMENT' GitHub Environment.
No deployment client secret was created.
EOF
