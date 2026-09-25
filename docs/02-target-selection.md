# Target selection

Choose based on the delivery and licensing scenario, not because one host is globally better.

## Power Apps Code App

Use when:

- users already live inside Power Platform;
- Dataverse and connector integration should be native;
- the application should appear/manage like a Power App;
- Entra sign-in is naturally provided by the Power Apps host;
- makers/admins expect Power Platform ALM.

Trade-offs:

- Code Apps have their own CLI lifecycle.
- the app must be initialized against a Power Platform environment;
- unattended publishing currently uses service-principal credentials.

## Power Pages Code Site

Use when:

- users need a web application delivered as a Power Pages site;
- Power Pages web roles/table permissions are part of the security model;
- external/portal-style access is required;
- Server Logic is useful for trusted server-side work;
- the customer wants Power Pages ownership/operations.

Trade-offs:

- Code Site deployment uses PAC CLI rather than native Git integration;
- Server Logic has a managed ECMAScript runtime with specific restrictions;
- environment roles/permissions remain part of deployment readiness.

## Azure Static Web Apps + .NET API

Use when:

- full Azure hosting/control is desired;
- ASP.NET Core is preferred for the backend;
- Azure-native monitoring/networking/scaling are required;
- the application must remain independent of the Power Apps player and Power Pages runtime.

Trade-offs:

- Azure resources and operational ownership are required;
- Dataverse application-user integration must be configured;
- Static Web Apps Standard is required for the linked App Service backend.

## Multiple hosts

Use multiple hosts when the same product needs different delivery models across customers or user populations.

Do not fork the UI. Keep:

- one domain layer;
- one feature layer;
- one UI;
- host adapters and deployment manifests per channel.

## Recommended default for Dataverse-centric products

A strong default is:

- shared React frontend;
- Dataverse Custom API/plugin for authoritative cross-host business operations;
- host-specific transport adapter;
- Azure .NET API acting as a BFF/integration boundary rather than duplicating Dataverse business logic.

See `09-dataverse.md`.
