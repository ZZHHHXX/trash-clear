export const IPC_CHANNELS = {
  app: {
    getVersion: "app:get-version"
  },
  settings: {
    get: "settings:get",
    update: "settings:update"
  },
  window: {
    minimize: "window:minimize",
    toggleMaximize: "window:toggle-maximize",
    close: "window:close",
    quit: "window:quit"
  },
  scan: {
    start: "scan:start",
    progress: "scan:progress",
    resultBatch: "scan:result-batch"
  }
} as const;
