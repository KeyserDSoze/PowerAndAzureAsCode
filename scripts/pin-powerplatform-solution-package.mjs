import { readFile, writeFile } from "node:fs/promises";

export const solutionBuildPackageVersion = "2.12.2";

export function pinSolutionBuildPackage(content) {
  const pattern =
    /(<PackageReference\s+Include="Microsoft\.PowerApps\.MSBuild\.Solution"\s+Version=")[^"]+(")/;

  if (!pattern.test(content)) {
    throw new Error(
      "Microsoft.PowerApps.MSBuild.Solution PackageReference was not found in the generated .cdsproj."
    );
  }

  return content.replace(
    pattern,
    (_match, prefix, suffix) =>
      `${prefix}${solutionBuildPackageVersion}${suffix}`
  );
}

export async function pinSolutionBuildPackageFile(path) {
  const content = await readFile(path, "utf8");
  const next = pinSolutionBuildPackage(content);
  await writeFile(path, next, "utf8");
}
