<template>
<!-- 系统日志卡片 -->
                <div class="card console-card">
                    <div class="card-header console-card-header">
                        <i class="fas fa-terminal"></i>
                        <span>系统日志</span>
                    </div>
                    <div class="console-card-body">
                        <div class="console-logs-container">
                            <div v-for="log in consoleLogs" :key="log.id" class="console-log-item" :class="log.type">
                                <span class="console-log-time">{{ log.timestamp }}</span>
                                <span class="console-log-message">{{ log.message }}</span>
                            </div>
                            <div v-if="consoleLogs.length === 0" class="console-empty-state">
                                <i class="fas fa-clipboard-list"></i>
                                <span>暂无日志</span>
                            </div>
                        </div>
                    </div>
                    <div class="console-card-footer">
                        <button class="console-btn console-btn-secondary console-btn-full" @click="clearConsole">
                            <i class="fas fa-eraser"></i> 清空日志
                        </button>
                    </div>
                </div>
                
                <div class="card console-card" style="margin-top: 16px;">
                    <div class="card-header console-card-header">
                        <i class="fas fa-bug"></i>
                        <span>全局运行日志 (用于给AI查Bug)</span>
                        <button class="sys-btn sys-btn-outline" style="margin-left: auto; padding: 4px 12px; font-size: 12px;" @click="copyRealConsoleLogs">复制全部</button>
                    </div>
                    <div class="console-card-body" style="padding: 0;">
                        <textarea readonly style="width: 100%; height: 200px; background: rgba(0,0,0,0.4); border: none; color: #00ff00; font-family: monospace; font-size: 11px; padding: 12px; resize: vertical; box-sizing: border-box;" :value="realConsoleLogs"></textarea>
                    </div>
                </div>
</template>

<script>
import { inject } from 'vue';

export default {
    name: 'MonitorPanel',
    setup() {
        return inject('globalState');
    }
}
</script>
