const guidPattern =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function validatePowerAppsDeploymentTarget(environmentName, solutionId) {
  if (!environmentName?.trim()) {
    throw new Error("POWERAPPS_ENVIRONMENT_NAME is required.");
  }

  if (/^Default-/i.test(environmentName.trim())) {
    throw new Error(
      "Unattended Code App deployment is not supported for a default Power Platform environment. Use a dedicated non-default environment."
    );
  }

  if (!solutionId?.trim()) {
    throw new Error(
      "POWERAPPS_SOLUTION_ID is required so publishing cannot fall back to an unintended preferred solution."
    );
  }

  if (!guidPattern.test(solutionId.trim())) {
    throw new Error("POWERAPPS_SOLUTION_ID must be a solution GUID.");
  }

  return {
    environmentName: environmentName.trim(),
    solutionId: solutionId.trim()
  };
}
