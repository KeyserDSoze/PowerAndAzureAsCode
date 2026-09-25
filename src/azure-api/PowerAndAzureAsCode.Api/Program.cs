using System.Security.Claims;
using Microsoft.Xrm.Sdk;
using PowerAndAzureAsCode.Api.Auth;
using PowerAndAzureAsCode.Api.Dataverse;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplicationInsightsTelemetry();
builder.Services.AddSingleton<DataverseConnectionFactory>();

var app = builder.Build();

app.UseMiddleware<StaticWebAppsPrincipalMiddleware>();

app.MapGet("/api/health", (HttpContext context, DataverseConnectionFactory dataverse) =>
{
    if (context.User.Identity?.IsAuthenticated != true)
    {
        return Results.Unauthorized();
    }

    return Results.Ok(new
    {
        status = "ok",
        runtime = ".NET 10",
        dataverseConfigured = dataverse.IsConfigured
    });
});

app.MapGet("/api/me", (HttpContext context) =>
{
    if (context.User.Identity?.IsAuthenticated != true)
    {
        return Results.Unauthorized();
    }

    return Results.Ok(new
    {
        id = context.User.FindFirstValue(ClaimTypes.NameIdentifier),
        name = context.User.Identity.Name,
        roles = context.User.FindAll(ClaimTypes.Role).Select(role => role.Value).Distinct().OrderBy(role => role)
    });
});

app.MapGet("/api/dataverse/health", (
    HttpContext context,
    DataverseConnectionFactory dataverse,
    ILogger<Program> logger) =>
{
    if (context.User.Identity?.IsAuthenticated != true)
    {
        return Results.Unauthorized();
    }

    if (!dataverse.IsConfigured)
    {
        return Results.Problem(
            statusCode: StatusCodes.Status503ServiceUnavailable,
            title: "Dataverse is not configured.");
    }

    try
    {
        using var client = dataverse.Create();

        if (!client.IsReady)
        {
            logger.LogWarning("Dataverse client initialization failed.");
            return Results.Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "Dataverse connectivity check failed.");
        }

        _ = client.Execute(new OrganizationRequest("WhoAmI"));

        return Results.Ok(new
        {
            status = "ok",
            connected = true
        });
    }
    catch (Exception exception)
    {
        logger.LogError(
            "Dataverse health check failed with exception type {ExceptionType}.",
            exception.GetType().FullName);

        return Results.Problem(
            statusCode: StatusCodes.Status503ServiceUnavailable,
            title: "Dataverse connectivity check failed.");
    }
});

app.Run();
