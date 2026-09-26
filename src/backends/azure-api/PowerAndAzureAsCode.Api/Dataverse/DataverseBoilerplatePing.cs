using Microsoft.Xrm.Sdk;

namespace PowerAndAzureAsCode.Api.Dataverse;

public sealed class DataverseBoilerplatePing(
    DataverseConnectionFactory connectionFactory,
    IConfiguration configuration)
{
    private readonly string? _apiName = configuration["Dataverse:BoilerplatePingApiName"];

    public bool IsConfigured =>
        connectionFactory.IsConfigured &&
        !string.IsNullOrWhiteSpace(_apiName);

    public async Task<string> ExecuteAsync(
        string message,
        CancellationToken cancellationToken = default)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException(
                "Dataverse BoilerplatePing Custom API is not configured.");
        }

        using var client = connectionFactory.Create();
        if (!client.IsReady)
        {
            throw new InvalidOperationException("Dataverse client is not ready.");
        }

        var request = new OrganizationRequest(_apiName!);
        request.Parameters["Message"] = message;

        var response = await client.ExecuteAsync(request, cancellationToken);
        if (!response.Results.TryGetValue("Reply", out var replyValue) ||
            replyValue is not string reply ||
            string.IsNullOrWhiteSpace(reply))
        {
            throw new InvalidOperationException(
                "Dataverse BoilerplatePing response did not contain Reply.");
        }

        return reply;
    }
}
