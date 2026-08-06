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
                                                        <div class="peek-app-nav">
                                                            <button class="peek-app-back" @click="peek.closePeekInnerApp"><i class="fas fa-chevron-left"></i></button>
                                                            <span class="peek-app-title">{{ peek.getPeekAppName(peek.peekInnerApp) }}</span>
                                                        </div>
                                                        <div class="peek-app-body">
                                                            <div v-if="peek.peekInnerApp === 'messages'" class="peek-app-im peek-retro-im">
                                                                <!-- Inbox View -->
                                                                <div v-if="!peek.peekActiveChatContact" class="peek-retro-inbox">
                                                                    <div class="peek-retro-header">
                                                                        <span>MESSAGES</span>
                                                                    </div>
                                                                    <div v-if="peek.peekChatInbox.length === 0" class="peek-retro-empty">NO MESSAGES</div>
                                                                    <div class="peek-retro-inbox-list">
                                                                        <div v-for="c in peek.peekChatInbox" :key="c.contactName" class="peek-retro-inbox-item" @click="peek.openPeekChat(c.contactName)">
                                                                            <div class="peek-retro-avatar-box">{{ c.contactName.charAt(0) }}</div>
                                                                            <div class="peek-retro-inbox-info">
                                                                                <div class="peek-retro-inbox-top">
                                                                                    <span class="peek-retro-name">{{ c.contactName }}</span>
                                                                                    <span class="peek-retro-time">{{ c.lastMessageTime }}</span>
                                                                                </div>
                                                                                <div class="peek-retro-inbox-bottom">
                                                                                    <span class="peek-retro-preview">{{ c.lastMessageText }}</span>
                                                                                    <span class="peek-retro-unread" v-if="c.unread > 0">!</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <!-- Chat Thread View -->
                                                                <div v-else class="peek-retro-thread">
                                                                    <div class="peek-retro-header">
                                                                        <div class="peek-retro-back" @click="peek.closePeekChat()">&lt; BACK</div>
                                                                        <span>{{ peek.peekActiveChatContact }}</span>
                                                                    </div>
                                                                    <div class="peek-retro-thread-body">
                                                                        <div v-if="peek.peekActiveChatMessages.length === 0" class="peek-retro-empty">NO MESSAGES</div>
                                                                        <div v-for="m in peek.peekActiveChatMessages" :key="m.id" class="peek-retro-msg-row" :class="m.sender">
                                                                            <div class="peek-retro-avatar-box" v-if="m.sender === 'other'">{{ m.contactName.charAt(0) }}</div>
                                                                            <div class="peek-retro-bubble-wrap">
                                                                                <div class="peek-retro-bubble">{{ m.text }}</div>
                                                                                <div class="peek-retro-msg-time">{{ m.at }}</div>
                                                                            </div>
                                                                            <div class="peek-retro-avatar-box" v-if="m.sender === 'self'">{{ (peek.peekSelectedCharacter?.nickname || 'TA').charAt(0) }}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div v-else-if="peek.peekInnerApp === 'todo'" class="peek-app-todo">
                                                                <div class="peek-todo-header">提醒事项</div>
                                                                <div v-if="(peek.peekTodoItems || []).length === 0" class="peek-chat-empty">暂无待办</div>
                                                                <div class="peek-todo-list">
                                                                    <div class="peek-todo-item" v-for="t in peek.peekTodoItems" :key="t.id" :class="{ 'done': t.done }">
                                                                        <div class="peek-todo-checkbox"><i class="far" :class="t.done ? 'fa-check-circle' : 'fa-circle'"></i></div>
                                                                        <div class="peek-todo-content">
                                                                            <div class="peek-todo-title">{{ t.text || '待办' }}</div>
                                                                            <div class="peek-todo-due" v-if="t.due">截止：{{ t.due }} <span v-if="t.at">· {{ t.at }}</span></div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div v-else-if="peek.peekInnerApp === 'calendar'" class="peek-app-calendar">
                                                                <div class="peek-calendar-header">即将到来</div>
                                                                <div v-if="(peek.peekCalendarEvents || []).length === 0" class="peek-chat-empty">暂无日程</div>
                                                                <div class="peek-calendar-timeline">
                                                                    <div class="peek-calendar-item" v-for="e in peek.peekCalendarEvents" :key="e.id">
                                                                        <div class="peek-calendar-time-col">{{ e.at?.split(' ')[1] || e.at || '全天' }}</div>
                                                                        <div class="peek-calendar-event-card">
                                                                            <div class="peek-calendar-event-title">{{ e.title || '日程' }}</div>
                                                                            <div class="peek-calendar-event-loc" v-if="e.location"><i class="fas fa-map-marker-alt"></i> {{ e.location }}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div v-else-if="peek.peekInnerApp === 'wallet'" class="peek-app-bank">
                                                                <div class="peek-bank-header">
                                                                    <div class="peek-bank-title">零钱余额</div>
                                                                    <div class="peek-bank-balance">¥ {{ (peek.peekWallet && peek.peekWallet.balance) || 0 }}</div>
                                                                </div>
                                                                <div class="peek-bank-list">
                                                                    <div class="peek-bank-list-title">账单明细</div>
                                                                    <div class="peek-bank-item" v-for="r in ((peek.peekWallet && peek.peekWallet.records) || [])" :key="r.id">
                                                                        <div class="peek-bank-item-left">
                                                                            <div class="peek-bank-item-icon"><i class="fas fa-wallet"></i></div>
                                                                            <div class="peek-bank-item-info">
                                                                                <div class="peek-bank-item-title">{{ r.item || '消费' }}</div>
                                                                                <div class="peek-bank-item-time">{{ r.at }}<span v-if="r.note"> · {{ r.note }}</span></div>
                                                                            </div>
                                                                        </div>
                                                                        <div class="peek-bank-item-amount" :class="{ 'income': r.amount > 0 }">{{ peek.peekFormatAmount(r.amount) }}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div v-else-if="peek.peekInnerApp === 'health'" class="peek-app-health">
                                                                <div class="peek-health-header">摘要</div>
                                                                <div class="peek-health-cards">
                                                                    <div class="peek-health-card steps">
                                                                        <div class="peek-health-card-header"><i class="fas fa-fire" style="color: #ff3b30;"></i> 活动步数</div>
                                                                        <div class="peek-health-value">{{ ((peek.peekHealth && peek.peekHealth.steps) || [])[0]?.count || 0 }} <span class="peek-health-unit">步</span></div>
                                                                    </div>
                                                                    <div class="peek-health-card sleep">
                                                                        <div class="peek-health-card-header"><i class="fas fa-bed" style="color: #5856d6;"></i> 睡眠时长</div>
                                                                        <div class="peek-health-value">{{ ((peek.peekHealth && peek.peekHealth.sleep) || [])[0]?.hours || 0 }} <span class="peek-health-unit">小时</span></div>
                                                                        <div class="peek-health-sub" v-if="((peek.peekHealth && peek.peekHealth.sleep) || [])[0]?.note">{{ ((peek.peekHealth && peek.peekHealth.sleep) || [])[0].note }}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div v-else-if="peek.peekInnerApp === 'mail'" class="peek-app-mail">
                                                                <div class="peek-mail-header">收件箱</div>
                                                                <div v-if="(peek.peekMailThreads || []).length === 0" class="peek-chat-empty">暂无邮件</div>
                                                                <div class="peek-mail-list">
                                                                    <div class="peek-mail-item" v-for="m in peek.peekMailThreads" :key="m.id">
                                                                        <div class="peek-mail-dot" :class="{ 'unread': m.unread }"></div>
                                                                        <div class="peek-mail-content">
                                                                            <div class="peek-mail-top">
                                                                                <div class="peek-mail-from">{{ m.from || '发件人' }}</div>
                                                                                <div class="peek-mail-time">{{ m.at || '' }}</div>
                                                                            </div>
                                                                            <div class="peek-mail-subject">{{ m.subject || '无主题' }}</div>
                                                                            <div class="peek-mail-preview">{{ m.preview || '' }}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div v-else-if="peek.peekInnerApp === 'calls'" class="peek-list">
                                                                <div class="peek-list-item" v-for="c in peek.peekCalls" :key="c.id"><div><b>{{ c.who }}</b> · {{ c.type === 'missed' ? '未接来电' : '已拨出' }}</div><span>{{ c.at }}</span></div>
                                                            </div>
                                                            <div v-else-if="peek.peekInnerApp === 'album'" class="peek-app-album-container">
                                                                <div class="peek-app-album">
                                                                    <div v-for="(p, i) in peek.peekPhotos" :key="p.id || i" class="peek-album-item">
                                                                        <div class="peek-album-glass" :style="{ background: 'linear-gradient(135deg,' + (p.bgColor || '#333') + ',' + (p.bgColor2 || '#111') + ')' }">
                                                                            <i class="fas fa-image"></i>
                                                                            <div class="peek-album-desc">{{ p.description }}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div class="peek-album-hidden-section">
                                                                    <div class="peek-album-hidden-title">更多项目</div>
                                                                    <div class="peek-album-hidden-item">
                                                                        <div class="peek-album-hidden-icon"><i class="fas fa-eye-slash"></i></div>
                                                                        <div class="peek-album-hidden-text">已隐藏</div>
                                                                        <div class="peek-album-hidden-count"><i class="fas fa-lock"></i></div>
                                                                    </div>
                                                                    <div class="peek-album-hidden-item">
                                                                        <div class="peek-album-hidden-icon"><i class="fas fa-trash-alt"></i></div>
                                                                        <div class="peek-album-hidden-text">最近删除</div>
                                                                        <div class="peek-album-hidden-count">{{ peek.peekPhotos.length > 0 ? 3 : 0 }}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div v-else-if="peek.peekInnerApp === 'notes' || peek.peekInnerApp === 'diary'" class="peek-app-notes">
                                                                <div class="peek-note-card" v-for="d in peek.peekDiaryEntries" :key="d.id">
                                                                    <h4 class="peek-note-title">{{ d.title }}</h4>
                                                                    <div class="peek-note-mood"><i class="fas fa-tag"></i> {{ d.mood }}</div>
                                                                    <p class="peek-note-body">{{ d.content }}</p>
                                                                </div>
                                                                <div class="peek-note-card" v-for="n in peek.peekNotes" :key="n.id">
                                                                    <h4 class="peek-note-title">{{ n.title }}</h4>
                                                                    <p class="peek-note-body">{{ n.content }}</p>
                                                                </div>
                                                            </div>
                                                            <div v-else-if="peek.peekInnerApp === 'browser'" class="peek-app-browser">
                                                                <div class="peek-browser-searchbar"><i class="fas fa-lock"></i> 搜索或键入网址</div>
                                                                <div class="peek-browser-history-title">历史记录</div>
                                                                <div class="peek-browser-item" v-for="b in peek.peekBrowserHistory" :key="b.id">
                                                                    <div class="peek-browser-icon"><i class="fas fa-search"></i></div>
                                                                    <div class="peek-browser-content">
                                                                        <div class="peek-browser-title">{{ b.title }}</div>
                                                                        <div class="peek-browser-url">{{ b.url }}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div v-else-if="peek.peekInnerApp === 'files'" class="peek-list">
                                                                <div class="peek-list-item" v-for="f in peek.peekFiles" :key="f.id"><div><b>{{ f.name }}</b></div><span>{{ f.size }}</span></div>
                                                            </div>
                                                            <div v-else-if="peek.peekInnerApp === 'bank'" class="peek-app-bank">
                                                                <div class="peek-bank-header">
                                                                    <div class="peek-bank-title">账户总览</div>
                                                                    <div class="peek-bank-balance">¥ {{ peek.peekBankAccount.balance }}</div>
                                                                    <div class="peek-bank-sub">本月支出: ¥ {{ peek.peekBankAccount.monthlySpend }}</div>
                                                                </div>
                                                                <div class="peek-bank-list">
                                                                    <div class="peek-bank-list-title">近期明细</div>
                                                                    <div class="peek-bank-item" v-for="r in (peek.peekBankAccount.records || [])" :key="r.id">
                                                                        <div class="peek-bank-item-left">
                                                                            <div class="peek-bank-item-icon"><i class="fas fa-money-check"></i></div>
                                                                            <div class="peek-bank-item-info">
                                                                                <div class="peek-bank-item-title">{{ r.item }}</div>
                                                                                <div class="peek-bank-item-time">{{ r.at }}</div>
                                                                            </div>
                                                                        </div>
                                                                        <div class="peek-bank-item-amount" :class="{ 'income': r.amount > 0 }">{{ peek.peekFormatAmount(r.amount) }}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div v-else-if="peek.peekInnerApp === 'map'" class="peek-app-map">
                                                                <div class="peek-map-mock-bg">
                                                                    <i class="fas fa-location-arrow"></i>
                                                                </div>
                                                                <div class="peek-map-panel">
                                                                    <div class="peek-map-panel-title">最近去过</div>
                                                                    <div class="peek-map-list">
                                                                        <div class="peek-map-item" v-for="m in peek.peekMapTracks" :key="m.id">
                                                                            <div class="peek-map-icon"><i class="fas fa-map-pin"></i></div>
                                                                            <div class="peek-map-info">
                                                                                <div class="peek-map-place">{{ m.place }}</div>
                                                                                <div class="peek-map-desc">{{ m.note }} · {{ m.at }}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div class="peek-home-indicator"></div>
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
import { inject } from 'vue';

export default {
    name: 'PeekApp',
    setup() {
        const state = inject('globalState');
        return state;
    }
}
</script>
