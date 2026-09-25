using Microsoft.PowerPlatform.Dataverse.Client;

namespace PowerAndAzureAsCode.Api.Dataverse;

public sealed class DataverseConnectionFactory(IConfiguration configuration)
{
    private readonly string? _url = configuration["Dataverse:Url"];
    private readonly string? _clientId = configuration["Dataverse:ClientId"];
    private readonly string? _clientSecret = configuration["Dataverse:ClientSecret"];

    public bool IsConfigured =>
        Uri.TryCreate(_url, UriKind.Absolute, out _) &&
        !string.IsNullOrWhiteSpace(_clientId) &&
        !string.IsNullOrWhiteSpace(_clientSecret);

    public ServiceClient Create()
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException(
                "Dataverse runtime credentials are not configured. Use App Service settings or Key Vault references; never put them in the SPA.");
        }

        return new ServiceClient(
            new Uri(_url!, UriKind.Absolute),
            _clientId!,
            _clientSecret!,
            true);
    }
}
