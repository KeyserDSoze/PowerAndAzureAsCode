# Azure .NET 10 API

## Baseline

The starter API is:

```text
src/backends/azure-api/PowerAndAzureAsCode.Api/
```

and targets:

```xml
<TargetFramework>net10.0</TargetFramework>
```

It is intentionally small so derived products can choose Minimal APIs, controllers, vertical slices or another ASP.NET Core organization without fighting the template.

## Authentication model

The default API expects to be a **linked backend** of Azure Static Web Apps.

Static Web Apps authenticates the user and forwards principal information through:

```text
x-ms-client-principal
```

`StaticWebAppsPrincipalMiddleware` converts that trusted linked-backend header into an ASP.NET Core `ClaimsPrincipal`.

In Development only, the middleware creates a local developer principal when the header is absent.

Do not copy that development fallback into an environment marked Production.

## Example endpoints

All example endpoints require an authenticated Static Web Apps principal.

```http
GET /api/health
```

Reports process/runtime health and whether Dataverse configuration is present.

```http
GET /api/me
```

Demonstrates the trusted user principal propagated from Static Web Apps to ASP.NET Core.

```http
GET /api/dataverse/health
```

Creates a real Dataverse `ServiceClient` and executes `WhoAmI`. It returns only connectivity status, never the Dataverse user identifier or raw fault.

```http
POST /api/boilerplate-ping
Content-Type: application/json

{ "message": "hello" }
```

Demonstrates the intended BFF pattern: the API validates the request, invokes the configured Dataverse Custom API with `OrganizationRequest`, and normalizes the response to `{ "reply": "..." }`. The authoritative operation remains the Dataverse Custom API/plugin.

## Dataverse

The starter uses:

```text
Microsoft.PowerPlatform.Dataverse.Client
```

The connection factory reads ASP.NET Core configuration. The neutral example additionally reads `Dataverse:BoilerplatePingApiName`; do not hard-code a publisher prefix in the generic template.

Production uses App Service settings plus a Key Vault reference by default. The Bicep baseline enables a system-assigned App Service Managed Identity and grants it Key Vault read access.

## Recommended derived structure

As the application grows:

```text
Api/
  Features/
    Reservations/
      CreateReservationEndpoint.cs
      CreateReservationService.cs
      Models.cs
  Dataverse/
    DataverseConnectionFactory.cs
    ...
  Auth/
  Observability/
```

or use your organization's established clean/vertical architecture.

Avoid a giant `DataverseController` that exposes arbitrary tables.

## Error contracts

Define explicit application error codes, for example:

```json
{
  "code": "CONFLICT",
  "message": "The operation could not be completed.",
  "correlationId": "..."
}
```

Do not leak:

- connection strings;
- Dataverse raw faults with secrets/internal IDs;
- stack traces in production;
- access tokens.

## Application Insights

Application Insights is part of the Azure baseline. The project references `Microsoft.ApplicationInsights.AspNetCore`, and the infrastructure workflow configures `APPLICATIONINSIGHTS_CONNECTION_STRING` from the provisioned workspace-based Application Insights component.

Recommended telemetry:

- request/trace correlation ID;
- operation name;
- target host;
- dependency timing;
- Dataverse operation category;
- success/failure code.

Avoid logging business payloads by default.

## Alternative: Azure Functions

.NET 10 is supported by Azure Functions 4.x in the isolated worker model.

Use Functions when:

- workloads are event/serverless oriented;
- consumption scaling is desirable;
- the API shape fits Functions.

On Linux, .NET 10 does not run on the old Consumption plan; use Flex Consumption or another supported hosting plan.

The shared React adapter does not need to change if the replacement backend still exposes compatible same-origin `/api` contracts.
