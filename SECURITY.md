# Security

- Never commit client secrets, certificates, Static Web Apps deployment tokens or access tokens.
- Never put service-principal credentials in Vite variables.
- Prefer GitHub OIDC/FIC for Azure and PAC CLI.
- Scope deployment configuration to protected GitHub Environments.
- Give Dataverse application users least-privilege security roles.
- Protect Power Pages Server Logic with web roles/table permissions and CSRF.
- Grant Power Apps deployment service principals only the access required to update the code app.
- Rotate any credential that appears in logs, commits, artifacts or screenshots.

See `docs/06-authentication-security.md` and `docs/08-secrets-variables.md`.
