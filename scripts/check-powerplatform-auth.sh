#!/usr/bin/env bash
set -euo pipefail

command -v pac >/dev/null 2>&1 || {
  echo "Power Platform CLI (pac) is required." >&2
  exit 1
}

test -f src/frontend/package.json || {
  echo "Run this command from the repository root." >&2
  exit 1
}

echo "PAC CLI authentication:"
pac auth list

echo
echo "Power Apps CLI authentication:"
(
  cd src/frontend
  npx --no-install pa auth status
)

cat <<'EOF'

Verify that BOTH CLIs point at the intended tenant/environment before any
command that creates, shares, pushes, registers, synchronizes or imports
Power Platform resources. pa and pac maintain separate authentication state.
EOF
