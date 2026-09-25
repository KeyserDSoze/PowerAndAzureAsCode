#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/bootstrap-azure-deployment-identity.sh \
    --app-name <entra-app-name> \
    --repository <owner/repo> \
    --github-environment <development|test|production> \
    --subscription-id <subscription-guid> \
    --resource-group <existing-resource-group>

Creates/reuses one Entra application + service principal, creates the GitHub OIDC
federated credential for the explicitly selected GitHub Environment, and grants
resource-group scoped:
  - Contributor
  - Role Based Access Control Administrator

The second role is needed because the Bicep deployment creates a Key Vault role assignment.
Run interactively with an identity allowed to manage Entra applications and Azure RBAC.
EOF
}

APP_NAME=""
REPOSITORY=""
GITHUB_ENVIRONMENT=""
SUBSCRIPTION_ID=""
RESOURCE_GROUP=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-name) APP_NAME="$2"; shift 2 ;;
    --repository) REPOSITORY="$2"; shift 2 ;;
    --github-environment) GITHUB_ENVIRONMENT="$2"; shift 2 ;;
    --subscription-id) SUBSCRIPTION_ID="$2"; shift 2 ;;
    --resource-group) RESOURCE_GROUP="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$APP_NAME" || -z "$REPOSITORY" || -z "$GITHUB_ENVIRONMENT" || -z "$SUBSCRIPTION_ID" || -z "$RESOURCE_GROUP" ]]; then
  usage
  exit 1
fi

case "$GITHUB_ENVIRONMENT" in
  development|test|production) ;;
  *) echo "github-environment must be development, test or production." >&2; exit 1 ;;
esac

command -v az >/dev/null 2>&1 || {
  echo "Azure CLI is required." >&2
  exit 1
}

az account set --subscription "$SUBSCRIPTION_ID"

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

SP_OBJECT_ID="$(az ad sp show --id "$APP_ID" --query id -o tsv)"
SCOPE="/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP"
FIC_NAME="github-$GITHUB_ENVIRONMENT"
SUBJECT="repo:$REPOSITORY:environment:$GITHUB_ENVIRONMENT"

EXISTING_FIC="$(az ad app federated-credential list \
  --id "$APP_ID" \
  --query "[?name=='$FIC_NAME'].name | [0]" -o tsv)"

if [[ -z "$EXISTING_FIC" ]]; then
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

for ROLE in "Contributor" "Role Based Access Control Administrator"; do
  COUNT="$(az role assignment list \
    --assignee "$SP_OBJECT_ID" \
    --role "$ROLE" \
    --scope "$SCOPE" \
    --query "length(@)" -o tsv)"

  if [[ "$COUNT" == "0" ]]; then
    az role assignment create \
      --assignee-object-id "$SP_OBJECT_ID" \
      --assignee-principal-type ServicePrincipal \
      --role "$ROLE" \
      --scope "$SCOPE" \
      --output none
  fi
done

TENANT_ID="$(az account show --query tenantId -o tsv)"

cat <<EOF
Azure GitHub OIDC identity ready for: $GITHUB_ENVIRONMENT

AZURE_TENANT_ID=$TENANT_ID
AZURE_CLIENT_ID=$APP_ID
AZURE_SUBSCRIPTION_ID=$SUBSCRIPTION_ID

Store these as GitHub Environment variables in '$GITHUB_ENVIRONMENT'.
No Azure client secret was created.
EOF
