// Generic Power Pages Server Logic facade over the shared Dataverse Custom API.
// Install it into .powerpages-site with scripts/install-powerpages-server-logic-example.mjs.

function post() {
  try {
    Server.Logger.Log("Boilerplate Dataverse ping endpoint called.");

    const input = JSON.parse(Server.Context.Body || "{}");
    if (typeof input.message !== "string" || input.message.length > 200) {
      return JSON.stringify({
        status: "error",
        message: "message must be a string with at most 200 characters."
      });
    }

    const response = Server.Connector.Dataverse.InvokeCustomApi(
      "post",
      "<publisher-prefix>_BoilerplatePing",
      JSON.stringify({ Message: input.message })
    );

    if (!response.IsSuccessStatusCode) {
      Server.Logger.Error("BoilerplatePing Custom API failed.");
      return JSON.stringify({
        status: "error",
        message: "Dataverse operation failed."
      });
    }

    return response.Body;
  } catch (error) {
    Server.Logger.Error("Boilerplate Dataverse ping endpoint failed.");
    return JSON.stringify({
      status: "error",
      message: "Request processing failed."
    });
  }
}
