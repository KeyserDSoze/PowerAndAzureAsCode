#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/bootstrap-swa-entra.sh \
    --app-name <entra-app-name> \
    --resource-group <azure-rg> \
    --static-web-app-name <swa-name> \
    [--credential-years 1]

Creates/reuses a single-tenant Microsoft Entra app registration for Azure Static Web Apps,
creates a credential, and writes the client ID/credential directly to Static Web Apps
application settings without printing the credential.
EOF
}

APP_NAME=""
RESOURCE_GROUP=""
STATIC_WEB_APP_NAME=""
CREDENTIAL_YEARS="1"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app-name) APP_NAME="$2"; shift 2 ;;
    --resource-group) RESOURCE_GROUP="$2"; shift 2 ;;
    --static-web-app-name) STATIC_WEB_APP_NAME="$2"; shift 2 ;;
    --credential-years) CREDENTIAL_YEARS="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$APP_NAME" || -z "$RESOURCE_GROUP" || -z "$STATIC_WEB_APP_NAME" ]]; then
  usage
  exit 1
fi

command -v az >/dev/null 2>&1 || {
  echo "Azure CLI is required." >&2
  exit 1
}

az account show >/dev/null

HOSTNAME="$(az staticwebapp show   --name "$STATIC_WEB_APP_NAME"   --resource-group "$RESOURCE_GROUP"   --query defaultHostname -o tsv)"

if [[ -z "$HOSTNAME" ]]; then
  echo "Unable to resolve Static Web App default hostname." >&2
  exit 1
fi

REDIRECT_URI="https://$HOSTNAME/.auth/login/aad/callback"
APP_ID="$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv)"

if [[ -z "$APP_ID" ]]; then
  APP_ID="$(az ad app create     --display-name "$APP_NAME"     --sign-in-audience AzureADMyOrg     --web-redirect-uris "$REDIRECT_URI"     --query appId -o tsv)"
else
  az ad app update     --id "$APP_ID"     --web-redirect-uris "$REDIRECT_URI"
fi

if ! az ad sp show --id "$APP_ID" >/dev/null 2>&1; then
  az ad sp create --id "$APP_ID" --output none
fi

CLIENT_SECRET="$(az ad app credential reset   --id "$APP_ID"   --append   --display-name "static-web-app-auth"   --years "$CREDENTIAL_YEARS"   --query password -o tsv)"

az staticwebapp appsettings set   --name "$STATIC_WEB_APP_NAME"   --resource-group "$RESOURCE_GROUP"   --setting-names     "AZURE_CLIENT_ID=$APP_ID"     "AZURE_CLIENT_SECRET=$CLIENT_SECRET"   --output none

unset CLIENT_SECRET

TENANT_ID="$(az account show --query tenantId -o tsv)"

cat <<EOF
Single-tenant Static Web Apps authentication configured.

Tenant ID: $TENANT_ID
Application (client) ID: $APP_ID
Redirect URI: $REDIRECT_URI

Set these GitHub Environment variables:
  AZURE_SWA_AUTH_MODE=singletenant
  AZURE_SWA_ENTRA_TENANT_ID=$TENANT_ID

If you later add a custom domain, add its
https://<custom-domain>/.auth/login/aad/callback redirect URI to the same app registration.
EOF
