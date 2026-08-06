<template>
  <div id="app" v-cloak :class="{ 'home-notch-off': !enableNotchAdaptation }">

                <HomeApp />

        <RightnowApp v-if="openedApp === 'rightnow'" />

        <ChatApp v-else-if="openedApp === 'chat'" />

        <EmberApp v-else-if="openedApp === 'ember'" />

        <FeedApp v-else-if="openedApp === 'feed'" />
        <LiveApp v-else-if="openedApp === 'live'" />
        <MateApp v-else-if="openedApp === 'mate'" />

        <ReadApp v-else-if="openedApp === 'read'" />

        <WorkshopApp v-else-if="openedApp === 'workshop'" />

        <ConsoleApp v-else-if="openedApp === 'console'" />

        <ThemeApp v-else-if="openedApp === 'theme'" />

        <MusicApp v-else-if="openedApp === 'music'" />

        <GamesApp v-else-if="openedApp === 'games'" />

        <NoticeApp v-else-if="openedApp === 'notice'" />

        <!-- Nest App -->
        <NestApp v-else-if="openedApp === 'nest'" />景 -->
        <div v-if="isLockScreenVisible" class="lock-screen-background-blur"></div>
        <!-- 锁屏界面 -->
        <div v-if="isLockScreenVisible" class="lockscreen" :style="{ backgroundImage: `url(${lockWallpaper})` }">

            
            <!-- 主时间显示 -->
                <div class="lock-time" :style="{ color: lockDateTimeColor }">
                    <div class="lock-clock">{{ currentTime }}</div>
                    <div class="lock-date">{{ fullDate }}</div>
                    <div class="lock-signature">{{ lockSignature }}</div>
                </div>
            
            <!-- 密码输入区域（仅开启锁屏密码时显示） -->
            <div v-if="enableLockScreen" class="lock-password">
                <div class="lock-password-input">
                    <div v-for="(dot, index) in 4" :key="index" class="lock-password-dot" :class="{ active: password.length > index }"></div>
                </div>
                <div class="lock-password-keyboard">
                    <div class="lock-password-row">
                        <div class="lock-password-key" @click="addPassword('1')">1</div>
                        <div class="lock-password-key" @click="addPassword('2')">2</div>
                        <div class="lock-password-key" @click="addPassword('3')">3</div>
                    </div>
                    <div class="lock-password-row">
                        <div class="lock-password-key" @click="addPassword('4')">4</div>
                        <div class="lock-password-key" @click="addPassword('5')">5</div>
                        <div class="lock-password-key" @click="addPassword('6')">6</div>
                    </div>
                    <div class="lock-password-row">
                        <div class="lock-password-key" @click="addPassword('7')">7</div>
                        <div class="lock-password-key" @click="addPassword('8')">8</div>
                        <div class="lock-password-key" @click="addPassword('9')">9</div>
                    </div>
                    <div class="lock-password-row">
                        <div class="lock-password-key lock-password-key-confirm" @click.stop="tapUnlock">确认</div>
                        <div class="lock-password-key" @click="addPassword('0')">0</div>
                        <div class="lock-password-key" @click="removePassword"><i class="fa fa-backspace"></i></div>
                    </div>
                </div>
            </div>
            
            <!-- 底部操作按钮 -->
            <div class="lock-bottom-controls">
                <div class="lock-bottom-btn">
                    <i class="fa fa-phone"></i>
                </div>
                <div class="lock-unlock-btn" @click="tapUnlock">
                    <div class="lock-unlock-circle"></div>
                </div>
                <div class="lock-bottom-btn">
                    <i class="fa fa-camera"></i>
                </div>
            </div>
        </div>
        
        <!-- 浮动装饰图标 -->
        <svg class="sparkle-icon sparkle-1" viewBox="0 0 24 24" fill="none">
            <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill="currentColor"/>
        </svg>
        <svg class="sparkle-icon sparkle-2" viewBox="0 0 24 24" fill="none">
            <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill="currentColor"/>
        </svg>
        <svg class="sparkle-icon sparkle-3" viewBox="0 0 24 24" fill="none">
            <path d="M5 12 L19 12 M12 5 L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <svg class="sparkle-icon sparkle-4" viewBox="0 0 24 24" fill="none">
            <path d="M5 12 L19 12 M12 5 L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        
        <!-- 顶部状态栏 -->
        <div v-if="!enableHideStatusBar" class="status-bar">
            <span>{{ currentTime }}</span>
            <div class="status-right">
                <i class="fa fa-signal"></i>
                <i class="fa fa-wifi"></i>
                <i class="fa fa-battery-full"></i>
            </div>
        </div>

        <!-- 主屏幕 -->
        <div
            v-if="isHomeScreenVisible"
            class="homescreen"
            :class="{ 'home-glass-mode': enableHomeGlass }"
            :style="{
                backgroundImage: homeWallpaperInput ? ('url(' + homeWallpaperInput + ')') : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'transparent',
                '--home-app-color': homeTextColorInput || homeTextColor || '#000000'
            }"
        >
            <!-- 内部手机有效区域：固定宽度但无明显边框 -->
            <div class="homescreen-inner">
                <!-- 页面容器 -->
                <div class="home-pages" ref="homePages" style="cursor: grab;">
                    <!-- 最左页：角色手机模拟 -->
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
                    <!-- 第一页 -->
                    <div class="home-page" :class="{ 'active': currentPage === 1 }">
                    <div class="grid-6x4">
                        <!-- 第1-4行：照片小组件 (4行×4格) -->
                        <div class="grid-cell grid-row-1-4">
                            <div class="photo-widget" @click.stop>
                                <div class="photo-widget-content">
                                    <!-- 顶部信息栏 -->
                                    <div class="photo-widget-header">
                                        <div class="photo-widget-date">
                                            <div class="photo-date-day">{{ photoWidgetDate.day }}</div>
                                            <div class="photo-date-weekday">{{ photoWidgetDate.weekday }}</div>
                                        </div>
                                        <div class="photo-widget-text" @click="editPhotoWidgetText">
                                            <div class="photo-text-line1">{{ photoWidgetText.line1 }}</div>
                                            <div class="photo-text-line2">{{ photoWidgetText.line2 }}</div>
                                        </div>
                                    </div>
                                    <!-- 照片网格 -->
                                    <div class="photo-widget-grid">
                                        <div v-for="(photo, index) in photoWidgetPhotos" :key="index" 
                                             class="photo-widget-item" 
                                             @click="changePhotoWidgetImage(index)">
                                            <img :src="photo.url" :alt="'Photo ' + (index + 1)" class="photo-widget-img">
                                            <div class="photo-widget-overlay"></div>
                                        </div>
                                    </div>
                                </div>
                        </div>
                            </div>
                        
                        <!-- 第5-6行：贴纸和app (2行×4格) -->
                        <div class="grid-cell grid-row-5-6">
                            <div class="first-page-bottom-content">
                                <!-- 左侧：贴纸小组件 -->
                                <div class="sticker-widget" @click="changeStickerWidgetImage">
                                    <div class="sticker-widget-content">
                                        <img :src="stickerWidgetUrl" alt="Sticker" class="sticker-image">
                                    </div>
                                </div>
                                
                                <!-- 右侧：app图标 -->
                                <div class="first-page-apps">
                                    <div class="app-icon" @click="openApp('chat')">
                                        <div class="app-icon-wrapper">
                                            <i class="fa fa-comments app-icon-font"></i>
                                            <span v-if="totalUnrepliedCount > 0" class="app-dot-badge"></span>
                                        </div>
                                        <div class="app-label">Chat</div>
                                    </div>
                                    <div class="app-icon" @click="openApp('rightnow')">
                                        <div class="app-icon-wrapper">
                                            <i class="fas fa-feather-alt app-icon-font"></i>
                                        </div>
                                        <div class="app-label">Rightnow</div>
                                    </div>
                                    <div class="app-icon" @click="openApp('live')">
                                        <div class="app-icon-wrapper">
                                            <i class="fa fa-microphone app-icon-font"></i>
                                        </div>
                                        <div class="app-label">Live</div>
                                    </div>
                                    <div class="app-icon" @click="openApp('ember')">
                                        <div class="app-icon-wrapper">
                                            <i class="fa fa-fire app-icon-font"></i>
                                        </div>
                                        <div class="app-label">Ember</div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                    </div>

                <!-- 第二页 -->
                <div class="home-page page-2-grid" :class="{ 'active': currentPage === 2 }">
                    <div class="grid-6x4">
                        <!-- 第1-2行：灵动岛小组件 -->
                        <div class="grid-cell grid-row-1-2">
                            <div class="dashboard-container">
                                <div class="top-row">
                                    <div class="pill-sm" @click="editDashboardText('weekday')">
                                        <span>{{ dashboardTexts.weekday }}</span>
                                        <svg class="icon-week" viewBox="0 0 24 24">
                                            <rect x="3" y="4" width="18" height="18" rx="2" stroke="white" fill="none" stroke-width="2"/>
                                            <path d="M3 10h18M7 2v4M17 2v4" stroke="white" stroke-width="2"/>
                                            <text x="7" y="18" fill="white" font-size="6" font-family="Arial">WEEK</text>
                                        </svg>
                                    </div>
                                    <div class="progress-circle">
                                        <div class="inner-dark"></div>
                                    </div>
                                </div>

                                <div class="pill-lg">
                                    <div class="avatar-section" @click="showCharacterSelector = true">
                                        <img :src="selectedCharacter.avatarUrl || 'https://img.js.design/assets/smartFill/img342164da747808.jpg'" alt="avatar">
                                    </div>
                                    <div class="time-weather">
                                        <div class="time-row">
                                            <span class="meridiem">{{ currentTime.split(' ')[1] }}</span>
                                            <span class="clock">{{ currentTime.split(' ')[0] }}</span>
                                        </div>
                                        <div class="weather-row" @click="editDashboardText('weather')">
                                            <span>{{ dashboardTexts.weather }}</span>
                                        </div>
                                    </div>
                                    <div class="date-section">
                                        <div class="slogan" @click="editDashboardText('slogan')">{{ dashboardTexts.slogan }}</div>
                                        <div class="date-str">{{ currentDate }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 第3-4行：音乐组件 (2行×4格) -->
                        <div class="grid-cell grid-row-3-4">
                            <!-- 音乐组件：替换为你图里的“耳机线+日期文案”样式（整图背景） -->
                            <div class="music-widget-hero" @click="openApp('music')" role="button" aria-label="打开音乐 App">
                                <!-- 左侧：歌名/歌手（上） -->
                                <div class="music-hero-songinfo">
                                    <h1 class="song-name">{{ currentTrack.title }}</h1>
                                    <p class="artist">{{ currentTrack.artist }}</p>
                                </div>

                                <!-- 中间：耳机线（分左右两列各一半） -->
                                <div class="music-hero-earphone music-hero-earphone-left" aria-hidden="true"></div>
                                <div class="music-hero-earphone music-hero-earphone-right" aria-hidden="true"></div>

                                <!-- 左侧：播放/暂停/收藏/下一首（下） -->
                                <div class="music-hero-controls">
                                    <button class="icon-btn" type="button" aria-label="previous" @click.stop="musicPlayPrevious">
                                        <!-- skip-back -->
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M11 6v12l-8-6 8-6z"/>
                                            <path d="M13 6h2v12h-2z"/>
                                        </svg>
                                    </button>

                                    <button class="icon-btn play-pause" id="playBtn" type="button" aria-label="play/pause" @click.stop="toggleMusicPlayPause">
                                        <i class="fas" :class="music.isLoading ? 'fa-spinner fa-spin' : (music.isPlaying ? 'fa-pause' : 'fa-play')"></i>
                                    </button>

                                    <button class="icon-btn" type="button" aria-label="next" @click.stop="musicPlayNext">
                                        <!-- skip-forward -->
                                        <svg viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M13 6v12l8-6-8-6z"/>
                                            <path d="M9 6h2v12H9z"/>
                                        </svg>
                                    </button>

                                    <button class="icon-btn heart" type="button" aria-label="favorite" :class="{ active: isCurrentFavorite }" @click.stop="musicToggleFavorite(currentTrack)">
                                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                    </button>
                                </div>

                                <!-- 右侧：日期 -->
                                <div class="music-hero-date">
                                    <div class="music-date-month">{{ currentMonthEn }}</div>
                                    <div class="music-date-day">{{ currentDayOfMonth }}</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 第5-6行：app和胶囊框 (2行×4格) -->
                        <div class="grid-cell grid-row-5-6">
                            <div class="app-grid-bottom-left">

                                <div class="app-icon" @click="openApp('mate')">
                                    <div class="app-icon-wrapper">
                                        <i class="fa fa-user app-icon-font"></i>
                                    </div>
                                    <div class="app-label">Mate</div>
                                </div>
                                <div class="app-icon" @click="openApp('read')">
                                    <div class="app-icon-wrapper">
                                        <i class="fa fa-book-open app-icon-font"></i>
                                    </div>
                                    <div class="app-label">Read</div>
                                </div>
                                <div class="app-icon" @click="openApp('feed')">
                                    <div class="app-icon-wrapper">
                                        <i class="fa fa-list app-icon-font"></i>
                                    </div>
                                    <div class="app-label">Feed</div>
                                </div>
                                <div class="app-icon" @click="openApp('nest')">
                                    <div class="app-icon-wrapper">
                                        <i class="fa fa-home app-icon-font"></i>
                                    </div>
                                    <div class="app-label">Nest</div>
                                </div>
                            </div>
                            
                            <!-- 右侧胶囊框 -->
                            <div class="glass-capsules">
                                <div class="glass-capsule glass-black" @click="editCapsuleText('black')">
                                    <div class="capsule-text">{{ capsuleTexts.black }}</div>
                                </div>
                                <div class="glass-capsule glass-gray" @click="editCapsuleText('gray')">
                                    <div class="capsule-text">{{ capsuleTexts.gray }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>

                <!-- 页面指示器和翻页箭头（固定在 homescreen-inner 内部） -->
                <div
                    class="page-indicator-container"
                >
                    <button 
                        class="page-nav-arrow left" 
                        @click="prevPage"
                        :disabled="currentPage === 0"
                        v-show="currentPage > 0"
                    >
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    
                    <div class="page-indicator">
                        <div class="indicator-dot" :class="{ 'active': currentPage === 0 }"></div>
                        <div class="indicator-dot" :class="{ 'active': currentPage === 1 }"></div>
                        <div class="indicator-dot" :class="{ 'active': currentPage === 2 }"></div>
                    </div>
                    
                    <button 
                        class="page-nav-arrow right" 
                        @click="nextPage"
                        :disabled="currentPage === 2"
                        v-show="currentPage < 2"
                    >
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>

                <!-- Dock栏：作为第7行，固定在 homescreen-inner 底部 -->
                <div
                    class="dock"
                    v-if="isHomeScreenVisible"
                >
                    <div class="dock-icon" @click="openApp('workshop')">
                        <i class="fa fa-wrench"></i>
                        <span>Workshop</span>
                    </div>
                    <div class="dock-icon" @click="openApp('console')">
                        <i class="fa fa-terminal"></i>
                        <span>Console</span>
                    </div>
                    <div class="dock-icon" @click="openApp('theme')">
                        <i class="fa fa-paint-brush"></i>
                        <span>Theme</span>
                    </div>
                    <div class="dock-icon" @click="openApp('notice')">
                        <i class="fa fa-bullhorn"></i>
                        <span>Notice</span>
                    </div>
                </div>
            </div>
        </div>

        <RightnowApp v-else-if="openedApp === 'rightnow'" />

        <ChatApp v-else-if="openedApp === 'chat'" />

        <EmberApp v-else-if="openedApp === 'ember'" />

        <FeedApp v-else-if="openedApp === 'feed'" />
        <LiveApp v-else-if="openedApp === 'live'" />
        <MateApp v-else-if="openedApp === 'mate'" />

        <ReadApp v-else-if="openedApp === 'read'" />

        <WorkshopApp v-else-if="openedApp === 'workshop'" />

        <ConsoleApp v-else-if="openedApp === 'console'" />

        <ThemeApp v-else-if="openedApp === 'theme'" />

        <MusicApp v-else-if="openedApp === 'music'" />

        <GamesApp v-else-if="openedApp === 'games'" />

        <NoticeApp v-else-if="openedApp === 'notice'" />

        <!-- Nest App -->
        <div v-else-if="openedApp === 'nest'" class="app-view">
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
        <div v-if="showPhotoWidgetEditDialog" class="photo-widget-edit-dialog" @click.self="closePhotoWidgetEditDialog">
            <div class="photo-widget-edit-content">
                <div class="photo-widget-edit-header">
                    <h3>编辑文字</h3>
                    <button class="photo-widget-edit-close" @click="closePhotoWidgetEditDialog">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="photo-widget-edit-body">
                    <div class="photo-widget-edit-field">
                        <label>第一行</label>
                        <input name="sp_field_169" id="sp-field-169" 
                            type="text" 
                            v-model="photoWidgetEditText1" 
                            placeholder="请输入第一行文字"
                            maxlength="20"
                        >
                    </div>
                    <div class="photo-widget-edit-field">
                        <label>第二行</label>
                        <input name="sp_field_170" id="sp-field-170" 
                            type="text" 
                            v-model="photoWidgetEditText2" 
                            placeholder="请输入第二行文字"
                            maxlength="20"
                        >
                    </div>
                </div>
                <div class="photo-widget-edit-footer">
                    <button class="photo-widget-edit-btn photo-widget-edit-cancel" @click="closePhotoWidgetEditDialog">取消</button>
                    <button class="photo-widget-edit-btn photo-widget-edit-save" @click="savePhotoWidgetText">保存</button>
                </div>
            </div>
        </div>
        
        <!-- 胶囊框文字编辑对话框 -->
        <div v-if="showCapsuleEditDialog" class="photo-widget-edit-dialog" @click.self="closeCapsuleEditDialog">
            <div class="photo-widget-edit-content">
                <div class="photo-widget-edit-header">
                    <h3>编辑胶囊文字</h3>
                    <button class="photo-widget-edit-close" @click="closeCapsuleEditDialog">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="photo-widget-edit-body">
                    <div class="photo-widget-edit-field">
                        <label>{{ currentCapsuleType === 'black' ? '黑色胶囊' : '灰色胶囊' }}文字</label>
                        <input name="sp_field_171" id="sp-field-171" 
                            type="text" 
                            v-model="capsuleEditText" 
                            placeholder="请输入文字"
                            maxlength="10"
                        >
                    </div>
                </div>
                <div class="photo-widget-edit-footer">
                    <button class="photo-widget-edit-btn photo-widget-edit-cancel" @click="closeCapsuleEditDialog">取消</button>
                    <button class="photo-widget-edit-btn photo-widget-edit-save" @click="saveCapsuleText">保存</button>
                </div>
            </div>
        </div>
        
        <!-- 灵动岛文字编辑对话框 -->
        <div v-if="showDashboardEditDialog" class="photo-widget-edit-dialog" @click.self="closeDashboardEditDialog">
            <div class="photo-widget-edit-content">
                <div class="photo-widget-edit-header">
                    <h3>编辑灵动岛文字</h3>
                    <button class="photo-widget-edit-close" @click="closeDashboardEditDialog">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="photo-widget-edit-body">
                    <div class="photo-widget-edit-field">
                        <label>{{ 
                            currentDashboardTextType === 'weekday' ? '星期文字' : 
                            currentDashboardTextType === 'weather' ? '天气文字' : '口号文字' 
                        }}</label>
                        <input name="sp_field_172" id="sp-field-172" 
                            type="text" 
                            v-model="dashboardEditText" 
                            placeholder="请输入文字"
                            maxlength="20"
                        >
                    </div>
                </div>
                <div class="photo-widget-edit-footer">
                    <button class="photo-widget-edit-btn photo-widget-edit-cancel" @click="closeDashboardEditDialog">取消</button>
                    <button class="photo-widget-edit-btn photo-widget-edit-save" @click="saveDashboardText">保存</button>
                </div>
            </div>
        </div>

        <!-- 角色选择器对话框 -->
        <div v-if="showCharacterSelector" class="photo-widget-edit-dialog" @click.self="showCharacterSelector = false">
            <div class="photo-widget-edit-content">
                <div class="photo-widget-edit-header">
                    <h3>选择角色</h3>
                    <button class="photo-widget-edit-close" @click="showCharacterSelector = false">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="photo-widget-edit-body">
                    <div v-if="characters.length === 0" style="text-align: center; color: #666; padding: 40px;">
                        暂无角色，请先去工作室创建
                    </div>
                    <div v-else style="display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto;">
                        <div 
                            v-for="char in characters" 
                            :key="char.id" 
                            @click="selectCharacter(char)"
                            style="display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 12px; cursor: pointer; transition: background 0.2s;"
                            :style="{ background: (selectedCharacter?.id) === (char?.id) ? '#F0F0F0' : 'transparent' }"
                            @mouseover="e => e.currentTarget.style.background = selectedCharacter?.id === char.id ? '#F0F0F0' : '#F8F8F8'"
                            @mouseout="e => e.currentTarget.style.background = selectedCharacter.id === char.id ? '#F0F0F0' : 'transparent'"
                        >
                            <img :src="char.avatarUrl || 'https://placehold.co/60x60?text=No+Avatar'" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover;">
                            <div style="flex: 1;">
                                <div style="font-weight: 600; color: #000;">{{ char.nickname || char.name || '未命名角色' }}</div>
                                </div>
                            <i v-if="selectedCharacter.id === char.id" class="fas fa-check" style="color: #000; font-size: 18px;"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 通话小组件编辑对话框 -->
        <div class="call-widget-editor" v-if="showCallWidgetEdit">
            <div class="call-widget-editor-content">
                <h3>编辑通话小组件文字</h3>
                <input name="sp_field_173" id="sp-field-173" 
                    type="text" 
                    v-model="callWidgetEditInput" 
                    class="call-widget-edit-input"

                    placeholder="请输入自定义文字"
                    autofocus
                >
                <div class="call-widget-editor-buttons">
                    <button @click="closeCallWidgetEdit">取消</button>
                    <button @click="saveCallWidgetSubtitle">保存</button>
                </div>
            </div>
        </div>
        <!-- 系统更新提示弹窗 -->
        <div class="update-notice-overlay" v-if="showUpdateNotice" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 99999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px);">
            <div style="background: #fff; width: 85%; max-width: 400px; border-radius: 20px; padding: 30px 24px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
                <i class="fa fa-rocket" style="font-size: 48px; color: #000; margin-bottom: 20px;"></i>
                <h2 style="font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; margin-bottom: 12px; color: #000;">更新成功</h2>
                <p style="font-family: 'Inter', sans-serif; font-size: 15px; color: #666; margin-bottom: 30px; line-height: 1.5;">
                    {{ updateNoticeVersion }}
                </p>
                <button @click="closeUpdateNotice" style="background: #000; color: #fff; border: none; border-radius: 12px; padding: 14px 40px; font-size: 16px; font-weight: 600; cursor: pointer; width: 100%;">
                    我知道了，开启体验
                </button>
            </div>
        </div>
    
  </div>
</template>

<script>
import { provide } from 'vue';
import { setupApp } from './js/script.js';
import SubPlaylist from './components/SubPlaylist.vue';
import SharedHistory from './components/SharedHistory.vue';
import LiveApp from './components/apps/LiveApp.vue';
import MateApp from './components/apps/MateApp.vue';
import NoticeApp from './components/apps/NoticeApp.vue';
import GamesApp from './components/apps/GamesApp.vue';
import MusicApp from './components/apps/MusicApp.vue';
import ThemeApp from './components/apps/ThemeApp.vue';
import ConsoleApp from './components/apps/ConsoleApp.vue';
import WorkshopApp from './components/apps/WorkshopApp.vue';
import ReadApp from './components/apps/ReadApp.vue';
import FeedApp from './components/apps/FeedApp.vue';
import EmberApp from './components/apps/EmberApp.vue';
import ChatApp from './components/apps/ChatApp.vue';
import RightnowApp from './components/apps/RightnowApp.vue';
import HomeApp from './components/apps/HomeApp.vue';
import NestApp from './components/apps/NestApp.vue';

export default {
    name: 'App',
    components: {
        SubPlaylist,
        SharedHistory,
        LiveApp,
        MateApp,
        RightnowApp,
        HomeApp,
        NestApp,

        ChatApp,
        EmberApp,
        FeedApp,
        ReadApp,
        WorkshopApp,
        ConsoleApp,
        ThemeApp,
        MusicApp,
        GamesApp,
        NoticeApp
    },
    setup() {
        const state = setupApp();
        provide('globalState', state);
        return state;
    }
}
</script>
