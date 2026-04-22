import { RiskLevel } from "../enums/risk-level.js";

export interface ScanResultItem {
  id: string;
  taskId: string;
  name: string;
  path: string;
  extension: string;
  size: number;
  modifiedAt?: string;
  purpose: string;
  reason: string;
  riskLevel: RiskLevel;
  allowDelete: boolean;
}
