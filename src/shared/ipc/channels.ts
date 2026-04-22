export const IPC_CHANNELS = {
  app: {
    getVersion: "app:get-version"
  },
  settings: {
    get: "settings:get",
    update: "settings:update"
  },
  cleanup: {
    execute: "cleanup:execute"
  },
  window: {
    minimize: "window:minimize",
    toggleMaximize: "window:toggle-maximize",
    close: "window:close",
    quit: "window:quit"
  },
  scan: {
    getTargets: "scan:get-targets",
    revealInFolder: "scan:reveal-in-folder",
    start: "scan:start",
    progress: "scan:progress",
    resultBatch: "scan:result-batch"
  }
} as const;
