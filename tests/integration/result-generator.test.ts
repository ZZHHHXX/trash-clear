import test from "node:test";
import assert from "node:assert/strict";
import { RiskLevel } from "../../src/shared/enums/risk-level.js";
import { ScanMode } from "../../src/shared/enums/scan-mode.js";
import { TaskStatus } from "../../src/shared/enums/task-status.js";
import { createResultItem } from "../../src/core/rules/result-generator.js";

const scanTask = {
  id: "scan-1",
  targetPath: "D:\\",
  mode: ScanMode.Quick,
  status: TaskStatus.Running,
  createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString()
};

test("should generate removable result items for temp files", () => {
  const result = createResultItem(
    scanTask,
    {
      path: "D:\\Temp\\sample.tmp",
      name: "sample.tmp",
      extension: ".tmp",
      size: 2048,
      modifiedAt: new Date("2025-01-01T00:00:00.000Z").toISOString(),
      accessedAt: new Date("2025-01-01T00:00:00.000Z").toISOString()
    },
    1
  );

  assert.ok(result);
  assert.equal(result.riskLevel, RiskLevel.SafeToClean);
  assert.equal(result.allowDelete, true);
});

test("should skip protected files from normal result list", () => {
  const result = createResultItem(
    scanTask,
    {
      path: "C:\\Windows\\System32\\kernel32.dll",
      name: "kernel32.dll",
      extension: ".dll",
      size: 1024,
      modifiedAt: new Date("2025-01-01T00:00:00.000Z").toISOString(),
      accessedAt: new Date("2025-01-01T00:00:00.000Z").toISOString()
    },
    2
  );

  assert.equal(result, null);
});
