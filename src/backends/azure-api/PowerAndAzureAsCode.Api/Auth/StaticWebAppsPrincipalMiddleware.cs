using System.Security.Claims;

namespace PowerAndAzureAsCode.Api.Auth;

public sealed class StaticWebAppsPrincipalMiddleware(
    RequestDelegate next,
    IWebHostEnvironment environment,
    ILogger<StaticWebAppsPrincipalMiddleware> logger)
{
    private const string HeaderName = "x-ms-client-principal";

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue(HeaderName, out var header) &&
            !string.IsNullOrWhiteSpace(header.ToString()))
        {
            context.User = StaticWebAppsPrincipalParser.Parse(
                header.ToString(),
                warning => logger.LogWarning("{Warning}", warning));
        }
        else if (environment.IsDevelopment())
        {
            var identity = new ClaimsIdentity("development");
            identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, "local-developer"));
            identity.AddClaim(new Claim(ClaimTypes.Name, "Local Developer"));
            identity.AddClaim(new Claim(ClaimTypes.Role, "authenticated"));
            context.User = new ClaimsPrincipal(identity);
        }

        await next(context);
    }
}
