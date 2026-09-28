#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/bootstrap-powerplatform-solution.sh \
    --solution-name <solution-name> \
    --publisher-name <publisher-name> \
    --publisher-prefix <2-8-char-prefix> \
    [--output-root src/backends/dataverse/solution]

Creates the initial EMPTY Dataverse solution project for a derived product.
The plug-in project reference is deliberately added only after the plug-in
package has been registered in DEV once and the solution has been synchronized.
EOF
}

SOLUTION_NAME=""
PUBLISHER_NAME=""
PUBLISHER_PREFIX=""
OUTPUT_ROOT="src/backends/dataverse/solution"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --solution-name) SOLUTION_NAME="$2"; shift 2 ;;
    --publisher-name) PUBLISHER_NAME="$2"; shift 2 ;;
    --publisher-prefix) PUBLISHER_PREFIX="$2"; shift 2 ;;
    --output-root) OUTPUT_ROOT="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown argument: $1" >&2; usage; exit 1 ;;
  esac
done

if [[ -z "$SOLUTION_NAME" || -z "$PUBLISHER_NAME" || -z "$PUBLISHER_PREFIX" ]]; then
  usage
  exit 1
fi

if [[ ! "$SOLUTION_NAME" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
  echo "solution-name must contain only letters, digits and underscores and cannot start with a digit." >&2
  exit 1
fi

PREFIX_LOWER="$(printf '%s' "$PUBLISHER_PREFIX" | tr '[:upper:]' '[:lower:]')"
if [[ ! "$PUBLISHER_PREFIX" =~ ^[A-Za-z][A-Za-z0-9]{1,7}$ ]] || [[ "$PREFIX_LOWER" == mscrm* ]]; then
  echo "publisher-prefix must be 2-8 alphanumeric characters, start with a letter and not start with mscrm." >&2
  exit 1
fi

command -v pac >/dev/null 2>&1 || {
  echo "Power Platform CLI (pac) is required." >&2
  exit 1
}

command -v node >/dev/null 2>&1 || {
  echo "Node.js is required." >&2
  exit 1
}

command -v dotnet >/dev/null 2>&1 || {
  echo ".NET SDK is required." >&2
  exit 1
}

SOLUTION_DIR="$OUTPUT_ROOT/$SOLUTION_NAME"

if [[ -e "$SOLUTION_DIR" ]]; then
  echo "Solution directory already exists: $SOLUTION_DIR" >&2
  exit 1
fi

mkdir -p "$OUTPUT_ROOT"

pac solution init \
  --publisher-name "$PUBLISHER_NAME" \
  --publisher-prefix "$PUBLISHER_PREFIX" \
  --outputDirectory "$SOLUTION_DIR"

mapfile -t projects < <(find "$SOLUTION_DIR" -maxdepth 1 -type f -name '*.cdsproj' | sort)
if [[ "${#projects[@]}" -ne 1 ]]; then
  echo "Expected exactly one generated .cdsproj in $SOLUTION_DIR, found ${#projects[@]}." >&2
  exit 1
fi

PROJECT="${projects[0]}"

node scripts/pin-powerplatform-solution-package-cli.mjs "$PROJECT"
dotnet restore "$PROJECT" --use-lock-file

cat <<EOF
Initial Power Platform solution project created:
  $SOLUTION_DIR

First-time DEV sequence:
  1. Verify PAC/Power Apps authentication with:
       bash scripts/check-powerplatform-auth.sh
  2. Build and import this EMPTY solution into DEV.
  3. Build the plug-in package separately with a clean/non-incremental Release build.
  4. Register that NuGet package ONCE with the Plug-in Registration Tool (PRT)
     and add it to this solution.
  5. Create the Custom APIs/parameters and bind them to the registered plug-in type.
  6. Run 'pac solution sync' from this solution project and review the diff.
  7. Only now add the plug-in project reference:
       cd "$SOLUTION_DIR"
       pac solution add-reference --path "$(pwd)/src/backends/dataverse/PowerAndAzureAsCode.Dataverse.Plugins"
  8. Commit the synchronized solution source, .cdsproj and packages.lock.json.
  9. Record the registered plug-in package ID as GitHub Environment variable
       POWERPLATFORM_PLUGIN_PACKAGE_ID
     for subsequent CI updates through 'pac plugin push'.

Do not change the publisher prefix after product components have been created.
EOF
