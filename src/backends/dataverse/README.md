# Dataverse backend

This folder is the canonical server-side backend for business operations that must behave consistently across Power Apps, Power Pages and Azure.

## Power Apps does have a backend

A Power Apps Code App can use generated TypeScript services to call Dataverse tables, actions and functions directly. Those generated services run as **client transport code** in the Code App.

They are not the authoritative business backend.

For simple CRUD, direct Dataverse table access is valid when table permissions/security roles and standard Dataverse behavior are sufficient.

For business operations with concurrency, validation, multi-table behavior, authorization rules or invariants, use a Dataverse Custom API implemented by a plug-in.

## Shared path

```text
Power Apps Code App
  -> generated Dataverse API service
  -> Dataverse Custom API
  -> plug-in

Power Pages
  -> Server Logic
  -> Server.Connector.Dataverse.InvokeCustomApi
  -> Dataverse Custom API
  -> plug-in

Azure
  -> ASP.NET Core API
  -> Dataverse ServiceClient
  -> Dataverse Custom API
  -> plug-in
```

This is how one business operation can have one server-side implementation while keeping three different hosting adapters.

## Sample plug-in

The project:

```text
src/backends/dataverse/PowerAndAzureAsCode.Dataverse.Plugins/
```

contains `BoilerplatePingPlugin`, a domain-neutral Custom API handler.

Create a Custom API in a development solution with a unique name based on the solution publisher prefix, for example:

```text
<publisher-prefix>_BoilerplatePing
```

Configure:

```text
Binding type: Global
Plug-in type:
  PowerAndAzureAsCode.Dataverse.Plugins.CustomApis.BoilerplatePingPlugin

Request parameter:
  Message : String

Response property:
  Reply : String
```

The publisher prefix is intentionally not hard-coded in the template.

## Power Apps integration

After the Custom API exists:

```bash
cd src/frontend
pa app find-dataverse-api --search "BoilerplatePing"
pa app add dataverse-api --api-name <publisher-prefix>_BoilerplatePing
```

Power Apps CLI then generates TypeScript models/services for the operation. Wrap those generated services behind application repositories/use-cases.

## Power Pages integration

An example façade is under:

```text
src/backends/powerpages/server-logic/boilerplate-ping/server.js
```

It invokes the same Dataverse Custom API through `Server.Connector.Dataverse.InvokeCustomApi`.

## Build

```bash
dotnet build src/backends/dataverse/PowerAndAzureAsCode.Dataverse.Plugins/PowerAndAzureAsCode.Dataverse.Plugins.csproj -c Release
```

The plug-in project targets .NET Framework 4.8 because Dataverse plug-ins execute in the Dataverse sandbox. The Azure API remains .NET 10; these are two different runtimes by design.

## Deployment

In a derived product, put the plug-in assembly and Custom API definition in the product's Power Platform solution and promote them through normal Power Platform ALM.

Do not move cross-host business rules back into React merely because Power Apps can perform direct CRUD.
