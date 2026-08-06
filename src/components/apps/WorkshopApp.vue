<template>
        <!-- Workshop App -->
        <div  class="app-view workshop-view">
            <div class="app-header">
                <button class="back-btn" @click="closeApp"><i class="fas fa-chevron-left"></i></button>
                <span class="app-title">工作室</span>
                <div style="width: 40px;"></div>
            </div>
            <div class="app-content workshop-content">
                <!-- 角色管理卡片（带导入） -->
                <div class="card workshop-card">
                    <div class="card-header">
                        <span>角色管理</span>
                        <div class="card-actions">
                            <button class="btn-small" @click="openBatchDelete('characters')">批量删除</button>
                            <i class="fas fa-upload" @click="triggerCharacterImport"></i>
                        </div>
                    </div>
                    <input name="sp_field_115" id="sp-field-115" type="file" ref="characterImportInput" @change="handleCharacterImport" accept=".json,.png" style="display: none;">
                    <div class="card-body">
                        <div class="character-grid">
                            <div v-for="char in characters" :key="char.id" class="character-card" @click="openDossier(char)">
                                <img :src="char.avatarUrl || 'https://placehold.co/100x100?text=No+Avatar'" class="character-avatar">
                                <div class="character-info">
                                    <div class="character-name">{{ char.nickname || char.name }}</div>
                                    <div class="character-summary">{{ char.summary || '无简介' }}</div>
                                </div>
                            </div>
                            <div class="character-card add-card" @click="addNewCharacter">
                                <i class="fas fa-plus"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 世界书卡片 -->
                <div class="card workshop-card">
                    <div class="card-header">
                        <span>世界书</span>
                        <div class="card-actions">
                            <button class="btn-small" @click="openBatchDelete('worldbooks')">批量删除</button>
                            <i class="fas fa-upload" @click="triggerWorldbookImport"></i>
                        </div>
                    </div>
                    <input name="sp_field_wb_import" id="sp-field-wb-import" type="file" ref="worldbookImportInput" @change="handleWorldbookImport" accept=".txt" style="display: none;">
                    <div class="card-body">
                        <div v-if="worldbooks.length === 0" class="empty-state">暂无世界书，点击下方添加</div>
                        
                        <template v-if="worldbooks.filter(w => w.category === 'global').length > 0">
                            <div class="profile-meta" style="margin-top: 10px; padding: 0 16px;">全局世界书</div>
                            <div v-for="wb in worldbooks.filter(w => w.category === 'global')" :key="wb.id" class="profile-item" @click="openWorldbookEditor(wb)">
                                <div class="profile-info">
                                    <div class="profile-name">{{ wb.name }}</div>
                                    <div class="profile-meta">{{ wb.entries?.length || 0 }} 个条目</div>
                                </div>
                                <div class="setting-toggle" @click.stop="toggleGlobalWorldbook(wb)" style="margin-right: 12px; margin-left: auto;">
                                    <div class="toggle-slider" :class="{ active: wb.globalEnabled }">
                                        <div class="toggle-thumb"></div>
                                    </div>
                                </div>
                            </div>
                        </template>

                        <template v-if="worldbooks.filter(w => w.category !== 'global').length > 0">
                            <div class="profile-meta" style="margin-top: 10px; padding: 0 16px;">角色世界书</div>
                            <div v-for="wb in worldbooks.filter(w => w.category !== 'global')" :key="wb.id" class="profile-item" @click="openWorldbookEditor(wb)">
                                <div class="profile-info">
                                    <div class="profile-name">{{ wb.name }}</div>
                                    <div class="profile-meta">{{ wb.entries?.length || 0 }} 个条目</div>
                                </div>
                            </div>
                        </template>

                        <div class="profile-item add-item" @click="addNewWorldbook">
                            <i class="fas fa-plus"></i>
                        </div>
                    </div>
                </div>
                

            </div>

        </div>

        <!-- 批量删除模态框 -->
        <div v-if="showBatchDeleteDialog" class="modal-overlay" @click.self="closeBatchDelete">
            <div class="modal-content batch-delete-modal">
                <div class="modal-header">
                    <span>{{ batchDeleteTitle }}</span>
                    <button class="close-btn" @click="closeBatchDelete"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <!-- 操作工具栏 -->
                    <div class="batch-delete-toolbar">
                        <div class="batch-stats">
                            <span class="stats-badge">已选 {{ selectedBatchCount }} / {{ batchDeleteItems.length }}</span>
                        </div>
                        <div class="batch-actions">
                            <button class="toolbar-btn" @click="selectAllBatchItems" :disabled="batchDeleteItems.length === 0 || isAllBatchSelected">
                                <i class="fas fa-check-square"></i> 全选
                            </button>
                            <button class="toolbar-btn" @click="invertBatchSelection" :disabled="batchDeleteItems.length === 0">
                                <i class="fas fa-exchange-alt"></i> 反选
                            </button>
                            <button class="toolbar-btn danger" @click="clearBatchSelection" :disabled="batchDeleteSelections.length === 0">
                                <i class="fas fa-eraser"></i> 清空
                            </button>
                        </div>
                    </div>

                    <!-- 项目列表 -->
                    <div class="batch-delete-list">
                        <div v-for="item in batchDeleteItems" :key="item.id" class="batch-delete-item" :class="{ selected: batchDeleteSelections.includes(item.id) }">
                            <label class="batch-delete-label">
                                <div class="custom-checkbox" :class="{ checked: batchDeleteSelections.includes(item.id) }">
                                    <i class="fas fa-check" v-if="batchDeleteSelections.includes(item.id)"></i>
                                </div>
                                <input name="sp_field_117" id="sp-field-117" type="checkbox" :value="item.id" v-model="batchDeleteSelections" class="hidden-checkbox">
                                <div class="batch-delete-info">
                                    <div class="batch-delete-name">{{ item.name }}</div>
                                    <div class="batch-delete-meta">{{ item.meta }}</div>
                                </div>
                            </label>
                        </div>
                        <div v-if="batchDeleteItems.length === 0" class="batch-delete-empty">
                            <i class="fas fa-inbox"></i>
                            <span>暂无可删除项</span>
                        </div>
                    </div>

                    <!-- 底部按钮 -->
                    <div class="batch-delete-footer">
                        <button class="btn" @click="closeBatchDelete">取消</button>
                        <button class="btn btn-danger" @click="confirmBatchDelete" :disabled="batchDeleteSelections.length === 0">
                            <i class="fas fa-trash-alt"></i> 删除选中项
                        </button>
                    </div>
                </div>
            </div>
        </div>

                <CharacterCard />

                <Worldbook />

        <!-- 世界书导入模态框已移除，现在使用直接选择文件的方式 -->



</template>

<script>
import { inject } from 'vue';
import CharacterCard from './CharacterCard.vue';
import Worldbook from './Worldbook.vue';

export default {
    name: 'WorkshopApp',
    components: {
        CharacterCard,
        Worldbook
    },
    setup() {
        return inject('globalState');
    }
}
</script>
