// Example façade over the shared Dataverse Custom API.
// Replace <publisher-prefix> in the derived product.

function post() {
  const input = JSON.parse(Server.Context.Body || "{}");
  const response = Server.Connector.Dataverse.InvokeCustomApi(
    "post",
    "<publisher-prefix>_BoilerplatePing",
    JSON.stringify({ Message: input.message || "" })
  );

  if (!response.IsSuccessStatusCode) {
    Server.Logger.Error("BoilerplatePing Custom API failed.");
    return JSON.stringify({ status: "error", message: "Dataverse operation failed." });
  }

  return response.Body;
}
