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
src/backends/azure-api/PowerAndAzureAsCode.Api/Dataverse/DataverseBoilerplatePing.cs
src/frontend/src/platform/powerapps/boilerplatePingBridge.ts
```

The sample is generic and contains no customer-specific tables or business rules. Its purpose is to prove the transport boundary end to end.

For a derived Power Apps target, generate the real Custom API service from the environment and wire the bridge:

```bash
cd src/frontend
npx --no-install pa app add dataverse-api --api-name <publisher-prefix>_BoilerplatePing
cd ../..
npm run configure:powerapps-ping -- --api-name <publisher-prefix>_BoilerplatePing
```


## ALM

The Dataverse plug-in project uses `Microsoft.PowerApps.MSBuild.Plugin`, so it is ready to be referenced as a plug-in package from a Power Platform solution project.

In a derived product:

```bash
bash scripts/bootstrap-powerplatform-solution.sh \
  --solution-name "ProductSolution" \
  --publisher-name "Company" \
  --publisher-prefix "abc"
```

Create the actual product Custom APIs in the development solution, synchronize them back to source, and deploy the solution through `.github/workflows/deploy-powerplatform-solution.yml`.

See `19-power-platform-alm.md`.
