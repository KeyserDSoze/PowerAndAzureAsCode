using System;
using Microsoft.Xrm.Sdk;

namespace PowerAndAzureAsCode.Dataverse.Plugins.CustomApis;

public sealed class BoilerplatePingPlugin : IPlugin
{
    public const string InputMessage = "Message";
    public const string OutputReply = "Reply";

    public void Execute(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetService(typeof(IPluginExecutionContext)) as IPluginExecutionContext
            ?? throw new InvalidPluginExecutionException("Execution context is unavailable.");

        var tracing = serviceProvider.GetService(typeof(ITracingService)) as ITracingService;
        var message = context.InputParameters.Contains(InputMessage)
            ? context.InputParameters[InputMessage] as string
            : null;

        context.OutputParameters[OutputReply] = string.IsNullOrWhiteSpace(message)
            ? "pong"
            : $"pong:{message}";

        tracing?.Trace("BoilerplatePingPlugin completed.");
    }
}
