import test from "node:test";
import assert from "node:assert/strict";
import { RiskLevel } from "../../src/shared/enums/risk-level.js";
import { validateCleanupItem } from "../../src/core/cleanup/delete-guard.js";

test("should block cleanup when item is marked as not deletable", () => {
  const result = validateCleanupItem({
    id: "1",
    path: "D:\\cache\\blocked.tmp",
    name: "blocked.tmp",
    size: 128,
    allowDelete: false,
    riskLevel: RiskLevel.SafeToClean
  });

  assert.equal(result.allowed, false);
  assert.match(result.message, /不可删除/);
});

test("should block cleanup for protected system paths", () => {
  const result = validateCleanupItem({
    id: "2",
    path: "C:\\Windows\\System32\\kernel32.dll",
    name: "kernel32.dll",
    size: 1024,
    allowDelete: true,
    riskLevel: RiskLevel.SafeToClean
  });

  assert.equal(result.allowed, false);
  assert.match(result.message, /受保护系统目录/);
});

test("should allow cleanup for low risk removable files", () => {
  const result = validateCleanupItem({
    id: "3",
    path: "D:\\Temp\\cleanup.tmp",
    name: "cleanup.tmp",
    size: 2048,
    allowDelete: true,
    riskLevel: RiskLevel.SafeToClean
  });

  assert.equal(result.allowed, true);
});
