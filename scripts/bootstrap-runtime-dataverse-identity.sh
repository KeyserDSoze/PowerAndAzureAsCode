#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/bootstrap-runtime-dataverse-identity.sh \
    --app-name <entra-app-name> \
    --resource-group <azure-rg> \
    --webapp-name <app-service-name> \
    --key-vault-name <key-vault-name> \
    --dataverse-url <https://org.crm*.dynamics.com> \
    [--secret-name dataverse-client-secret] \
    [--credential-years 1]

Run interactively with an identity allowed to create Microsoft Entra applications
and application credentials. The generated credential is written directly to
Azure Key Vault and is never printed by this script.
EOF
}

APP_NAME=""
RESOURCE_GROUP=""
WEBAPP_NAME=""
KEY_VAULT_NAME=""
DATAVERSE_URL=""
SECRET_NAME="dataverse-client-secret"
CREDENTIAL_YEARS="1"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-name) APP_NAME="$2"; shift 2 ;;
    --resource-group) RESOURCE_GROUP="$2"; shift 2 ;;
    --webapp-name) WEBAPP_NAME="$2"; shift 2 ;;
    --key-vault-name) KEY_VAULT_NAME="$2"; shift 2 ;;
    --dataverse-url) DATAVERSE_URL="$2"; shift 2 ;;
    --secret-name) SECRET_NAME="$2"; shift 2 ;;
    --credential-years) CREDENTIAL_YEARS="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 1 ;;
  esac
done

for value in APP_NAME RESOURCE_GROUP WEBAPP_NAME KEY_VAULT_NAME DATAVERSE_URL; do
  if [[ -z "${!value}" ]]; then
    echo "Missing required argument for $value" >&2
    usage
    exit 1
  fi
done

command -v az >/dev/null 2>&1 || {
  echo "Azure CLI is required." >&2
  exit 1
}

az account show >/dev/null

APP_ID="$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv)"

if [[ -z "$APP_ID" ]]; then
  APP_ID="$(az ad app create     --display-name "$APP_NAME"     --sign-in-audience AzureADMyOrg     --query appId -o tsv)"
fi

if ! az ad sp show --id "$APP_ID" >/dev/null 2>&1; then
  az ad sp create --id "$APP_ID" --output none
fi

CLIENT_SECRET="$(az ad app credential reset   --id "$APP_ID"   --append   --display-name "dataverse-runtime"   --years "$CREDENTIAL_YEARS"   --query password -o tsv)"

az keyvault secret set   --vault-name "$KEY_VAULT_NAME"   --name "$SECRET_NAME"   --value "$CLIENT_SECRET"   --output none

unset CLIENT_SECRET

az webapp config appsettings set   --resource-group "$RESOURCE_GROUP"   --name "$WEBAPP_NAME"   --settings     "Dataverse__Url=$DATAVERSE_URL"     "Dataverse__ClientId=$APP_ID"     "Dataverse__ClientSecret=@Microsoft.KeyVault(VaultName=$KEY_VAULT_NAME;SecretName=$SECRET_NAME)"   --output none

TENANT_ID="$(az account show --query tenantId -o tsv)"

cat <<EOF
Runtime identity configured.

Tenant ID: $TENANT_ID
Application (client) ID: $APP_ID
Key Vault secret name: $SECRET_NAME

Next:
  scripts/bootstrap-dataverse-application-user.sh \
    --environment "$DATAVERSE_URL" \
    --app-id "$APP_ID" \
    --role "<existing-custom-security-role>"

Also set GitHub Environment variable:
  DATAVERSE_RUNTIME_CLIENT_ID=$APP_ID

The generated credential was not printed. It is stored in Azure Key Vault.
EOF
