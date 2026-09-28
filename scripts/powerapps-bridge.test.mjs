import assert from "node:assert/strict";
import test from "node:test";

import {
  renderBoilerplatePingBridge,
  serviceNameForApi
} from "./powerapps-bridge.mjs";

test("generated service class capitalizes the API name", () => {
  assert.equal(
    serviceNameForApi("rqt_BoilerplatePing"),
    "Rqt_BoilerplatePingService"
  );
});

test("bridge uses success/data/error result contract", () => {
  const bridge = renderBoilerplatePingBridge("rqt_BoilerplatePing");

  assert.match(bridge, /Rqt_BoilerplatePingService/);
  assert.match(bridge, /if \(!result\.success\)/);
  assert.match(bridge, /throw result\.error/);
  assert.match(bridge, /parseBoilerplatePingPayload\(result\.data\)/);
  assert.doesNotMatch(bridge, /result\.value/);
});
