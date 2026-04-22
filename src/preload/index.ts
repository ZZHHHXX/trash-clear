import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/ipc/channels.js";
import type {
  ScanProgressEvent,
  ScanResultBatchEvent,
  StartScanPayload,
  StartScanResponse
} from "../shared/ipc/scan-ipc.js";
import type { AppSettings } from "../shared/types/app-settings.js";

contextBridge.exposeInMainWorld("trashClear", {
  getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.app.getVersion) as Promise<string>,
  getSettings: () => ipcRenderer.invoke(IPC_CHANNELS.settings.get) as Promise<AppSettings>,
  updateSettings: (payload: Partial<AppSettings>) =>
    ipcRenderer.invoke(IPC_CHANNELS.settings.update, payload) as Promise<AppSettings>,
  startScan: (payload: StartScanPayload) =>
    ipcRenderer.invoke(IPC_CHANNELS.scan.start, payload) as Promise<StartScanResponse>,
  onScanProgress: (handler: (event: ScanProgressEvent) => void) => {
    const listener = (_event: unknown, payload: ScanProgressEvent) => {
      handler(payload);
    };

    ipcRenderer.on(IPC_CHANNELS.scan.progress, listener);

    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.scan.progress, listener);
    };
  },
  onScanResultBatch: (handler: (event: ScanResultBatchEvent) => void) => {
    const listener = (_event: unknown, payload: ScanResultBatchEvent) => {
      handler(payload);
    };

    ipcRenderer.on(IPC_CHANNELS.scan.resultBatch, listener);

    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.scan.resultBatch, listener);
    };
  },
  minimizeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.window.minimize) as Promise<void>,
  toggleMaximizeWindow: () =>
    ipcRenderer.invoke(IPC_CHANNELS.window.toggleMaximize) as Promise<boolean>,
  closeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.window.close) as Promise<void>,
  quitApp: () => ipcRenderer.invoke(IPC_CHANNELS.window.quit) as Promise<void>
});
