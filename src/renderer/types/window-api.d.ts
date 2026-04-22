export {};

import type { AppSettings } from "@shared/types/app-settings";
import type {
  ScanProgressEvent,
  ScanResultBatchEvent,
  StartScanPayload,
  StartScanResponse
} from "@shared/ipc/scan-ipc";

declare global {
  interface Window {
    trashClear: {
      getAppVersion: () => Promise<string>;
      getSettings: () => Promise<AppSettings>;
      updateSettings: (payload: Partial<AppSettings>) => Promise<AppSettings>;
      startScan: (payload: StartScanPayload) => Promise<StartScanResponse>;
      onScanProgress: (handler: (event: ScanProgressEvent) => void) => () => void;
      onScanResultBatch: (handler: (event: ScanResultBatchEvent) => void) => () => void;
      minimizeWindow: () => Promise<void>;
      toggleMaximizeWindow: () => Promise<boolean>;
      closeWindow: () => Promise<void>;
      quitApp: () => Promise<void>;
    };
  }
}
