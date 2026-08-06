<template>
<!-- 数据备份（localStorage + IndexedDB，参考全量导出思路） -->
                <div class="card console-card">
                    <div class="card-header console-card-header">
                        <i class="fas fa-database"></i>
                        <span>数据备份</span>
                    </div>
                    <div class="console-card-body">
                        <p class="console-backup-desc">
                            将本机 <strong>localStorage</strong> 与 <strong>IndexedDB</strong>（聊天、Feed 帖子等）打成一份 JSON：可下载留存，并额外写入浏览器内的「备份槽」以防误删单条数据。
                        </p>
                        <p class="console-backup-hint" v-if="backupLastSavedHint">{{ backupLastSavedHint }}</p>
                        <div class="console-backup-actions">
                            <button type="button" class="console-btn console-btn-primary console-btn-full" @click="downloadSoulOsBackup"
                                :disabled="backupExporting || backupImporting">
                                <i class="fas fa-download"></i> {{ backupExporting ? '打包中…' : '下载完整备份' }}
                            </button>
                            <button type="button" class="console-btn console-btn-secondary console-btn-full" @click="downloadSegmentedBackup"
                                :disabled="backupExporting || backupImporting">
                                <i class="fas fa-layer-group"></i> 下载分片备份（按软件/角色）
                            </button>
                            <button type="button" class="console-btn console-btn-secondary console-btn-full" @click="saveSoulOsBackupSlotOnly"
                                :disabled="backupExporting || backupImporting">
                                <i class="fas fa-archive"></i> 仅写入本地备份槽
                            </button>
                            <button type="button" class="console-btn console-btn-secondary console-btn-full" @click="restoreSoulOsFromSlot"
                                :disabled="backupExporting || backupImporting">
                                <i class="fas fa-undo"></i> 从备份槽恢复
                            </button>
                            <button type="button" class="console-btn console-btn-secondary console-btn-full" @click="triggerSoulOsBackupImport"
                                :disabled="backupExporting || backupImporting">
                                <i class="fas fa-file-import"></i> 从备份文件恢复
                            </button>
                            <input name="sp_field_143" id="sp-field-143" type="file" accept=".json,application/json" ref="soulosBackupFileInput" style="display:none" @change="handleSoulOsBackupImport">
                        </div>
                    </div>
                </div>

                <div v-if="showSegmentedImportPanel && segmentedImportPackage" class="art-savearchive-overlay" @click.self="closeSegmentedImportPanel">
                    <div class="art-savearchive-panel" style="max-height: 80vh; overflow-y: auto;">
                        <div class="card-title" style="margin-bottom: 10px;">分片恢复选择</div>
                        <p class="console-backup-desc">勾选要恢复的软件模块和角色。未勾选项不会被影响。</p>
                        <div class="console-card" style="margin: 10px 0;">
                            <div class="console-card-header"><span>软件分片</span></div>
                            <div class="console-card-body">
                                <label v-for="(seg, appKey) in segmentedImportPackage.segments.apps" :key="appKey" style="display:flex; gap:8px; align-items:center; margin:6px 0;">
                                    <input name="sp_field_144" id="sp-field-144" type="checkbox" v-model="segmentedImportAppSelections[appKey]">
                                    <span>{{ appKey }}</span>
                                </label>
                            </div>
                        </div>
                        <div class="console-card" style="margin: 10px 0;">
                            <div class="console-card-header"><span>角色分片</span></div>
                            <div class="console-card-body">
                                <label v-for="(seg, roleId) in segmentedImportPackage.segments.roles" :key="roleId" style="display:flex; gap:8px; align-items:center; margin:6px 0;">
                                    <input name="sp_field_145" id="sp-field-145" type="checkbox" v-model="segmentedImportRoleSelections[roleId]">
                                    <span>{{ seg.name || roleId }}</span>
                                </label>
                            </div>
                        </div>
                        <div class="art-savearchive-buttons">
                            <button class="art-savearchive-btn art-savearchive-btn-cancel" @click="closeSegmentedImportPanel">取消</button>
                            <button class="art-savearchive-btn art-savearchive-btn-save" @click="confirmSegmentedImport">按勾选恢复</button>
                        </div>
                    </div>
                </div>

                </template>

<script>
import { inject } from 'vue';

export default {
    name: 'BackupManager',
    setup() {
        return inject('globalState');
    }
}
</script>
