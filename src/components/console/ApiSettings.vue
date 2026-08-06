<template>
<!-- API配置卡片 -->
                <div class="card console-card">
                    <div class="card-header console-card-header">
                        <i class="fas fa-server"></i>
                        <span>API 配置</span>
                    </div>
                    <div class="console-card-body">
                        <div class="console-profile-list">
                            <div v-for="profile in profiles" :key="profile.id" class="console-profile-item" :class="{ active: activeProfileId === profile.id }">
                                <div class="console-profile-info">
                                    <div class="console-profile-name">{{ profile.name }}</div>
                                    <div class="console-profile-endpoint">{{ profile.endpoint || '未填写地址' }}</div>
                                </div>
                                <div class="console-profile-actions">
                                    <span v-if="activeProfileId === profile.id" class="console-active-badge">
                                        <i class="fas fa-check-circle"></i> 当前
                                    </span>
                                    <button v-else class="console-btn console-btn-small console-btn-activate" @click="setActiveProfile(profile.id)">
                                        <i class="fas fa-play"></i> 激活
                                    </button>
                                    <button class="console-btn console-btn-small console-btn-danger" @click="deleteProfile(profile.id)">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
                            <div v-if="profiles.length === 0" class="console-empty-state">
                                <i class="fas fa-plug"></i>
                                <span>暂无配置，请添加</span>
                            </div>
                        </div>
                    </div>
                    <div class="console-card-footer">
                        <button class="console-btn console-btn-primary console-btn-full" @click="createNewProfile">
                            <i class="fas fa-plus"></i> 新建配置
                        </button>
                    </div>
                </div>

                <!-- 当前配置编辑卡片 -->
                <div class="card console-card" v-if="activeProfile">
                    <div class="card-header console-card-header">
                        <i class="fas fa-edit"></i>
                        <span>当前配置</span>
                    </div>
                    <div class="console-card-body">
                        <div class="console-form">
                            <div class="console-form-group">
                                <label class="console-label">
                                    <i class="fas fa-tag"></i> 配置名称
                                </label>
                                <input name="sp_field_138" id="sp-field-138" type="text" class="console-input" placeholder="输入配置名称" v-model="activeProfile.name">
                            </div>
                            <div class="console-form-group">
                                <label class="console-label">
                                    <i class="fas fa-link"></i> API 地址
                                </label>
                                <input name="sp_field_139" id="sp-field-139" type="text" class="console-input" placeholder="https://api.example.com/v1" v-model="activeProfile.endpoint">
                            </div>
                            <div class="console-form-group">
                                <label class="console-label">
                                    <i class="fas fa-key"></i> API Key
                                </label>
                                <input name="sp_field_140" id="sp-field-140" type="password" class="console-input" placeholder="输入 API Key" v-model="activeProfile.key">
                            </div>
                            <div class="console-form-group">
                                <label class="console-label">
                                    <i class="fas fa-brain"></i> 模型
                                </label>
                                <div class="console-model-select">
                                    <select name="sp_field_141" id="sp-field-141" class="console-select" v-model="activeProfile.model">
                                        <option value="">选择模型</option>
                                        <option v-for="model in availableModels" :key="model.id" :value="model.id">{{ model.id }}</option>
                                    </select>
                                    <button class="console-btn console-btn-secondary" @click="fetchModels" :disabled="fetchingModels">
                                        <i class="fas" :class="fetchingModels ? 'fa-spinner fa-spin' : 'fa-sync'"></i>
                                        {{ fetchingModels ? '获取中' : '获取' }}
                                    </button>
                                </div>
                            </div>
                            <div class="console-form-group">
                                <label class="console-label">
                                    <i class="fas fa-thermometer-half"></i> 温度 (Temperature)
                                    <span class="temperature-value">{{ activeProfile.temperature !== undefined ? activeProfile.temperature : 0.7 }}</span>
                                </label>
                                <input name="sp_field_142" id="sp-field-142" type="range" class="console-slider" min="0" max="2" step="0.1" v-model.number="activeProfile.temperature">
                                <div class="temperature-hint">
                                    <span class="hint-label">保守</span>
                                    <span class="hint-desc">控制AI回复的随机性。较低值使回复更确定、一致；较高值使回复更有创意、多样。</span>
                                    <span class="hint-label">创意</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="console-card-footer">
                        <button class="console-btn console-btn-primary console-btn-full" @click="saveProfiles">
                            <i class="fas fa-save"></i> 保存配置
                        </button>
                    </div>
                </div>

                </template>

<script>
import { inject } from 'vue';

export default {
    name: 'ApiSettings',
    setup() {
        return inject('globalState');
    }
}
</script>
