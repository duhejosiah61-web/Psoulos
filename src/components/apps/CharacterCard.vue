<template>
<!-- 角色编辑模态框 -->
        <div v-if="editingCharacter" class="modal-overlay" @click.self="cancelDossier">
            <div class="modal-content">
                <div class="modal-header">
                    <span>编辑角色</span>
                    <button class="close-btn" @click="cancelDossier"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <label>昵称</label>
                    <input name="sp_field_118" id="sp-field-118" v-model="editingCharacter.nickname" placeholder="昵称">
                    <label class="mt-2">内部名称</label>
                    <input name="sp_field_119" id="sp-field-119" v-model="editingCharacter.internalName" placeholder="内部名称">
                    <label class="mt-2">简介</label>
                    <textarea name="sp_field_120" id="sp-field-120" v-model="editingCharacter.summary" rows="2" placeholder="角色简介..."></textarea>
                    <label class="mt-2">人设</label>
                    <textarea name="sp_field_121" id="sp-field-121" v-model="editingCharacter.persona" rows="4" placeholder="角色人设..."></textarea>
                    <label class="mt-2">头像</label>
                    <div class="flex" style="gap: 8px;">
                        <input name="sp_field_122" id="sp-field-122" v-model="editingCharacter.avatarUrl" placeholder="头像 URL" style="flex: 1;">
                        <button class="btn-small" @click="triggerAvatarUpload"><i class="fas fa-image"></i> 相册</button>
                    </div>
                    
                    <label class="mt-2">角色外貌</label>
                    <textarea v-model="editingCharacter.appearance" rows="2" placeholder="角色的外貌描述标签 (例如: 1girl, blonde hair, blue eyes)..."></textarea>
                    <label class="mt-2">开场白</label>
                    <div v-for="(line, index) in editingCharacter.openingLines" :key="index" class="flex mt-1" style="gap: 8px;">
                        <input name="sp_field_123" id="sp-field-123" v-model="editingCharacter.openingLines[index]" placeholder="输入开场白内容..." style="flex: 1;">
                        <button class="btn-small danger" @click="removeOpeningLine(index)" v-if="editingCharacter.openingLines.length > 1"><i class="fas fa-minus"></i></button>
                    </div>
                    <button class="btn-small mt-1" @click="addOpeningLine"><i class="fas fa-plus"></i> 添加更多开场白</button>
                    
                    <label class="mt-2">标签</label>
                    <div class="flex mt-1" style="gap: 8px; flex-wrap: wrap;">
                        <span v-for="(tag, index) in editingCharacter.tags" :key="index" class="tag">
                            {{ tag }}
                            <i class="fas fa-times" @click="removeTag(index)" style="cursor: pointer; margin-left: 4px;"></i>
                        </span>
                    </div>
                    <div class="flex mt-1" style="gap: 8px;">
                        <input name="sp_field_124" id="sp-field-124" v-model="newTagInput" placeholder="添加标签..." style="flex: 1;">
                        <button class="btn-small" @click="addTag"><i class="fas fa-plus"></i></button>
                    </div>
                    
                    <label class="mt-2">绑定角色专属世界书</label>
                    <div class="profile-meta" style="margin-bottom: 8px;">全局世界书已在后台自动对所有角色生效，无需在此重复绑定。</div>
                    <div v-if="worldbooks.filter(w => w.category !== 'global').length === 0" class="profile-meta">暂无可绑定的专属世界书，请先在工作室创建</div>
                    <div v-else class="worldbook-list">
                        <div v-for="wb in worldbooks.filter(w => w.category !== 'global')" :key="wb.id" class="worldbook-item" style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid rgba(0,0,0,0.1);">
                            <span>{{ wb.name }}</span>
                            <input name="sp_field_125" id="sp-field-125" type="checkbox" v-model="editingCharacter.worldbookIds" :value="wb.id">
                        </div>
                    </div>

                    <label class="mt-2">绑定预设 (线下模式使用)</label>
                    <select name="sp_field_126" id="sp-field-126" v-model="editingCharacter.selectedPresetId">
                        <option :value="null">不绑定预设</option>
                        <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>

                    <label class="mt-2">用户人设</label>
                    <textarea name="sp_field_127" id="sp-field-127" v-model="editingCharacter.userPersona" rows="2" placeholder="用户在此角色面前的人设..."></textarea>
                    
                    <label class="mt-2">用户外貌</label>
                    <textarea v-model="editingCharacter.userAppearance" rows="2" placeholder="用户的外貌描述标签 (例如: 1boy, black hair, glasses)..."></textarea>
                    
                    <div class="flex mt-2" style="justify-content: flex-end; gap: 12px;">
                        <button class="btn btn-danger" @click="deleteCharacter">删除</button>
                        <button class="btn" @click="cancelDossier">取消</button>
                        <button class="btn btn-primary" @click="saveDossier">保存</button>
                    </div>
                </div>
            </div>
        </div>


</template>

<script>
import { inject } from 'vue';

export default {
    name: 'CharacterCard',
    setup() {
        return inject('globalState');
    }
}
</script>
