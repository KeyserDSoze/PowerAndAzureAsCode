import { resolve } from "node:path";
import {
  pinSolutionBuildPackageFile,
  solutionBuildPackageVersion
} from "./pin-powerplatform-solution-package.mjs";

const project = process.argv[2];
if (!project) {
  console.error(
    "Usage: node scripts/pin-powerplatform-solution-package-cli.mjs <solution.cdsproj>"
  );
  process.exit(1);
}

const path = resolve(project);
await pinSolutionBuildPackageFile(path);
console.log(
  `Pinned Microsoft.PowerApps.MSBuild.Solution to ${solutionBuildPackageVersion} in ${path}.`
);
