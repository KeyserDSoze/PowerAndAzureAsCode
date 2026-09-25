# Architecture

## Objective

Keep the application domain and user experience independent from the host.

```text
React UI / routes / state / use-cases
                 |
          application services
                 |
          PlatformClient seam
      +----------+----------+
      |          |          |
 Power Apps  Power Pages   Azure
      |          |          |
 connectors  Server Logic  /api
      |          |          |
      +----------+----------+
                 |
              Dataverse
```

## Shared code

The following should normally be host-independent:

- routes and screens;
- design system/components;
- domain types;
- form/state validation;
- application use-cases;
- mapping between domain and API contracts;
- telemetry abstractions;
- error handling.

## Host adapters

Host adapters handle only things that genuinely differ:

- current user/session projection;
- calling Power Apps generated services;
- Power Pages CSRF and Server Logic;
- Azure Static Web Apps auth endpoints;
- same-origin Azure API transport;
- host capabilities.

Do not place booking rules, approval rules, pricing rules, validation policy or other authoritative business rules in these adapters.

## Canonical business logic

For Dataverse-centric applications, prefer one canonical backend surface such as:

- Dataverse Custom APIs backed by plugins;
- Dataverse plugins triggered by table operations;
- a dedicated Azure domain API where Dataverse is only persistence.

The same operation can then be reached from all three hosts without duplicating behavior.

## Identity boundary

End-user identity differs per host:

- Power Apps: Power Apps/Power Platform host identity.
- Power Pages: Power Pages authenticated session and web roles.
- Azure: Microsoft Entra identity through Azure Static Web Apps.

Runtime service identity is separate:

- Azure API -> Dataverse application user.
- optional server-to-server identities for integrations.

Deployment identity is separate again:

- GitHub -> Power Platform deployment app.
- GitHub -> Azure deployment app.
- Power Apps CLI service principal.

## Azure topology

The default Azure topology uses a linked backend:

```text
Browser
  |
  v
Azure Static Web Apps
  | authenticated route
  +---- static React assets
  |
  +---- /api/* -------------------+
                                  |
                           Azure App Service
                           ASP.NET Core .NET 10
                                  |
                              Dataverse
```

A linked App Service is intentionally used instead of embedding .NET 10 in Static Web Apps managed Functions. It gives the API an ordinary ASP.NET Core lifecycle and keeps the frontend architecture unchanged.

## Deployment units

The three frontend builds come from the same source but are different release artifacts because host-specific integration/configuration can differ.

This is preferred over pretending that one identical `dist` directory must work everywhere.

## Extension rule

When introducing a new host-specific capability:

1. define an application-facing interface;
2. implement it in each required host adapter;
3. keep feature code dependent on the interface;
4. document unsupported host capabilities explicitly;
5. add tests at the adapter boundary.
