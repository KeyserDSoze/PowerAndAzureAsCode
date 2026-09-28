import assert from "node:assert/strict";
import test from "node:test";

import { validatePowerAppsDeploymentTarget } from "./powerapps-deployment-target.mjs";

const solutionId = "11111111-2222-3333-4444-555555555555";

test("accepts a dedicated environment and explicit solution", () => {
  assert.deepEqual(
    validatePowerAppsDeploymentTarget("Development", solutionId),
    { environmentName: "Development", solutionId }
  );
});

test("rejects default Power Platform environments", () => {
  assert.throws(
    () =>
      validatePowerAppsDeploymentTarget(
        "Default-00000000-0000-0000-0000-000000000000",
        solutionId
      ),
    /dedicated non-default environment/
  );
});

test("rejects missing or malformed solution IDs", () => {
  assert.throws(
    () => validatePowerAppsDeploymentTarget("Development", ""),
    /POWERAPPS_SOLUTION_ID is required/
  );
  assert.throws(
    () => validatePowerAppsDeploymentTarget("Development", "preferred"),
    /solution GUID/
  );
});
