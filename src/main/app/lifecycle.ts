import { app, BrowserWindow } from "electron";
import { createMainWindow, getMainWindow } from "../window/main-window.js";

export function registerAppLifecycle() {
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      return;
    }

    getMainWindow()?.show();
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
}
