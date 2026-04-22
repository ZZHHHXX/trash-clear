import { access } from "node:fs/promises";
import type { ScanTarget } from "../../shared/types/scan-target.js";

const DRIVE_LETTERS = "CDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function getDriveDescription(letter: string) {
  if (letter === "C") {
    return "系统盘";
  }

  if (letter === "D") {
    return "数据盘";
  }

  return "本地磁盘";
}

export async function getAvailableScanTargets(): Promise<ScanTarget[]> {
  const targets: Array<ScanTarget | null> = await Promise.all(
    DRIVE_LETTERS.map(async (letter) => {
      const path = `${letter}:\\`;

      try {
        await access(path);

        return {
          path,
          label: `${letter}:`,
          description:
            letter === "C" ? "建议优先执行快速扫描" : `${getDriveDescription(letter)}，适合缓存与下载目录清理`,
          isSystem: letter === "C"
        } satisfies ScanTarget;
      } catch {
        return null;
      }
    })
  );

  return targets.filter((target): target is ScanTarget => Boolean(target));
}
