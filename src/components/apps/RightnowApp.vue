<template>
        <!-- Rightnow App (Offline Novel Mode) -->
        <div  class="app-view rightnow-app" style="background: #000000; color: #e5e5e5; height: 100%; display: flex; flex-direction: column;">
            <div class="rightnow-header" style="position: relative; display: flex; justify-content: space-between; align-items: center; padding: 30px 24px 10px; z-index: 20;">
                <div style="flex: 1; display: flex; justify-content: flex-start;">
                    <button class="back-btn" @click="showRightnowSettings ? (showRightnowSettings = false) : (rightnowActiveSlot ? (rightnowActiveSlot = null, soulLinkActiveChat = null, selectedCharForRightnow = null) : (setRightnowMode(false), closeApp()))" style="background: none; border: none; color: #a0a0a0; font-size: 20px; cursor: pointer; transition: color 0.3s;"><i class="fas fa-chevron-left"></i></button>
                </div>
                <div style="flex: 1; display: flex; justify-content: center;">
                    <span class="app-title" style="color: #c0c0c0; font-family: 'Georgia', 'Songti SC', serif; font-size: 16px; letter-spacing: 4px; font-weight: 300; white-space: nowrap;">{{ showRightnowSettings ? '时空设置' : (rightnowActiveSlot ? (isAiTyping ? '···' : currentChatName.toUpperCase()) : '选择共鸣的灵魂') }}</span>
                </div>
                <div style="flex: 1; display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
                    <button v-if="rightnowActiveSlot && !showRightnowSettings" @click="clearRightnowHistory" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 4px 8px; color: #d4d4d4; font-size: 12px; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'" title="清空当前存档记录">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <button v-else-if="!rightnowActiveSlot && !showRightnowSettings" @click="showRightnowSettings = true" style="background: none; border: none; color: #a0a0a0; font-size: 20px; cursor: pointer; transition: color 0.3s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#a0a0a0'" title="设置">
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
            </div>
            
            <div v-if="showRightnowSettings" class="app-content rightnow-settings" style="flex: 1; padding: 16px; display: flex; flex-direction: column; overflow-y: auto; box-sizing: border-box;">
                <h3 style="font-family: 'Georgia', 'Songti SC', serif; font-weight: 300; margin-bottom: 16px; color: #fff; text-align: center;">文风与系统设置</h3>
                
                <!-- 文风预设管理 (手机优化版) -->
                <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 14px;">
                    
                    <!-- 预设选择器与操作栏 -->
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <label style="color: #aaa; font-size: 13px;">选择预设文风：</label>
                        <div style="display: flex; gap: 8px; width: 100%;">
                            <select :value="rightnowActiveStyleId" 
                                    @change="rightnowActiveStyleId = $event.target.value; saveRightnowStyles()"
                                    style="flex: 1; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 10px 12px; color: #fff; font-size: 15px; outline: none;">
                                <option v-for="style in rightnowStylePresets" :key="style.id" :value="style.id">
                                    {{ style.name }}
                                </option>
                                <option v-if="rightnowStylePresets.length === 0" value="">暂无预设</option>
                            </select>
                            
                            <button @click="confirmAddRightnowStyle" style="width: 42px; height: 42px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">
                                <i class="fas fa-plus"></i>
                            </button>
                            
                            <button v-if="rightnowStylePresets.length > 1 && rightnowActiveStyleId" 
                                    @click="confirmDeleteRightnowStyle(rightnowActiveStyleId)" 
                                    style="width: 42px; height: 42px; background: rgba(255,75,75,0.15); border: 1px solid rgba(255,75,75,0.3); border-radius: 8px; color: #ff4b4b; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- 编辑区域 -->
                    <div v-if="rightnowActiveStyleId" style="display: flex; flex-direction: column; gap: 12px; margin-top: 4px;">
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <label style="color: #aaa; font-size: 13px;">预设名称：</label>
                            <input type="text" :value="rightnowStylePresets.find(s => s.id === rightnowActiveStyleId)?.name"
                                   @input="updateRightnowStyle(rightnowActiveStyleId, undefined, $event.target.value)"
                                   placeholder="预设名称" 
                                   style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 12px; color: #fff; font-size: 15px; outline: none;">
                        </div>
                        
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <label style="color: #aaa; font-size: 13px;">文风与描写要求：</label>
                            <textarea :value="rightnowStylePresets.find(s => s.id === rightnowActiveStyleId)?.content"
                                      @input="updateRightnowStyle(rightnowActiveStyleId, $event.target.value, undefined)"
                                      placeholder="在此输入文风要求、排版规则或行为设定... (例如：多描写微表情，使用暗黑风格的词汇等)"
                                      style="min-height: 180px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 12px; color: #ccc; font-size: 14px; line-height: 1.5; resize: none; outline: none;"></textarea>
                        </div>
                    </div>
                    
                    <div v-else style="color: #888; text-align: center; padding: 30px 0; font-size: 14px;">
                        暂无文风预设，请先点击右上角 “+” 创建一个吧
                    </div>
                </div>
            </div>

            <div v-else-if="!rightnowActiveSlot" class="app-content rightnow-select-char" style="flex: 1; padding: 24px; display: flex; gap: 40px;">
                <!-- 左侧：角色列表 -->
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; border-right: 1px solid rgba(255,255,255,0.1); padding-right: 40px; overflow-y: auto;">
                    <div class="rightnow-char-list" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px 20px; width: 100%;">
                        <div v-for="char in displayChatCharacters" :key="char?.id || char?.name" @click="selectedCharForRightnow = char" style="text-align: center; cursor: pointer; display: flex; flex-direction: column; align-items: center; transition: all 0.3s;" :style="{ opacity: selectedCharForRightnow && selectedCharForRightnow.id === char.id ? 1 : 0.5, transform: selectedCharForRightnow && selectedCharForRightnow.id === char.id ? 'scale(1.05)' : 'scale(1)' }">
                            <img :src="char.avatarUrl || 'https://placehold.co/100x100/111/444?text=?'" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 2px solid transparent; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); transition: all 0.3s;" :style="{ borderColor: selectedCharForRightnow && selectedCharForRightnow.id === char.id ? '#ffffff' : 'transparent', filter: selectedCharForRightnow && selectedCharForRightnow.id === char.id ? 'none' : 'grayscale(30%) contrast(110%)' }">
                            <span style="font-size: 14px; font-family: 'Georgia', 'Songti SC', serif; color: #fff; letter-spacing: 1px;">{{ char.nickname || char.name }}</span>
                        </div>
                    </div>
                </div>

                <!-- 右侧：存档面板 -->
                <div style="flex: 1; display: flex; flex-direction: column; overflow-y: auto; padding-left: 10px;">
                    <template v-if="selectedCharForRightnow">
                        <h4 style="font-family: 'Georgia', 'Songti SC', serif; font-weight: 300; color: #d0d0d0; margin-bottom: 20px; font-size: 16px;">{{ selectedCharForRightnow.nickname || selectedCharForRightnow.name }} 的存档记录</h4>
                        
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div v-for="slot in (rightnowSlots[selectedCharForRightnow.id] || [])" :key="slot.id" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; display: flex; justify-content: space-between; align-items: center; transition: background 0.3s;">
                                <div>
                                    <div style="font-size: 15px; color: #fff; margin-bottom: 4px;">{{ slot.name }}</div>
                                    <div style="font-size: 12px; color: #888;">{{ new Date(slot.updatedAt).toLocaleString() }}</div>
                                </div>
                                <div style="display: flex; gap: 8px;">
                                    <button @click="startSoulLinkChat(selectedCharForRightnow.id); rightnowActiveSlot = slot.id" class="btn btn-primary btn-small" style="font-size: 13px; padding: 6px 12px;">载入</button>
                                    <button @click="confirmDeleteRightnowSlot(selectedCharForRightnow.id, slot.id)" class="btn btn-danger btn-small" style="font-size: 13px; padding: 6px 12px;"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>

                            <button @click="(rightnowActiveSlot = createRightnowSlot(selectedCharForRightnow.id)) && startSoulLinkChat(selectedCharForRightnow.id)" style="background: transparent; border: 1px dashed rgba(255,255,255,0.3); color: #aaa; border-radius: 8px; padding: 16px; font-size: 14px; cursor: pointer; transition: all 0.3s; margin-top: 10px;" onmouseover="this.style.borderColor='rgba(255,255,255,0.6)'; this.style.color='#fff'" onmouseout="this.style.borderColor='rgba(255,255,255,0.3)'; this.style.color='#aaa'">
                                + 新建时空存档
                            </button>
                        </div>
                    </template>
                    <div v-else style="display: flex; height: 100%; align-items: center; justify-content: center; color: #666; font-size: 14px; font-family: 'Georgia', 'Songti SC', serif;">
                        请在左侧选择一个角色
                    </div>
                </div>
            </div>
            
            <div v-else class="app-content rightnow-reader" style="flex: 1; overflow-y: auto; padding: 20px 28px 120px 28px; font-family: 'Georgia', 'Songti SC', 'SimSun', serif; font-size: 18px; line-height: 2.2; color: #d4d4d4; letter-spacing: 1px; scroll-behavior: smooth;" @click.self="closeAllPanels">
                <div v-for="msg in rightnowActiveMessages" :key="msg.id" class="rightnow-paragraph" 
                     @contextmenu.prevent="onMessageContextMenu($event, msg)"
                     @touchstart="onMessageTouchStart($event, msg)"
                     @touchmove="onMessageTouchMove"
                     @touchend="onMessageTouchEnd"
                     style="margin-bottom: 20px; padding: 18px 24px; background: rgba(20, 20, 25, 0.75); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); animation: fadeIn 0.4s ease-out; position: relative; transition: background 0.3s;">
                    <!-- Sender Name -->
                    <div style="font-size: 13px; color: #777; margin-bottom: 8px; font-family: sans-serif; display: flex; align-items: center; justify-content: space-between;">
                        <span>{{ msg.sender === 'user' ? '我' : (msg.sender === 'system' ? '系统' : currentChatName) }}</span>
                    </div>
                    
                    <div v-if="msg.sender === 'user'" style="text-indent: 2em; margin-top: 4px; margin-bottom: 0px;">
                        <span style="font-weight: normal; color: #f0f0f0;">{{ msg.text }}</span>
                    </div>
                    <div v-else-if="msg.sender === 'system'" style="text-indent: 2em; margin-top: 4px; margin-bottom: 0px;">
                        <span style="font-weight: normal; color: #a0a0a0; font-size: 15px;">{{ msg.text }}</span>
                    </div>
                    <div v-else style="font-weight: normal; color: #f0f0f0;" v-html="formatRightnowText(msg.text)"></div>
                </div>
                <div v-if="isAiTyping" class="rightnow-paragraph typing" style="margin-bottom: 20px; padding: 16px 24px; background: rgba(20, 20, 25, 0.75); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: #777; font-style: italic; animation: pulse 2s infinite;">
                    {{ currentChatName }} 正在沉思...
                </div>
            </div>
            
            <div v-if="soulLinkActiveChat" class="rightnow-footer" style="position: absolute; bottom: 0; left: 0; right: 0; padding: 0 28px 24px; background: linear-gradient(to top, rgba(0,0,0,1) 80%, rgba(0,0,0,0)); display: flex; flex-direction: column; z-index: 10;">
                <div class="rightnow-toolbar" style="display: flex; gap: 10px; padding: 24px 0 8px; opacity: 0.85;">
                    <span @click="insertIntoRightnow('“', '”')" style="cursor: pointer; color: #d4d4d4; font-family: 'Georgia', serif; padding: 4px 10px; background: rgba(255,255,255,0.1); border-radius: 4px; font-size: 13px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">“对话”</span>
                    <span @click="insertIntoRightnow('*', '*')" style="cursor: pointer; color: #d4d4d4; font-family: 'Georgia', serif; padding: 4px 10px; background: rgba(255,255,255,0.1); border-radius: 4px; font-size: 13px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">*旁白*</span>
                    <span @click="insertIntoRightnow('（', '）')" style="cursor: pointer; color: #d4d4d4; font-family: 'Georgia', serif; padding: 4px 10px; background: rgba(255,255,255,0.1); border-radius: 4px; font-size: 13px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">（内心）</span>
                </div>
                <div style="display: flex; align-items: flex-end; width: 100%;">
                    <textarea name="sp_field_rightnow_input" id="sp-field-rightnow-input" v-model="soulLinkInput" placeholder="写下你的故事... (回车换行)" style="flex: 1; background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,0.15); padding: 10px 0; font-family: 'Georgia', 'Songti SC', serif; font-size: 15px; color: #e5e5e5; outline: none; transition: border-color 0.3s; resize: none; overflow-y: auto; max-height: 150px; line-height: 1.5; min-height: 22px;" oninput="this.style.height = 'auto'; this.style.height = (this.scrollHeight) + 'px';"></textarea>
                    <button @click="onSendOrCall" style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; padding: 6px 14px; font-family: 'Georgia', 'Songti SC', serif; font-size: 14px; margin-left: 15px; margin-bottom: 4px; color: #fff; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.25)'" onmouseout="this.style.background='rgba(255,255,255,0.15)'">链接</button>
                </div>
            </div>
        </div>

</template>

<script>
import { inject } from 'vue';

export default {
    name: 'RightnowApp',
    setup() {
        return inject('globalState');
    }
}
</script>
