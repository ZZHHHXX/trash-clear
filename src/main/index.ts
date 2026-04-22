import { app } from "electron";
import { registerAppLifecycle } from "./app/lifecycle.js";
import { registerIpcHandlers } from "./ipc/register-ipc.js";
import { createAppTray } from "./tray/create-tray.js";
import { createMainWindow } from "./window/main-window.js";

app.whenReady().then(() => {
  registerIpcHandlers();
  registerAppLifecycle();
  createMainWindow();
  createAppTray();
});
