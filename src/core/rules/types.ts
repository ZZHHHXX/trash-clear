import { RiskLevel } from "../../shared/enums/risk-level.js";
import type { FileMetadata } from "../scanner/metadata-reader.js";

export interface RuleContext {
  metadata: FileMetadata;
}

export interface RuleMatch {
  matched: boolean;
  purpose: string;
  reason: string;
  riskLevel: RiskLevel;
  allowDelete: boolean;
  protected?: boolean;
  score: number;
}

export type RuleHandler = (context: RuleContext) => RuleMatch | null;
