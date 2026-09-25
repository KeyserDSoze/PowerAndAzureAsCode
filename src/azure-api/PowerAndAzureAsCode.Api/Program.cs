using PowerAndAzureAsCode.Api.Auth;
using PowerAndAzureAsCode.Api.Dataverse;

var builder = WebApplication.CreateBuilder(args);
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
        user = context.User.Identity.Name,
        dataverseConfigured = dataverse.IsConfigured
    });
});

app.Run();
