import { BrowserWindow } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveAppIconPath } from "../utils/icon-path.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let shouldQuit = false;

function resolveRendererEntry(): { kind: "url"; value: string } | { kind: "file"; value: string } {
  const rendererUrl = process.env.VITE_DEV_SERVER_URL;

  if (rendererUrl) {
    return { kind: "url", value: rendererUrl };
  }

  return { kind: "file", value: join(__dirname, "../../renderer/index.html") };
}

export function markAppShouldQuit() {
  shouldQuit = true;
}

export function getMainWindow() {
  return mainWindow;
}

export function createMainWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }

  const preloadPath = join(__dirname, "../../preload/index.js");

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1080,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#edf6ff",
    icon: resolveAppIconPath(),
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  const entry = resolveRendererEntry();

  if (entry.kind === "url") {
    void mainWindow.loadURL(entry.value);
  } else {
    void mainWindow.loadFile(entry.value);
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("close", (event) => {
    if (shouldQuit) {
      return;
    }

    event.preventDefault();
    mainWindow?.hide();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  return mainWindow;
}
