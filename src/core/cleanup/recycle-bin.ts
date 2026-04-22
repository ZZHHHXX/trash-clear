import { shell } from "electron";

export async function moveToRecycleBin(path: string) {
  await shell.trashItem(path);
}
