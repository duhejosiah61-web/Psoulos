<template>
<!-- 主题设置（全局字体 + 主界面壁纸/文字颜色） -->
                    <div class="card theme-card">
                        <div class="theme-card-header">
                            <i class="fas fa-font"></i>
                            <span>主题设置</span>
                        </div>

                        <div class="setting-item setting-item-full">
                            <div class="setting-info">
                                <div class="setting-label">全局字体</div>
                                <div class="setting-desc">锁屏以外的文字</div>
                            </div>

                            <div class="font-setting">
                                <div class="font-cards-container">
                                    <div
                                        v-for="font in fonts"
                                        :key="font.fontId"
                                        class="font-card"
                                        :class="{ active: globalSelectedFont === font.fontFamily }"
                                        @click="selectGlobalFont(font)"
                                        :style="{ fontFamily: font.fontFamily }"
                                    >
                                        <div class="font-card-row font-card-name">{{ font.displayName }}</div>
                                        <div class="font-card-row font-card-english">ABCabc</div>
                                        <div class="font-card-row font-card-number">123</div>
                                    </div>
                                </div>

                                <div class="font-actions">
                                    <div class="font-import">
                                        <input name="sp_field_153" id="sp-field-153"
                                            ref="globalFontFileInput"
                                            type="file"
                                            accept=".ttf"
                                            @change="importCustomFont"
                                            style="display: none;"
                                        >
                                        <button
                                            class="font-import-btn"
                                            @click="globalFontFileInput && globalFontFileInput.click()"
                                        >导入字体</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-label">主界面壁纸</div>
                                <div class="setting-desc">设置主界面背景图片</div>
                            </div>
                            <div class="lock-wallpaper-setting" style="display: flex; gap: 8px;">
                                <input name="sp_field_154" id="sp-field-154"
                                    type="text"
                                    class="lock-wallpaper-input"
                                    v-model="homeWallpaperInput"
                                    placeholder="输入图片URL"
                                >
                                <button class="lock-wallpaper-save-btn" @click="saveHomeWallpaper">保存</button>
                                <input type="file" accept="image/*" @change="uploadHomeWallpaper" style="display: none;" ref="homeWallpaperFile">
                                <button class="lock-wallpaper-save-btn" style="background: #f2f2f7; color: #333; border: 1px solid #ddd;" @click="$refs.homeWallpaperFile.click()">上传</button>
                            </div>
                        </div>

                        <div class="setting-item setting-item-full">
                            <div class="setting-info">
                                <div class="setting-label">我的背景</div>
                                <div class="setting-desc">和「我的收藏」同级设置，支持链接、预览和清除</div>
                            </div>
                            <div class="lock-wallpaper-setting" style="display:block;width:100%;margin-top:10px;">
                                <div style="display:flex;gap:10px;align-items:center;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:10px;">
                                    <input
                                        name="sp_field_200"
                                        id="sp-field-200"
                                        type="url"
                                        class="lock-wallpaper-input"
                                        v-model="mineCollectionBgInput"
                                        placeholder="粘贴背景图链接（https://...）"
                                        style="flex:1;border-radius:12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);padding:10px 12px;"
                                    >
                                    <button class="lock-wallpaper-save-btn" @click="applyMineCollectionBgLink" style="border-radius:12px;padding:10px 14px;">应用</button>
                                    <button class="lock-color-save-btn" @click="clearMineCollectionBg" style="border-radius:12px;padding:10px 14px;">清除</button>
                                </div>
                                <div style="margin-top:10px;height:72px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);overflow:hidden;position:relative;">
                                    <div v-if="mineCollectionBg" :style="{ position:'absolute', inset:0, background: `url(${mineCollectionBg}) center/cover no-repeat` }"></div>
                                    <div :style="{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(0,0,0,.25), rgba(0,0,0,.08))' }"></div>
                                    <div style="position:relative;z-index:1;height:100%;display:flex;align-items:center;padding:0 12px;font-size:12px;color:rgba(255,255,255,0.92);">
                                        {{ mineCollectionBg ? '已设置背景（预览）' : '未设置收藏背景' }}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 主界面毛玻璃开关 -->
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-label">毛玻璃开关</div>
                                <div class="setting-desc">开启后主界面相关区域全毛玻璃</div>
                            </div>
                            <div class="setting-toggle" @click="toggleHomeGlass">
                                <div class="toggle-slider" :class="{ active: enableHomeGlass }">
                                    <div class="toggle-thumb"></div>
                                </div>
                            </div>
                        </div>

                        <!-- 状态栏隐藏 -->
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-label">状态栏隐藏</div>
                                <div class="setting-desc">开启后隐藏顶部时间/信号电量</div>
                            </div>
                            <div class="setting-toggle" @click="toggleHideStatusBar">
                                <div class="toggle-slider" :class="{ active: enableHideStatusBar }">
                                    <div class="toggle-thumb"></div>
                                </div>
                            </div>
                        </div>

                        <!-- 苹果刘海屏适配 -->
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-label">苹果刘海屏适配</div>
                                <div class="setting-desc">根据安全区域自动调整顶部位置</div>
                            </div>
                            <div class="setting-toggle" @click="toggleNotchAdaptation">
                                <div class="toggle-slider" :class="{ active: enableNotchAdaptation }">
                                    <div class="toggle-thumb"></div>
                                </div>
                            </div>
                        </div>

                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-label">文字颜色</div>
                                <div class="setting-desc">设置主界面/全局文字颜色</div>
                            </div>
                            <div class="lock-color-setting">
                                <input name="sp_field_155" id="sp-field-155" type="color" class="lock-color-input" v-model="homeTextColorInput">
                                <button class="lock-color-save-btn" @click="saveHomeTextColor">保存</button>
                            </div>
                        </div>

                        <div
                            class="home-main-preview-phone"
                            :class="{ 'home-glass-mode': enableHomeGlass }"
                            :style="{
                                backgroundImage: homeWallpaperInput ? ('url(' + homeWallpaperInput + ')') : 'none',
                                color: homeTextColorInput,
                                fontFamily: globalSelectedFont || 'inherit'
                            }"
                        >
                            <div class="home-main-preview-status">
                                <span class="home-main-preview-time">12:34</span>
                                <span class="home-main-preview-icons">▮▮▮  WiFi  ▮▮▮</span>
                            </div>

                            <div class="home-main-preview-grid">
                                <div class="home-main-preview-photo"> </div>
                                <div class="home-main-preview-sticker-left"> </div>
                                <div class="home-main-preview-app-right"> </div>
                                <div class="home-main-preview-dock">Dock</div>
                            </div>
                        </div>
</div>

</template>

<script>
import { inject } from 'vue';

export default {
    name: 'HomeScreenTheme',
    setup() {
        return inject('globalState');
    }
}
</script>
