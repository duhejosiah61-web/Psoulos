<template>
<!-- 世界书编辑模态框 -->
        <div v-if="editingWorldbook" class="modal-overlay" @click.self="cancelWorldbookEditor">
            <div class="modal-content">
                <div class="modal-header">
                    <span>编辑世界书</span>
                    <button class="close-btn" @click="cancelWorldbookEditor"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <label>名称</label>
                    <input name="sp_field_128" id="sp-field-128" v-model="editingWorldbook.name" placeholder="世界书名称">
                    <label class="mt-2">适用范围 (Scope)</label>
                    <select name="sp_field_type" id="sp-field-type" v-model="editingWorldbook.category" style="width: 100%; padding: 10px; border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; background: rgba(0,0,0,0.02); color: #000; font-size: 14px; outline: none; transition: border-color 0.2s;">
                        <option value="global">全局 (所有角色生效)</option>
                        <option value="character">角色专属 (仅绑定角色生效)</option>
                    </select>
                    
                    <label class="mt-2">种类 (Type)</label>
                    <select name="sp_field_worldbook_type" id="sp-field-worldbook-type" v-model="editingWorldbook.worldbookType" style="width: 100%; padding: 10px; border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; background: rgba(0,0,0,0.02); color: #000; font-size: 14px; outline: none; transition: border-color 0.2s;">
                        <option value="setting">设定</option>
                        <option value="worldview">世界观</option>
                        <option value="npc">NPC</option>
                        <option value="image_gen">生图</option>
                    </select>
                    <label class="mt-2">描述</label>
                    <textarea name="sp_field_129" id="sp-field-129" v-model="editingWorldbook.description" rows="2" placeholder="世界书描述..."></textarea>
                    <label class="mt-2">条目</label>
                    <div v-for="(entry, idx) in editingWorldbook.entries" :key="entry.id" class="worldbook-entry">
                        <input name="sp_field_130" id="sp-field-130" v-model="entry.key" placeholder="关键词" class="entry-key">
                        <textarea name="sp_field_131" id="sp-field-131" v-model="entry.content" placeholder="内容" rows="3" class="entry-content"></textarea>
                        <div class="entry-actions">
                            <label class="checkbox-label">
                                <input name="sp_field_132" id="sp-field-132" type="checkbox" v-model="entry.enabled">
                                <span>启用</span>
                            </label>
                            <button class="btn-small danger" @click="deleteWorldbookEntry(entry.id)">删除</button>
                        </div>
                    </div>
                    <button class="btn w-100 mt-2" @click="addWorldbookEntry">+ 添加条目</button>
                    <div class="flex mt-2" style="justify-content: flex-end; gap: 12px;">
                        <button class="btn btn-danger" @click="deleteCurrentWorldbook">删除世界书</button>
                        <button class="btn" @click="cancelWorldbookEditor">取消</button>
                        <button class="btn btn-primary" @click="saveWorldbookEditor">保存</button>
                    </div>
                </div>
            </div>
        </div>


</template>

<script>
import { inject } from 'vue';

export default {
    name: 'Worldbook',
    setup() {
        return inject('globalState');
    }
}
</script>
