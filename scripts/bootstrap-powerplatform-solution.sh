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

Creates a Dataverse solution project and adds a reference to the boilerplate
Dataverse plug-in package project. Run this in a derived product repository.
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

SOLUTION_DIR="$OUTPUT_ROOT/$SOLUTION_NAME"
PLUGIN_PROJECT="$(pwd)/src/backends/dataverse/PowerAndAzureAsCode.Dataverse.Plugins"

if [[ -e "$SOLUTION_DIR" ]]; then
  echo "Solution directory already exists: $SOLUTION_DIR" >&2
  exit 1
fi

mkdir -p "$OUTPUT_ROOT"

pac solution init \
  --publisher-name "$PUBLISHER_NAME" \
  --publisher-prefix "$PUBLISHER_PREFIX" \
  --outputDirectory "$SOLUTION_DIR"

(
  cd "$SOLUTION_DIR"
  pac solution add-reference --path "$PLUGIN_PROJECT"
)

cat <<EOF
Power Platform solution project created:
  $SOLUTION_DIR

Next:
  1. Authenticate PAC CLI to the development Dataverse environment.
  2. Build/import this solution into DEV.
  3. Create the product Custom APIs and other Dataverse components in this solution.
  4. Run 'pac solution sync' from the solution project and commit the generated source.
  5. Configure the GitHub workflow variables documented in docs/19-power-platform-alm.md.

Do not change the publisher prefix after product components have been created.
EOF
