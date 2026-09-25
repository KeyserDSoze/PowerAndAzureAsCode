# Dataverse backend and Power Apps

## The key distinction

A Power Apps Code App is a React/TypeScript client hosted by Power Apps.

Power Apps CLI can generate TypeScript services for Dataverse tables, actions and functions. The Code App can call those services directly using the signed-in Power Apps user's platform context.

That does **not** make the React application the backend.

## Simple CRUD path

For straightforward data access:

```text
React
 -> application repository
 -> generated Dataverse table service
 -> Dataverse
```

This is appropriate when Dataverse security roles, table privileges and standard CRUD semantics are sufficient.

## Business-operation path

For authoritative business behavior:

```text
React
 -> application use-case/repository
 -> generated Dataverse Custom API service
 -> Dataverse Custom API
 -> Dataverse plug-in
```

Use this path for booking, allocation, cancellation, approval, capacity, conflict detection, multi-table transactions and other rules that must not depend on the browser.

## Why this backend is shared

The same Custom API can be reached by every delivery target:

```text
Power Apps -> generated Dataverse API service ----+
                                                   |
Power Pages -> Server Logic -----------------------+--> Dataverse Custom API -> plug-in
                                                   |
Azure -> .NET 10 API / Dataverse ServiceClient ---+
```

This avoids implementing the same business rule three times.

## Repository layout

All application/runtime source is under `src`:

```text
src/
├── frontend/
├── backends/
│   ├── azure-api/
│   ├── dataverse/
│   └── powerpages/
└── hosting/
    └── azure/
```

Root folders intentionally left outside `src`:

- `.github`: CI/CD;
- `docs`: documentation;
- `infra`: infrastructure as code;
- `scripts`: repository/build tooling.

## Dataverse plug-in runtime

Dataverse plug-in assemblies are not .NET 10 ASP.NET Core projects. Microsoft currently supports Dataverse plug-ins on .NET Framework and recommends .NET Framework 4.8 for new plug-in code.

The boilerplate therefore deliberately contains:

```text
src/backends/azure-api/...        -> .NET 10
src/backends/dataverse/...        -> .NET Framework 4.8
```

They solve different runtime concerns.

## Sample

See:

```text
src/backends/dataverse/README.md
src/backends/dataverse/PowerAndAzureAsCode.Dataverse.Plugins/
src/backends/powerpages/server-logic/boilerplate-ping/server.js
```

The sample is generic and contains no customer-specific tables or business rules.
