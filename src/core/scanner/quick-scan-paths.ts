import { access } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

function normalizeDriveRoot(targetPath: string) {
  return (targetPath.endsWith("\\") ? targetPath : `${targetPath}\\`).slice(0, 3).toUpperCase();
}

function belongsToDrive(path: string, driveRoot: string) {
  return path.replace(/\//g, "\\").toUpperCase().startsWith(driveRoot);
}

async function filterExistingPaths(paths: string[]) {
  const results = await Promise.all(
    paths.map(async (path) => {
      try {
        await access(path);
        return path;
      } catch {
        return null;
      }
    })
  );

  return results.filter((path): path is string => Boolean(path));
}

export async function resolveQuickScanPaths(targetPath: string) {
  const driveRoot = normalizeDriveRoot(targetPath);
  const drivePath = driveRoot;
  const homePath = homedir();
  const localAppData = process.env.LOCALAPPDATA ?? join(homePath, "AppData", "Local");
  const appData = process.env.APPDATA ?? join(homePath, "AppData", "Roaming");
  const userTemp = process.env.TEMP ?? join(localAppData, "Temp");

  const candidatePaths = [
    join(drivePath, "$Recycle.Bin"),
    join(drivePath, "Temp"),
    join(drivePath, "TMP"),
    join(drivePath, "Downloads"),
    userTemp,
    join(homePath, "Downloads"),
    join(localAppData, "Microsoft", "Windows", "INetCache"),
    join(localAppData, "Microsoft", "Windows", "Explorer"),
    join(localAppData, "Google", "Chrome", "User Data", "Default", "Cache", "Cache_Data"),
    join(localAppData, "Microsoft", "Edge", "User Data", "Default", "Cache", "Cache_Data"),
    join(appData, "Mozilla", "Firefox", "Profiles")
  ].filter((path, index, list) => list.indexOf(path) === index);

  const driveScopedPaths = candidatePaths.filter((path) => belongsToDrive(path, driveRoot));

  return filterExistingPaths(driveScopedPaths);
}
