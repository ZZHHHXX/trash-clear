import { ScanMode } from "../enums/scan-mode.js";

export interface AppSettings {
  minimizeToTrayOnClose: boolean;
  launchAtStartup: boolean;
  scanMode: ScanMode;
  aiEnabled: boolean;
}
