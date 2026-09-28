import assert from "node:assert/strict";
import test from "node:test";

import {
  pinSolutionBuildPackage,
  solutionBuildPackageVersion
} from "./pin-powerplatform-solution-package.mjs";

test("pins the floating PAC solution package version", () => {
  const input = `<Project Sdk="Microsoft.NET.Sdk">
  <ItemGroup>
    <PackageReference Include="Microsoft.PowerApps.MSBuild.Solution" Version="1.*" />
  </ItemGroup>
</Project>`;

  const output = pinSolutionBuildPackage(input);
  assert.match(
    output,
    new RegExp(
      `Microsoft\\.PowerApps\\.MSBuild\\.Solution" Version="${solutionBuildPackageVersion.replaceAll(".", "\\.")}"`
    )
  );
  assert.doesNotMatch(output, /Version="1\.\*"/);
});

test("fails when PAC output shape changes unexpectedly", () => {
  assert.throws(
    () => pinSolutionBuildPackage("<Project />"),
    /PackageReference was not found/
  );
});
