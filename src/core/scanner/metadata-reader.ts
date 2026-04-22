import { stat } from "node:fs/promises";
import { basename, extname } from "node:path";

export interface FileMetadata {
  path: string;
  name: string;
  extension: string;
  size: number;
  modifiedAt: string;
  accessedAt: string;
}

export async function readFileMetadata(path: string): Promise<FileMetadata> {
  const fileStat = await stat(path);

  return {
    path,
    name: basename(path),
    extension: extname(path).toLowerCase(),
    size: fileStat.size,
    modifiedAt: fileStat.mtime.toISOString(),
    accessedAt: fileStat.atime.toISOString()
  };
}
