// Generic Power Pages Server Logic template.
// Install it into the deployable .powerpages-site metadata with the repository helper.

function get() {
  try {
    Server.Logger.Log("Boilerplate health endpoint called.");
    return JSON.stringify({
      status: "ok",
      runtime: "power-pages-server-logic",
      activityId: Server.Context.ActivityId
    });
  } catch (error) {
    Server.Logger.Error("Boilerplate health endpoint failed.");
    return JSON.stringify({
      status: "error",
      message: "Health check failed."
    });
  }
}
