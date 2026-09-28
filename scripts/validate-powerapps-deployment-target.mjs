import { validatePowerAppsDeploymentTarget } from "./powerapps-deployment-target.mjs";

try {
  const target = validatePowerAppsDeploymentTarget(
    process.env.POWERAPPS_ENVIRONMENT_NAME,
    process.env.POWERAPPS_SOLUTION_ID
  );

  console.log(
    `Power Apps deployment target validated: ${target.environmentName}; solution ${target.solutionId}.`
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : "Invalid Power Apps deployment target.");
  process.exit(1);
}
