<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { RiskLevel } from "@shared/enums/risk-level";
import { TaskStatus } from "@shared/enums/task-status";
import type { CleanupItemResult } from "@shared/ipc/cleanup-ipc";
import type { ScanResultItem } from "@shared/types/scan-result-item";
import type { ScanTarget } from "@shared/types/scan-target";

const ROW_HEIGHT = 104;
const OVERSCAN_COUNT = 6;

const appVersion = ref("读取中...");
const selectedDisk = ref("");
const selectedMode = ref<"quick" | "deep">("quick");
const scanStatus = ref("就绪");
const disks = ref<ScanTarget[]>([]);
const scanTargetError = ref("");
const resultItems = ref<ScanResultItem[]>([]);
const currentTaskId = ref("");
const progressPercent = ref(0);
const scannedFileCount = ref(0);
const candidateCount = ref(0);
const currentPath = ref("尚未开始");
const estimatedReleasedSize = ref(0);
const isScanning = ref(false);
const cleanupModalVisible = ref(false);
const cleanupInProgress = ref(false);
const cleanupFeedback = ref("");
const cleanupResults = ref<CleanupItemResult[]>([]);

const riskFilter = ref<"all" | "green" | "yellow" | "red">("all");
const deleteFilter = ref<"all" | "allow" | "block">("all");
const typeFilter = ref("all");
const selectedIds = ref<string[]>([]);
const contextMenu = ref<{
  visible: boolean;
  x: number;
  y: number;
  item: ScanResultItem | null;
}>({
  visible: false,
  x: 0,
  y: 0,
  item: null
});

const listViewportRef = ref<HTMLElement | null>(null);
const viewportHeight = ref(320);
const scrollTop = ref(0);

let removeProgressListener: (() => void) | null = null;
let removeResultListener: (() => void) | null = null;

async function loadAppInfo() {
  appVersion.value = await window.trashClear.getAppVersion();
}

async function loadScanTargets() {
  try {
    const response = await window.trashClear.getScanTargets();
    disks.value = response.targets;

    if (!selectedDisk.value && response.targets.length > 0) {
      selectedDisk.value = response.targets[0].path;
    }

    if (response.targets.length === 0) {
      scanTargetError.value = "未读取到可用盘符，请尝试完全退出客户端后重新启动。";
      return;
    }

    scanTargetError.value = "";
  } catch (error) {
    console.error("加载盘符失败", error);
    const message = error instanceof Error ? error.message : String(error);
    scanTargetError.value = `盘符读取失败：${message}`;
  }
}

function formatBytes(bytes: number) {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** power;

  return `${value.toFixed(value >= 10 || power === 0 ? 0 : 1)} ${units[power]}`;
}

function resolveRiskLabel(level: RiskLevel) {
  if (level === RiskLevel.SafeToClean) {
    return "绿色";
  }

  if (level === RiskLevel.DoNotClean || level === RiskLevel.Protected) {
    return "红色";
  }

  return "黄色";
}

function resolveFileType(item: ScanResultItem) {
  if (!item.extension) {
    return "未知类型";
  }

  return item.extension.replace(".", "").toUpperCase();
}

function bindScanEvents() {
  removeProgressListener = window.trashClear.onScanProgress(({ progress }) => {
    if (progress.taskId !== currentTaskId.value) {
      return;
    }

    scannedFileCount.value = progress.scannedFileCount;
    candidateCount.value = progress.candidateCount;
    currentPath.value = progress.currentPath ?? "扫描完成";
    progressPercent.value = progress.progressPercent ?? Math.min(95, progress.candidateCount);
    estimatedReleasedSize.value = progress.releasedBytesEstimate;

    if (progress.status === TaskStatus.Running) {
      scanStatus.value = "扫描中";
      isScanning.value = true;
    } else if (progress.status === TaskStatus.Completed) {
      scanStatus.value = "扫描完成";
      progressPercent.value = 100;
      isScanning.value = false;
      void nextTick(updateViewportMetrics);
    } else if (progress.status === TaskStatus.Failed) {
      scanStatus.value = "扫描失败";
      isScanning.value = false;
    }
  });

  removeResultListener = window.trashClear.onScanResultBatch(({ taskId, items }) => {
    if (taskId !== currentTaskId.value) {
      return;
    }

    resultItems.value = [...resultItems.value, ...items];
  });
}

async function handleStartScan() {
  if (!selectedDisk.value || isScanning.value) {
    return;
  }

  resultItems.value = [];
  selectedIds.value = [];
  scannedFileCount.value = 0;
  candidateCount.value = 0;
  progressPercent.value = 0;
  estimatedReleasedSize.value = 0;
  currentPath.value = "准备扫描";
  scanStatus.value = "启动中";
  isScanning.value = true;
  scrollTop.value = 0;

  const response = await window.trashClear.startScan({
    targetPath: selectedDisk.value,
    mode: selectedMode.value
  });

  currentTaskId.value = response.task.id;
  scanStatus.value = "扫描中";
}

function updateViewportMetrics() {
  viewportHeight.value = listViewportRef.value?.clientHeight ?? 320;
}

function handleListScroll(event: Event) {
  const target = event.target as HTMLElement;
  scrollTop.value = target.scrollTop;
}

function toggleItemSelection(id: string) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((itemId) => itemId !== id);
    return;
  }

  selectedIds.value = [...selectedIds.value, id];
}

function clearSelection() {
  selectedIds.value = [];
}

function selectAllFiltered() {
  selectedIds.value = filteredItems.value.filter((item) => item.allowDelete).map((item) => item.id);
}

function selectVisibleItems() {
  const merged = new Set(selectedIds.value);

  visibleItems.value.forEach(({ item }) => {
    if (item.allowDelete) {
      merged.add(item.id);
    }
  });

  selectedIds.value = [...merged];
}

function isSelected(id: string) {
  return selectedIds.value.includes(id);
}

function openCleanupModal() {
  if (selectedItems.value.length === 0) {
    return;
  }

  cleanupFeedback.value = "";
  cleanupResults.value = [];
  cleanupModalVisible.value = true;
}

function closeCleanupModal() {
  if (cleanupInProgress.value) {
    return;
  }

  cleanupModalVisible.value = false;
}

function closeContextMenu() {
  contextMenu.value = {
    visible: false,
    x: 0,
    y: 0,
    item: null
  };
}

function openContextMenu(event: MouseEvent, item: ScanResultItem) {
  event.preventDefault();
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    item
  };
}

async function revealSelectedItemInFolder() {
  if (!contextMenu.value.item) {
    return;
  }

  await window.trashClear.revealItemInFolder({
    path: contextMenu.value.item.path
  });
  closeContextMenu();
}

async function executeSelectedCleanup() {
  if (selectedItems.value.length === 0 || cleanupInProgress.value) {
    return;
  }

  cleanupInProgress.value = true;
  cleanupFeedback.value = "";

  try {
    const response = await window.trashClear.executeCleanup({
      taskId: currentTaskId.value || undefined,
      items: selectedItems.value.map((item) => ({
        id: item.id,
        path: item.path,
        name: item.name,
        size: item.size,
        allowDelete: item.allowDelete,
        riskLevel: item.riskLevel
      }))
    });

    cleanupResults.value = response.results;
    cleanupFeedback.value = `已成功移动 ${response.deletedCount} 个条目到回收站，预计释放 ${formatBytes(response.releasedBytes)}。`;

    const deletedIds = new Set(
      response.results.filter((result) => result.status === "deleted").map((result) => result.id)
    );

    resultItems.value = resultItems.value.filter((item) => !deletedIds.has(item.id));
    selectedIds.value = selectedIds.value.filter((id) => !deletedIds.has(id));
    candidateCount.value = resultItems.value.length;
    estimatedReleasedSize.value = resultItems.value
      .filter((item) => item.allowDelete)
      .reduce((total, item) => total + item.size, 0);
  } catch (error) {
    cleanupFeedback.value = error instanceof Error ? error.message : "清理执行失败。";
  } finally {
    cleanupInProgress.value = false;
  }
}

const typeOptions = computed(() => {
  const uniqueTypes = [...new Set(resultItems.value.map((item) => resolveFileType(item)))];
  return ["all", ...uniqueTypes];
});

const filteredItems = computed(() => {
  return resultItems.value.filter((item) => {
    const riskLabel = resolveRiskLabel(item.riskLevel);

    if (riskFilter.value !== "all" && riskLabel !== (riskFilter.value === "green" ? "绿色" : riskFilter.value === "yellow" ? "黄色" : "红色")) {
      return false;
    }

    if (deleteFilter.value === "allow" && !item.allowDelete) {
      return false;
    }

    if (deleteFilter.value === "block" && item.allowDelete) {
      return false;
    }

    if (typeFilter.value !== "all" && resolveFileType(item) !== typeFilter.value) {
      return false;
    }

    return true;
  });
});

const selectedItems = computed(() => {
  const selectedSet = new Set(selectedIds.value);
  return resultItems.value.filter((item) => selectedSet.has(item.id));
});

const selectedSize = computed(() => {
  return selectedItems.value.reduce((total, item) => total + item.size, 0);
});

const virtualListHeight = computed(() => filteredItems.value.length * ROW_HEIGHT);
const startIndex = computed(() => Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - OVERSCAN_COUNT));
const visibleCount = computed(() => Math.ceil(viewportHeight.value / ROW_HEIGHT) + OVERSCAN_COUNT * 2);
const endIndex = computed(() => Math.min(filteredItems.value.length, startIndex.value + visibleCount.value));

const visibleItems = computed(() => {
  return filteredItems.value.slice(startIndex.value, endIndex.value).map((item, index) => ({
    item,
    style: {
      transform: `translateY(${(startIndex.value + index) * ROW_HEIGHT}px)`
    }
  }));
});

onMounted(() => {
  void loadAppInfo();
  void loadScanTargets();
  bindScanEvents();
  void nextTick(updateViewportMetrics);
  window.addEventListener("resize", updateViewportMetrics);
  window.addEventListener("click", closeContextMenu);
  window.addEventListener("blur", closeContextMenu);
});

onBeforeUnmount(() => {
  removeProgressListener?.();
  removeResultListener?.();
  window.removeEventListener("resize", updateViewportMetrics);
  window.removeEventListener("click", closeContextMenu);
  window.removeEventListener("blur", closeContextMenu);
});
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div>
        <p class="eyebrow">Trash Clear</p>
        <h1>磁盘垃圾清理助手</h1>
      </div>
    </header>

    <div class="content-grid">
      <aside class="sidebar panel">
        <div class="panel-header">
          <h2>磁盘选择</h2>
          <span class="meta">版本 {{ appVersion }}</span>
        </div>

        <div class="disk-list">
          <div v-if="scanTargetError" class="disk-empty-state">
            <strong>盘符加载异常</strong>
            <p>{{ scanTargetError }}</p>
          </div>

          <button
            v-for="disk in disks"
            :key="disk.path"
            type="button"
            class="disk-card"
            :class="{ active: selectedDisk === disk.path }"
            @click="selectedDisk = disk.path"
          >
            <strong>{{ disk.label }}</strong>
            <span>{{ disk.description }}</span>
            <small>{{ disk.path }}</small>
          </button>
        </div>

        <div class="panel-footer">
          <p>当前阶段已接入真实盘符识别、扫描链路和结果交互，目录选择能力会在后续阶段补齐。</p>
        </div>
      </aside>

      <section class="workspace panel">
        <div class="toolbar">
          <div>
            <h2>扫描工作区</h2>
            <p>当前已接入真实扫描任务、筛选能力、选择能力和结果列表虚拟渲染。</p>
          </div>

          <div class="toolbar-actions">
            <label>
              扫描模式
              <select v-model="selectedMode">
                <option value="quick">快速扫描</option>
                <option value="deep">深度扫描</option>
              </select>
            </label>
            <button type="button" class="primary" :disabled="!selectedDisk || isScanning" @click="handleStartScan">
              {{ isScanning ? "扫描中..." : "执行扫描" }}
            </button>
          </div>
        </div>

        <div class="status-strip">
          <div>
            <span>当前目标</span>
            <strong>{{ selectedDisk || "未选择" }}</strong>
          </div>
          <div>
            <span>当前状态</span>
            <strong>{{ scanStatus }}</strong>
          </div>
          <div>
            <span>进度</span>
            <strong>{{ progressPercent }}%</strong>
          </div>
        </div>

        <div class="progress-card">
          <div class="progress-head">
            <span>{{ currentPath }}</span>
            <span>已扫描 {{ scannedFileCount }} 个文件，命中 {{ candidateCount }} 条结果</span>
          </div>
          <div class="progress-track">
            <div class="progress-bar" :style="{ width: `${progressPercent}%` }"></div>
          </div>
        </div>

        <div class="result-section">
          <div class="section-head">
            <h3>扫描结果</h3>
            <div class="legend">
              <span class="legend-item green">建议删除</span>
              <span class="legend-item yellow">建议确认后删除</span>
              <span class="legend-item red">高风险保护</span>
            </div>
          </div>

          <div class="filters-bar">
            <label>
              风险筛选
              <select v-model="riskFilter">
                <option value="all">全部</option>
                <option value="green">绿色</option>
                <option value="yellow">黄色</option>
                <option value="red">红色</option>
              </select>
            </label>
            <label>
              操作建议
              <select v-model="deleteFilter">
                <option value="all">全部</option>
                <option value="allow">允许清理</option>
                <option value="block">保护/阻止</option>
              </select>
            </label>
            <label>
              文件类型
              <select v-model="typeFilter">
                <option v-for="type in typeOptions" :key="type" :value="type">
                  {{ type === "all" ? "全部类型" : type }}
                </option>
              </select>
            </label>
            <div class="filters-summary">
              <span>当前结果 {{ filteredItems.length }} 条</span>
            </div>
          </div>

          <div class="selection-bar">
            <div class="selection-summary">
              <strong>已选 {{ selectedItems.length }} 项</strong>
              <span>预计释放 {{ formatBytes(selectedSize) }}</span>
            </div>
            <div class="selection-actions">
              <button type="button" @click="selectVisibleItems">选择当前可见</button>
              <button type="button" @click="selectAllFiltered">选择全部可清理</button>
              <button type="button" @click="clearSelection" :disabled="selectedItems.length === 0">清空选择</button>
              <button type="button" class="primary" :disabled="selectedItems.length === 0" @click="openCleanupModal">
                清理所选
              </button>
            </div>
          </div>

          <div v-if="filteredItems.length === 0" class="empty-state">
            <strong>当前筛选条件下没有结果</strong>
            <p>你可以调整风险、类型或操作建议筛选条件，或者重新执行扫描。</p>
          </div>

          <div
            v-else
            ref="listViewportRef"
            class="result-list-viewport"
            @scroll="handleListScroll"
          >
            <div class="result-list-spacer" :style="{ height: `${virtualListHeight}px` }">
              <article
                v-for="{ item, style } in visibleItems"
                :key="item.id"
                class="result-card"
                :class="{ selected: isSelected(item.id), blocked: !item.allowDelete }"
                :style="style"
                @contextmenu="openContextMenu($event, item)"
              >
                <label class="result-check">
                  <input
                    :checked="isSelected(item.id)"
                    :disabled="!item.allowDelete"
                    type="checkbox"
                    @change="toggleItemSelection(item.id)"
                  />
                </label>

                <div class="result-main">
                  <div>
                    <h4>{{ item.name }}</h4>
                    <p>{{ item.purpose }} · {{ item.reason }}</p>
                  </div>
                  <div class="result-meta">
                    <span>{{ resolveFileType(item) }}</span>
                    <span>{{ formatBytes(item.size) }}</span>
                    <span
                      class="risk-badge"
                      :class="{
                        green: resolveRiskLabel(item.riskLevel) === '绿色',
                        yellow: resolveRiskLabel(item.riskLevel) === '黄色',
                        red: resolveRiskLabel(item.riskLevel) === '红色'
                      }"
                    >
                      {{ resolveRiskLabel(item.riskLevel) }}
                    </span>
                    <span class="delete-flag" :class="{ enabled: item.allowDelete, disabled: !item.allowDelete }">
                      {{ item.allowDelete ? "可加入清理" : "受保护/不可删" }}
                    </span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>

        <footer class="workspace-footer">
          <span>预计可释放空间：{{ formatBytes(estimatedReleasedSize) }}。Phase 6 将继续接入删除确认、回收站与日志链路。</span>
        </footer>
      </section>
    </div>

    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
      @click.stop
    >
      <button type="button" class="context-menu-item" @click="revealSelectedItemInFolder">
        打开文件所在位置
      </button>
    </div>

    <div v-if="cleanupModalVisible" class="modal-overlay" @click="closeCleanupModal">
      <div class="modal-card" @click.stop>
        <div class="modal-head">
          <h3>确认清理所选条目</h3>
          <button type="button" :disabled="cleanupInProgress" @click="closeCleanupModal">关闭</button>
        </div>

        <div class="modal-summary">
          <div>
            <span>已选条目</span>
            <strong>{{ selectedItems.length }} 项</strong>
          </div>
          <div>
            <span>预计释放</span>
            <strong>{{ formatBytes(selectedSize) }}</strong>
          </div>
          <div>
            <span>执行方式</span>
            <strong>移动到回收站</strong>
          </div>
        </div>

        <p class="modal-tip">
          本次清理默认移动到系统回收站，不会直接永久删除。高风险或受保护文件会在执行前被再次拦截。
        </p>

        <div v-if="cleanupFeedback" class="cleanup-feedback">
          {{ cleanupFeedback }}
        </div>

        <div v-if="cleanupResults.length > 0" class="cleanup-results">
          <article v-for="result in cleanupResults" :key="result.id" class="cleanup-result-row">
            <strong>{{ result.status === "deleted" ? "成功" : result.status === "skipped" ? "已跳过" : "失败" }}</strong>
            <span>{{ result.message }}</span>
          </article>
        </div>

        <div class="modal-actions">
          <button type="button" :disabled="cleanupInProgress" @click="closeCleanupModal">稍后处理</button>
          <button type="button" class="primary" :disabled="cleanupInProgress" @click="executeSelectedCleanup">
            {{ cleanupInProgress ? "清理中..." : "确认清理" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  overflow: hidden;
}

:global(html) {
  overflow: hidden;
}

:global(*) {
  box-sizing: border-box;
}

.app-shell {
  height: 100vh;
  padding: 20px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(135, 198, 255, 0.35) 0, transparent 32%),
    radial-gradient(circle at right bottom, rgba(119, 176, 233, 0.22) 0, transparent 28%),
    linear-gradient(180deg, #eef7ff 0%, #dfeeff 100%);
  color: #15324b;
  font-family: "Segoe UI", "PingFang SC", sans-serif;
}

.topbar,
.content-grid,
.toolbar,
.status-strip,
.progress-head,
.section-head,
.workspace-footer,
.toolbar-actions,
.result-meta,
.panel-header,
.filters-bar,
.selection-bar,
.selection-actions,
.selection-summary {
  display: flex;
}

.topbar,
.toolbar,
.progress-head,
.section-head,
.workspace-footer,
.panel-header,
.selection-bar {
  align-items: center;
  justify-content: space-between;
}

.topbar {
  margin-bottom: 12px;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #3c7bb3;
}

h1,
h2,
h3,
h4,
p {
  margin: 0;
}

h1 {
  font-size: 26px;
}

.content-grid {
  gap: 16px;
  height: calc(100vh - 92px);
  overflow: hidden;
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
}

.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel {
  border: 1px solid rgba(79, 138, 189, 0.15);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 18px 50px rgba(29, 67, 108, 0.1);
  backdrop-filter: blur(10px);
}

.sidebar,
.workspace {
  padding: 18px;
}

.meta,
.panel-footer,
.toolbar p,
.workspace-footer span,
.result-card p,
.disk-card small,
.status-strip span,
.filters-summary {
  color: #5d7890;
}

.disk-list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.disk-empty-state {
  padding: 16px;
  border-radius: 18px;
  background: #fff4d7;
  color: #8a5c00;
  line-height: 1.6;
}

.disk-card,
button,
select {
  border: 0;
  font: inherit;
}

.disk-card,
button {
  cursor: pointer;
}

.disk-card {
  display: grid;
  gap: 6px;
  padding: 16px;
  border-radius: 18px;
  text-align: left;
  background: #edf6ff;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.disk-card.active {
  background: linear-gradient(135deg, #2576bb, #4a9ce3);
  color: #fff;
  box-shadow: 0 16px 34px rgba(37, 118, 187, 0.24);
}

.disk-card.active small {
  color: rgba(255, 255, 255, 0.82);
}

.disk-card:hover,
button:hover {
  transform: translateY(-1px);
}

.panel-footer {
  margin-top: 18px;
  font-size: 13px;
  line-height: 1.6;
}

.toolbar-actions,
.result-meta,
.legend,
.selection-actions,
.selection-summary {
  gap: 10px;
}

.toolbar-actions,
.filters-bar {
  align-items: end;
}

.toolbar-actions label,
.filters-bar label {
  display: grid;
  gap: 6px;
  font-size: 12px;
}

select,
button {
  padding: 10px 14px;
  border-radius: 12px;
}

select {
  min-width: 130px;
  border: 1px solid #c3d8eb;
  background: #fff;
}

button {
  background: #e7f2ff;
  color: #12314f;
}

button.primary {
  background: linear-gradient(135deg, #1d6db0, #3290db);
  color: #fff;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.72;
  transform: none;
}

.status-strip {
  gap: 12px;
  margin: 14px 0;
}

.status-strip > div {
  flex: 1;
  padding: 10px 14px;
  border-radius: 16px;
  background: #f3f9ff;
}

.status-strip strong {
  display: block;
  margin-top: 6px;
  font-size: 15px;
}

.progress-card,
.result-section {
  padding: 16px;
  border-radius: 20px;
  background: #f8fbff;
}

.progress-track {
  height: 10px;
  margin-top: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #dceaf7;
}

.progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #3d86c6, #7fc4ff);
  transition: width 0.2s ease;
}

.result-section {
  margin-top: 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.section-head,
.filters-bar,
.selection-bar {
  flex-shrink: 0;
}

.section-head {
  margin-bottom: 10px;
}

.filters-bar {
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(223, 238, 255, 0.82);
}

.filters-summary {
  margin-left: auto;
  align-self: center;
  font-size: 13px;
  font-weight: 600;
}

.selection-bar {
  margin-bottom: 10px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.86);
}

.legend {
  flex-wrap: wrap;
}

.legend-item,
.risk-badge,
.delete-flag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.green {
  background: #dff6e6;
  color: #23744b;
}

.yellow {
  background: #fff4d7;
  color: #9f6a00;
}

.red {
  background: #ffe3e3;
  color: #9b3434;
}

.delete-flag.enabled {
  background: #e3f0ff;
  color: #1d6db0;
}

.delete-flag.disabled {
  background: #eef0f3;
  color: #7b8794;
}

.result-list-viewport {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 6px;
}

.result-list-spacer {
  position: relative;
  width: 100%;
}

.empty-state {
  padding: 22px 18px;
  border-radius: 16px;
  background: #fff;
  color: #5d7890;
  line-height: 1.7;
}

.result-card {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 14px 16px;
  border-radius: 14px;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.result-card.selected {
  border: 1px solid rgba(41, 119, 185, 0.4);
  box-shadow: 0 10px 24px rgba(38, 113, 180, 0.12);
  background: #f7fbff;
}

.result-card.blocked {
  background: #fbfcfd;
}

.result-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.result-check {
  padding-top: 2px;
}

.result-check input {
  width: 18px;
  height: 18px;
  accent-color: #2b79be;
}

.result-card h4 {
  margin-bottom: 6px;
}

.result-meta {
  align-items: center;
  flex-wrap: wrap;
  min-width: 280px;
  justify-content: end;
}

.workspace-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #d7e5f2;
  flex-shrink: 0;
}

.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 180px;
  padding: 8px;
  border: 1px solid rgba(74, 118, 161, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16px 36px rgba(18, 49, 79, 0.18);
  backdrop-filter: blur(12px);
}

.context-menu-item {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  text-align: left;
  background: transparent;
}

.context-menu-item:hover {
  background: #eef6ff;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(12, 27, 42, 0.26);
  backdrop-filter: blur(4px);
}

.modal-card {
  width: min(640px, calc(100vw - 32px));
  padding: 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 24px 60px rgba(16, 43, 69, 0.2);
}

.modal-head,
.modal-summary,
.modal-actions {
  display: flex;
}

.modal-head,
.modal-actions {
  align-items: center;
  justify-content: space-between;
}

.modal-summary {
  gap: 12px;
  margin-top: 16px;
}

.modal-summary > div {
  flex: 1;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f3f9ff;
}

.modal-summary span,
.modal-tip,
.cleanup-result-row span {
  color: #5d7890;
}

.modal-summary strong {
  display: block;
  margin-top: 6px;
}

.modal-tip {
  margin-top: 16px;
  line-height: 1.7;
}

.cleanup-feedback {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #e7f5ea;
  color: #1e6b46;
}

.cleanup-results {
  display: grid;
  gap: 10px;
  max-height: 220px;
  margin-top: 14px;
  overflow-y: auto;
}

.cleanup-result-row {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f9fbfd;
}

.modal-actions {
  margin-top: 18px;
}

@media (max-width: 1240px) {
  .filters-summary {
    margin-left: 0;
  }

  .selection-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

@media (max-width: 1080px) {
  .content-grid {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
  }

  .topbar,
  .toolbar,
  .workspace-footer,
  .section-head,
  .result-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .status-strip {
    flex-direction: column;
  }

  .result-meta {
    justify-content: flex-start;
    min-width: auto;
  }

  .selection-actions {
    flex-wrap: wrap;
  }
}
</style>
