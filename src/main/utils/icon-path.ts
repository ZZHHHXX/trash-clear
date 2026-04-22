import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFile);

export function resolveAppIconPath() {
  if (process.platform === "win32") {
    return join(currentDir, "../../../assets/icons/trash-clear.ico");
  }

  return join(currentDir, "../../../assets/icons/trash-clear.png");
}
