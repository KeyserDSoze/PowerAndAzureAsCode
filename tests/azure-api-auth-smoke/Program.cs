using System.Security.Claims;
using System.Text;
using PowerAndAzureAsCode.Api.Auth;

static void Assert(bool condition, string message)
{
    if (!condition)
    {
        throw new InvalidOperationException(message);
    }
}

var json = """
{
  "identityProvider": "aad",
  "userId": "user-123",
  "userDetails": "Example User",
  "userRoles": ["anonymous", "authenticated", "operator"]
}
""";

var encoded = Convert.ToBase64String(Encoding.UTF8.GetBytes(json));
var principal = StaticWebAppsPrincipalParser.Parse(encoded);

Assert(principal.Identity?.IsAuthenticated == true, "Expected authenticated identity.");
Assert(
    principal.FindFirstValue(ClaimTypes.NameIdentifier) == "user-123",
    "Expected NameIdentifier claim.");
Assert(principal.Identity?.Name == "Example User", "Expected display name.");
Assert(principal.IsInRole("authenticated"), "Expected authenticated role.");
Assert(principal.IsInRole("operator"), "Expected custom role.");
Assert(!principal.IsInRole("anonymous"), "Anonymous role must not be promoted.");

var warnings = new List<string>();
var invalid = StaticWebAppsPrincipalParser.Parse(
    "not-base64",
    warning => warnings.Add(warning));

Assert(
    invalid.Identity?.IsAuthenticated != true,
    "Invalid header must not authenticate a principal.");
Assert(warnings.Count == 1, "Invalid header should emit one warning.");

Console.WriteLine("Static Web Apps principal parser smoke tests passed.");
