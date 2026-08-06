<template>
<!-- Nest App -->
        <div  class="app-view">
            <div class="app-header">
                <button class="back-btn" @click="closeApp"><i class="fas fa-chevron-left"></i></button>
                <span class="app-title">Nest</span>
                <div style="width: 40px;"></div>
            </div>
            <div class="app-content" style="padding: 16px; display:flex; flex-direction:column; gap:12px;">
                <div class="card">
                    <div class="card-title">情侣空间</div>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <input name="sp_field_160" id="sp-field-160" v-model="nest.nestTitle" class="lock-wallpaper-input" placeholder="空间名称">
                        <input name="sp_field_161" id="sp-field-161" v-model="nest.anniversaryDate" type="date" class="lock-wallpaper-input">
                        <textarea name="sp_field_162" id="sp-field-162" v-model="nest.myNote" class="lock-wallpaper-input" style="min-height:64px;" placeholder="今日想对Ta说..."></textarea>
                    </div>
                    <div style="margin-top:10px; font-size:13px; color:#666;">
                        和 {{ nest.partnerName }} 在一起第 {{ nest.daysTogether }} 天 · Love Score {{ nest.loveScore }}
                    </div>
                    <div style="margin-top:8px; display:flex; gap:8px;">
                        <button class="console-btn console-btn-primary" @click="nest.refreshPartnerNote(true)" :disabled="nest.partnerNoteLoading">
                            {{ nest.partnerNoteLoading ? '写日记中...' : '让Ta写今日日记' }}
                        </button>
                        <button class="console-btn console-btn-secondary" @click="nest.addMemoryFromChat" :disabled="!nest.latestChatLine">从最近聊天摘录</button>
                    </div>
                </div>

                <div class="card">
                    <div class="card-title">便签墙</div>
                    <div class="nest-note-wall">
                        <div
                            v-for="note in nest.noteWall"
                            :key="note.id"
                            class="nest-note-card"
                            @click="openNestNote(note)"
                        >
                            <div class="nest-note-date">{{ note.title }}</div>
                            <div class="nest-note-preview">{{ note.text }}</div>
                        </div>
                        <div v-if="nest.noteWall.length === 0" style="font-size:13px; color:#999; padding:10px;">
                            还没有日记，等 Ta 写第一篇吧
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-title">回忆相册</div>
                    <div style="display:flex; gap:8px;">
                        <input name="sp_field_163" id="sp-field-163" v-model="nest.memoryInput" @keyup.enter="nest.addMemory(nest.memoryInput)" class="lock-wallpaper-input" placeholder="记录一个瞬间...">
                        <button class="console-btn console-btn-primary" @click="nest.addMemory(nest.memoryInput)">添加</button>
                    </div>
                    <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px; max-height:180px; overflow:auto;">
                        <div v-for="m in nest.memories" :key="m.id" style="display:flex; justify-content:space-between; gap:8px; padding:8px 10px; border-radius:10px; background:#f6f6f7;">
                            <span style="font-size:13px; color:#333;">{{ m.text }}</span>
                            <button class="console-btn console-btn-secondary" style="padding:4px 8px;" @click="nest.removeMemory(m.id)">删</button>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-title">愿望清单（{{ nest.completedWishCount }}/{{ nest.wishes.length }}）</div>
                    <div style="display:flex; gap:8px;">
                        <input name="sp_field_164" id="sp-field-164" v-model="nest.wishInput" @keyup.enter="nest.addWish" class="lock-wallpaper-input" placeholder="比如：一起看海">
                        <button class="console-btn console-btn-primary" @click="nest.addWish">添加</button>
                    </div>
                    <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px; max-height:160px; overflow:auto;">
                        <label v-for="w in nest.wishes" :key="w.id" style="display:flex; align-items:center; gap:8px; font-size:13px; color:#333;">
                            <input name="sp_field_165" id="sp-field-165" type="checkbox" :checked="w.done" @change="nest.toggleWish(w.id)">
                            <span :style="{ textDecoration: w.done ? 'line-through' : 'none', opacity: w.done ? 0.6 : 1 }">{{ w.text }}</span>
                            <span v-if="nest.pendingReactionTrigger === ('wish:' + w.id)" class="nest-pulse-dot"></span>
                        </label>
                    </div>
                </div>

                <div class="card">
                    <div class="card-title">约会计划（{{ nest.completedPlanCount }}/{{ nest.plans.length }}）</div>
                    <div style="display:flex; gap:8px;">
                        <input name="sp_field_166" id="sp-field-166" v-model="nest.planInput" class="lock-wallpaper-input" placeholder="计划内容">
                        <input name="sp_field_167" id="sp-field-167" v-model="nest.planDateInput" type="date" class="lock-wallpaper-input" style="max-width:140px;">
                        <button class="console-btn console-btn-primary" @click="nest.addPlan">加</button>
                    </div>
                    <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px; max-height:180px; overflow:auto;">
                        <label v-for="p in nest.plans" :key="p.id" style="display:flex; align-items:center; gap:8px; font-size:13px; color:#333; padding:6px 0;">
                            <input name="sp_field_168" id="sp-field-168" type="checkbox" :checked="p.done" @change="nest.togglePlan(p.id)">
                            <span :style="{ textDecoration: p.done ? 'line-through' : 'none', opacity: p.done ? 0.6 : 1 }">{{ p.date }} · {{ p.text }}</span>
                            <span v-if="nest.pendingReactionTrigger === ('plan:' + p.id)" class="nest-pulse-dot"></span>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <!-- Nest 便签放大弹窗 -->
        <div v-if="showNestNoteModal && selectedNestNote" class="call-diary-modal" @click.self="closeNestNoteModal">
            <div class="call-diary-panel">
                <div class="call-diary-header">
                    <strong>{{ selectedNestNote.title }}</strong>
                    <button class="call-diary-close" @click="closeNestNoteModal"><i class="fas fa-times"></i></button>
                </div>
                <div class="call-diary-body">{{ selectedNestNote.text }}</div>
            </div>
        </div>

        <div v-if="showCallDiaryModal && selectedCallDiary" class="call-diary-modal" @click.self="closeCallDiaryModal">
            <div class="call-diary-panel">
                <div class="call-diary-header">
                    <strong>{{ callDiaryTitle }}</strong>
                    <button class="call-diary-close" @click="closeCallDiaryModal"><i class="fas fa-times"></i></button>
                </div>
                <div class="call-diary-meta">
                    <span>{{ selectedCallDiary.name }}</span>
                    <span>{{ selectedCallDiary.callType === 'video' ? '视频通话' : '语音通话' }}</span>
                    <span>{{ selectedCallDiary.duration }}</span>
                    <span>{{ new Date(selectedCallDiary.createdAt).toLocaleDateString('zh-CN') }}</span>
                </div>
                <div class="call-diary-body" :class="{ 'long-form': (selectedCallDiary.body || '').length > 260 }">{{ selectedCallDiary.body }}</div>
            </div>
        </div>

        <!-- 多渠道生图高级生成设定 Modal -->
        <div v-if="showImageGenSettingsModal && imageGenConfig" class="art-savearchive-overlay" @click.self="showImageGenSettingsModal = false">
            <div class="art-savearchive-panel novelai-modal-panel">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 10px;">
                    <div style="font-family: 'Georgia', 'Songti SC', serif; font-size: 17px; font-weight: bold; color: #333;">生图高级生成设定</div>
                    <i class="fas fa-times" @click="showImageGenSettingsModal = false" style="cursor: pointer; font-size: 18px; color: #888;"></i>
                </div>

                <!-- 渠道切换 Tab bar -->
                <div class="image-gen-modal-tabs" style="display: flex; gap: 6px; margin-bottom: 14px; overflow-x: auto; padding-bottom: 4px;">
                    <button class="channel-chip" style="padding: 5px 10px; font-size: 12px;" :class="{ active: imageGenModalTab === 'pollinations' }" @click="imageGenModalTab = 'pollinations'">
                        <i class="fas fa-leaf"></i> Pollinations
                    </button>
                    <button class="channel-chip" style="padding: 5px 10px; font-size: 12px;" :class="{ active: imageGenModalTab === 'novelai' }" @click="imageGenModalTab = 'novelai'">
                        <i class="fas fa-paint-brush"></i> NovelAI
                    </button>
                    <button class="channel-chip" style="padding: 5px 10px; font-size: 12px;" :class="{ active: imageGenModalTab === 'openai' }" @click="imageGenModalTab = 'openai'">
                        <i class="fas fa-robot"></i> DALL-E
                    </button>
                    <button class="channel-chip" style="padding: 5px 10px; font-size: 12px;" :class="{ active: imageGenModalTab === 'gemini' }" @click="imageGenModalTab = 'gemini'">
                        <i class="fas fa-sparkles"></i> Gemini
                    </button>
                    <button class="channel-chip" style="padding: 5px 10px; font-size: 12px;" :class="{ active: imageGenModalTab === 'custom' }" @click="imageGenModalTab = 'custom'">
                        <i class="fas fa-sliders-h"></i> 自定义
                    </button>
                </div>

                <div style="max-height: 60vh; overflow-y: auto; padding-right: 6px;">

                    <!-- 1. Pollinations 参数 -->
                    <div v-if="imageGenModalTab === 'pollinations'">
                        <div class="console-form-group">
                            <label class="console-label">图像尺寸 (Width x Height)</label>
                            <div style="display: flex; gap: 8px;">
                                <input type="number" class="console-input" placeholder="宽" v-model.number="imageGenConfig.pollinations.width" style="flex: 1;">
                                <span style="align-self: center;">x</span>
                                <input type="number" class="console-input" placeholder="高" v-model.number="imageGenConfig.pollinations.height" style="flex: 1;">
                            </div>
                        </div>
                        <div class="console-form-group">
                            <label class="console-label">模型选择 (Model)</label>
                            <select class="console-select" v-model="imageGenConfig.pollinations.model">
                                <option value="flux">FLUX.1 (推荐 - 高清通用)</option>
                                <option value="flux-realism">FLUX Realism (真实写实)</option>
                                <option value="any-dark">Any Dark (暗黑二次元)</option>
                                <option value="turbo">Turbo (极速)</option>
                            </select>
                        </div>
                        <div class="console-form-group">
                            <label class="console-label">随机种子 (Seed)</label>
                            <input type="number" class="console-input" placeholder="-1 表示随机" v-model.number="imageGenConfig.pollinations.seed">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 10px; margin: 12px 0; background: rgba(0,0,0,0.03); padding: 12px; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 13px; font-weight: 500;">No Logo (隐去水印)</span>
                                <div class="setting-toggle" @click="imageGenConfig.pollinations.nologo = !imageGenConfig.pollinations.nologo">
                                    <div class="toggle-slider" :class="{ active: imageGenConfig.pollinations.nologo }">
                                        <div class="toggle-thumb"></div>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 13px; font-weight: 500;">Enhance Prompt (GPT 自动扩写提示词)</span>
                                <div class="setting-toggle" @click="imageGenConfig.pollinations.enhance = !imageGenConfig.pollinations.enhance">
                                    <div class="toggle-slider" :class="{ active: imageGenConfig.pollinations.enhance }">
                                        <div class="toggle-thumb"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="console-form-group">
                            <label class="console-label">默认正面提示词 (Positive Prompts)</label>
                            <textarea class="console-input" rows="2" v-model="imageGenConfig.pollinations.positivePrompt"></textarea>
                        </div>
                    </div>

                    <!-- 2. NovelAI 参数 -->
                    <div v-else-if="imageGenModalTab === 'novelai'">
                        <div class="console-form-group">
                            <label class="console-label">图像尺寸 (Width x Height)</label>
                            <div style="display: flex; gap: 8px;">
                                <input type="number" step="64" class="console-input" placeholder="宽 (建议64的倍数)" v-model.number="imageGenConfig.novelai.width" style="flex: 1;">
                                <span style="align-self: center;">x</span>
                                <input type="number" step="64" class="console-input" placeholder="高 (建议64的倍数)" v-model.number="imageGenConfig.novelai.height" style="flex: 1;">
                            </div>
                        </div>
                        <div class="console-form-group">
                            <label class="console-label">采样步数 (Steps): {{ imageGenConfig.novelai.steps }}</label>
                            <input type="range" class="console-slider" min="1" max="50" step="1" v-model.number="imageGenConfig.novelai.steps">
                        </div>
                        <div class="console-form-group">
                            <label class="console-label">提示词相关性 (CFG Scale): {{ imageGenConfig.novelai.cfgScale }}</label>
                            <input type="range" class="console-slider" min="1" max="20" step="0.5" v-model.number="imageGenConfig.novelai.cfgScale">
                        </div>
                        <div class="console-form-group">
                            <label class="console-label">采样器 (Sampler)</label>
                            <select class="console-select" v-model="imageGenConfig.novelai.sampler">
                                <option value="k_euler">Euler (标准极速)</option>
                                <option value="k_dpmpp_2m">DPM++ 2M (推荐 - 细节丰富)</option>
                                <option value="k_dpmpp_sde">DPM++ SDE (艺术质感)</option>
                                <option value="ddim">DDIM</option>
                            </select>
                        </div>
                        <div class="console-form-group">
                            <label class="console-label">噪声调度 (Noise Schedule)</label>
                            <select class="console-select" v-model="imageGenConfig.novelai.noiseSchedule">
                                <option value="karras">Karras (推荐 - 平滑质感)</option>
                                <option value="native">Native (原生)</option>
                                <option value="exponential">Exponential</option>
                            </select>
                        </div>
                        <div class="console-form-group">
                            <label class="console-label">随机种子 (Seed)</label>
                            <input type="number" class="console-input" placeholder="-1 表示随机" v-model.number="imageGenConfig.novelai.seed">
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 10px; margin: 12px 0; background: rgba(0,0,0,0.03); padding: 12px; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 13px; font-weight: 500;">Quality Tags (优质画质词开关)</span>
                                <div class="setting-toggle" @click="imageGenConfig.novelai.qualityTags = !imageGenConfig.novelai.qualityTags">
                                    <div class="toggle-slider" :class="{ active: imageGenConfig.novelai.qualityTags }">
                                        <div class="toggle-thumb"></div>
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-size: 13px; font-weight: 500;">Variety+ (增强画面多样性)</span>
                                <div class="setting-toggle" @click="imageGenConfig.novelai.variety = !imageGenConfig.novelai.variety">
                                    <div class="toggle-slider" :class="{ active: imageGenConfig.novelai.variety }">
                                        <div class="toggle-thumb"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- 画风参考 (Vibe Transfer / 垫图 / 解析 naiv4vibe) 卡片区块 -->
                        <div style="margin: 14px 0; background: rgba(108,92,231,0.05); border: 1px dashed rgba(108,92,231,0.25); padding: 12px; border-radius: 10px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <div style="font-size: 13px; font-weight: 600; color: #4834d4;">
                                    <i class="fas fa-image" style="margin-right: 4px;"></i> 画风参考 (Vibe Transfer)
                                </div>
                                <div class="setting-toggle" @click="imageGenConfig.novelai.vibeTransfer.enabled = !imageGenConfig.novelai.vibeTransfer.enabled">
                                    <div class="toggle-slider" :class="{ active: imageGenConfig.novelai.vibeTransfer.enabled }">
                                        <div class="toggle-thumb"></div>
                                    </div>
                                </div>
                            </div>
                            <div style="font-size: 11px; color: #666; margin-bottom: 10px; line-height: 1.4;">
                                支持上传图片或直接导入 NovelAI 专属 <strong>.naiv4vibe</strong> 垫图文件，精确提取与融合画风及色彩。
                            </div>

                            <!-- 上传/导入/移除按钮组 -->
                            <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
                                <label class="console-btn console-btn-secondary" style="margin: 0; font-size: 11px; padding: 6px 10px; cursor: pointer;">
                                    <i class="fas fa-upload"></i> 上传参考图
                                    <input type="file" accept="image/*,.naiv4vibe" style="display: none;" @change="e => e.target.files[0] && handleVibeFileUpload(e.target.files[0])">
                                </label>
                                <label class="console-btn console-btn-secondary" style="margin: 0; font-size: 11px; padding: 6px 10px; cursor: pointer;">
                                    <i class="fas fa-file-import"></i> 导入 naiv4vibe 文件
                                    <input type="file" accept=".naiv4vibe,application/json,image/*" style="display: none;" @change="e => e.target.files[0] && handleVibeFileUpload(e.target.files[0])">
                                </label>
                                <button v-if="imageGenConfig.novelai.vibeTransfer.imageUrl" class="console-btn console-btn-danger" style="margin: 0; font-size: 11px; padding: 6px 10px;" @click="removeVibeImage">
                                    <i class="fas fa-trash-alt"></i> 移除参考图
                                </button>
                            </div>

                            <!-- 缩略图预览 -->
                            <div v-if="imageGenConfig.novelai.vibeTransfer.imageUrl" style="margin-bottom: 10px; text-align: center; background: rgba(0,0,0,0.03); padding: 8px; border-radius: 6px;">
                                <img :src="imageGenConfig.novelai.vibeTransfer.imageUrl" style="max-height: 120px; max-width: 100%; border-radius: 6px; border: 1px solid rgba(0,0,0,0.15); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            </div>

                            <!-- 滑块：画风强度 -->
                            <div v-if="imageGenConfig.novelai.vibeTransfer.enabled" class="console-form-group" style="margin-bottom: 8px;">
                                <label class="console-label" style="font-size: 12px;">画风强度 (Strength): {{ imageGenConfig.novelai.vibeTransfer.strength }}</label>
                                <input type="range" class="console-slider" min="0.1" max="1.0" step="0.05" v-model.number="imageGenConfig.novelai.vibeTransfer.strength">
                                <div style="font-size: 11px; color: #999;">推荐值 0.5 - 0.7（控制融合参考图风味的比例）</div>
                            </div>

                            <!-- 滑块：信息提取度 -->
                            <div v-if="imageGenConfig.novelai.vibeTransfer.enabled" class="console-form-group" style="margin-bottom: 0;">
                                <label class="console-label" style="font-size: 12px;">信息提取度 (Information Extracted): {{ imageGenConfig.novelai.vibeTransfer.infoExtracted || 1.0 }}</label>
                                <input type="range" class="console-slider" min="0.1" max="1.0" step="0.05" v-model.number="imageGenConfig.novelai.vibeTransfer.infoExtracted">
                            </div>
                        </div>

                        <div class="console-form-group">
                            <label class="console-label">默认正面提示词 (Positive Prompts)</label>
                            <textarea class="console-input" rows="2" v-model="imageGenConfig.novelai.positivePrompt"></textarea>
                        </div>
                        <div class="console-form-group">
                            <label class="console-label">默认反向提示词 (Negative Prompts)</label>
                            <textarea class="console-input" rows="2" v-model="imageGenConfig.novelai.negativePrompt"></textarea>
                        </div>
                    </div>

                    <!-- 3. OpenAI DALL-E 参数 -->
                    <div v-else-if="imageGenModalTab === 'openai'">
                        <div class="console-form-group">
                            <label class="console-label">生图模型 (Model)</label>
                            <div style="display: flex; gap: 8px;">
                                <select class="console-select" v-model="imageGenConfig.openai.model" style="flex: 1;">
                                    <option v-for="model in imageGenConfig.openai.availableModels" :key="model.id" :value="model.id">{{ model.id }}</option>
                                </select>
                                <button class="console-btn console-btn-secondary" @click.stop.prevent="fetchOpenAiModels" :disabled="fetchingOpenAiModels">
                                    <i class="fas" :class="fetchingOpenAiModels ? 'fa-spinner fa-spin' : 'fa-sync'"></i>
                                    {{ fetchingOpenAiModels ? '拉取中' : '拉取' }}
                                </button>
                            </div>
                        </div>
                        <div class="console-form-group">
                            <label class="console-label">图像尺寸 (Width x Height)</label>
                            <div style="display: flex; gap: 8px;">
                                <input type="number" class="console-input" placeholder="宽" v-model.number="imageGenConfig.openai.width" style="flex: 1;">
                                <span style="align-self: center;">x</span>
                                <input type="number" class="console-input" placeholder="高" v-model.number="imageGenConfig.openai.height" style="flex: 1;">
                            </div>
                        </div>
                        <div class="console-form-group">
                            <label class="console-label">默认正向提示词 (Positive Prompts)</label>
                            <textarea class="console-input" rows="2" v-model="imageGenConfig.openai.positivePrompt"></textarea>
                        </div>
                        <div class="console-form-group">
                            <label class="console-label">默认反向提示词 (Negative Prompts - 以 Avoid: 附加)</label>
                            <textarea class="console-input" rows="2" v-model="imageGenConfig.openai.negativePrompt"></textarea>
                        </div>
                    </div>

                    <!-- 4. Gemini Imagen 参数 -->
                    <div v-else-if="imageGenModalTab === 'gemini'">
                        <div class="console-form-group">
                            <label class="console-label">Imagen 模型 (Model)</label>
                            <select class="console-select" v-model="imageGenConfig.gemini.model">
                                <option value="imagen-3.0-generate-002">Imagen 3.0 Generate 002 (推荐)</option>
                                <option value="imagen-3.0-fast-generate-001">Imagen 3.0 Fast Generate</option>
                            </select>
                        </div>
                        <div class="console-form-group">
                            <label class="console-label">画幅比例 (Aspect Ratio)</label>
                            <select class="console-select" v-model="imageGenConfig.gemini.aspectRatio">
                                <option value="1:1">1:1 (正方形)</option>
                                <option value="3:4">3:4 (竖屏)</option>
                                <option value="4:3">4:3 (横屏)</option>
                                <option value="9:16">9:16 (手机全屏)</option>
                                <option value="16:9">16:9 (宽屏)</option>
                            </select>
                        </div>
                    </div>

                    <!-- 5. 自定义 / 反代 参数 -->
                    <div v-else-if="imageGenModalTab === 'custom'">
                        <div class="console-form-group">
                            <label class="console-label">默认尺寸 (Width x Height)</label>
                            <div style="display: flex; gap: 8px;">
                                <input type="number" class="console-input" placeholder="宽" v-model.number="imageGenConfig.custom.width" style="flex: 1;">
                                <span style="align-self: center;">x</span>
                                <input type="number" class="console-input" placeholder="高" v-model.number="imageGenConfig.custom.height" style="flex: 1;">
                            </div>
                        </div>
                        <div class="console-form-group">
                            <label class="console-label">模型名称 (Model)</label>
                            <input type="text" class="console-input" placeholder="dall-e-3 / sd-webui" v-model="imageGenConfig.custom.model">
                        </div>
                        <div class="console-form-group">
                            <label class="console-label">默认正面提示词 (Positive Prompts)</label>
                            <textarea class="console-input" rows="2" v-model="imageGenConfig.custom.positivePrompt"></textarea>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 10px; margin-top: 16px;">
                    <button class="art-savearchive-btn art-savearchive-btn-cancel" @click="resetImageGenConfig" style="flex: 1;">恢复默认</button>
                    <button class="art-savearchive-btn art-savearchive-btn-save" @click="saveImageGenConfig(); showImageGenSettingsModal = false" style="flex: 2;">保存设置</button>
                </div>
            </div>
        </div>

        <!-- 照片小组件文字编辑对话框 -->
        
</template>

<script>
import { inject } from 'vue';

export default {
    name: 'NestApp',
    setup() {
        const state = inject('globalState');
        return state;
    }
}
</script>
