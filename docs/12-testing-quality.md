# Testing and quality

## Current template checks

CI validates:

- configuration files exist;
- TypeScript compiles in all three target builds;
- Vite bundles all three targets;
- .NET 10 restores/builds;
- Dataverse plug-in package restores/builds and emits a NuGet package;
- npm and NuGet restores use committed lockfiles;
- a disposable checkout is fully rebranded and rebuilt as a template smoke test;
- Bicep compiles;
- CodeQL analyzes TypeScript/JavaScript and C#;
- Dependabot tracks npm, NuGet and GitHub Actions;
- repository-tooling regression tests verify forbidden citation scanning;
- Node's TypeScript-capable test runner verifies shared host response contracts;
- a dependency-free .NET smoke executable verifies Static Web Apps principal parsing, including rejection of malformed headers and filtering the anonymous role.

These template-owned tests intentionally avoid a deployed tenant. Environment integration tests remain the responsibility of derived products.

## Derived application tests

Add:

- unit tests for domain/use-case logic;
- component tests for shared React features;
- adapter tests per host;
- API integration tests;
- Dataverse integration tests in non-production;
- Playwright end-to-end tests for supported delivery channels.

## Important test principle

Do not only test the Azure build and assume Power Pages/Power Apps work because React compiled.

Host integration failures are different:

- Power Apps connector generation/permissions;
- Power Pages CSRF/web roles/site permissions;
- Static Web Apps principal/linked-backend behavior.

## Contract tests

If multiple host adapters reach the same business operation, define a common contract suite.

Example:

```text
CreateReservation contract
  - valid request succeeds
  - duplicate is rejected
  - unauthorized actor is rejected
  - stale/concurrent request is handled
```

Run the same semantic cases against each host adapter in a suitable environment.

## Production smoke tests

After deployment verify:

- authentication redirect/sign-in;
- current user projection;
- backend health;
- one harmless read operation;
- one controlled write in non-production;
- expected Dataverse auditing;
- logout/session expiration.

## Security testing

Include:

- authorization negative tests;
- attempts to call backend without auth;
- attempts with insufficient role;
- malformed payload validation;
- dependency/security scanning;
- secret scanning according to organization policy.

Browser-hidden controls are not authorization tests.
