<template>
<div class="home-page home-page-left-peek" :class="{ 'active': currentPage === 0 }">
                        <div class="grid-6x4">
                            <div class="grid-cell grid-row-1-6 left-peek-cell">
                                <div class="left-peek-container" :class="{ dark: peek.peekDark }">
                                    <div class="left-peek-toolbar">
                                        <select name="sp_field_1" id="sp-field-1" class="left-peek-select" :value="peek.peekSelectedCharacterId" @change="peek.selectPeekCharacter($event.target.value)">
                                            <option value="">选择角色手机</option>
                                            <option v-for="char in (characters || []).filter(Boolean)" :key="char?.id || char?.name || 'char-item'" :value="char?.id">
                                                {{ char?.nickname || char?.name || '未命名' }}
                                            </option>
                                        </select>
                                        <button class="left-peek-ai-btn" @click="peek.generatePeekLinkedData()" :disabled="peek.peekAiGenerating" title="联动生成">
                                            <i class="fas" :class="peek.peekAiGenerating ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'"></i>
                                        </button>
                                    </div>
                                    <div v-if="!peek.peekSelectedCharacter" class="left-peek-empty">
                                        选择角色查看其手机
                                    </div>
                                    <div v-else class="left-peek-hero" style="display: none;">
                                        <img class="left-peek-hero-avatar" :src="peek.peekSelectedCharacter.avatarUrl || 'https://placehold.co/160x160?text=Avatar'" :alt="peek.peekSelectedCharacter.nickname || peek.peekSelectedCharacter.name || '角色头像'" />
                                        <div class="left-peek-hero-copy">
                                            <div class="left-peek-hero-name">{{ peek.peekSelectedCharacter.nickname || peek.peekSelectedCharacter.name }}</div>
                                            <div class="left-peek-hero-meta">{{ peek.peekSelectedCharacter.persona || peek.peekSelectedCharacter.summary || '角色手机预览' }}</div>
                                        </div>
                                    </div>
                                    <div v-if="peek.peekSelectedCharacter" class="left-peek-phone-wrap">
                                        <div class="left-peek-phone-frame">
                                            <div class="left-peek-side-buttons left">
                                                <span class="side-btn volume-up"></span>
                                                <span class="side-btn volume-down"></span>
                                            </div>
                                            <div class="left-peek-side-buttons right">
                                                <span class="side-btn power"></span>
                                            </div>
                                            <div class="left-peek-notch"></div>
                                            <div class="left-peek-screen peek-phone-screen" :class="{ dark: peek.peekDark }">
                                                <!-- 新增：抓包推送通知 -->
                                                <div class="peek-push-notification" :class="{ 'show': peek.showCaughtNotification }" @click="peek.dismissCaughtNotification">
                                                    <div class="peek-push-header">
                                                        <div class="peek-push-app"><i class="fab fa-weixin" style="color: #07c160;"></i> 微信</div>
                                                        <div class="peek-push-time">现在</div>
                                                    </div>
                                                    <div class="peek-push-content">
                                                        <div class="peek-push-title">{{ peek.peekSelectedCharacter?.nickname || peek.peekSelectedCharacter?.name || 'TA' }}</div>
                                                        <div class="peek-push-text">{{ peek.caughtNotificationText }}</div>
                                                    </div>
                                                </div>
                                                <div v-if="peek.peekLocked" class="peek-lockscreen" @click="peek.peekLocked = false" style="cursor: pointer; position: relative;">
                                                    <div class="peek-lock-bg" :style="{ backgroundImage: 'url(' + (peek.peekSelectedCharacter?.avatarUrl || 'https://placehold.co/400x800?text=Wallpaper') + ')' }" style="position: absolute; inset: 0; background-size: cover; background-position: center; filter: blur(20px) brightness(0.7); transform: scale(1.1); z-index: 1;"></div>
                                                    <div class="peek-lock-time-wrap" style="z-index: 2; position: relative; margin-top: 40px;">
                                                        <div class="lock-time" style="display: flex; flex-direction: column; align-items: center; text-shadow: 0 4px 20px rgba(0,0,0,0.6);">
                                                            <div class="lock-clock" style="font-size: 20px; opacity: 0.8;"><i class="fas fa-lock"></i></div>
                                                            <div class="lock-date" style="font-size: 72px; font-weight: 800; letter-spacing: -2px; margin-top:10px; line-height: 1;">{{ peek.peekStatusTime }}</div>
                                                            <div class="lock-date" style="font-size: 18px; font-weight: 500; margin-top: 10px; opacity: 0.9;">{{ peek.peekWidgetDate }}</div>
                                                        </div>
                                                    </div>
                                                    <div class="peek-faceid-panel" style="z-index: 2; position: relative; margin-bottom: 30px; animation: pulse 2.5s infinite ease-in-out;">
                                                        <div class="peek-faceid-text" style="font-size: 14px; font-weight: 600; letter-spacing: 1px; color: rgba(255,255,255,0.9); text-shadow: 0 2px 10px rgba(0,0,0,0.5);">向上滑动或点击解锁</div>
                                                    </div>
                                                </div>
                                                <template v-else>
                                                    <div class="peek-statusbar">
                                                        <span class="peek-status-time">{{ peek.peekStatusTime }}</span>
                                                        <div class="peek-status-right"><i class="fas fa-signal"></i><i class="fas fa-wifi"></i><i class="fas fa-battery-full"></i></div>
                                                    </div>
                                                    <template v-if="peek.peekInnerApp === 'home'">
                                                        <div class="peek-home-content">
                                                            <div class="peek-home-headline">
                                                                <div class="peek-widget-date">{{ peek.peekWidgetDate }}</div>
                                                                <div class="peek-widget-greeting">{{ peek.peekWidgetGreeting }}，{{ peek.peekSelectedCharacter?.nickname || peek.peekSelectedCharacter?.name || '你' }}</div>
                                                            </div>
                                                            <div class="peek-widget-board">
                                                                <div class="peek-widget-card peek-widget-weather-card">
                                                                    <div class="peek-widget-card-title">天气</div>
                                                                    <div class="peek-widget-weather-value"><i class="fas fa-sun"></i> {{ peek.peekWidgetWeather }}</div>
                                                                    <div class="peek-widget-card-sub">当前位置</div>
                                                                </div>
                                                                <div class="peek-widget-card peek-widget-photos" @click="peek.openPeekInnerApp('album')">
                                                                    <div class="peek-widget-card-title">回忆</div>
                                                                    <div class="peek-widget-photo-row">
                                                                        <div v-for="(p, i) in peek.peekWidgetPhotos" :key="'ph-'+i" class="peek-widget-photo">
                                                                            <div v-if="p && typeof p === 'object'" class="mock-image"
                                                                                :style="{ width: '100%', height: '100%', background: 'linear-gradient(135deg,' + (p.bgColor || '#dbeafe') + ',' + (p.bgColor2 || '#fce7f3') + ')' }">
                                                                                <div class="mock-image-desc">{{ p.description }}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div class="peek-widget-card-sub">最近</div>
                                                                </div>
                                                                    <!-- Removed duplicate Note/Messages widget to keep layout clean -->
                                                            </div>
                                                            <div class="peek-home-grid">
                                                                <button class="peek-app-icon" v-for="app in peek.filteredPeekApps" :key="app.id" @click="peek.openPeekInnerApp(app.id)">
                                                                    <i class="fas" :class="app.icon"></i>
                                                                    <span class="peek-app-label">{{ app.name }}</span>
                                                                    <span v-if="peek.getPeekBadgeCount(app.id) > 0" class="peek-app-badge">{{ Math.min(99, peek.getPeekBadgeCount(app.id)) }}</span>
                                                                </button>
                                                            </div>
                                                                <!-- Sync time moved outside -->
                                                            <div v-if="peek.peekAiError" class="peek-ai-error">
                                                                <div class="peek-ai-error-title">联动生成失败</div>
                                                                <div class="peek-ai-error-body">{{ peek.peekAiError }}</div>
                                                            </div>
                                                        </div>
                                                        <div class="peek-dock">
                                                            <button class="peek-dock-item" v-for="d in peek.DOCK_APPS" :key="d.id" @click="peek.openPeekInnerApp(d.id)">
                                                                <i class="fas" :class="d.icon"></i><span class="peek-dock-label">{{ d.name }}</span>
                                                            </button>
                                                        </div>
                                                        <div class="peek-home-indicator"></div>
                                                    </template>
                                                    <template v-else>
                                                        <PeekAppContent />

                                                    </template>
                                                </template>
                                            </div>
                                        </div>
                                        <div class="peek-generate-tip-outer" v-if="peek.peekAiLastGeneratedAt" style="text-align: center; font-size: 11px; opacity: 0.5; margin-top: 12px; color: inherit;">
                                            最后同步：{{ peek.peekAiLastGeneratedAt }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
</template>

<script>
import PeekAppContent from './PeekAppContent.vue';
import { inject } from 'vue';

export default {
    name: 'PeekApp',
    components: {
        PeekAppContent
    },
    setup() {
        const state = inject('globalState');
        return state;
    }
}
</script>
