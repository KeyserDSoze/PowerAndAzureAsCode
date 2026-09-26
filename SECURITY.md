# Security

## Reporting a vulnerability

Do not report suspected vulnerabilities, leaked credentials or tenant-specific security information in a public GitHub issue.

Preferred reporting path:

1. use GitHub Private Vulnerability Reporting / a private Security Advisory when enabled for the repository;
2. otherwise contact the repository owner or the organization's security contact through an approved private channel.

Include:

- affected commit/version;
- affected host target (Power Apps, Power Pages, Azure or shared);
- reproduction steps;
- security impact;
- whether credentials/data may have been exposed;
- any suggested mitigation.

Do not include real secrets or customer data in the report.

## Supported code

This repository is a boilerplate. Security fixes are applied to the current `main` baseline.

Derived product repositories own their own supported-version and patching policy after they diverge from the template.

## Credential handling

- Never commit client secrets, certificates, Static Web Apps deployment tokens or access tokens.
- Never put service-principal credentials in Vite variables.
- Prefer GitHub OIDC/FIC for Azure and PAC CLI.
- Scope deployment configuration to protected GitHub Environments.
- Give Dataverse application users least-privilege security roles.
- Protect Power Pages Server Logic with web roles/table permissions and CSRF.
- Grant Power Apps deployment service principals only the access required to update the code app.
- Keep runtime Dataverse credentials in Azure Key Vault or an equivalent server-side secret store.
- Keep GitHub Actions pinned to immutable commit SHAs.

## Suspected secret exposure

If a credential appears in logs, commits, artifacts, screenshots or chat:

1. revoke/rotate it immediately;
2. review audit logs and recent use;
3. remove it from active configuration;
4. clean repository history only after the credential is invalidated;
5. document the incident according to organizational policy.

Deleting a committed secret without rotating it is not remediation.

## Supply chain

The repository uses:

- npm and NuGet lockfiles;
- deterministic CI restore modes;
- SHA-pinned GitHub Actions;
- Dependabot;
- CodeQL.

Review dependency and action updates before merging them.

See:

- `docs/06-authentication-security.md`
- `docs/08-secrets-variables.md`
- `docs/20-github-repository-hardening.md`
