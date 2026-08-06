<template>
<!-- 锁屏设置卡片 -->
                <div class="card theme-card">
                    <div class="theme-card-header">
                        <i class="fas fa-lock"></i>
                        <span>锁屏设置</span>
                    </div>
                    <div class="lock-screen-setting">
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-label">启用锁屏</div>
                                <div class="setting-desc">打开应用时显示锁屏界面</div>
                            </div>
                            <div class="setting-toggle" @click="toggleLockScreen">
                                <div class="toggle-slider" :class="{ active: enableLockScreen }">
                                    <div class="toggle-thumb"></div>
                                </div>
                            </div>
                        </div>
                        <div class="setting-item" v-if="enableLockScreen">
                            <div class="setting-info">
                                <div class="setting-label">设置密码</div>
                                <div class="setting-desc">请设置四位数字密码</div>
                            </div>
                            <div class="password-setting">
                                <input name="sp_field_146" id="sp-field-146" type="password" class="password-input" v-model="passwordSetting" placeholder="输入4位数字" maxlength="4" @input="validatePassword">
                                <button class="password-save-btn" @click="savePassword" :disabled="!isPasswordValid">保存</button>
                            </div>
                        </div>
                        <div class="setting-item setting-item-full">
                            <div class="setting-info">
                                <div class="setting-label">字体</div>
                                <div class="setting-desc">设置锁屏界面的字体</div>
                            </div>
                            <div class="font-setting">
                                <div class="font-cards-container">
                                    <div 
                                        v-for="font in fonts" 
                                        :key="font.fontId" 
                                        class="font-card"
                                        :class="{ active: selectedFont === font.fontFamily }"
                                        @click="selectFont(font); console.log('点击字体卡片:', font.fontFamily)"
                                        :style="{ fontFamily: font.fontFamily }"
                                    >
                                        <div class="font-card-row font-card-name">{{ font.displayName }}</div>
                                        <div class="font-card-row font-card-english">ABCabc</div>
                                        <div class="font-card-row font-card-number">123</div>
                                    </div>
                                </div>
                                <div class="font-actions">
                                    <div class="font-import">
                                        <input name="sp_field_147" id="sp-field-147" type="file" accept=".ttf" @change="importCustomFont" ref="fontFileInput" style="display: none;">
                                        <button class="font-import-btn" @click="showFontImportDialog = true">导入字体</button>
                                    </div>
                                    <button class="font-save-btn" @click="saveFont">保存</button>
                                </div>
                                
                                <!-- 字体导入对话框 -->
                                <div v-if="showFontImportDialog" class="font-import-dialog">
                                    <div class="font-import-dialog-content">
                                        <h3>导入字体</h3>
                                        <div class="font-import-form">
                                            <div class="form-group">
                                                <label>字体名称</label>
                                                <input name="sp_field_148" id="sp-field-148" type="text" v-model="newFontName" placeholder="输入字体名称">
                                            </div>
                                            <div class="form-group">
                                                <label>字体链接 (TTF格式)</label>
                                                <input name="sp_field_149" id="sp-field-149" type="text" v-model="newFontUrl" placeholder="输入TTF字体链接">
                                            </div>
                                            <div class="form-actions">
                                                <button class="cancel-btn" @click="showFontImportDialog = false">取消</button>
                                                <button class="confirm-btn" @click="addFontByUrl">确定</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-label">个性签名</div>
                                <div class="setting-desc">设置锁屏界面的个性签名</div>
                            </div>
                            <div class="signature-setting">
                                <input name="sp_field_150" id="sp-field-150" type="text" class="signature-input" v-model="signatureSetting" placeholder="输入个性签名">
                                <button class="signature-save-btn" @click="saveSignature">保存</button>
                            </div>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-label">锁屏壁纸</div>
                                <div class="setting-desc">设置锁屏界面的背景图片</div>
                            </div>
                            <div class="lock-wallpaper-setting" style="display: flex; gap: 8px;">
                                <input name="sp_field_151" id="sp-field-151" type="text" class="lock-wallpaper-input" v-model="lockWallpaperInput" placeholder="输入图片URL">
                                <button class="lock-wallpaper-save-btn" @click="saveLockWallpaper">保存</button>
                                <input type="file" accept="image/*" @change="uploadLockWallpaper" style="display: none;" ref="lockWallpaperFile">
                                <button class="lock-wallpaper-save-btn" style="background: #f2f2f7; color: #333; border: 1px solid #ddd;" @click="$refs.lockWallpaperFile.click()">上传</button>
                            </div>
                        </div>
                        <div class="setting-item">
                            <div class="setting-info">
                                <div class="setting-label">日期时间颜色</div>
                                <div class="setting-desc">设置锁屏界面的日期时间颜色</div>
                            </div>
                            <div class="lock-color-setting">
                                <input name="sp_field_152" id="sp-field-152" type="color" class="lock-color-input" v-model="lockDateTimeColor">
                                <button class="lock-color-save-btn" @click="saveLockDateTimeColor">保存</button>
                            </div>
                        </div>
                        <!-- 锁屏预览（美化项关闭密码时仍可预览时间/签名/壁纸） -->
                        <div class="lock-screen-preview">
                            <div class="lock-preview-header">预览</div>
                            <div class="lock-preview-container" :style="{ backgroundImage: `url(${lockWallpaper})` }">
                                <div class="lock-preview-time" :style="{ color: lockDateTimeColor }">
                                <div class="lock-preview-clock">12:00</div>
                                <div class="lock-preview-date">2026年3月17日</div>
                                <div class="lock-preview-signature">{{ lockSignature }}</div>
                            </div>
                                <div v-if="enableLockScreen" class="lock-preview-password">
                                    <div class="lock-preview-dots">
                                        <div class="lock-preview-dot"></div>
                                        <div class="lock-preview-dot"></div>
                                        <div class="lock-preview-dot"></div>
                                        <div class="lock-preview-dot"></div>
                                    </div>
                                    <div class="lock-preview-keyboard">
                                        <div class="lock-preview-row">
                                            <div class="lock-preview-key"></div>
                                            <div class="lock-preview-key"></div>
                                            <div class="lock-preview-key"></div>
                                        </div>
                                        <div class="lock-preview-row">
                                            <div class="lock-preview-key"></div>
                                            <div class="lock-preview-key"></div>
                                            <div class="lock-preview-key"></div>
                                        </div>
                                        <div class="lock-preview-row">
                                            <div class="lock-preview-key"></div>
                                            <div class="lock-preview-key"></div>
                                            <div class="lock-preview-key"></div>
                                        </div>
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
    name: 'LockScreenTheme',
    setup() {
        return inject('globalState');
    }
}
</script>
