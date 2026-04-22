import { app, BrowserWindow, ipcMain } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc/channels.js";
import type { AppSettings } from "../../shared/types/app-settings.js";
import type { StartScanPayload, StartScanResponse } from "../../shared/ipc/scan-ipc.js";
import { ScanMode } from "../../shared/enums/scan-mode.js";
import { TaskStatus } from "../../shared/enums/task-status.js";
import { getMainWindow, markAppShouldQuit } from "../window/main-window.js";

let settings: AppSettings = {
  minimizeToTrayOnClose: true,
  launchAtStartup: false,
  scanMode: ScanMode.Quick,
  aiEnabled: false
};

function getFocusedWindow() {
  return BrowserWindow.getFocusedWindow() ?? getMainWindow();
}

export function registerIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.app.getVersion, () => app.getVersion());

  ipcMain.handle(IPC_CHANNELS.settings.get, () => settings);
  ipcMain.handle(IPC_CHANNELS.settings.update, (_event, payload: Partial<AppSettings>) => {
    settings = {
      ...settings,
      ...payload
    };

    return settings;
  });

  ipcMain.handle(IPC_CHANNELS.window.minimize, () => {
    getFocusedWindow()?.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.window.toggleMaximize, () => {
    const target = getFocusedWindow();

    if (!target) {
      return false;
    }

    if (target.isMaximized()) {
      target.unmaximize();
      return false;
    }

    target.maximize();
    return true;
  });

  ipcMain.handle(IPC_CHANNELS.window.close, () => {
    getFocusedWindow()?.close();
  });

  ipcMain.handle(IPC_CHANNELS.window.quit, () => {
    markAppShouldQuit();
    app.quit();
  });

  ipcMain.handle(
    IPC_CHANNELS.scan.start,
    (_event, payload: StartScanPayload): StartScanResponse => {
      const task = {
        id: `scan-${Date.now()}`,
        targetPath: payload.targetPath,
        mode: payload.mode === "deep" ? ScanMode.Deep : ScanMode.Quick,
        status: TaskStatus.Pending,
        createdAt: new Date().toISOString()
      };

      return { task };
    }
  );
}
