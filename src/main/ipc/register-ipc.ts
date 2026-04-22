import { app, BrowserWindow, ipcMain, shell } from "electron";
import { access } from "node:fs/promises";
import { dirname } from "node:path";
import { IPC_CHANNELS } from "../../shared/ipc/channels.js";
import type { CleanupRequest, CleanupResponse } from "../../shared/ipc/cleanup-ipc.js";
import type { AppSettings } from "../../shared/types/app-settings.js";
import type {
  GetScanTargetsResponse,
  RevealInFolderPayload,
  StartScanPayload,
  StartScanResponse
} from "../../shared/ipc/scan-ipc.js";
import { ScanMode } from "../../shared/enums/scan-mode.js";
import { getMainWindow, markAppShouldQuit } from "../window/main-window.js";
import { executeCleanup } from "../../core/cleanup/cleanup-service.js";
import { getAvailableScanTargets } from "../../core/scanner/windows-drives.js";
import { createScanTask, runScanTask } from "../../core/tasks/task-manager.js";

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
  ipcMain.handle(IPC_CHANNELS.scan.getTargets, async (): Promise<GetScanTargetsResponse> => {
    const targets = await getAvailableScanTargets();

    return { targets };
  });
  ipcMain.handle(IPC_CHANNELS.scan.revealInFolder, async (_event, payload: RevealInFolderPayload) => {
    try {
      await access(payload.path);
      shell.showItemInFolder(payload.path);
    } catch {
      await shell.openPath(dirname(payload.path));
    }
  });
  ipcMain.handle(IPC_CHANNELS.cleanup.execute, async (_event, payload: CleanupRequest): Promise<CleanupResponse> => {
    return executeCleanup(payload);
  });

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
      const targetWindow = getFocusedWindow();

      if (!targetWindow) {
        throw new Error("当前没有可用窗口来承载扫描任务。");
      }

      const task = createScanTask(payload);
      settings.scanMode = payload.mode === "deep" ? ScanMode.Deep : ScanMode.Quick;

      runScanTask(task, targetWindow);
      return { task };
    }
  );
}
