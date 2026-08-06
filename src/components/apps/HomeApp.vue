<template>
<!-- 锁屏毛玻璃背景 -->
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
                    <PeekApp :class="{ 'active': currentPage === 0 }" />
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


</template>

<script>
import { inject } from 'vue';
import PeekApp from './PeekApp.vue';

export default {
    name: 'HomeApp',
    components: {
        PeekApp
    },
    setup() {
        const state = inject('globalState');
        return state;
    }
}
</script>
