<template>
<!-- 图像生成配置卡片 -->
                <div class="card console-card" v-if="imageGenConfig">
                    <div class="card-header console-card-header" style="justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fas fa-magic" style="color: #6c5ce7;"></i>
                            <span>图像生成配置</span>
                        </div>
                        <div class="setting-toggle" @click="imageGenConfig.enabled = !imageGenConfig.enabled">
                            <div class="toggle-slider" :class="{ active: imageGenConfig.enabled }">
                                <div class="toggle-thumb"></div>
                            </div>
                        </div>
                    </div>
                    <div class="console-card-body" v-if="imageGenConfig.enabled">
                        <div class="console-form">
                            <!-- 基础选项开关 -->
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed rgba(0,0,0,0.08);">
                                <div>
                                    <div style="font-size: 14px; font-weight: 600; color: #333;"><i class="fas fa-book-open" style="color: #6c5ce7; margin-right: 4px;"></i> 读取生图世界书 / 角色设定</div>
                                    <div style="font-size: 12px; color: #888;">提示词自动融合当前聊天的角色外貌与场景描述</div>
                                </div>
                                <div class="setting-toggle" @click="imageGenConfig.readWorldBook = !imageGenConfig.readWorldBook">
                                    <div class="toggle-slider" :class="{ active: imageGenConfig.readWorldBook }">
                                        <div class="toggle-thumb"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- 生图渠道切换标签页 -->
                            <div class="console-form-group" style="margin-top: 12px;">
                                <label class="console-label"><i class="fas fa-network-wired"></i> 生图服务渠道 (Active Channel)</label>
                                <div class="image-gen-channel-grid">
                                    <button class="channel-chip" :class="{ active: imageGenConfig.activeChannel === 'pollinations' }" @click="imageGenConfig.activeChannel = 'pollinations'">
                                        <i class="fas fa-leaf"></i> Pollinations (免费)
                                    </button>
                                    <button class="channel-chip" :class="{ active: imageGenConfig.activeChannel === 'novelai' }" @click="imageGenConfig.activeChannel = 'novelai'">
                                        <i class="fas fa-paint-brush"></i> NovelAI
                                    </button>
                                    <button class="channel-chip" :class="{ active: imageGenConfig.activeChannel === 'openai' }" @click="imageGenConfig.activeChannel = 'openai'">
                                        <i class="fas fa-robot"></i> OpenAI (DALL-E)
                                    </button>
                                    <button class="channel-chip" :class="{ active: imageGenConfig.activeChannel === 'gemini' }" @click="imageGenConfig.activeChannel = 'gemini'">
                                        <i class="fas fa-sparkles"></i> Gemini / Imagen
                                    </button>
                                    <button class="channel-chip" :class="{ active: imageGenConfig.activeChannel === 'custom' }" @click="imageGenConfig.activeChannel = 'custom'">
                                        <i class="fas fa-sliders-h"></i> 自定义 / 反代
                                    </button>
                                </div>
                            </div>

                            <!-- Pollinations 详情 -->
                            <div v-if="imageGenConfig.activeChannel === 'pollinations'" class="channel-config-panel">
                                <div class="console-form-group">
                                    <label class="console-label">模型选择</label>
                                    <select class="console-select" v-model="imageGenConfig.pollinations.model">
                                        <option value="flux">FLUX.1 (推荐 - 极高清)</option>
                                        <option value="flux-realism">FLUX Realism (写实风格)</option>
                                        <option value="any-dark">Any Dark (暗黑二次元)</option>
                                        <option value="turbo">Turbo (极速模式)</option>
                                    </select>
                                </div>
                                <div style="font-size: 12px; color: #10ac84; background: rgba(16,172,132,0.1); padding: 8px 12px; border-radius: 6px; margin-bottom: 10px;">
                                    <i class="fas fa-check-circle"></i> 免 Key 渠道：无需填写任何 API Key，开箱即可免费出图！
                                </div>
                                <button class="console-btn console-btn-secondary console-btn-full" @click="openImageGenSettingsModal('pollinations')">
                                    <i class="fas fa-sliders-h"></i> 调整 Pollinations 高级生成设定 ({{ imageGenConfig.pollinations.width }}x{{ imageGenConfig.pollinations.height }} >)
                                </button>
                            </div>

                            <!-- NovelAI 详情 -->
                            <div v-else-if="imageGenConfig.activeChannel === 'novelai'" class="channel-config-panel">
                                <div class="console-form-group">
                                    <label class="console-label">NovelAI API Key / Token</label>
                                    <input type="password" class="console-input" placeholder="输入 NovelAI Bearer Token" v-model="imageGenConfig.novelai.apiKey">
                                </div>
                                <div class="console-form-group">
                                    <label class="console-label">连线方式</label>
                                    <select class="console-select" v-model="imageGenConfig.novelai.endpointType">
                                        <option value="official">官方主节点 (https://image.novelai.net)</option>
                                        <option value="official_api">官方备用节点 (https://api.novelai.net)</option>
                                        <option value="proxy">自定义中转 / 反代 URL</option>
                                    </select>
                                </div>
                                <div class="console-form-group" v-if="imageGenConfig.novelai.endpointType === 'proxy'">
                                    <label class="console-label">反代地址 (Proxy URL)</label>
                                    <input type="text" class="console-input" placeholder="https://your-proxy.com/ai/generate-image" v-model="imageGenConfig.novelai.proxyUrl">
                                </div>
                                <div class="console-form-group">
                                    <label class="console-label">生图模型</label>
                                    <select class="console-select" v-model="imageGenConfig.novelai.model">
                                        <option value="nai-diffusion-4-5-full">nai-diffusion-4-5-full (V4.5 Full 推荐)</option>
                                        <option value="nai-diffusion-4-5-curated">nai-diffusion-4-5-curated (V4.5 Curated)</option>
                                        <option value="nai-diffusion-4-full">nai-diffusion-4-full (V4 Full)</option>
                                        <option value="nai-diffusion-4-curated-preview">nai-diffusion-4-curated-preview (V4 Curated)</option>
                                        <option value="nai-diffusion-3">nai-diffusion-3 (V3 Anime)</option>
                                        <option value="furry-diffusion-3">furry-diffusion-3 (V3 Furry)</option>
                                    </select>
                                </div>
                                <button class="console-btn console-btn-secondary console-btn-full" @click="openImageGenSettingsModal('novelai')" style="margin-bottom: 10px;">
                                    <i class="fas fa-sliders-h"></i> 调整 NovelAI 高级生成设定 ({{ imageGenConfig.novelai.width }}x{{ imageGenConfig.novelai.height }} >)
                                </button>
                            </div>

                            <!-- OpenAI DALL-E 详情 -->
                            <div v-else-if="imageGenConfig.activeChannel === 'openai'" class="channel-config-panel">
                                <div class="console-form-group">
                                    <label class="console-label">API Key</label>
                                    <input type="password" class="console-input" placeholder="sk-..." v-model="imageGenConfig.openai.apiKey">
                                </div>
                                <div class="console-form-group">
                                    <label class="console-label">API Base URL</label>
                                    <input type="text" class="console-input" placeholder="https://api.openai.com/v1" v-model="imageGenConfig.openai.endpoint">
                                </div>
                                <div class="console-form-group">
                                    <label class="console-label">模型</label>
                                    <div style="display: flex; gap: 8px;">
                                        <select class="console-select" v-model="imageGenConfig.openai.model" style="flex: 1;">
                                            <option v-for="model in imageGenConfig.openai.availableModels" :key="model.id" :value="model.id">{{ model.id }}</option>
                                        </select>
                                        <button class="console-btn console-btn-secondary" @click.stop.prevent="fetchOpenAiModels" :disabled="fetchingOpenAiModels">
                                            <i class="fas" :class="fetchingOpenAiModels ? 'fa-spinner fa-spin' : 'fa-sync'"></i>
                                        </button>
                                    </div>
                                </div>
                                <button class="console-btn console-btn-secondary console-btn-full" @click="openImageGenSettingsModal('openai')">
                                    <i class="fas fa-sliders-h"></i> 调整 OpenAI 高级生成设定 ({{ imageGenConfig.openai.width }}x{{ imageGenConfig.openai.height }} >)
                                </button>
                            </div>

                            <!-- Gemini 详情 -->
                            <div v-else-if="imageGenConfig.activeChannel === 'gemini'" class="channel-config-panel">
                                <div class="console-form-group">
                                    <label class="console-label">Google Gemini API Key</label>
                                    <input type="password" class="console-input" placeholder="输入 Gemini API Key" v-model="imageGenConfig.gemini.apiKey">
                                </div>
                                <button class="console-btn console-btn-secondary console-btn-full" @click="openImageGenSettingsModal('gemini')">
                                    <i class="fas fa-sliders-h"></i> 调整 Gemini Imagen 高级生成设定 ({{ imageGenConfig.gemini.aspectRatio }} >)
                                </button>
                            </div>

                            <!-- 自定义 详情 -->
                            <div v-else-if="imageGenConfig.activeChannel === 'custom'" class="channel-config-panel">
                                <div class="console-form-group">
                                    <label class="console-label">自定义 API Endpoint</label>
                                    <input type="text" class="console-input" placeholder="https://api.example.com/v1" v-model="imageGenConfig.custom.endpoint">
                                </div>
                                <div class="console-form-group">
                                    <label class="console-label">API Key (可选)</label>
                                    <input type="password" class="console-input" placeholder="sk-..." v-model="imageGenConfig.custom.apiKey">
                                </div>
                                <button class="console-btn console-btn-secondary console-btn-full" @click="openImageGenSettingsModal('custom')">
                                    <i class="fas fa-sliders-h"></i> 调整 自定义高级生成设定 ({{ imageGenConfig.custom.width }}x{{ imageGenConfig.custom.height }} >)
                                </button>
                            </div>

                            <!-- 测试生图区 -->
                            <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(0,0,0,0.08);">
                                <label class="console-label"><i class="fas fa-flask"></i> 测试生成画作</label>
                                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                                    <input type="text" class="console-input" placeholder="输入测试 Prompt..." v-model="testPromptInput" style="flex: 1;">
                                    <button class="console-btn console-btn-primary" @click="testGenerateImage" :disabled="isGeneratingTestImage" style="white-space: nowrap;">
                                        <i class="fas" :class="isGeneratingTestImage ? 'fa-spinner fa-spin' : 'fa-magic'"></i> {{ isGeneratingTestImage ? '生图中...' : '测试生图' }}
                                    </button>
                                </div>
                                <div v-if="testImageResult" class="image-gen-test-preview">
                                    <img :src="testImageResult" alt="Test Result" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin-top: 8px;">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="console-card-footer" v-if="imageGenConfig.enabled">
                        <button class="console-btn console-btn-primary console-btn-full" @click="saveImageGenConfig">
                            <i class="fas fa-save"></i> 保存生图配置
                        </button>
                    </div>
                </div>

                </template>

<script>
import { inject } from 'vue';

export default {
    name: 'ImageGenSettings',
    setup() {
        return inject('globalState');
    }
}
</script>
