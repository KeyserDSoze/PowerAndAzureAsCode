# Azure .NET 10 API

## Baseline

The starter API is:

```text
src/azure-api/PowerAndAzureAsCode.Api/
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

## Health endpoint

```http
GET /api/health
```

The endpoint requires an authenticated principal and reports whether Dataverse configuration is present without returning credentials.

## Dataverse

The starter uses:

```text
Microsoft.PowerPlatform.Dataverse.Client
```

The connection factory reads ASP.NET Core configuration.

Production should use App Service settings/Key Vault references.

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

Add Application Insights in a derived product when Azure is a real target.

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
