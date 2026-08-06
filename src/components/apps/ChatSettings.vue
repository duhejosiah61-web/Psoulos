<template>
<!-- 聊天设置面板 -->
        <div v-if="showChatSettings" class="art-settings-overlay" @click.self="showChatSettings = false">
            <div class="art-settings-panel" :style="chatSettings.chatSettingsPanelStyle">
                <button class="art-settings-close" @click="showChatSettings = false">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                
                <h1 class="art-settings-title">SETTING</h1>
                
                <div class="art-profile-card" @click="uploadUserAvatar">
                    <div class="art-profile-avatar">
                        <img v-if="userAvatar" :src="userAvatar" class="art-avatar-img">
                        <svg v-else viewBox="0 0 80 80" fill="none">
                            <circle cx="40" cy="40" r="36" stroke="#000000" stroke-width="2"/>
                            <circle cx="40" cy="32" r="8" stroke="#000000" stroke-width="2"/>
                            <path d="M25 55 Q40 45 55 55" stroke="#000000" stroke-width="2" fill="none"/>
                        </svg>
                    </div>
                    <div class="art-profile-info">
                        <span class="art-profile-name">我的头像</span>
                        <span class="art-profile-bio">{{ userAvatar ? '点击更换头像' : '点击设置头像' }}</span>
                    </div>
                </div>
                
                <div v-if="userAvatar" class="art-reset-avatar-btn" @click="resetUserAvatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="1 4 1 10 7 10"></polyline>
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                    </svg>
                    重置
                </div>
                
                <div class="art-settings-section">
                    <h2 class="art-section-title">个人信息</h2>
                    <div class="art-settings-input-item">
                        <div class="art-settings-icon-wrapper">
                            <div class="art-settings-blob blob-color-3"></div>
                            <svg class="art-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <div class="art-input-wrapper">
                            <label class="art-input-label">我的身份</label>
                            <input name="sp_field_9" id="sp-field-9" type="text" v-model="chatSettings.userIdentity" class="art-settings-input" placeholder="向ta介绍一下我自己....">
                        </div>
                    </div>

                    <div class="art-settings-input-item">
                        <div class="art-settings-icon-wrapper">
                            <div class="art-settings-blob blob-color-2"></div>
                            <svg class="art-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M8 7a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"></path>
                                <path d="M16 7a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"></path>
                                <path d="M4 19c0-2.2 1.8-4 4-4"></path>
                                <path d="M20 19c0-2.2-1.8-4-4-4"></path>
                            </svg>
                        </div>
                        <div class="art-input-wrapper">
                            <label class="art-input-label">我的人称代词</label>
                            <select name="sp_field_10" id="sp-field-10" v-model="chatSettings.userPronoun" class="art-settings-input">
                                <option value="unknown">保密/中性（TA）</option>
                                <option value="female">女性（她）</option>
                                <option value="male">男性（他）</option>
                                <option value="nonbinary">非二元/中性</option>
                            </select>
                        </div>
                    </div>
                    
                    <div v-if="soulLinkActiveChatType !== 'group'" class="art-settings-input-item">
                        <div class="art-settings-icon-wrapper">
                            <div class="art-settings-blob blob-color-4"></div>
                            <svg class="art-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <div class="art-input-wrapper">
                            <label class="art-input-label">和TA的关系</label>
                            <input name="sp_field_11" id="sp-field-11" type="text" v-model="chatSettings.userRelation" class="art-settings-input" placeholder="例如：闺蜜、死党...">
                        </div>
                    </div>
                    
                    <!-- 群聊成员关系 -->
                    <div v-if="soulLinkActiveChatType === 'group' && activeGroupChat" class="group-members-settings">
                        <div class="group-member-item" v-for="(member, index) in activeGroupChat.members" :key="member.id || ('m-' + index)">
                            <img :src="member.avatarUrl || 'https://placehold.co/100x100?text=No+Avatar'" class="group-member-small-avatar">
                            <div class="group-member-info">
                                <div class="group-member-name">{{ member.name }}</div>
                                <input name="sp_field_12" id="sp-field-12" type="text" v-model="member.relation" class="group-member-relation-input" :placeholder="'与' + member.name + '的关系'">
                            </div>
                            <button type="button" class="edit-member-btn" @click="openMemberEditor(member)" title="编辑人设与世界书">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button v-if="member.id && String(member.id).indexOf('custom_') !== 0" type="button" class="btn-small" style="margin-right:4px;" @click="toggleUserBlockRoleForCharacter(member.id)">{{ isCharacterBlockedByUser(member.id) ? '取消拉黑' : '拉黑' }}</button>
                            <button type="button" class="remove-member-btn" @click="removeGroupMember(index)">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <button class="add-member-btn" @click="showAddMemberDialog = true">
                            <i class="fas fa-plus"></i>
                            添加成员
                        </button>
                    </div>
                </div>

                <div class="art-settings-section">
                    <h2 class="art-section-title">外语翻译</h2>
                    <div class="art-settings-input-item">
                        <div class="art-settings-icon-wrapper">
                            <div class="art-settings-blob blob-color-4"></div>
                            <svg class="art-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M4 5h16"></path>
                                <path d="M4 19h16"></path>
                                <path d="M7 5v14"></path>
                                <path d="M17 5v14"></path>
                            </svg>
                        </div>
                        <div class="art-input-wrapper">
                            <label class="art-input-label">外语功能</label>
                            <div style="display: flex; align-items: center; gap: 10px; padding-top: 6px;">
                                <input id="soulLinkForeignTranslationEnabled" type="checkbox" v-model="chatSettings.soulLinkForeignTranslationEnabled">
                                <label for="soulLinkForeignTranslationEnabled" style="font-family: 'Inter', sans-serif; font-size: 14px; color: #000000;">开启外语翻译</label>
                            </div>
                        </div>
                    </div>
                    <div class="art-settings-input-item">
                        <div class="art-settings-icon-wrapper">
                            <div class="art-settings-blob blob-color-5"></div>
                            <svg class="art-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M3 5h18"></path>
                                <path d="M7 9h10"></path>
                                <path d="M8 19h8"></path>
                                <path d="M12 5v14"></path>
                            </svg>
                        </div>
                        <div class="art-input-wrapper">
                            <label class="art-input-label">输出语言(A) / 翻译语言(B)</label>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                <select name="sp_field_13" id="sp-field-13" v-model="chatSettings.soulLinkForeignPrimaryLang" class="art-settings-input">
                                    <option value="zh-CN">中文(简体)</option>
                                    <option value="zh-TW">中文(繁體)</option>
                                    <option value="en">English</option>
                                    <option value="ja">日本語</option>
                                    <option value="ko">한국어</option>
                                    <option value="fr">Français</option>
                                    <option value="de">Deutsch</option>
                                    <option value="es">Español</option>
                                    <option value="it">Italiano</option>
                                    <option value="ru">Русский</option>
                                    <option value="pt-BR">Português (Brasil)</option>
                                    <option value="ar">العربية</option>
                                    <option value="hi">हिन्दी</option>
                                    <option value="th">ไทย</option>
                                    <option value="vi">Tiếng Việt</option>
                                    <option value="id">Bahasa Indonesia</option>
                                    <option value="tr">Türkçe</option>
                                </select>
                                <select name="sp_field_14" id="sp-field-14" v-model="chatSettings.soulLinkForeignSecondaryLang" class="art-settings-input">
                                    <option value="zh-CN">中文(简体)</option>
                                    <option value="zh-TW">中文(繁體)</option>
                                    <option value="en">English</option>
                                    <option value="ja">日本語</option>
                                    <option value="ko">한국어</option>
                                    <option value="fr">Français</option>
                                    <option value="de">Deutsch</option>
                                    <option value="es">Español</option>
                                    <option value="it">Italiano</option>
                                    <option value="ru">Русский</option>
                                    <option value="pt-BR">Português (Brasil)</option>
                                    <option value="ar">العربية</option>
                                    <option value="hi">हिन्दी</option>
                                    <option value="th">ไทย</option>
                                    <option value="vi">Tiếng Việt</option>
                                    <option value="id">Bahasa Indonesia</option>
                                    <option value="tr">Türkçe</option>
                                </select>
                            </div>
                            <div style="font-size: 12px; color: rgba(0, 0, 0, 0.55); margin-top: 6px;">
                                {{ chatSettings.soulLinkForeignTranslationDirectionText }}
                            </div>
                        </div>
                    </div>
                </div>


                <div class="art-settings-section">
                    <h2 class="art-section-title">聊天美化</h2>
                    <div class="art-settings-input-item">
                        <div class="art-settings-icon-wrapper">
                            <div class="art-settings-blob blob-color-1"></div>
                            <svg class="art-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                        </div>
                        <div class="art-input-wrapper">
                            <label class="art-input-label">聊天背景</label>
                            <div style="display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap;">
                                <input type="text" v-model="chatSettings.chatBackgroundImageInput" class="art-settings-input" style="flex: 1; min-width: 150px;" placeholder="输入图片链接...">
                                <button class="btn-small" @click="chatSettings.applyBackgroundImageLink()">保存</button>
                                <input type="file" accept="image/*" @change="uploadChatBackgroundImage" style="display: none;" ref="chatBgFile">
                                <button class="btn-small" style="background: #f2f2f7; color: #333; border: 1px solid #ddd;" @click="$refs.chatBgFile.click()">上传</button>
                                <button class="btn-small" style="background: transparent; color: #d9534f; border: 1px solid #d9534f;" @click="chatSettings.clearBackgroundImage()">清除</button>
                            </div>
                        </div>
                    </div>

                    <div class="art-settings-input-item" style="align-items: flex-start;">
                        <div class="art-settings-icon-wrapper">
                            <div class="art-settings-blob blob-color-5"></div>
                            <svg class="art-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                            </svg>
                        </div>
                        <div class="art-input-wrapper" style="width: 100%;">
                            <label class="art-input-label">自定义主题与气泡 (CSS)</label>
                            <textarea v-model="chatSettings.customBubbleCSS" class="art-settings-input" style="height: 100px; resize: vertical; margin-top: 6px; font-family: monospace; font-size: 12px;" placeholder="在此粘贴 AI 生成的 CSS 代码..."></textarea>
                            <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
                                <button class="btn-small" @click="chatSettings.applyCustomCSS()">应用</button>
                                <input type="file" accept=".css" @change="uploadChatThemeCSS" style="display: none;" ref="chatThemeFile">
                                <button class="btn-small" style="background: #f2f2f7; color: #333; border: 1px solid #ddd;" @click="$refs.chatThemeFile.click()">上传 CSS 文件</button>
                                <button class="btn-small" style="background: #e3f2fd; color: #0275d8; border: 1px solid #0275d8;" @click="downloadChatBeautifyGuide" title="下载给 AI 看的提示词模版">获取 AI 指南</button>
                                <button class="btn-small" style="background: transparent; color: #d9534f; border: 1px solid #d9534f;" @click="chatSettings.customBubbleCSS = ''; chatSettings.applyCustomCSS()">清除</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="art-settings-section">
                    <h2 class="art-section-title">聊天总结</h2>
                    <div class="art-settings-input-item">
                        <div class="art-settings-icon-wrapper">
                            <div class="art-settings-blob blob-color-6"></div>
                            <svg class="art-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M4 4h16v16H4z"></path>
                                <path d="M7 8h10"></path>
                                <path d="M7 12h10"></path>
                                <path d="M7 16h7"></path>
                            </svg>
                        </div>
                        <div class="art-input-wrapper">
                            <label class="art-input-label">自动总结</label>
                            <div style="display: flex; align-items: center; gap: 10px; padding-top: 6px;">
                                <input id="chatSummaryEnabled" type="checkbox" v-model="chatSettings.chatSummaryEnabled">
                                <label for="chatSummaryEnabled" style="font-family: 'Inter', sans-serif; font-size: 14px; color: #000000;">开启聊天总结</label>
                            </div>
                            <div v-if="chatSettings.chatSummaryEnabled" style="margin-top: 10px; display: flex; align-items: center; gap: 10px;">
                                <span style="font-size: 13px; color: rgba(0,0,0,.65);">每</span>
                                <input name="sp_field_24" id="sp-field-24" type="number" v-model.number="chatSettings.chatSummaryEveryN" min="1" step="1" class="art-settings-input" style="max-width: 110px;">
                                <span style="font-size: 13px; color: rgba(0,0,0,.65);">次对话自动总结一次</span>
                            </div>
                            <div style="margin-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
                                <button class="btn-small" @click="manualSummarizeChat" :disabled="chatSettings.chatSummaryGenerating">
                                    {{ chatSettings.chatSummaryGenerating ? '总结中...' : '立即总结' }}
                                </button>
                                <button class="btn-small" @click="clearChatSummaryBoard" :disabled="chatSettings.chatSummaryGenerating || chatSummaryBoardList.length === 0">
                                    清空留言板
                                </button>
                            </div>
                            <div style="font-size: 12px; color: rgba(0, 0, 0, 0.55); margin-top: 8px;">
                                开启后会用“摘要 + 最近少量消息”与AI对话，减少token。
                            </div>
                        </div>
                    </div>

                    <div class="art-settings-input-item" style="align-items: flex-start;">
                        <div class="art-settings-icon-wrapper">
                            <div class="art-settings-blob blob-color-3"></div>
                            <svg class="art-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path>
                            </svg>
                        </div>
                        <div class="art-input-wrapper" style="width: 100%;">
                            <label class="art-input-label">留言板（总结区）</label>
                            <div v-if="chatSummaryBoardList.length === 0" style="font-size: 13px; color: rgba(0,0,0,.55); padding-top: 6px;">
                                还没有总结。你可以点“立即总结”生成第一条。
                            </div>
                            <div v-else style="display: flex; flex-direction: column; gap: 10px; margin-top: 8px;">
                                <div v-for="item in chatSummaryBoardList.slice(0, 6)" :key="item.id" style="border: 1px solid rgba(0,0,0,.12); border-radius: 12px; padding: 10px; background: #fff;">
                                    <div style="display: flex; justify-content: space-between; gap: 10px;">
                                        <div style="font-weight: 600; font-size: 13px; color: #111;">{{ item.title || '聊天总结' }}</div>
                                        <div style="font-size: 12px; color: rgba(0,0,0,.55); white-space: nowrap;">{{ item.createdAtText }}</div>
                                    </div>
                                    <div style="margin-top: 6px; font-size: 13px; line-height: 1.5; color: rgba(0,0,0,.75); white-space: pre-wrap;">
                                        {{ item.body }}
                                    </div>
                                </div>
                                <div v-if="chatSummaryBoardList.length > 6" style="font-size: 12px; color: rgba(0,0,0,.55);">
                                    仅展示最近 6 条（其余已保存在本地）。
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="art-settings-section">
                    <h2 class="art-section-title">时间/时差感知</h2>
                    <div class="art-settings-input-item">
                        <div class="art-settings-icon-wrapper">
                            <div class="art-settings-blob blob-color-3"></div>
                            <svg class="art-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="12" cy="12" r="9"></circle>
                                <polyline points="12 7 12 12 15 15"></polyline>
                            </svg>
                        </div>
                        <div class="art-input-wrapper">
                            <label class="art-input-label">现实时间感知</label>
                            <div style="display: flex; align-items: center; gap: 10px; padding-top: 6px;">
                                <input id="timeSenseEnabled" type="checkbox" v-model="chatSettings.timeSenseEnabled">
                                <label for="timeSenseEnabled" style="font-family: 'Inter', sans-serif; font-size: 14px; color: #000000;">开启时间感知</label>
                            </div>
                            <div class="menu-setting-item" style="display: flex; align-items: center; gap: 8px;">
                                <input id="realtimeTypingEnabled" type="checkbox" v-model="chatSettings.realtimeTypingEnabled">
                                <label for="realtimeTypingEnabled" style="font-family: 'Inter', sans-serif; font-size: 14px; color: #000000;">开启实时打字效果</label>
                            </div>
                            <div class="menu-setting-hint" style="margin-top: -12px; margin-bottom: 12px; font-size: 12px; color: rgba(0,0,0,0.45); padding: 0 16px;">关闭后将恢复为整段内容同时输出，且不支持打字过程中的闪烁特效。</div>
                            <div style="font-size: 12px; color: rgba(0, 0, 0, 0.55); margin-top: 8px;">
                                角色会感知当前现实时间（早中晚/工作日/周末等），让对话更真实。若开启下方“时差系统”，将以时差系统为准。
                            </div>
                        </div>
                    </div>
                    <div class="art-settings-input-item">
                        <div class="art-settings-icon-wrapper">
                            <div class="art-settings-blob blob-color-2"></div>
                            <svg class="art-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="12" cy="12" r="9"></circle>
                                <path d="M12 7v5l3 2"></path>
                            </svg>
                        </div>
                        <div class="art-input-wrapper">
                            <label class="art-input-label">时差感知</label>
                            <div style="display: flex; align-items: center; gap: 10px; padding-top: 6px;">
                                <input id="timeZoneSystemEnabled" type="checkbox" v-model="chatSettings.timeZoneSystemEnabled">
                                <label for="timeZoneSystemEnabled" style="font-family: 'Inter', sans-serif; font-size: 14px; color: #000000;">开启时差系统</label>
                            </div>
                            <div style="font-size: 12px; color: rgba(0, 0, 0, 0.55); margin-top: 8px;">
                                可填写 IANA 时区（如 `Asia/Shanghai`）或 UTC 偏移（如 `UTC+8` / `UTC-5:30`）。
                            </div>
                        </div>
                    </div>
                    <div v-if="chatSettings.timeZoneSystemEnabled" class="art-settings-input-item">
                        <div class="art-settings-icon-wrapper">
                            <div class="art-settings-blob blob-color-4"></div>
                            <svg class="art-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <div class="art-input-wrapper">
                            <label class="art-input-label">用户时区</label>
                            <input name="sp_field_25" id="sp-field-25" type="text" v-model="chatSettings.userTimeZone" class="art-settings-input" placeholder="例如：Asia/Shanghai 或 UTC+8">
                        </div>
                    </div>
                    <div v-if="chatSettings.timeZoneSystemEnabled" class="art-settings-input-item">
                        <div class="art-settings-icon-wrapper">
                            <div class="art-settings-blob blob-color-5"></div>
                            <svg class="art-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <div class="art-input-wrapper">
                            <label class="art-input-label">角色时区</label>
                            <input name="sp_field_26" id="sp-field-26" type="text" v-model="chatSettings.roleTimeZone" class="art-settings-input" placeholder="例如：Asia/Tokyo 或 UTC+9">
                        </div>
                    </div>
                </div>

                <div class="art-settings-section">
                    <h2 class="art-section-title">主动发消息 <span style="font-size:12px; color:#ef4444; font-weight:normal; margin-left:8px;">(此功能会真实调用 API，注意 Token 消耗)</span></h2>
                    <div class="art-settings-input-item">
                        <div class="art-settings-icon-wrapper">
                            <div class="art-settings-blob blob-color-4"></div>
                            <svg class="art-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </div>
                        <div class="art-input-wrapper">
                            <label class="art-input-label">启用主动消息</label>
                            <div style="display:flex; align-items:center; gap:10px; padding-top:6px;">
                                <input id="activeMessageEnabled" type="checkbox" v-model="chatSettings.activeMessageEnabled">
                                <label for="activeMessageEnabled" style="font-family:'Inter',sans-serif; font-size:14px; color:#000;">开启</label>
                            </div>
                            <div v-if="chatSettings.activeMessageEnabled" style="display:flex; gap:10px; margin-top:8px; align-items:center;">
                                <span style="font-size:13px; color:#666;">频率(分钟)</span>
                                <input name="sp_field_27" id="sp-field-27" type="number" min="1" step="1" v-model.number="chatSettings.activeMessageFrequencyMin" class="art-settings-input" style="max-width:110px;">
                                <span style="font-size:13px; color:#666;">回复延迟(秒)</span>
                                <input name="sp_field_28" id="sp-field-28" type="number" min="1" step="1" v-model.number="chatSettings.activeReplyDelaySec" class="art-settings-input" style="max-width:110px;">
                            </div>
                            <p style="font-size:12px; color:rgba(0,0,0,.5); margin-top:8px; line-height:1.45;">按当前会话保存：每个单聊、每个群聊的主动消息开关与频率各自独立。群聊仅在已配置有效 API 且模型返回内容时，才会随机选一名未拉黑成员发送一条主动消息。</p>
                        </div>
                    </div>
                </div>

                <div v-if="soulLinkActiveChatType === 'character'" class="art-settings-section">
                    <h2 class="art-section-title">拉黑（按角色）</h2>
                    <div class="art-settings-input-item">
                        <div class="art-settings-icon-wrapper">
                            <div class="art-settings-blob blob-color-6"></div>
                            <svg class="art-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="12" cy="12" r="9"></circle>
                                <path d="M7 17l10-10"></path>
                            </svg>
                        </div>
                        <!-- Block UI removed by user request -->
                    </div>
                </div>
                <div v-else-if="soulLinkActiveChatType === 'group'" class="art-settings-section" style="display:none;"></div>
                
                <div class="art-settings-section">
                    <h2 class="art-section-title">聊天记录</h2>
                    <div class="art-settings-item">
                        <div class="art-settings-icon-wrapper">
                            <div class="art-settings-blob blob-color-1"></div>
                            <svg class="art-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        </div>
                        <span class="art-settings-label">导出聊天记录</span>
                        <button class="art-settings-arrow" @click="exportChatHistory">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="art-settings-item">
                        <div class="art-settings-icon-wrapper">
                            <div class="art-settings-blob blob-color-2"></div>
                            <svg class="art-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </div>
                        <span class="art-settings-label">清空聊天记录</span>
                        <button class="art-settings-arrow" @click="clearChatHistory">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="art-settings-section">
                    <h2 class="art-section-title">对话框管理</h2>
                    <div class="art-settings-item">
                        <div class="art-settings-icon-wrapper">
                            <div class="art-settings-blob blob-color-5"></div>
                            <svg class="art-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <polyline points="21 8 21 21 3 21 3 8"></polyline>
                                <rect x="1" y="3" width="22" height="5"></rect>
                                <line x1="10" y1="12" x2="14" y2="12"></line>
                            </svg>
                        </div>
                        <span class="art-settings-label">存档当前对话</span>
                        <button class="art-settings-arrow" @click="showArchiveDialog = true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="art-settings-item">
                        <div class="art-settings-icon-wrapper">
                            <div class="art-settings-blob blob-color-6"></div>
                            <svg class="art-settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                            </svg>
                        </div>
                        <span class="art-settings-label">查看已存档对话</span>
                        <button class="art-settings-arrow" @click="showArchivedChats = true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="art-save-section">
                    <button class="art-save-btn" @click="saveChatMenuSettings">保存设置</button>
                </div>
                
                <div class="art-bottom-decoration">
                    <svg class="art-decoration-illustration" viewBox="0 0 300 80" fill="none">
                        <path d="M0 80 L40 50 L70 65 L100 35 L140 55 L180 30 L220 50 L260 35 L300 60 L300 80 Z" stroke="#000000" stroke-width="1.5" fill="#FDFDFB"/>
                        <path d="M20 70 L50 45 L80 58 L120 32 L160 48 L200 28 L240 42 L280 30 L300 50 L300 80 L0 80 Z" stroke="#000000" stroke-width="1.5" fill="none"/>
                        <circle cx="250" cy="20" r="10" stroke="#000000" stroke-width="1.5" fill="none"/>
                        <path d="M248 16 L252 24" stroke="#000000" stroke-width="1.5"/>
                        <path d="M248 24 L252 16" stroke="#000000" stroke-width="1.5"/>
                    </svg>
                    <div class="art-version-info">
                        <span>v</span>
                        <span>1</span>
                        <span>.</span>
                        <span>0</span>
                    </div>
                </div>
            </div>
        </div>
</template>

<script>
import { inject } from 'vue';

export default {
    name: 'ChatSettings',
    setup() {
        const globalState = inject('globalState');
        return {
            ...globalState
        };
    }
}
</script>
