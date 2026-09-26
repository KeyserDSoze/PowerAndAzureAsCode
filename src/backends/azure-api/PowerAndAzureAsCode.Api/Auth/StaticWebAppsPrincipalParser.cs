using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace PowerAndAzureAsCode.Api.Auth;

public static class StaticWebAppsPrincipalParser
{
    public static ClaimsPrincipal Parse(
        string encoded,
        Action<string>? warning = null)
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

            var identity = new ClaimsIdentity(
                principal.IdentityProvider ?? "static-web-apps");
            identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, principal.UserId));
            identity.AddClaim(new Claim(
                ClaimTypes.Name,
                principal.UserDetails ?? principal.UserId));

            foreach (var role in principal.UserRoles ?? [])
            {
                if (!string.Equals(
                    role,
                    "anonymous",
                    StringComparison.OrdinalIgnoreCase))
                {
                    identity.AddClaim(new Claim(ClaimTypes.Role, role));
                }
            }

            return new ClaimsPrincipal(identity);
        }
        catch (FormatException)
        {
            warning?.Invoke("Static Web Apps principal header was not valid Base64.");
            return new ClaimsPrincipal();
        }
        catch (JsonException)
        {
            warning?.Invoke("Static Web Apps principal header was not valid JSON.");
            return new ClaimsPrincipal();
        }
    }

    private sealed record ClientPrincipal(
        string? IdentityProvider,
        string? UserId,
        string? UserDetails,
        string[]? UserRoles);
}
