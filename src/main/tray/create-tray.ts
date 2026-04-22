import { Menu, Tray, nativeImage } from "electron";
import { getMainWindow, markAppShouldQuit } from "../window/main-window.js";
import { resolveAppIconPath } from "../utils/icon-path.js";

let appTray: Tray | null = null;

function createTrayIcon() {
  const image = nativeImage.createFromPath(resolveAppIconPath());

  return image.resize({
    width: 16,
    height: 16,
    quality: "best"
  });
}

export function createAppTray() {
  if (appTray) {
    return appTray;
  }

  appTray = new Tray(createTrayIcon());
  appTray.setToolTip("Trash Clear");
  appTray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "打开主窗口",
        click: () => {
          getMainWindow()?.show();
          getMainWindow()?.focus();
        }
      },
      {
        label: "退出程序",
        click: () => {
          markAppShouldQuit();
          process.nextTick(() => {
            getMainWindow()?.destroy();
          });
        }
      }
    ])
  );

  appTray.on("double-click", () => {
    getMainWindow()?.show();
    getMainWindow()?.focus();
  });

  return appTray;
}
