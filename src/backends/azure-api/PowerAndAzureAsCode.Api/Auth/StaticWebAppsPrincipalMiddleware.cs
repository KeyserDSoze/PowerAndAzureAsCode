using System.Security.Claims;
using System.Text;
using System.Text.Json;

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
            context.User = Parse(header.ToString());
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

    private ClaimsPrincipal Parse(string encoded)
    {
        try
        {
            var json = Encoding.UTF8.GetString(Convert.FromBase64String(encoded));
            var principal = JsonSerializer.Deserialize<ClientPrincipal>(
                json,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (principal?.UserId is null)
            {
                return new ClaimsPrincipal();
            }

            var identity = new ClaimsIdentity(principal.IdentityProvider ?? "static-web-apps");
            identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, principal.UserId));
            identity.AddClaim(new Claim(ClaimTypes.Name, principal.UserDetails ?? principal.UserId));

            foreach (var role in principal.UserRoles ?? [])
            {
                if (!string.Equals(role, "anonymous", StringComparison.OrdinalIgnoreCase))
                {
                    identity.AddClaim(new Claim(ClaimTypes.Role, role));
                }
            }

            return new ClaimsPrincipal(identity);
        }
        catch (FormatException)
        {
            logger.LogWarning("Static Web Apps principal header was not valid Base64.");
            return new ClaimsPrincipal();
        }
        catch (JsonException)
        {
            logger.LogWarning("Static Web Apps principal header was not valid JSON.");
            return new ClaimsPrincipal();
        }
    }

    private sealed record ClientPrincipal(
        string? IdentityProvider,
        string? UserId,
        string? UserDetails,
        string[]? UserRoles);
}
