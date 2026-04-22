import type { RiskLevel } from "../enums/risk-level.js";

export interface CleanupItemRequest {
  id: string;
  path: string;
  name: string;
  size: number;
  allowDelete: boolean;
  riskLevel: RiskLevel;
}

export interface CleanupRequest {
  taskId?: string;
  items: CleanupItemRequest[];
}

export interface CleanupItemResult {
  id: string;
  path: string;
  status: "deleted" | "skipped" | "failed";
  message: string;
}

export interface CleanupResponse {
  results: CleanupItemResult[];
  deletedCount: number;
  releasedBytes: number;
}

export interface CleanupLogEntry {
  id: string;
  taskId?: string;
  path: string;
  name: string;
  size: number;
  status: CleanupItemResult["status"];
  message: string;
  createdAt: string;
}
