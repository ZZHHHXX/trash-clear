<script setup lang="ts">
import { onMounted, ref } from "vue";

const appVersion = ref("读取中...");
const selectedDisk = ref("C:");
const selectedMode = ref<"quick" | "deep">("quick");
const scanStatus = ref("就绪");

const disks = [
  { name: "C:", label: "系统盘", usage: "建议优先限制为快速扫描" },
  { name: "D:", label: "数据盘", usage: "适合下载目录和缓存目录清理" },
  { name: "E:", label: "归档盘", usage: "适合后续深度扫描" }
];

const resultPreview = [
  {
    name: "Windows 临时文件",
    type: "缓存",
    size: "420 MB",
    purpose: "系统临时缓存和安装残留",
    risk: "绿色"
  },
  {
    name: "浏览器缓存",
    type: "缓存",
    size: "180 MB",
    purpose: "网页资源缓存文件",
    risk: "绿色"
  },
  {
    name: "旧安装包",
    type: "压缩包",
    size: "1.6 GB",
    purpose: "下载目录中的历史安装文件",
    risk: "黄色"
  }
];

async function loadAppInfo() {
  appVersion.value = await window.trashClear.getAppVersion();
}

function handleStartScan() {
  scanStatus.value = `待启动 ${selectedDisk.value} ${selectedMode.value === "quick" ? "快速扫描" : "深度扫描"}`;
}

onMounted(() => {
  void loadAppInfo();
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
          <button
            v-for="disk in disks"
            :key="disk.name"
            type="button"
            class="disk-card"
            :class="{ active: selectedDisk === disk.name }"
            @click="selectedDisk = disk.name"
          >
            <strong>{{ disk.name }}</strong>
            <span>{{ disk.label }}</span>
            <small>{{ disk.usage }}</small>
          </button>
        </div>

        <div class="panel-footer">
          <p>关闭窗口后默认隐藏到托盘，后续会在设置页支持关闭该行为。</p>
        </div>
      </aside>

      <section class="workspace panel">
        <div class="toolbar">
          <div>
            <h2>扫描工作区</h2>
            <p>第二阶段已接入基础桌面框架，第三阶段将继续接入真实扫描能力。</p>
          </div>

          <div class="toolbar-actions">
            <label>
              扫描模式
              <select v-model="selectedMode">
                <option value="quick">快速扫描</option>
                <option value="deep">深度扫描</option>
              </select>
            </label>
            <button type="button" class="primary" @click="handleStartScan">执行扫描</button>
          </div>
        </div>

        <div class="status-strip">
          <div>
            <span>当前目标</span>
            <strong>{{ selectedDisk }}</strong>
          </div>
          <div>
            <span>当前状态</span>
            <strong>{{ scanStatus }}</strong>
          </div>
          <div>
            <span>进度</span>
            <strong>0%</strong>
          </div>
        </div>

        <div class="progress-card">
          <div class="progress-head">
            <span>扫描进度预留区</span>
            <span>待接入真实任务流</span>
          </div>
          <div class="progress-track">
            <div class="progress-bar"></div>
          </div>
        </div>

        <div class="result-section">
          <div class="section-head">
            <h3>结果预览</h3>
            <div class="legend">
              <span class="legend-item green">建议删除</span>
              <span class="legend-item yellow">建议确认后删除</span>
              <span class="legend-item red">高风险保护</span>
            </div>
          </div>

          <div class="result-list">
            <article v-for="item in resultPreview" :key="item.name" class="result-card">
              <div>
                <h4>{{ item.name }}</h4>
                <p>{{ item.purpose }}</p>
              </div>
              <div class="result-meta">
                <span>{{ item.type }}</span>
                <span>{{ item.size }}</span>
                <span
                  class="risk-badge"
                  :class="{
                    green: item.risk === '绿色',
                    yellow: item.risk === '黄色',
                    red: item.risk === '红色'
                  }"
                >
                  {{ item.risk }}
                </span>
              </div>
            </article>
          </div>
        </div>

        <footer class="workspace-footer">
          <span>当前为基础框架阶段，列表、筛选、批量清理会在后续阶段接入。</span>
        </footer>
      </section>
    </div>
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
}

:global(*) {
  box-sizing: border-box;
}

.app-shell {
  min-height: 100vh;
  padding: 20px;
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
.result-card,
.workspace-footer,
.toolbar-actions,
.result-meta,
.panel-header {
  display: flex;
}

.topbar,
.toolbar,
.progress-head,
.section-head,
.result-card,
.workspace-footer,
.panel-header {
  align-items: center;
  justify-content: space-between;
}

.topbar {
  margin-bottom: 16px;
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
  font-size: 28px;
}

.content-grid {
  gap: 16px;
  min-height: calc(100vh - 110px);
}

.sidebar {
  width: 300px;
  flex-shrink: 0;
}

.workspace {
  flex: 1;
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
  padding: 20px;
}

.meta,
.panel-footer,
.toolbar p,
.workspace-footer span,
.result-card p,
.disk-card small,
.status-strip span {
  color: #5d7890;
}

.disk-list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
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
.legend {
  gap: 10px;
}

.toolbar-actions {
  align-items: end;
}

.toolbar-actions label {
  display: grid;
  gap: 8px;
  font-size: 13px;
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

.status-strip {
  gap: 12px;
  margin: 18px 0;
}

.status-strip > div {
  flex: 1;
  padding: 14px 16px;
  border-radius: 18px;
  background: #f3f9ff;
}

.status-strip strong {
  display: block;
  margin-top: 8px;
  font-size: 16px;
}

.progress-card,
.result-section {
  padding: 18px;
  border-radius: 20px;
  background: #f8fbff;
}

.progress-track {
  height: 14px;
  margin-top: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: #dceaf7;
}

.progress-bar {
  width: 18%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #3d86c6, #7fc4ff);
}

.result-section {
  margin-top: 18px;
}

.section-head {
  margin-bottom: 14px;
}

.legend {
  flex-wrap: wrap;
}

.legend-item,
.risk-badge {
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

.result-list {
  display: grid;
  gap: 12px;
}

.result-card {
  gap: 16px;
  padding: 16px;
  border-radius: 16px;
  background: #fff;
}

.result-card h4 {
  margin-bottom: 6px;
}

.result-meta {
  align-items: center;
  flex-wrap: wrap;
  min-width: 240px;
  justify-content: end;
}

.workspace-footer {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #d7e5f2;
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
  .section-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .status-strip {
    flex-direction: column;
  }

  .result-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .result-meta {
    justify-content: flex-start;
    min-width: auto;
  }
}
</style>
