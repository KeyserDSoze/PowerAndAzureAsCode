using System.Security.Claims;
using SecurityClaimTypes = System.Security.Claims.ClaimTypes;
using Microsoft.Xrm.Sdk;
using PowerAndAzureAsCode.Api.Auth;
using PowerAndAzureAsCode.Api.Dataverse;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplicationInsightsTelemetry();
builder.Services.AddSingleton<DataverseConnectionFactory>();
builder.Services.AddSingleton<DataverseBoilerplatePing>();

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
        id = context.User.FindFirstValue(SecurityClaimTypes.NameIdentifier),
        name = context.User.Identity.Name,
        roles = context.User.FindAll(SecurityClaimTypes.Role).Select(role => role.Value).Distinct().OrderBy(role => role)
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

app.MapPost("/api/boilerplate-ping", async (
    HttpContext context,
    BoilerplatePingRequest request,
    DataverseBoilerplatePing operation,
    ILogger<Program> logger,
    CancellationToken cancellationToken) =>
{
    if (context.User.Identity?.IsAuthenticated != true)
    {
        return Results.Unauthorized();
    }

    if (request.Message is null || request.Message.Length > 200)
    {
        return Results.BadRequest(new
        {
            code = "INVALID_REQUEST",
            message = "message must be a string with at most 200 characters."
        });
    }

    if (!operation.IsConfigured)
    {
        return Results.Problem(
            statusCode: StatusCodes.Status503ServiceUnavailable,
            title: "Dataverse BoilerplatePing is not configured.");
    }

    try
    {
        var reply = await operation.ExecuteAsync(request.Message, cancellationToken);
        return Results.Ok(new { reply });
    }
    catch (Exception exception)
    {
        logger.LogError(
            "BoilerplatePing failed with exception type {ExceptionType}.",
            exception.GetType().FullName);

        return Results.Problem(
            statusCode: StatusCodes.Status502BadGateway,
            title: "Dataverse operation failed.");
    }
});

app.Run();

internal sealed record BoilerplatePingRequest(string? Message);
