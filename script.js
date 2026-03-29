//=========================================================================
// == SOUL OS SCRIPT (FIXED VERSION)
// =========================================================================
import { ref, computed, onMounted, watch, reactive, nextTick } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import { useFeed } from './feed.js';
import { useMate } from './mate.js';
import { useNotice } from './notice.js';
import { useGames } from './games.js';
import { useLive } from './live.js';
import { usePeek } from './peek.js';
import { useRead } from './read.js';


export function setupApp() {
    console.log('setup start'); 
    
    // 锁屏状态
    const enableLockScreen = ref(localStorage.getItem('enableLockScreen') !== 'false');
    const isLockScreenVisible = ref(enableLockScreen.value);

    // Theme（非锁屏）相关：清空主版本缓存，方便你重做这一块
    // 注意：锁屏相关 key 不动
    try {
        localStorage.removeItem('themeMode');
        localStorage.removeItem('themeWallpaper');
    } catch (e) {
        // ignore
    }
    
    // 页面切换（0=角色手机 1=主页 2=第二页）
    const currentPage = ref(0);
    const homePages = ref(null);
  
    // 这些核心状态会在 mounted 初始化链路中被引用，
    // 需要尽早初始化，避免 setup 中途异常导致 TDZ 报错。
    const soulLinkGroups = ref([]);
    const soulLinkPet = ref({
        name: 'PIXEL PET',
        emoji: '🐾',
        energy: 80,
        hunger: 20,
        mood: 70,
        lastTick: Date.now()
    });
    const userAvatar = ref('');

    
    // 照片小组件
    const photoWidgetDate = ref({
        day: '',
        weekday: ''
    });
    const photoWidgetText = ref({
        line1: localStorage.getItem('photoWidgetText1') || 'the storm is',
        line2: localStorage.getItem('photoWidgetText2') || 'COMING'
    });
    const photoWidgetPhotos = ref([
        { url: localStorage.getItem('photoWidgetPhoto0') || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=300&fit=crop' },
        { url: localStorage.getItem('photoWidgetPhoto1') || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=300&fit=crop' },
        { url: localStorage.getItem('photoWidgetPhoto2') || 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=300&fit=crop' },
        { url: localStorage.getItem('photoWidgetPhoto3') || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=300&fit=crop' }
    ]);
    
    // 贴纸小组件
    const stickerWidgetUrl = ref(localStorage.getItem('stickerWidgetUrl') || 'https://img.heliar.top/file/1773774569024_retouch_2026031803084004.png');
    
    // 胶囊框文字
    const capsuleTexts = ref({
        black: localStorage.getItem('capsuleTextBlack') || '缘悭一面',
        gray: localStorage.getItem('capsuleTextGray') || '须臾故人'
    });
    
    // 胶囊框文字编辑对话框
    const showCapsuleEditDialog = ref(false);
    const currentCapsuleType = ref('');
    const capsuleEditText = ref('');
    
    // 灵动岛文字
    const dashboardTexts = ref({
        weekday: localStorage.getItem('dashboardWeekday') || '星期一',
        slogan: localStorage.getItem('dashboardSlogan') || '✨ with you ★.',
        weather: localStorage.getItem('dashboardWeather') || '北京 4°C 晴'
    });
    const showDashboardEditDialog = ref(false);
    const currentDashboardTextType = ref('');
    const dashboardEditText = ref('');
    
    // 更换贴纸小组件图片
    const changeStickerWidgetImage = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    compressAvatarImage(event.target.result, 'widgetSticker', (croppedDataUrl) => {
                        stickerWidgetUrl.value = croppedDataUrl;
                        try {
                            localStorage.setItem('stickerWidgetUrl', croppedDataUrl);
                        } catch (e) {
                            console.warn('图片太大，无法保存到本地存储');
                            alert('贴纸已更换，但无法永久保存（超出存储限制）');
                        }
                    });
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };
    

    
    // 照片小组件文字编辑对话框
    const showPhotoWidgetEditDialog = ref(false);
    const photoWidgetEditText1 = ref('');
    const photoWidgetEditText2 = ref('');
    

    
    // 更新照片小组件日期
    const updatePhotoWidgetDate = () => {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const weekday = weekdays[now.getDay()];
        
        photoWidgetDate.value = {
            day: `${month}/${day}`,
            weekday: weekday
        };
    };
    
    // 更换照片小组件图片
    const changePhotoWidgetImage = (index) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    compressAvatarImage(ev.target.result, 'widgetPhoto', (croppedDataUrl) => {
                            photoWidgetPhotos.value = photoWidgetPhotos.value.map((p, i) => (
                                i === index ? { ...p, url: croppedDataUrl } : p
                            ));
                        try {
                            localStorage.setItem(`photoWidgetPhoto${index}`, croppedDataUrl);
                        } catch (e) {
                            console.warn('图片太大，无法保存到本地存储');
                            alert('图片已更换，但无法永久保存（超出存储限制）');
                        }
                    });
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    };
    
    // 压缩图片
    const compressImage = (file, maxWidth, quality) => {
        return new Promise((resolve) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            
            img.src = URL.createObjectURL(file);
        });
    };
    
    // 编辑照片小组件文字 - 打开对话框
    const editPhotoWidgetText = () => {
        photoWidgetEditText1.value = photoWidgetText.value.line1;
        photoWidgetEditText2.value = photoWidgetText.value.line2;
        showPhotoWidgetEditDialog.value = true;
    };
    
    // 关闭照片小组件文字编辑对话框
    const closePhotoWidgetEditDialog = () => {
        showPhotoWidgetEditDialog.value = false;
        photoWidgetEditText1.value = '';
        photoWidgetEditText2.value = '';
    };
    
    // 保存照片小组件文字
    const savePhotoWidgetText = () => {
        photoWidgetText.value.line1 = photoWidgetEditText1.value;
        photoWidgetText.value.line2 = photoWidgetEditText2.value;
        localStorage.setItem('photoWidgetText1', photoWidgetEditText1.value);
        localStorage.setItem('photoWidgetText2', photoWidgetEditText2.value);
        showPhotoWidgetEditDialog.value = false;
    };
    
    // 编辑胶囊框文字 - 打开对话框
    const editCapsuleText = (type) => {
        currentCapsuleType.value = type;
        capsuleEditText.value = capsuleTexts.value[type];
        showCapsuleEditDialog.value = true;
    };
    
    // 关闭胶囊框文字编辑对话框
    const closeCapsuleEditDialog = () => {
        showCapsuleEditDialog.value = false;
        currentCapsuleType.value = '';
        capsuleEditText.value = '';
    };
    
    // 保存胶囊框文字
    const saveCapsuleText = () => {
        if (currentCapsuleType.value) {
            capsuleTexts.value[currentCapsuleType.value] = capsuleEditText.value;
            localStorage.setItem(`capsuleText${currentCapsuleType.value.charAt(0).toUpperCase() + currentCapsuleType.value.slice(1)}`, capsuleEditText.value);
            showCapsuleEditDialog.value = false;
        }
    };
    
    // 编辑灵动岛文字
    const editDashboardText = (type) => {
        currentDashboardTextType.value = type;
        dashboardEditText.value = dashboardTexts.value[type];
        showDashboardEditDialog.value = true;
    };
    
    // 关闭灵动岛文字编辑对话框
    const closeDashboardEditDialog = () => {
        showDashboardEditDialog.value = false;
        currentDashboardTextType.value = '';
        dashboardEditText.value = '';
    };
    
    // 保存灵动岛文字
    const saveDashboardText = () => {
        if (currentDashboardTextType.value) {
            dashboardTexts.value[currentDashboardTextType.value] = dashboardEditText.value;
            localStorage.setItem(`dashboard${currentDashboardTextType.value.charAt(0).toUpperCase() + currentDashboardTextType.value.slice(1)}`, dashboardEditText.value);
            showDashboardEditDialog.value = false;
        }
    };
    
    // 切换锁屏开关
    const toggleLockScreen = () => {
        enableLockScreen.value = !enableLockScreen.value;
        localStorage.setItem('enableLockScreen', enableLockScreen.value);
        
        // 如果关闭锁屏，确保锁屏界面隐藏
        if (!enableLockScreen.value && isLockScreenVisible.value) {
            isLockScreenVisible.value = false;
        }
    };
    
    // 锁定屏幕
    const lockScreen = () => {
        if (!enableLockScreen.value) return;
        isLockScreenVisible.value = true;
        // 重置锁屏样式
        setTimeout(() => {
            const lockScreen = document.querySelector('.lockscreen');
            const blurBg = document.querySelector('.lock-screen-background-blur');
            if (lockScreen) {
                lockScreen.style.transform = 'translateY(0)';
            }
            if (blurBg) {
                blurBg.style.opacity = '1';
            }
        }, 100);
    };
    
    // 密码相关
    const password = ref('');
    const correctPassword = ref(localStorage.getItem('lockScreenPassword') || '1234'); // 从localStorage读取密码，默认1234
    const passwordSetting = ref('');
    const isPasswordValid = ref(false);
    
    // 日期相关
const chineseDate = ref('');
const fullDate = ref('');
const lockSignature = ref(localStorage.getItem('lockSignature') || '每一天都是新的开始');
const signatureSetting = ref(lockSignature.value);

// 字体相关
const fonts = ref([
    {
        name: '默认字体1',
        displayName: '默认字体1',
        fontFamily: 'CustomFont1',
        url: 'https://files.catbox.moe/5r7lc4.ttf',
        fontId: 'font1'
    },
    {
        name: '默认字体2',
        displayName: '默认字体2',
        fontFamily: 'CustomFont2',
        url: 'https://files.catbox.moe/tqrgcm.ttf',
        fontId: 'font2'
    },
    {
        name: '默认字体3',
        displayName: '默认字体3',
        fontFamily: 'CustomFont3',
        url: 'https://files.catbox.moe/rmahta.ttf',
        fontId: 'font3'
    },
    {
        name: '默认字体4',
        displayName: '默认字体4',
        fontFamily: 'CustomFont4',
        url: 'https://files.catbox.moe/x9ifle.ttf',
        fontId: 'font4'
    },
    {
        name: '默认字体5',
        displayName: '默认字体5',
        fontFamily: 'CustomFont5',
        url: 'https://files.catbox.moe/t94xpc.ttf',
        fontId: 'font5'
    },
    {
        name: '默认字体6',
        displayName: '默认字体6',
        fontFamily: 'CustomFont6',
        url: 'https://files.catbox.moe/m8ydxq.ttf',
        fontId: 'font6'
    },
    {
        name: '默认字体7',
        displayName: '默认字体7',
        fontFamily: 'CustomFont7',
        url: 'https://files.catbox.moe/a31kd3.ttf',
        fontId: 'font7'
    },
    {
        name: '默认字体8',
        displayName: '默认字体8',
        fontFamily: 'CustomFont8',
        url: 'https://files.catbox.moe/5r7lc4.ttf',
        fontId: 'font8'
    }
]);
const selectedFont = ref(localStorage.getItem('lockFont') || 'CustomFont1');
// 全局字体（锁屏以外）
const globalSelectedFont = ref(localStorage.getItem('globalFont') || 'CustomFont1');
const loadedFonts = ref(new Set());
const customFontCount = ref(8);
const showFontImportDialog = ref(false);
const newFontName = ref('');
const newFontUrl = ref('');

// 主界面全局字体：从本地导入 .ttf
const globalFontFileInput = ref(null);

// 动态加载TTF字体
const loadFontCSS = (font) => {
    console.log('加载字体:', font.fontFamily, 'URL:', font.url);
    
    // 移除之前的字体样式
    const oldStyle = document.getElementById('font-style');
    if (oldStyle) {
        oldStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = 'font-style';
    style.textContent = `
        @font-face {
            font-family: 'CustomFont';
            src: url('${font.url}') format('truetype');
            font-weight: normal;
            font-style: normal;
        }
        
        /* 确保字体在锁屏界面生效 */
        .lock-time, .lock-preview-time {
            font-family: 'CustomFont', sans-serif !important;
        }
        
        /* 确保字体在预览界面生效 */
        .lock-preview-clock, .lock-preview-date, .lock-preview-signature {
            font-family: 'CustomFont', sans-serif !important;
        }
        
        /* 确保字体在主界面生效 */
        .lock-clock, .lock-date, .lock-signature {
            font-family: 'CustomFont', sans-serif !important;
        }
    `;
    document.head.appendChild(style);
    console.log('字体加载完成:', font.fontFamily);
    
    // 测试字体是否加载成功
    setTimeout(() => {
        const testDiv = document.createElement('div');
        testDiv.style.fontFamily = 'CustomFont, sans-serif';
        testDiv.style.position = 'absolute';
        testDiv.style.left = '-9999px';
        testDiv.textContent = '测试字体';
        document.body.appendChild(testDiv);
        
        const computedStyle = window.getComputedStyle(testDiv);
        console.log('字体应用测试:', font.fontFamily, 'computed font-family:', computedStyle.fontFamily);
        
        document.body.removeChild(testDiv);
    }, 1000);
};

// 加载全局字体（锁屏区域不会被这些选择器命中）
const loadGlobalFontCSS = (font) => {
    console.log('加载全局字体:', font.fontFamily, 'URL:', font.url);

    const oldStyle = document.getElementById('global-font-style');
    if (oldStyle) oldStyle.remove();

    const style = document.createElement('style');
    style.id = 'global-font-style';
    style.textContent = `
        @font-face {
            font-family: '${font.fontFamily}';
            src: url('${font.url}') format('truetype');
            font-weight: normal;
            font-style: normal;
        }

        /* 锁屏区域不命中：只覆盖主页/应用内的文字 */
        #app .home-main-preview-phone{
            font-family: '${font.fontFamily}', sans-serif !important;
        }

        /* 覆盖组件里写死的 font-family（排除图标/输入/按钮以免破坏图标） */
        #app .homescreen *:not(i):not(.fa):not(.fas):not(.far):not(.fab):not(button):not(input):not(textarea),
        #app .home-pages *:not(i):not(.fa):not(.fas):not(.far):not(.fab):not(button):not(input):not(textarea),
        #app .app-view *:not(i):not(.fa):not(.fas):not(.far):not(.fab):not(button):not(input):not(textarea),
        #app .app-content *:not(i):not(.fa):not(.fas):not(.far):not(.fab):not(button):not(input):not(textarea),
        #app .dock *:not(i):not(.fa):not(.fas):not(.far):not(.fab):not(button):not(input):not(textarea),
        #app .page-indicator-container *:not(i):not(.fa):not(.fas):not(.far):not(.fab):not(button):not(input):not(textarea) {
            font-family: '${font.fontFamily}', sans-serif !important;
        }
    `;
    document.head.appendChild(style);
};

// 锁屏样式相关
const lockWallpaper = ref(localStorage.getItem('lockWallpaper') || 'https://img.heliar.top/file/1773753630799_1773753603638.png');
const lockWallpaperInput = ref(lockWallpaper.value);
const lockDateTimeColor = ref(localStorage.getItem('lockDateTimeColor') || '#000000');
const lockFont = ref(localStorage.getItem('lockFont') || 'CustomFont1');

// 主界面样式相关（不覆盖锁屏）
const homeWallpaper = ref(localStorage.getItem('homeWallpaper') || '');
const homeWallpaperInput = ref(homeWallpaper.value);
const homeTextColor = ref(localStorage.getItem('homeTextColor') || '#000000');
const homeTextColorInput = ref(homeTextColor.value);

const saveHomeWallpaper = () => {
    homeWallpaper.value = homeWallpaperInput.value;
    localStorage.setItem('homeWallpaper', homeWallpaperInput.value);
};

const saveHomeTextColor = () => {
    homeTextColor.value = homeTextColorInput.value;
    localStorage.setItem('homeTextColor', homeTextColorInput.value);
};

// 主界面毛玻璃开关（控制 dock / 翻页键 / 灵动岛 / 胶囊 / app 图标底板）
const enableHomeGlass = ref(localStorage.getItem('enableHomeGlass') !== 'false');
const toggleHomeGlass = () => {
    enableHomeGlass.value = !enableHomeGlass.value;
    localStorage.setItem('enableHomeGlass', enableHomeGlass.value ? 'true' : 'false');
};

// 状态栏隐藏开关
const enableHideStatusBar = ref(localStorage.getItem('enableHideStatusBar') === 'true');
const toggleHideStatusBar = () => {
    enableHideStatusBar.value = !enableHideStatusBar.value;
    localStorage.setItem('enableHideStatusBar', enableHideStatusBar.value ? 'true' : 'false');
};

// 苹果刘海屏适配开关（控制顶部 safe-area 偏移）
const enableNotchAdaptation = ref(localStorage.getItem('enableNotchAdaptation') !== 'false');
const toggleNotchAdaptation = () => {
    enableNotchAdaptation.value = !enableNotchAdaptation.value;
    localStorage.setItem('enableNotchAdaptation', enableNotchAdaptation.value ? 'true' : 'false');
};

// 导入自定义字体
const importCustomFont = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const fontData = e.target.result;
        const fontId = `custom_${customFontCount.value}`;
        const fontFamily = `CustomFont${customFontCount.value}`;
        
        const newFont = {
            name: `自定义字体${customFontCount.value - 7}`,
            displayName: `自定义字体${customFontCount.value - 7}`,
            fontFamily: fontFamily,
            url: fontData,
            fontId: fontId,
            isCustom: true
        };
        
        fonts.value.push(newFont);
        customFontCount.value++;
        
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-family: '${fontFamily}';
                src: url('${fontData}') format('truetype');
                font-weight: normal;
                font-style: normal;
            }
        `;
        document.head.appendChild(style);
        loadedFonts.value.add(fontId);
    };
    reader.readAsDataURL(file);
};

// 选择字体时加载对应的CSS
const selectFont = (font) => {
    console.log('选择字体:', font.fontFamily);
    selectedFont.value = font.fontFamily;
    loadFontCSS(font);
    console.log('selectedFont:', selectedFont.value);
    console.log('字体URL:', font.url);
};

// 选择全局字体（锁屏不受影响）
const selectGlobalFont = (font) => {
    globalSelectedFont.value = font.fontFamily;
    localStorage.setItem('globalFont', globalSelectedFont.value);
    loadGlobalFontCSS(font);
};

// 通过URL添加字体
const addFontByUrl = () => {
    if (!newFontName.value || !newFontUrl.value) {
        alert('请输入字体名称和链接');
        return;
    }
    
    if (!newFontUrl.value.endsWith('.ttf')) {
        alert('请输入TTF格式的字体链接');
        return;
    }
    
    const fontId = `custom_${customFontCount.value}`;
    const fontFamily = `CustomFont${customFontCount.value}`;
    
    const newFont = {
        name: newFontName.value,
        displayName: newFontName.value,
        fontFamily: fontFamily,
        url: newFontUrl.value,
        fontId: fontId,
        isCustom: true
    };
    
    fonts.value.push(newFont);
    customFontCount.value++;
    
    // 关闭对话框
    showFontImportDialog.value = false;
    
    // 重置输入
    newFontName.value = '';
    newFontUrl.value = '';
    
    console.log('通过URL添加字体:', newFont.displayName);
};

// 组件挂载后初始化
onMounted(() => {
    console.log('组件挂载完成');
    console.log('homePages引用:', homePages.value);
    
    // 更新页面位置的函数
    const updateHomePagePosition = () => {
        console.log('更新页面位置:', currentPage.value);
        // 直接获取DOM元素
        const homePagesElement = document.querySelector('.home-pages');
        if (homePagesElement) {
            console.log('获取到homePages元素');
            homePagesElement.style.transform = `translateX(-${currentPage.value * 100}%)`;
            console.log('设置transform:', `translateX(-${currentPage.value * 100}%)`);
        } else {
            console.log('无法获取homePages元素');
        }
    };
    
    // 获取home-pages元素
    const homePagesElement = document.querySelector('.home-pages');
    console.log('获取到的homePages元素:', homePagesElement);
    
    if (homePagesElement) {
        console.log('成功获取homePages元素');
        
        // 已移除：滑动/拖拽切换主屏页面的逻辑
        // 现在只保留翻页键（prevPage / nextPage）切换页面。
    } else {
        console.log('无法获取homePages元素');
    }
    
    // 初始化照片小组件日期
    updatePhotoWidgetDate();
    // 每分钟更新一次日期
    setInterval(updatePhotoWidgetDate, 60000);
    
    // 初始化页面位置
    updateHomePagePosition();
    
    // 监听currentPage变化
    watch(currentPage, (newValue) => {
        console.log('currentPage变化:', newValue);
        updateHomePagePosition();
    });
});

// 上一页
const prevPage = () => {
    console.log('点击上一页按钮');
    if (currentPage.value > 0) {
        currentPage.value--;
    }
};

// 下一页
const nextPage = () => {
    console.log('点击下一页按钮');
    if (currentPage.value < 2) {
        currentPage.value++;
    }
};

// 保存字体设置
const saveFont = () => {
    localStorage.setItem('lockFont', selectedFont.value);
    console.log('字体保存成功:', selectedFont.value);
};
    
    // 添加密码
    const addPassword = (digit) => {
        if (password.value.length < 4) {
            password.value += digit;
            // 当输入4位密码时，验证密码
            if (password.value.length === 4) {
                setTimeout(() => {
                    if (password.value === correctPassword.value) {
                        unlockScreen();
                    } else {
                        // 密码错误，清空密码
                        password.value = '';
                        // 可以添加错误提示动画
                    }
                }, 500);
            }
        }
    };
    
    // 验证密码
    const validatePassword = () => {
        // 验证是否为4位数字
        isPasswordValid.value = /^\d{4}$/.test(passwordSetting.value);
    };
    
    // 保存密码
    const savePassword = () => {
        if (isPasswordValid.value) {
            correctPassword.value = passwordSetting.value;
            localStorage.setItem('lockScreenPassword', passwordSetting.value);
            // 可以添加保存成功提示
            passwordSetting.value = '';
        }
    };
    
    // 保存个性签名
    const saveSignature = () => {
        lockSignature.value = signatureSetting.value;
        localStorage.setItem('lockSignature', signatureSetting.value);
    };
    
    // 保存锁屏壁纸
    const saveLockWallpaper = () => {
        lockWallpaper.value = lockWallpaperInput.value;
        localStorage.setItem('lockWallpaper', lockWallpaperInput.value);
    };
    
    // 保存日期时间颜色
    const saveLockDateTimeColor = () => {
        localStorage.setItem('lockDateTimeColor', lockDateTimeColor.value);
    };
    

    
    // 删除密码
    const removePassword = () => {
        if (password.value.length > 0) {
            password.value = password.value.slice(0, -1);
        }
    };
    
    // 解锁屏幕
    const unlockScreen = () => {
        // 获取锁屏和毛玻璃背景元素
        const lockScreen = document.querySelector('.lockscreen');
        const blurBg = document.querySelector('.lock-screen-background-blur');
        
        // 让锁屏界面向下滑动
        if (lockScreen) {
            lockScreen.style.transform = 'translateY(100%)';
        }
        
        // 让毛玻璃背景淡出
        if (blurBg) {
            blurBg.style.opacity = '0';
        }
        
        // 动画结束后，设置isLockScreenVisible为false
        setTimeout(() => {
            isLockScreenVisible.value = false;
            password.value = ''; // 清空密码
        }, 300);
    };
    
    // 触摸事件相关
    const touchStartY = ref(0);
    const touchEndY = ref(0);
    
    // 触摸开始
    const lockTouchStart = (e) => {
        touchStartY.value = e.touches[0].clientY;
    };
    
    // 触摸移动
    const lockTouchMove = (e) => {
        touchEndY.value = e.touches[0].clientY;
    };
    
    // 触摸结束
    const lockTouchEnd = () => {
        // 计算滑动距离
        const distance = touchStartY.value - touchEndY.value;
        // 向上滑动超过50px且密码正确时解锁
        if (distance > 50 && password.value === correctPassword.value) {
            unlockScreen();
        }
    };
    
    // 鼠标事件相关
    const lockMouseDown = (e) => {
        touchStartY.value = e.clientY;
    };
    
    const lockMouseMove = (e) => {
        touchEndY.value = e.clientY;
    };
    
    const lockMouseUp = () => {
        // 计算滑动距离
        const distance = touchStartY.value - touchEndY.value;
        // 向上滑动超过50px且密码正确时解锁
        if (distance > 50 && password.value === correctPassword.value) {
            unlockScreen();
        }
    };
    
    // 日期时间相关
    const currentTime = ref('');
    const currentDate = ref('');
    const currentDay = ref('');
    const currentMonth = ref('');
    const currentMonthEn = ref('');
    const currentDayOfMonth = ref('');
    
    // 更新时间
    const updateTime = () => {
        const now = new Date();
        
        // 时间
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        currentTime.value = `${hours}:${minutes}`;
        
        // 日期
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDate.value = now.toLocaleDateString('zh-CN', options);
        
        // 星期
        const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        currentDay.value = days[now.getDay()];
        
        // 月份
        const months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
        currentMonth.value = months[now.getMonth()];

        // 月份（英文，用于音乐组件日期占位）
        const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        currentMonthEn.value = monthsEn[now.getMonth()];
        
        // 日期
        currentDayOfMonth.value = now.getDate().toString();
        
        // 公历日期（2026年3月17日格式）
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const day = now.getDate();
        fullDate.value = `${year}年${month}月${day}日`;
        
        // 汉字日期
        const chineseMonths = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
        const chineseDays = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十'];
        chineseDate.value = `${chineseMonths[now.getMonth()]}月${chineseDays[now.getDate()]}`;
    };
    
    // 初始化时间
    updateTime();
    
    // 每秒更新时间
    setInterval(updateTime, 1000);
    
    // IndexedDB 初始化
    let db = null;
    const DB_NAME = 'SoulOS_DB';
    const DB_VERSION = 1;
    
    const initDB = () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onerror = () => {
                console.error('IndexedDB 打开失败');
                reject(request.error);
            };
            
            request.onsuccess = () => {
                db = request.result;
                console.log('IndexedDB 打开成功');
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                const database = event.target.result;
                
                if (!database.objectStoreNames.contains('soulLinkMessages')) {
                    database.createObjectStore('soulLinkMessages', { keyPath: 'id' });
                }
                
                if (!database.objectStoreNames.contains('soulLinkGroups')) {
                    database.createObjectStore('soulLinkGroups', { keyPath: 'id' });
                }
                
                if (!database.objectStoreNames.contains('archivedChats')) {
                    database.createObjectStore('archivedChats', { keyPath: 'id' });
                }
                
                if (!database.objectStoreNames.contains('settings')) {
                    database.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    };
    
    const dbGet = (storeName, key) => {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };
    
    const dbPut = (storeName, data) => {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    };
    
    const dbGetAll = (storeName) => {
        return new Promise((resolve, reject) => {
            if (!db) {
                reject(new Error('数据库未初始化'));
                return;
            }
            
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };
    
    try {
        // --- DATA (State) ---
        const deviceBatteryLevel = ref(null);
        const deviceBatteryCharging = ref(false);
        const deviceNetworkType = ref('');
        const deviceNetworkOnline = ref(true);
        const openedApp = ref(null);
        
        // 主屏幕状态 - 必须在openedApp定义之后
        const isHomeScreenVisible = computed(() => !isLockScreenVisible.value && !openedApp.value);

        watch(isHomeScreenVisible, (visible) => {
            if (visible) {
                nextTick(() => {
                    const el = document.querySelector('.home-pages');
                    if (el) el.style.transform = `translateX(-${currentPage.value * 100}%)`;
                });
            }
        });
        
        const isAiTyping = ref(false);
        const focusedOsMessageId = ref(null);
        const randomHexCode = ref('0x00000000');
        const isPlaying = ref(false);
        
        const generateRandomHex = () => {
            const hex = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase().padStart(8, '0');
            randomHexCode.value = `0x${hex}`;
        };
        
        const currentScreen = computed(() => {
             return openedApp.value ? openedApp.value.toLowerCase() : 'homescreen';
        });

        const deviceBatteryText = computed(() => {
            if (deviceBatteryLevel.value === null || Number.isNaN(deviceBatteryLevel.value)) {
                return '电量 --';
            }
            const suffix = deviceBatteryCharging.value ? ' 充电中' : '';
            return `电量 ${deviceBatteryLevel.value}%${suffix}`;
        });

        const deviceSignalText = computed(() => {
            if (!deviceNetworkOnline.value) {
                return '信号 无网络';
            }
            const raw = (deviceNetworkType.value || '').toLowerCase();
            const map = {
                'slow-2g': '2G',
                '2g': '2G',
                '3g': '3G',
                '4g': '4G',
                '5g': '5G',
                'wifi': 'WiFi',
                'ethernet': 'ETH'
            };
            const label = map[raw] || (raw ? raw.toUpperCase() : '在线');
            return `信号 ${label}`;
        });

        const updateBatteryStatus = (battery) => {
            if (!battery) return;
            deviceBatteryLevel.value = Math.round(battery.level * 100);
            deviceBatteryCharging.value = battery.charging;
        };

        const updateNetworkStatus = (connection) => {
            deviceNetworkOnline.value = navigator.onLine;
            if (!connection) {
                deviceNetworkType.value = '';
                return;
            }
            const type = connection.effectiveType || connection.type || '';
            deviceNetworkType.value = type;
        };

        const initDeviceStatus = () => {
            deviceNetworkOnline.value = navigator.onLine;
            if (typeof window !== 'undefined') {
                window.addEventListener('online', () => {
                    deviceNetworkOnline.value = true;
                    if (navigator.connection) {
                        updateNetworkStatus(navigator.connection);
                    }
                });
                window.addEventListener('offline', () => {
                    deviceNetworkOnline.value = false;
                });
            }
            if ('getBattery' in navigator) {
                navigator.getBattery().then((battery) => {
                    updateBatteryStatus(battery);
                    battery.addEventListener('levelchange', () => updateBatteryStatus(battery));
                    battery.addEventListener('chargingchange', () => updateBatteryStatus(battery));
                }).catch(() => {});
            }
            if ('connection' in navigator && navigator.connection) {
                updateNetworkStatus(navigator.connection);
                navigator.connection.addEventListener('change', () => updateNetworkStatus(navigator.connection));
            }
        };
        
        // Console App State
        const consoleLogs = ref([]);
        const profiles = ref([]);
        const activeProfileId = ref(null);
        const availableModels = ref([]);
        const fetchingModels = ref(false);

        // ==========================================================
        // --- Workshop App State ---
        // ==========================================================
        const activeWorkshopTab = ref('characters');
        
        // --- Characters Data ---
        const characters = ref([]); 
        const editingCharacter = ref(null); 
        
        // --- Worldbooks Data ---
        const worldbooks = ref([]);
        const editingWorldbook = ref(null);
        const activeWorldbookEntryId = ref(null);
        // 世界书导入相关状态
        const showWorldbookImport = ref(false);
        const importWorldbookName = ref('');
        const importFile = ref(null);
        const importMode = ref('replace');
        const swipedWorldbookId = ref(null);
        const expandedEntryIds = ref(new Set());

        // --- Presets Data ---
        const presets = ref([]);
        const editingPreset = ref(null);
        const swipedPresetId = ref(null);
        const presetImportInput = ref(null);
        const showBatchDeleteDialog = ref(false);
        const batchDeleteType = ref('characters');
        const batchDeleteSelections = ref([]);

        // --- Persistence Helpers ---
        const saveToStorage = (key, data) => {
            try { localStorage.setItem(key, JSON.stringify(data)); } 
            catch (e) { console.error(`Failed to save ${key}:`, e); }
        };

        const loadFromStorage = (key) => {
            const saved = localStorage.getItem(key);
            if (saved) {
                try { return JSON.parse(saved); } 
                catch (e) { console.error(`Failed to load ${key}:`, e); return []; }
            }
            return [];
        };

        // --- Character Actions ---
        const saveCharacters = () => saveToStorage('soulos_workshop_characters', characters.value);
        const loadCharacters = () => { 
            const loaded = loadFromStorage('soulos_workshop_characters'); 
            characters.value = Array.isArray(loaded) ? loaded.filter(c => c && c.id) : [];
        };

        const addNewCharacter = () => {
            const newId = Date.now().toString();
            const newCharacter = {
                id: newId,
                internalName: `Char_${newId}`,
                nickname: `新角色 ${characters.value.length + 1}`,
                name: `新角色 ${characters.value.length + 1}`,
                summary: '点击卡片进行编辑...', 
                avatarUrl: `https://placehold.co/100x100?text=Avatar`, 
                tags: ['新角色'],
                persona: '',
                kvData: [],
                openingLine: '',
                openingLines: [''],
                userPersona: '',
                worldbookIds: [],
                selectedPresetId: null,
                creator: '',
                version: '1.0'
            };
            characters.value.unshift(newCharacter);
            console.log('addNewCharacter: created new character with id:', newId);
        };

        const enableManualImageCrop = ref(true);
        const showImageCropModal = ref(false);
        const imageCropSource = ref('');
        const imageCropPreset = ref('avatar');
        const imageCropAspect = ref(1);
        const imageCropScale = ref(0.82);
        const imageCropRect = ref({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 }); // normalized [0,1]
        let imageCropDragState = null;
        let imageCropPendingCallback = null;

        const getImageCropPresetConfig = (preset) => {
            const presetMap = {
                avatar: { maxWidth: 400, maxHeight: 400, ratio: 1 },           // 头像 / 群头像
                background: { maxWidth: 1080, maxHeight: 1920, ratio: 9 / 16 }, // 聊天背景（竖屏）
                chatImage: { maxWidth: 960, maxHeight: 960, ratio: 4 / 3 },    // 聊天图片
                widgetPhoto: { maxWidth: 560, maxHeight: 840, ratio: 2 / 3 },  // 桌面照片小组件
                widgetSticker: { maxWidth: 520, maxHeight: 520, ratio: 1 },    // 桌面贴纸小组件
                free: { maxWidth: 960, maxHeight: 960, ratio: null }           // 不固定
            };
            return presetMap[preset] || presetMap.avatar;
        };
        const imageCropCanvasAspect = computed(() => {
            const ratio = Number(imageCropAspect.value) || 1;
            return Math.max(0.45, Math.min(1.8, ratio));
        });

        const resetImageCropRect = () => {
            const aspect = imageCropAspect.value;
            const scale = Math.max(0.45, Math.min(0.95, Number(imageCropScale.value) || 0.82));
            let w = 0.8 * scale;
            let h = 0.8 * scale;
            if (aspect && aspect > 0) {
                if (aspect >= 1) {
                    w = 0.86 * scale;
                    h = w / aspect;
                } else {
                    h = 0.86 * scale;
                    w = h * aspect;
                }
                if (w > 0.92) {
                    w = 0.92;
                    h = w / aspect;
                }
                if (h > 0.92) {
                    h = 0.92;
                    w = h * aspect;
                }
            }
            imageCropRect.value = {
                x: (1 - w) / 2,
                y: (1 - h) / 2,
                w,
                h
            };
        };

        const openImageCropModal = (dataUrl, preset, callback) => {
            imageCropSource.value = String(dataUrl || '');
            imageCropPreset.value = preset || 'avatar';
            imageCropPendingCallback = callback;
            const cfg = getImageCropPresetConfig(imageCropPreset.value);
            imageCropAspect.value = cfg.ratio || 1;
            imageCropScale.value = 0.82;
            resetImageCropRect();
            showImageCropModal.value = true;
        };

        const closeImageCropModal = () => {
            showImageCropModal.value = false;
            imageCropDragState = null;
            imageCropPendingCallback = null;
        };

        const onImageCropScaleChange = () => {
            resetImageCropRect();
        };

        const getEventClientXY = (e) => {
            if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
            return { x: e.clientX, y: e.clientY };
        };

        const onImageCropDragStart = (e) => {
            const container = document.querySelector('.image-cropper-canvas');
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const p = getEventClientXY(e);
            imageCropDragState = {
                startX: p.x,
                startY: p.y,
                originX: imageCropRect.value.x,
                originY: imageCropRect.value.y,
                containerW: rect.width,
                containerH: rect.height
            };
            window.addEventListener('mousemove', onImageCropDragMove);
            window.addEventListener('mouseup', onImageCropDragEnd);
            window.addEventListener('touchmove', onImageCropDragMove, { passive: false });
            window.addEventListener('touchend', onImageCropDragEnd);
        };

        const onImageCropDragMove = (e) => {
            if (!imageCropDragState) return;
            if (e.cancelable) e.preventDefault();
            const p = getEventClientXY(e);
            const dx = (p.x - imageCropDragState.startX) / Math.max(1, imageCropDragState.containerW);
            const dy = (p.y - imageCropDragState.startY) / Math.max(1, imageCropDragState.containerH);
            const w = imageCropRect.value.w;
            const h = imageCropRect.value.h;
            const nextX = Math.min(1 - w, Math.max(0, imageCropDragState.originX + dx));
            const nextY = Math.min(1 - h, Math.max(0, imageCropDragState.originY + dy));
            imageCropRect.value = { ...imageCropRect.value, x: nextX, y: nextY };
        };

        const onImageCropDragEnd = () => {
            imageCropDragState = null;
            window.removeEventListener('mousemove', onImageCropDragMove);
            window.removeEventListener('mouseup', onImageCropDragEnd);
            window.removeEventListener('touchmove', onImageCropDragMove);
            window.removeEventListener('touchend', onImageCropDragEnd);
        };

        const confirmImageCrop = () => {
            if (!imageCropPendingCallback) {
                closeImageCropModal();
                return;
            }
            const cfg = getImageCropPresetConfig(imageCropPreset.value);
            const img = new Image();
            img.onload = () => {
                const r = imageCropRect.value;
                const sx = Math.round(r.x * img.width);
                const sy = Math.round(r.y * img.height);
                const sw = Math.max(1, Math.round(r.w * img.width));
                const sh = Math.max(1, Math.round(r.h * img.height));

                let tw = sw;
                let th = sh;
                const scale = Math.min(cfg.maxWidth / tw, cfg.maxHeight / th, 1);
                tw = Math.max(1, Math.round(tw * scale));
                th = Math.max(1, Math.round(th * scale));

                const canvas = document.createElement('canvas');
                canvas.width = tw;
                canvas.height = th;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th);
                const out = canvas.toDataURL('image/jpeg', 0.82);
                const done = imageCropPendingCallback;
                closeImageCropModal();
                done(out);
            };
            img.src = imageCropSource.value;
        };

        const compressAvatarImage = (dataUrl, presetOrCallback, maybeCallback) => {
            const callback = typeof presetOrCallback === 'function' ? presetOrCallback : maybeCallback;
            const preset = typeof presetOrCallback === 'string' ? presetOrCallback : 'avatar';
            if (typeof callback !== 'function') return;
            if (enableManualImageCrop.value && preset !== 'free') {
                openImageCropModal(dataUrl, preset, callback);
                return;
            }
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const presetMap = {
                    avatar: { maxWidth: 400, maxHeight: 400, ratio: 1 },          // 头像/群头像
                    background: { maxWidth: 1080, maxHeight: 1920, ratio: 9 / 16 }, // 聊天背景（竖屏）
                    chatImage: { maxWidth: 960, maxHeight: 960, ratio: 4 / 3 },    // 聊天图片
                    widgetPhoto: { maxWidth: 560, maxHeight: 840, ratio: 2 / 3 },   // 桌面照片小组件
                    widgetSticker: { maxWidth: 520, maxHeight: 520, ratio: 1 },     // 桌面贴纸小组件
                    free: { maxWidth: 960, maxHeight: 960, ratio: null }           // 不裁剪
                };
                const cfg = presetMap[preset] || presetMap.avatar;
                const maxWidth = cfg.maxWidth;
                const maxHeight = cfg.maxHeight;
                const cropRatio = cfg.ratio;
                const shouldCrop = !!cropRatio;

                let sx = 0;
                let sy = 0;
                let sw = img.width;
                let sh = img.height;
                if (shouldCrop) {
                    const srcRatio = img.width / img.height;
                    if (srcRatio > cropRatio) {
                        sw = Math.round(img.height * cropRatio);
                        sx = Math.round((img.width - sw) / 2);
                    } else if (srcRatio < cropRatio) {
                        sh = Math.round(img.width / cropRatio);
                        sy = Math.round((img.height - sh) / 2);
                    }
                }

                let width = sw;
                let height = sh;
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
                
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
                callback(compressedDataUrl);
            };
            img.src = dataUrl;
        };
        
        const triggerAvatarUpload = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file && editingCharacter.value) {
                    const maxSize = 5 * 1024 * 1024;
                    if (file.size > maxSize) {
                        alert('图片大小不能超过5MB，请选择小一点的图片');
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        compressAvatarImage(e.target.result, (compressedDataUrl) => {
                            editingCharacter.value.avatarUrl = compressedDataUrl;
                        });
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        };

        const triggerCharacterImport = () => {
            if (characterImportInput.value) {
                characterImportInput.value.click();
            }
        };

        const parseCharPng = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const arrayBuffer = e.target.result;
                    const dataView = new DataView(arrayBuffer);
                    if (
                        dataView.getUint32(0) !== 0x89504e47 ||
                        dataView.getUint32(4) !== 0x0d0a1a0a
                    ) {
                        return reject(new Error('文件不是有效的PNG图片。'));
                    }
                    let offset = 8;
                    let characterJson = null;
                    while (offset < dataView.byteLength) {
                        const length = dataView.getUint32(offset);
                        const type = String.fromCharCode(
                            dataView.getUint8(offset + 4),
                            dataView.getUint8(offset + 5),
                            dataView.getUint8(offset + 6),
                            dataView.getUint8(offset + 7)
                        );
                        if (type === 'tEXt') {
                            const chunkData = new Uint8Array(arrayBuffer, offset + 8, length);
                            let text = '';
                            for (let i = 0; i < chunkData.length; i++) {
                                text += String.fromCharCode(chunkData[i]);
                            }
                            const keyword = 'chara' + String.fromCharCode(0);
                            if (text.startsWith(keyword)) {
                                const base64Data = text.substring(keyword.length);
                                try {
                                    const binaryString = atob(base64Data);
                                    const bytes = new Uint8Array(binaryString.length);
                                    for (let i = 0; i < binaryString.length; i++) {
                                        bytes[i] = binaryString.charCodeAt(i);
                                    }
                                    const decodedJsonString = new TextDecoder('utf-8').decode(bytes);
                                    characterJson = JSON.parse(decodedJsonString);
                                    break;
                                } catch (error) {
                                    return reject(new Error('解析PNG内嵌角色数据失败。'));
                                }
                            }
                        }
                        if (type === 'IEND') break;
                        offset += 12 + length;
                    }
                    if (characterJson) {
                        const imageReader = new FileReader();
                        imageReader.onload = (imgEvent) => {
                            resolve({
                                characterData: characterJson,
                                avatarBase64: imgEvent.target.result
                            });
                        };
                        imageReader.onerror = () => reject(new Error('读取头像失败。'));
                        imageReader.readAsDataURL(file);
                    } else {
                        reject(new Error('PNG未包含可识别的角色数据。'));
                    }
                };
                reader.onerror = () => reject(new Error('读取PNG文件失败。'));
                reader.readAsArrayBuffer(file);
            });
        };

        const parseCharJson = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const arrayBuffer = e.target.result;
                        const jsonString = new TextDecoder('utf-8').decode(arrayBuffer);
                        const data = JSON.parse(jsonString);
                        resolve(data.data || data);
                    } catch (error) {
                        reject(new Error('解析JSON角色卡失败。'));
                    }
                };
                reader.onerror = () => reject(new Error('读取JSON文件失败。'));
                reader.readAsArrayBuffer(file);
            });
        };

        const normalizeTags = (tags) => {
            if (Array.isArray(tags)) {
                return tags.map(tag => String(tag).trim()).filter(Boolean);
            }
            if (typeof tags === 'string') {
                return tags.split(',').map(tag => tag.trim()).filter(Boolean);
            }
            return [];
        };

        const buildWorldbookFromEntries = (entriesArray, name) => {
            const entries = entriesArray.map(entry => {
                if (!entry || entry.enabled === false || !entry.content) return null;
                const keyFromKeys = Array.isArray(entry.keys) && entry.keys.length > 0 ? entry.keys.join(', ') : '';
                const entryKey = (entry.comment || keyFromKeys || entry.key || entry.keyword || '未命名条目').trim();
                if (!entryKey) return null;
                const keywords = keyFromKeys || entry.keywords || entry.key || entry.keyword || '';
                return {
                    id: `entry_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                    key: entryKey,
                    keyword: entryKey,
                    keywords: keywords,
                    content: entry.content
                };
            }).filter(Boolean);
            if (entries.length === 0) return null;
            return {
                id: `wb_${Date.now()}`,
                name: `${name} 世界书`,
                description: '导入自角色卡',
                entries
            };
        };

        const buildWorldbookFromText = (text, name) => {
            const content = typeof text === 'string' ? text.trim() : '';
            if (!content) return null;
            return {
                id: `wb_${Date.now()}`,
                name: `${name} 世界书`,
                description: '导入自角色卡',
                entries: [{
                    id: `entry_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                    key: `${name} 世界设定`,
                    keyword: `${name} 世界设定`,
                    keywords: '',
                    content
                }]
            };
        };

        const createCharacterFromData = (data, avatarBase64) => {
            const charData = data && data.data ? data.data : data;
            const characterName = charData && charData.name ? String(charData.name).trim() : '未命名角色';
            const summarySource = charData && (charData.summary || charData.description || charData.personality);
            const summary = summarySource ? String(summarySource).trim() : '导入角色';
            const personaParts = [
                charData && charData.description,
                charData && charData.personality,
                charData && charData.scenario,
                charData && charData.mes_example
            ].filter(Boolean).map(part => String(part).trim());
            const persona = personaParts.join('\n');
            const openingLine = charData && (charData.first_mes || charData.first_message) ? String(charData.first_mes || charData.first_message).trim() : '';
            const tags = normalizeTags(charData && charData.tags);
            let newWorldbook = null;
            if (charData && charData.character_book && Array.isArray(charData.character_book.entries)) {
                newWorldbook = buildWorldbookFromEntries(charData.character_book.entries, characterName);
            } else if (charData && Array.isArray(charData.world_entries)) {
                newWorldbook = buildWorldbookFromEntries(charData.world_entries, characterName);
            } else if (data && typeof data.world === 'string') {
                newWorldbook = buildWorldbookFromText(data.world, characterName);
            } else if (charData && typeof charData.world_info === 'string') {
                newWorldbook = buildWorldbookFromText(charData.world_info, characterName);
            }
            let worldbookId = '';
            if (newWorldbook) {
                worldbooks.value.unshift(newWorldbook);
                worldbookId = newWorldbook.id;
            }
            // 使用字符串类型的id，确保与saveDossier中的查找逻辑一致
            const newId = Date.now().toString();
            const newCharacter = {
                id: newId,
                internalName: `Char_${newId}`,
                nickname: characterName,
                name: characterName,
                summary,
                avatarUrl: avatarBase64 || `https://placehold.co/100x100?text=Avatar`,
                tags: tags.length > 0 ? tags : ['导入'],
                persona,
                kvData: [],
                openingLine,
                userPersona: '',
                worldbookIds: worldbookId ? [worldbookId] : [],
                selectedPresetId: null,
                creator: charData && charData.creator ? String(charData.creator) : '',
                version: charData && charData.version ? String(charData.version) : '1.0'
            };
            characters.value.unshift(newCharacter);
            console.log('createCharacterFromData: created new character with id:', newId);
            return newCharacter;
        };

        const handleCharacterImport = async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            try {
                let characterData;
                let avatarBase64;
                const name = file.name.toLowerCase();
                if (name.endsWith('.png')) {
                    const result = await parseCharPng(file);
                    characterData = result.characterData;
                    avatarBase64 = result.avatarBase64;
                } else if (name.endsWith('.json')) {
                    characterData = await parseCharJson(file);
                    avatarBase64 = characterData && characterData.avatar ? characterData.avatar : `https://placehold.co/100x100?text=Avatar`;
                } else {
                    alert('不支持的文件格式，请选择 .png 或 .json 文件。');
                    return;
                }
                if (characterData) {
                    const created = createCharacterFromData(characterData, avatarBase64);
                    if (created) {
                        alert(`导入成功：${created.name}`);
                    }
                }
            } catch (error) {
                alert(`导入失败：${error.message}`);
            } finally {
                event.target.value = '';
            }
        };

        // --- Worldbook Actions ---
        const saveWorldbooks = () => saveToStorage('soulos_workshop_worldbooks', worldbooks.value);
        const loadWorldbooks = () => { worldbooks.value = loadFromStorage('soulos_workshop_worldbooks'); };

        const addNewWorldbook = () => {
            const newId = Date.now();
            const newWb = {
                id: `wb_${newId}`,
                name: `新世界书 ${worldbooks.value.length + 1}`,
                description: '暂无描述...',
                entries: []
            };
            worldbooks.value.unshift(newWb);
            openWorldbookEditor(newWb);
        };

        const addWorldbookEntry = () => {
            if (!editingWorldbook.value) return;
            const newEntry = {
                id: `entry_${Date.now()}`,
                key: '未命名条目',
                content: '',
                keywords: ''
            };
            editingWorldbook.value.entries.push(newEntry);
            expandedEntryIds.value.add(newEntry.id);
            expandedEntryIds.value = new Set(expandedEntryIds.value);
        };

        const deleteWorldbook = (id) => {
            if (confirm('确定要删除这本世界书吗？此操作不可恢复。')) {
                const index = worldbooks.value.findIndex(wb => wb.id === id);
                if (index !== -1) worldbooks.value.splice(index, 1);
            }
            swipedWorldbookId.value = null;
        };

        const deleteCurrentWorldbook = () => {
            if (!editingWorldbook.value) return;
            if (confirm('确定要删除这本世界书吗？此操作不可恢复。')) {
                const index = worldbooks.value.findIndex(wb => wb.id === editingWorldbook.value.id);
                if (index !== -1) {
                    worldbooks.value.splice(index, 1);
                    editingWorldbook.value = null;
                }
            }
        };
        
        const toggleSwipeWorldbook = (id) => {
            if (swipedWorldbookId.value === id) {
                swipedWorldbookId.value = null;
            } else {
                swipedWorldbookId.value = id;
            }
        };

        const openWorldbookEditor = (wb) => {
            if (swipedWorldbookId.value === wb.id) return; 
            swipedWorldbookId.value = null;
            editingWorldbook.value = JSON.parse(JSON.stringify(wb));
            if (!editingWorldbook.value.entries) editingWorldbook.value.entries = [];
            if (editingWorldbook.value.entries.length > 0) {
                activeWorldbookEntryId.value = editingWorldbook.value.entries[0].id;
            } else {
                activeWorldbookEntryId.value = null;
            }
        };

        // 打开世界书导入模态框
        const openWorldbookImport = () => {
            showWorldbookImport.value = true;
            importWorldbookName.value = '';
            importFile.value = null;
            importMode.value = 'replace';
        };

        // 处理文件上传
        const handleFileUpload = (event) => {
            const file = event.target.files[0];
            if (file) {
                importFile.value = file;
            }
        };

        // 导入世界书
        const importWorldbook = async () => {
            if (!importWorldbookName.value || !importFile.value) return;

            try {
                let textContent = '';
                
                // 读取文件内容
                if (importFile.value.type === 'text/plain') {
                    // 读取txt文件
                    textContent = await readTextFile(importFile.value);
                } else if (importFile.value.type === 'application/msword' || importFile.value.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    // 读取doc/docx文件（简化处理，实际项目中可能需要使用专门的库）
                    textContent = await readTextFile(importFile.value);
                } else {
                    console.error('不支持的文件类型');
                    return;
                }

                // 解析文件内容为世界书条目
                const entries = parseWorldbookContent(textContent);

                // 检查是否已存在同名世界书
                const existingWorldbook = worldbooks.value.find(wb => wb.name === importWorldbookName.value);
                let worldbook;

                if (existingWorldbook && importMode.value === 'append') {
                    // 追加到现有世界书
                    worldbook = existingWorldbook;
                    worldbook.entries = [...worldbook.entries, ...entries];
                } else {
                    // 创建新世界书或替换现有世界书
                    const newWorldbook = {
                        id: existingWorldbook ? existingWorldbook.id : `worldbook_${Date.now()}`,
                        name: importWorldbookName.value,
                        description: `从文件 ${importFile.value.name} 导入`,
                        entries: entries
                    };

                    if (existingWorldbook) {
                        // 替换现有世界书
                        const index = worldbooks.value.findIndex(wb => wb.id === existingWorldbook.id);
                        worldbooks.value[index] = newWorldbook;
                    } else {
                        // 添加新世界书
                        worldbooks.value.unshift(newWorldbook);
                    }
                    worldbook = newWorldbook;
                }

                // 保存世界书
                saveWorldbooks();

                // 关闭导入模态框
                showWorldbookImport.value = false;

                // 打开编辑模态框，显示导入的世界书
                openWorldbookEditor(worldbook);

                // 添加成功日志
                addConsoleLog('success', `成功导入世界书: ${importWorldbookName.value}`);
            } catch (error) {
                console.error('导入世界书失败:', error);
                addConsoleLog('error', `导入世界书失败: ${error.message}`);
            }
        };

        // 读取文本文件
        const readTextFile = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve(e.target.result);
                };
                reader.onerror = () => {
                    reject(new Error('读取文件失败'));
                };
                reader.readAsText(file, 'utf-8');
            });
        };

        // 解析世界书内容
        const parseWorldbookContent = (content) => {
            const entries = [];
            const lines = content.split('\n');
            let currentEntry = null;

            for (const line of lines) {
                const trimmedLine = line.trim();
                
                if (trimmedLine.startsWith('[')) {
                    // 新条目开始
                    if (currentEntry) {
                        entries.push(currentEntry);
                    }
                    
                    const key = trimmedLine.replace(/^\[(.*)\]$/, '$1').trim();
                    currentEntry = {
                        id: `entry_${Date.now()}_${entries.length}`,
                        key: key,
                        content: '',
                        enabled: true
                    };
                } else if (currentEntry) {
                    // 条目内容
                    currentEntry.content += line + '\n';
                }
            }

            // 添加最后一个条目
            if (currentEntry) {
                entries.push(currentEntry);
            }

            return entries;
        };

        const saveWorldbookEditor = () => {
            if (!editingWorldbook.value) return;
            const index = worldbooks.value.findIndex(wb => wb.id === editingWorldbook.value.id);
            if (index !== -1) {
                worldbooks.value[index] = editingWorldbook.value;
            }
            editingWorldbook.value = null;
        };

        const cancelWorldbookEditor = () => {
            editingWorldbook.value = null;
        };

        const toggleEntryExpand = (entryId) => {
            if (expandedEntryIds.value.has(entryId)) {
                expandedEntryIds.value.delete(entryId);
            } else {
                expandedEntryIds.value.add(entryId);
            }
            expandedEntryIds.value = new Set(expandedEntryIds.value);
        };
        
        const isEntryExpanded = (entryId) => {
            return expandedEntryIds.value.has(entryId);
        };
        
        const deleteWorldbookEntry = (entryId) => {
            if (!editingWorldbook.value) return;
            const index = editingWorldbook.value.entries.findIndex(e => e.id === entryId);
            if (index !== -1) {
                editingWorldbook.value.entries.splice(index, 1);
                if (activeWorldbookEntryId.value === entryId) {
                    activeWorldbookEntryId.value = null;
                }
            }
        };

        const activeWorldbookEntry = computed(() => {
            if (!editingWorldbook.value || !activeWorldbookEntryId.value) return null;
            return editingWorldbook.value.entries.find(e => e.id === activeWorldbookEntryId.value);
        });

        // --- Preset Actions ---
        const savePresets = () => saveToStorage('soulos_workshop_presets', presets.value);
        const loadPresets = () => { presets.value = loadFromStorage('soulos_workshop_presets'); };

        const addNewPreset = () => {
            const newId = Date.now();
            const newPreset = {
                id: `ps_${newId}`,
                name: `新预设 ${presets.value.length + 1}`,
                content: '',
                segments: []
            };
            presets.value.unshift(newPreset);
            openPresetEditor(newPreset);
        };

        const deletePreset = (id) => {
            if (confirm('确定要删除这个预设吗？')) {
                const index = presets.value.findIndex(p => p.id === id);
                if (index !== -1) presets.value.splice(index, 1);
            }
            swipedPresetId.value = null;
        };

        const deleteCurrentPreset = () => {
            if (!editingPreset.value) return;
            if (confirm('确定要删除这个预设吗？')) {
                const index = presets.value.findIndex(p => p.id === editingPreset.value.id);
                if (index !== -1) {
                    presets.value.splice(index, 1);
                    editingPreset.value = null;
                }
            }
        };

        const toggleSwipePreset = (id) => {
            if (swipedPresetId.value === id) {
                swipedPresetId.value = null;
            } else {
                swipedPresetId.value = id;
            }
        };

        const openPresetEditor = (preset) => {
            if (swipedPresetId.value === preset.id) return;
            swipedPresetId.value = null;
            const cloned = JSON.parse(JSON.stringify(preset));
            if (!Array.isArray(cloned.segments)) cloned.segments = [];
            editingPreset.value = cloned;
        };

        const savePresetEditor = () => {
            if (!editingPreset.value) return;
            const index = presets.value.findIndex(p => p.id === editingPreset.value.id);
            if (index !== -1) {
                presets.value[index] = editingPreset.value;
            }
            editingPreset.value = null;
        };

        const cancelPresetEditor = () => {
            editingPreset.value = null;
        };
        
        const triggerPresetImport = () => {
            if (presetImportInput.value) presetImportInput.value.click();
        };
        const parsePresetJson = (file) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const arrayBuffer = e.target.result;
                        const jsonString = new TextDecoder('utf-8').decode(arrayBuffer);
                        const data = JSON.parse(jsonString);
                        resolve(data);
                    } catch (error) {
                        reject(new Error('解析JSON预设失败。'));
                    }
                };
                reader.onerror = () => reject(new Error('读取JSON文件失败。'));
                reader.readAsArrayBuffer(file);
            });
        };
        const normalizePresetObject = (obj, filenameHint = '') => {
            if (!obj || typeof obj !== 'object') return null;
            const fallbackName = filenameHint ? filenameHint.replace(/\.[^.]+$/, '') : `导入预设 ${Date.now()}`;
            const name = String(obj.name || obj.title || obj.preset_name || fallbackName).trim();
            const contentField = obj.content ?? obj.text ?? obj.system_prompt ?? obj.prompt ?? '';
            const rawContent = typeof contentField === 'string' ? contentField : '';
            const items = obj.items || obj.entries || obj.sections || obj.blocks || obj.prompts || [];
            const segments = Array.isArray(items) ? items.map((it, idx) => ({
                id: `seg_${Date.now()}_${idx}_${Math.random().toString(16).slice(2)}`,
                title: String(it.title ?? it.name ?? it.key ?? `段落${idx + 1}`),
                content: String(it.content ?? it.text ?? it.value ?? ''),
                enabled: it.enabled !== false
            })) : [];
            if (segments.length === 0 && rawContent) {
                const parts = rawContent.split(/\n-{3,}\n|^#{1,3}\s/m).map(s => s.trim()).filter(Boolean);
                if (parts.length > 1) {
                    parts.forEach((txt, idx) => {
                        segments.push({
                            id: `seg_${Date.now()}_${idx}_${Math.random().toString(16).slice(2)}`,
                            title: `段落${idx + 1}`,
                            content: txt,
                            enabled: true
                        });
                    });
                } else {
                    segments.push({
                        id: `seg_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                        title: '正文',
                        content: rawContent,
                        enabled: true
                    });
                }
            }
            return {
                id: `ps_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                name,
                content: rawContent || (segments.length > 0 ? segments.map(s => s.content).join('\n\n') : ''),
                segments
            };
        };
        const importPresetsFromData = (data, filenameHint = '') => {
            const isPromptBundle = (obj) => {
                if (!obj || typeof obj !== 'object') return false;
                if (!Array.isArray(obj.prompts)) return false;
                const bundleKeys = [
                    'chat_completion_source', 'openai_model', 'claude_model', 'openrouter_model',
                    'temperature', 'top_p', 'top_k', 'presence_penalty', 'frequency_penalty'
                ];
                return bundleKeys.some(key => Object.prototype.hasOwnProperty.call(obj, key));
            };

            const buildPresetFromPromptBundle = (obj, hint) => {
                const fallbackName = hint ? hint.replace(/\.[^.]+$/, '') : `导入预设 ${Date.now()}`;
                const name = String(obj.name || obj.title || obj.preset_name || fallbackName).trim();
                const segments = obj.prompts.map((prompt, idx) => {
                    const title = String(prompt.name || prompt.title || prompt.identifier || `段落${idx + 1}`);
                    const role = prompt.role ? String(prompt.role) : '';
                    const body = String(prompt.content || '');
                    const content = role ? `[${role}]\n${body}` : body;
                    return {
                        id: `seg_${Date.now()}_${idx}_${Math.random().toString(16).slice(2)}`,
                        title,
                        content,
                        enabled: prompt.enabled !== false
                    };
                });
                const enabledContent = segments.filter(s => s.enabled).map(s => s.content).filter(Boolean);
                return {
                    id: `ps_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                    name,
                    content: enabledContent.join('\n\n'),
                    segments
                };
            };
            let list = [];
            if (Array.isArray(data)) {
                list = data;
            } else if (isPromptBundle(data)) {
                const preset = buildPresetFromPromptBundle(data, filenameHint);
                if (preset) presets.value.unshift(preset);
                return;
            } else if (Array.isArray(data?.prompts)) {
                list = data.prompts;
            } else if (Array.isArray(data?.presets)) {
                list = data.presets;
            } else if (data?.preset) {
                list = [data.preset];
            } else {
                list = [data];
            }

            list.forEach(item => {
                if (!item || typeof item !== 'object') return;
                const preset = normalizePresetObject(item, filenameHint);
                if (preset) presets.value.unshift(preset);
            });
        };
        const handlePresetImport = async (event) => {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            try {
                const data = await parsePresetJson(file);
                importPresetsFromData(data, file.name || '');
                event.target.value = '';
                addConsoleLog('预设导入成功', 'success');
            } catch (e) {
                addConsoleLog('预设导入失败：' + e.message, 'error');
            }
        };

        const batchDeleteTitle = computed(() => {
            if (batchDeleteType.value === 'worldbooks') return '批量删除世界书';
            if (batchDeleteType.value === 'presets') return '批量删除预设';
            return '批量删除角色';
        });

        const batchDeleteItems = computed(() => {
            if (batchDeleteType.value === 'worldbooks') {
                return worldbooks.value.map(wb => ({
                    id: wb.id,
                    name: wb.name || '未命名世界书',
                    meta: `${wb.entries?.length || 0} 个条目`
                }));
            }
            if (batchDeleteType.value === 'presets') {
                return presets.value.map(p => ({
                    id: p.id,
                    name: p.name || '未命名预设',
                    meta: `${p.segments?.length || 0} 个段落`
                }));
            }
            return characters.value.map(c => ({
                id: c.id,
                name: c.nickname || c.name || '未命名角色',
                meta: c.summary || '无简介'
            }));
        });

        const isAllBatchSelected = computed(() => {
            const total = batchDeleteItems.value.length;
            return total > 0 && batchDeleteSelections.value.length === total;
        });

        const selectedBatchCount = computed(() => batchDeleteSelections.value.length);

        const openBatchDelete = (type) => {
            batchDeleteType.value = type;
            batchDeleteSelections.value = [];
            showBatchDeleteDialog.value = true;
        };

        const closeBatchDelete = () => {
            showBatchDeleteDialog.value = false;
        };

        const selectAllBatchItems = () => {
            batchDeleteSelections.value = batchDeleteItems.value.map(item => item.id);
        };

        const clearBatchSelection = () => {
            batchDeleteSelections.value = [];
        };

        const invertBatchSelection = () => {
            const selected = new Set(batchDeleteSelections.value);
            batchDeleteSelections.value = batchDeleteItems.value
                .map(item => item.id)
                .filter(id => !selected.has(id));
        };

        const confirmBatchDelete = () => {
            if (batchDeleteSelections.value.length === 0) return;
            const label = batchDeleteTitle.value.replace('批量删除', '');
            if (!confirm(`确定删除选中的${label}吗？此操作不可撤销。`)) return;
            const selected = new Set(batchDeleteSelections.value);
            if (batchDeleteType.value === 'worldbooks') {
                worldbooks.value = worldbooks.value.filter(wb => !selected.has(wb.id));
                characters.value = characters.value.map(c => selected.has(c.worldbookId) ? { ...c, worldbookId: '' } : c);
                if (editingWorldbook.value && selected.has(editingWorldbook.value.id)) {
                    editingWorldbook.value = null;
                    activeWorldbookEntryId.value = null;
                }
                saveWorldbooks();
                saveCharacters();
            } else if (batchDeleteType.value === 'presets') {
                presets.value = presets.value.filter(p => !selected.has(p.id));
                if (editingPreset.value && selected.has(editingPreset.value.id)) {
                    editingPreset.value = null;
                }
                savePresets();
            } else {
                characters.value = characters.value.filter(c => !selected.has(c.id));
                if (editingCharacter.value && selected.has(editingCharacter.value.id)) {
                    editingCharacter.value = null;
                }
                const nextMessages = { ...soulLinkMessages.value };
                selected.forEach(id => { delete nextMessages[id]; });
                soulLinkMessages.value = nextMessages;
                if (selected.has(soulLinkActiveChat.value)) {
                    soulLinkActiveChat.value = null;
                }
                saveCharacters();
                saveSoulLinkMessages();
            }
            showBatchDeleteDialog.value = false;
        };
        
        // --- Character Dossier Logic & Helpers ---
        const newTagInput = ref('');
        const fileInput = ref(null);
        const characterImportInput = ref(null);

        const addTag = () => {
            if (newTagInput.value.trim() && editingCharacter.value) {
                if (!editingCharacter.value.tags) editingCharacter.value.tags = [];
                if (!editingCharacter.value.tags.includes(newTagInput.value.trim())) {
                    editingCharacter.value.tags.push(newTagInput.value.trim());
                }
                newTagInput.value = '';
            }
        };

        const removeTag = (index) => {
            if (editingCharacter.value && editingCharacter.value.tags) {
                editingCharacter.value.tags.splice(index, 1);
            }
        };

        const addKv = () => {
            if (editingCharacter.value) {
                if (!editingCharacter.value.kvData) editingCharacter.value.kvData = [];
                editingCharacter.value.kvData.push({ key: '', value: '' });
            }
        };

        const removeKv = (index) => {
            if (editingCharacter.value && editingCharacter.value.kvData) {
                editingCharacter.value.kvData.splice(index, 1);
            }
        };

        const handleAvatarFile = (event) => {
            const file = event.target.files[0];
            if (file && editingCharacter.value) {
                const maxSize = 5 * 1024 * 1024;
                if (file.size > maxSize) {
                    alert('图片大小不能超过5MB，请选择小一点的图片');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    compressAvatarImage(e.target.result, (compressedDataUrl) => {
                        editingCharacter.value.avatarUrl = compressedDataUrl;
                    });
                };
                reader.readAsDataURL(file);
            }
        };

        const deleteCharacter = () => {
            if (!editingCharacter.value) return;
            if (confirm('警告：确定要彻底删除该角色吗？\n此操作不可恢复，所有相关记忆将被清除。')) {
                 const index = characters.value.findIndex(c => c.id === editingCharacter.value.id);
                 if (index !== -1) {
                     characters.value.splice(index, 1);
                     editingCharacter.value = null;
                 }
            }
        };

        const openDossier = (character) => {
            // 确保角色对象有效
            if (!character) {
                console.error('openDossier: character is null or undefined');
                return;
            }
            
            // 深拷贝角色对象，避免直接修改原对象
            let copy;
            try {
                copy = JSON.parse(JSON.stringify(character));
            } catch (e) {
                console.error('openDossier: failed to clone character', e);
                return;
            }
            
            // 确保必要的字段存在
            if (!copy.id) {
                copy.id = Date.now().toString();
                console.warn('openDossier: character missing id, generated new id:', copy.id);
            }
            
            // 初始化所有必要字段
            if (!copy.tags) copy.tags = [];
            if (!copy.kvData) copy.kvData = [];
            if (!copy.worldbookIds) copy.worldbookIds = [];
            if (!copy.internalName) copy.internalName = copy.name || `Char_${copy.id}`;
            if (!copy.nickname) copy.nickname = copy.name || '未命名';
            if (!copy.userPersona) copy.userPersona = '';
            if (!copy.selectedPresetId) copy.selectedPresetId = null;
            if (!copy.summary) copy.summary = '';
            if (!copy.avatarUrl) copy.avatarUrl = '';
            if (!copy.creator) copy.creator = '';
            if (!copy.version) copy.version = '1.0';
            
            // 兼容旧数据：将 openingLine (string) 转换为 openingLines (array)
            if (copy.openingLine && typeof copy.openingLine === 'string' && (!copy.openingLines || copy.openingLines.length === 0)) {
                copy.openingLines = copy.openingLine.split('\n\n').filter(l => l.trim());
            }
            if (!copy.openingLines || !Array.isArray(copy.openingLines) || copy.openingLines.length === 0) {
                copy.openingLines = [''];
            }
            
            // 确保所有开场白都是字符串
            copy.openingLines = copy.openingLines.map(line => String(line || ''));
            
            editingCharacter.value = copy;
        };

        const addOpeningLine = () => {
            if (editingCharacter.value) {
                editingCharacter.value.openingLines.push('');
            }
        };

        const removeOpeningLine = (index) => {
            if (editingCharacter.value && editingCharacter.value.openingLines.length > 1) {
                editingCharacter.value.openingLines.splice(index, 1);
            }
        };

        const saveDossier = () => {
            if (!editingCharacter.value) {
                console.error('saveDossier: editingCharacter is null');
                return;
            }
            
            // 确保角色有有效的 id
            if (!editingCharacter.value.id) {
                editingCharacter.value.id = Date.now().toString();
                console.warn('saveDossier: character missing id, generated new id:', editingCharacter.value.id);
            }
            
            // 将 openingLines 合并回 openingLine 以保持兼容性
            if (editingCharacter.value.openingLines && Array.isArray(editingCharacter.value.openingLines)) {
                editingCharacter.value.openingLine = editingCharacter.value.openingLines
                    .filter(l => l && l.trim())
                    .join('\n\n');
            }
            
            // 更新角色名称
            editingCharacter.value.name = editingCharacter.value.nickname || editingCharacter.value.internalName || '未命名角色';
            
            // 确保所有必要字段都存在
            if (!editingCharacter.value.tags) editingCharacter.value.tags = [];
            if (!editingCharacter.value.kvData) editingCharacter.value.kvData = [];
            if (!editingCharacter.value.worldbookIds) editingCharacter.value.worldbookIds = [];
            
            // 查找角色在列表中的位置
            const index = characters.value.findIndex(c => c && c.id === editingCharacter.value.id);
            
            if (index !== -1) {
                // 更新现有角色
                characters.value[index] = { ...editingCharacter.value };
                console.log('saveDossier: updated existing character:', editingCharacter.value.id);
            } else {
                // 如果角色不在列表中，添加它（处理导入的角色）
                characters.value.push({ ...editingCharacter.value });
                console.log('saveDossier: added new character to list:', editingCharacter.value.id);
            }
            
            editingCharacter.value = null;
        };

        const cancelDossier = () => {
            editingCharacter.value = null;
        };

        // --- Workshop Persistence Wiring ---
        watch(worldbooks, saveWorldbooks, { deep: true });
        watch(presets, savePresets, { deep: true });
        watch(profiles, () => saveProfiles(true), { deep: true });
        
        onMounted(() => {
            loadWorldbooks();
            loadPresets();
        });

        // --- COMPUTED PROPERTIES ---
        const activeProfile = computed(() => {
            if (!activeProfileId.value) return null;
            return profiles.value.find(p => p.id === activeProfileId.value);
        });

        const apiStatus = computed(() => {
            if (!activeProfile.value) return 'unconfigured';
            if (activeProfile.value.endpoint && activeProfile.value.key) return 'valid';
            return 'invalid';
        });

        // Touch event variables for pull-to-refresh
        let startY = 0;
        const pullDistance = ref(0);
        
        const handleTouchStart = (e) => {
            startY = e.touches[0].clientY;
        };
        
        const handleTouchMove = () => {};
        
        const handleTouchEnd = () => {
            pullDistance.value = 0;
        };
        
        const openApp = (appName) => {
            const normalizedName = appName ? appName.toLowerCase() : null;
            openedApp.value = normalizedName;
            console.log(`[System] Opening App: ${normalizedName}`);
            
            if (normalizedName === 'console') {
                loadProfiles();
            } else if (normalizedName === 'soullink' || normalizedName === 'chat') {
                if (!['msg', 'group', 'feed', 'id'].includes(soulLinkTab.value)) {
                    soulLinkTab.value = 'msg';
                }
                console.log(`[SoulLink] Tab: ${soulLinkTab.value}, Characters: ${characters.value.length}`);
                if (characters.value.length === 0) {
                     loadCharacters();
                }
            } else if (normalizedName === 'feed') {
                console.log(`[Feed] Opening, Characters: ${characters.value.length}`);
                if (characters.value.length === 0) {
                    loadCharacters();
                }
            }
        };

        const closeApp = () => {
            openedApp.value = null;
        };

        const goBack = () => {
            openedApp.value = null;
        };

        const playerName = ref('');
        const currentPlayerName = ref('');

        const openGame = (gameId) => {
            const game = games.startGame(gameId);
            if (game) {
                console.log('Opening game:', game.name);
                // 重置玩家名字
                playerName.value = '';
                currentPlayerName.value = '';
            }
        };

        const joinGame = () => {
            if (playerName.value.trim()) {
                const success = games.joinGame(playerName.value.trim());
                if (success) {
                    currentPlayerName.value = playerName.value.trim();
                    playerName.value = '';
                    console.log('Player joined:', currentPlayerName.value);
                }
            }
        };

        const startGameSession = () => {
            const success = games.startGameSession();
            if (success) {
                console.log('Game started');
            }
        };

        const castVote = (voterName, targetName) => {
            const success = games.castVote(voterName, targetName);
            if (success) {
                console.log(`${voterName} voted for ${targetName}`);
            }
        };

        const endDay = () => {
            games.endDay();
            console.log('Day ended');
        };

        const closeGame = () => {
            games.currentGame = null;
            console.log('Game closed');
        };

        // 新游戏相关状态
        const showRules = ref(false);
        const chatExpanded = ref(false);
        const wheelRotation = ref(0);
        const playerMessage = ref('');
        const playerWord = ref('');
        
        // AI玩家状态
        const aiPlayers = ref([
            { status: '等待中' },
            { status: '等待中' },
            { status: '等待中' }
        ]);
        
        // 聊天消息
        const chatMessages = ref([]);
        const undercoverMessages = ref([]);
        
        // 真心话大冒险历史记录
        const todHistory = ref([]);

        // 新游戏相关函数
        const toggleSound = () => {
            console.log('Toggle sound');
        };

        const playRPS = (choice) => {
            const result = games.playRPS(choice);
            console.log('RPS result:', result);
            // 添加聊天消息
            chatMessages.value.push({ sender: 'AI', content: `我出${result.aiChoice === 'rock' ? '石头' : result.aiChoice === 'paper' ? '布' : '剪刀'}！`, type: 'ai' });
        };

        const spinTOD = () => {
            // 随机旋转角度
            wheelRotation.value = Math.floor(Math.random() * 360) + 720; // 至少转两圈
            
            // 延迟执行，模拟转盘转动
            setTimeout(() => {
                const result = games.spinTruthOrDare();
                console.log('TOD result:', result);
                
                // 添加到历史记录
                todHistory.value.unshift({
                    type: result.choice === 'truth' ? '真心话' : '大冒险',
                    content: result.truth || result.dare
                });
                
                // 限制历史记录数量
                if (todHistory.value.length > 3) {
                    todHistory.value = todHistory.value.slice(0, 3);
                }
                
                // 添加聊天消息
                chatMessages.value.push({ sender: 'AI', content: result.choice === 'truth' ? '真心话！快回答吧～' : '大冒险！挑战来了！', type: 'ai' });
            }, 1500);
        };

        const nextTOD = () => {
            games.gameState.truthOrDare = null;
            games.gameState.currentTruth = null;
            games.gameState.currentDare = null;
        };

        const startUNOGame = () => {
            games.startUNOGame();
            console.log('UNO game started');
        };

        const drawCard = () => {
            console.log('Draw card');
        };

        const playCard = (index) => {
            console.log('Play card:', index);
        };

        const sayUNO = () => {
            console.log('UNO!');
            chatMessages.value.push({ sender: '我', content: 'UNO!', type: 'player' });
        };

        const startLudoGame = () => {
            games.startLudoGame();
            console.log('Ludo game started');
        };

        const rollDice = () => {
            const dice = games.rollDice();
            console.log('Rolled dice:', dice);
            chatMessages.value.push({ sender: '系统', content: `掷出了${dice}点`, type: 'system' });
        };

        const toggleAutoPlay = () => {
            console.log('Toggle auto play');
        };

        const sendMessage = () => {
            if (playerMessage.value.trim()) {
                chatMessages.value.push({ sender: '我', content: playerMessage.value.trim(), type: 'player' });
                playerMessage.value = '';
            }
        };

        const switchWorkshopTab = (tabName) => {
            activeWorkshopTab.value = tabName;
        };

        const getAppIcon = (appName) => {
            const icons = {
                'SoulLink': 'fas fa-comments', 'Peek': 'fas fa-eye', 'Gallery': 'fas fa-photo-video', 'Diary': 'fas fa-book-open',
                'Pulse': 'fas fa-rss-square', 'Void': 'fa-brands fa-twitter', 'Vibe': 'fas fa-camera-retro', 'Muse': 'fas fa-film',
                'Period': 'fas fa-tint', 'Wallet': 'fas fa-wallet', 'Nest': 'fas fa-home', 'Mall': 'fas fa-shopping-bag',
                'Chamber': 'fas fa-hourglass-half', 'Music': 'fas fa-music', 'Arcade': 'fas fa-gamepad', 'Browser': 'fas fa-globe',
                'Theme': 'fas fa-palette', 'Workshop': 'fas fa-hammer', 'System': 'fas fa-book', 'Console': 'fas fa-terminal'
            };
            return icons[appName] || 'fas fa-question-circle';
        };

        // Music player controls
        const togglePlayPause = () => {
            isPlaying.value = !isPlaying.value;
        };

        const playPrevious = () => {
            console.log('Previous song');
            // Add previous song logic here
        };

        const playNext = () => {
            console.log('Next song');
            // Add next song logic here
        };

        // --- Console App Methods ---
        const addConsoleLog = (message, type = 'info') => {
            const timestamp = new Date().toLocaleTimeString('en-GB');
            consoleLogs.value.unshift({ id: Date.now(), timestamp, message, type });
            if (consoleLogs.value.length > 50) consoleLogs.value.pop();
        };

        const clearConsole = () => {
            consoleLogs.value = [];
            addConsoleLog('日志已清空', 'system');
        };

        const loadProfiles = () => {
            consoleLogs.value = [];
            addConsoleLog('正在初始化连接控制台...', 'system');
            try {
                const savedProfiles = localStorage.getItem('soulos_api_profiles');
                if (savedProfiles) {
                    profiles.value = JSON.parse(savedProfiles);
                    if (profiles.value.length > 0) {
                        activeProfileId.value = profiles.value[0].id;
                        addConsoleLog(`已加载 ${profiles.value.length} 个配置，当前激活：「${profiles.value[0].name}」`, 'success');
                    } else {
                        addConsoleLog('尚未创建任何配置，请在上方新建一个连接配置。', 'warn');
                    }
                } else {
                    profiles.value = [];
                    addConsoleLog('本地没有找到配置，准备创建新的连接配置。', 'warn');
                }
            } catch (error) {
                addConsoleLog('严重错误：读取配置失败：' + error.message, 'error');
                profiles.value = [];
            }
            if (profiles.value.length === 0) {
                activeProfileId.value = null;
            }
            availableModels.value = [];
        };

        const saveProfiles = (silent = false) => {
            if (!profiles.value || profiles.value.length === 0) return;
            try {
                localStorage.setItem('soulos_api_profiles', JSON.stringify(profiles.value));
                if (!silent) addConsoleLog('所有配置已保存，本地状态已更新。', 'success');
            } catch (error) {
                if (!silent) addConsoleLog('保存配置时出错：' + error.message, 'error');
            }
        };

        const createNewProfile = () => {
            const newProfile = {
                id: Date.now(),
                name: `新配置 ${profiles.value.length + 1}`,
                endpoint: '',
                key: '',
                model: '',
                temperature: 0.7
            };
            profiles.value.push(newProfile);
            activeProfileId.value = newProfile.id;
            addConsoleLog(`已创建新配置：「${newProfile.name}」`, 'system');
        };

        const deleteActiveProfile = () => {
            if (!activeProfile.value) return;
            if (!confirm(`危险操作：即将永久删除下列配置：\n\n「${activeProfile.value.name}」\n\n此操作无法撤销，是否继续？`)) {
                return;
            }
            const index = profiles.value.findIndex(p => p.id === activeProfileId.value);
            if (index > -1) {
                const deletedName = profiles.value[index].name;
                profiles.value.splice(index, 1);
                saveProfiles();
                if (profiles.value.length > 0) {
                    activeProfileId.value = profiles.value[0].id;
                } else {
                    activeProfileId.value = null;
                }
                addConsoleLog(`配置「${deletedName}」已被删除。`, 'warn');
            }
        };

        const setActiveProfile = (profileId) => {
            const target = profiles.value.find(p => p.id === profileId);
            if (!target) return;
            activeProfileId.value = profileId;
            availableModels.value = [];
            addConsoleLog(`已切换到配置：「${target.name}」`, 'info');
        };

        const deleteProfile = (profileId) => {
            const target = profiles.value.find(p => p.id === profileId);
            if (!target) return;
            if (!confirm(`危险操作：即将永久删除下列配置：\n\n「${target.name}」\n\n此操作无法撤销，是否继续？`)) {
                return;
            }
            const index = profiles.value.findIndex(p => p.id === profileId);
            if (index > -1) {
                const deletedName = profiles.value[index].name;
                profiles.value.splice(index, 1);
                saveProfiles();
                if (activeProfileId.value === profileId) {
                    activeProfileId.value = profiles.value.length > 0 ? profiles.value[0].id : null;
                }
                addConsoleLog(`配置「${deletedName}」已被删除。`, 'warn');
            }
        };
        
        const onProfileSelect = () => {
            availableModels.value = [];
            if(activeProfile.value) {
                addConsoleLog(`已切换到配置：「${activeProfile.value.name}」`, 'info');
            }
        };

        const fetchModels = async () => {
            if (!activeProfile.value || !activeProfile.value.endpoint || !activeProfile.value.key) {
                addConsoleLog('在获取模型前，请先填写 API 地址和密钥。', 'error');
                return;
            }
            fetchingModels.value = true;
            availableModels.value = [];
            addConsoleLog(`正在连接到「${activeProfile.value.name}」：${activeProfile.value.endpoint} ...`, 'info');
            
            try {
                const response = await fetch(`${activeProfile.value.endpoint}/models`, {
                    headers: { 'Authorization': `Bearer ${activeProfile.value.key}` }
                });

                if (!response.ok) {
                    throw new Error(`接口返回状态码 ${response.status}`);
                }
                const data = await response.json();
                availableModels.value = data.data || [];
                if (availableModels.value.length > 0) {
                    addConsoleLog(`已成功获取 ${availableModels.value.length} 个模型，说明此 API 可正常连接。`, 'success');
                } else {
                    addConsoleLog('连接成功，但接口未返回任何模型，请检查服务端配置。', 'warn');
                }
            } catch (error) {
                addConsoleLog(`获取模型失败：${error.message}`, 'error');
            } finally {
                fetchingModels.value = false;
            }
        };

        const live = useLive(characters, activeProfile, profiles, availableModels, worldbooks);
        const {
            liveWaveBars,
            liveOnlineCount,
            activeLiveRoomId,
            liveMicMuted,
            liveElapsedSeconds,
            liveInput,
            liveMessages,
            liveHostSpeechByRoom,
            liveDanmakuByRoom,
            liveHostSpeechLoading,
            liveBgmPlaying,
            liveBgmAudioRef,
            LIVE_BGM_URL,
            liveOnMic,
            liveUserDisguiseNick,
            liveHallWallpaperUrl,
            liveSettingsOpen,
            liveSettingsDraftBgmUrl,
            liveSettingsDraftUserMask,
            liveSettingsDraftHallWallpaperUrl,
            liveBgmSearchTerm,
            liveBgmSearchResults,
            liveBgmSearchLoading,
            liveBgmCurrentSong,
            liveBgmLyricsLoading,
            liveBgmCurrentLyricText,
            liveBgmLyricPrevText,
            liveBgmLyricNextText,
            liveRooms,
            activeLiveRoom,
            activeLiveHost,
            activeLiveMessages,
            liveElapsedText,
            activeLiveHostSpeech,
            activeLiveHostSpeechHistory,
            liveHostHistoryOpen,
            switchLiveRoom,
            toggleLiveMic,
            toggleLiveOnMic,
            rollDisguiseNick,
            sendLiveGift,
            sendLiveMessage,
            toggleLiveBgm,
            onLiveBgmPlay,
            onLiveBgmPause,
            onLiveBgmEnded,
            startBatchFetch,
            clearLivePlaybackAndBatch,
            toggleLiveHostHistory,
            closeLiveHostHistory,
            formatLiveHostHistoryTime,
            openLiveSettings,
            closeLiveSettings,
            saveLiveSettings,
            searchLiveBgmSongs,
            playLiveBgmFromSong,
            playLiveBgmByQuery,
            onLiveHallWallpaperUpload
        } = live;

        // --- Lifecycle Hook ---
        onMounted(() => {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                        registration.unregister();
                    }
                });
            }

            updateTime();
            generateRandomHex();
            loadCharacters();
            
            initDB().then(async () => {
                await feed.initFeedDB();
                await loadSoulLinkMessages();
                loadChatOfflineModes();
                await loadSoulLinkGroups();
                loadSoulLinkPet();
                initDeviceStatus();
                
                const savedUserAvatar = loadFromStorage('soulos_user_avatar');
                if (savedUserAvatar) {
                    userAvatar.value = savedUserAvatar;
                }
                
                loadChatMenuSettings();
                await loadArchivedChats();
            }).catch(err => {
                console.error('数据库初始化失败:', err);
                loadSoulLinkMessages();
                loadChatOfflineModes();
                loadSoulLinkGroups();
                loadSoulLinkPet();
                initDeviceStatus();
                
                const savedUserAvatar = loadFromStorage('soulos_user_avatar');
                if (savedUserAvatar) {
                    userAvatar.value = savedUserAvatar;
                }
                
                loadChatMenuSettings();
                loadArchivedChats();
            });
        });
        
        watch(characters, saveCharacters, { deep: true });
        
        watch(openedApp, (val, prev) => {
            const prevApp = prev ? prev.toLowerCase() : prev;
            const valApp = val ? val.toLowerCase() : val;

            if (prevApp === 'console') {
                saveProfiles(true);
            }
            if (valApp !== 'workshop') {
                editingCharacter.value = null;
            }
            clearLivePlaybackAndBatch();
            if (valApp !== 'live') {
                closeLiveHostHistory();
            }
            if (valApp === 'live') {
                setTimeout(() => startBatchFetch(), 450);
            }
        });

        // ==========================================================
        // --- SoulLink App State & Logic ---
        // ==========================================================
        const soulLinkTab = ref('msg');
        const soulLinkActiveChat = ref(null);
        const soulLinkActiveChatType = ref('character');
        const soulLinkInput = ref('');
        const soulLinkReplyTarget = ref(null);
        const soulLinkMessages = ref({});
        
        // 角色信息相关
        const showCharacterSelector = ref(false);
        const selectedCharacterId = ref(localStorage.getItem('selectedCharacterId') || null);

        // 每次打开“角色选择弹窗”都刷新 workshop 角色列表，
        // 避免你在别处新增角色后，当前内存的 characters 没及时同步。
        watch(showCharacterSelector, (val) => {
            if (val) {
                loadCharacters();
            }
        });
        const selectedCharacter = computed(() => {
            if (characters.value.length === 0) {
                return { nickname: '未命名角色', name: '未命名角色', avatarUrl: '', bindTime: null, affection: 0 };
            }
            const char = characters.value.find(c => c.id === selectedCharacterId.value);
            const targetChar = char || characters.value[0];
            return {
                ...targetChar,
                nickname: targetChar.nickname || targetChar.name || '未命名角色',
                name: targetChar.name || targetChar.nickname || '未命名角色',
                bindTime: targetChar.bindTime || null,
                affection: typeof targetChar.affection === 'number' ? targetChar.affection : 0
            };
        });
        
        // 通话小组件自定义文字
        const callWidgetSubtitle = ref(localStorage.getItem('callWidgetSubtitle') || '点击更换角色');
        const showCallWidgetEdit = ref(false);
        const callWidgetEditInput = ref('');
        
        // 天气时间小组件
        const currentDate = ref('');
        const currentTime = ref('');
        const weekdays = ref(['日', '一', '二', '三', '四', '五', '六']);
        const currentWeekday = ref(0);
        
        // 更新时间和日期
        const updateDateTime = () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            
            currentDate.value = `${year}.${month}.${day}`;
            currentTime.value = `${hours}:${minutes}`;
            currentWeekday.value = now.getDay();
        };
        
        // 初始化并每分钟更新一次
        updateDateTime();
        setInterval(updateDateTime, 60000);
        
        // 打开通话小组件编辑
        const editCallWidgetSubtitle = () => {
            callWidgetEditInput.value = callWidgetSubtitle.value;
            showCallWidgetEdit.value = true;
        };
        
        // 保存通话小组件自定义文字
        const saveCallWidgetSubtitle = () => {
            callWidgetSubtitle.value = callWidgetEditInput.value;
            localStorage.setItem('callWidgetSubtitle', callWidgetEditInput.value);
            showCallWidgetEdit.value = false;
        };
        
        // 关闭通话小组件编辑
        const closeCallWidgetEdit = () => {
            showCallWidgetEdit.value = false;
        };
        
        // 选择角色
        const selectCharacter = (char) => {
            selectedCharacterId.value = char.id;
            localStorage.setItem('selectedCharacterId', char.id);
            
            const charIndex = characters.value.findIndex(c => c.id === char.id);
            if (charIndex !== -1) {
                if (!characters.value[charIndex].bindTime) {
                    characters.value[charIndex].bindTime = new Date().toISOString();
                }
                if (typeof characters.value[charIndex].affection !== 'number') {
                    characters.value[charIndex].affection = 0;
                }
                saveCharacters();
            }
            
            showCharacterSelector.value = false;
        };

        const novelMode = ref(localStorage.getItem('soulos_novel_mode') === 'true');
        const chatOfflineModes = ref({});
        
        watch(novelMode, (val) => localStorage.setItem('soulos_novel_mode', val));
        
        const isOfflineMode = computed(() => {
            if (!soulLinkActiveChat.value) return false;
            return chatOfflineModes.value[soulLinkActiveChat.value] || false;
        });
        
        const setChatOfflineMode = (chatId, isOffline) => {
            chatOfflineModes.value[chatId] = isOffline;
            saveChatOfflineModes();
        };
        
        const saveChatOfflineModes = () => {
            try {
                localStorage.setItem('soulos_chat_offline_modes', JSON.stringify(chatOfflineModes.value));
            } catch (e) {
                console.error('Failed to save chat offline modes:', e);
            }
        };
        
        function loadChatOfflineModes() {
            try {
                const saved = localStorage.getItem('soulos_chat_offline_modes');
                if (saved) {
                    chatOfflineModes.value = JSON.parse(saved);
                }
            } catch (e) {
                console.error('Failed to load chat offline modes:', e);
                chatOfflineModes.value = {};
            }
        }

        // Initialize App Hooks with Dependencies
        const mate = reactive(useMate(soulLinkMessages, characters, activeProfile));
        const feed = reactive(useFeed(profiles, activeProfile));
        const notice = reactive(useNotice());
        const peek = reactive(usePeek(characters, activeProfile, soulLinkMessages, soulLinkGroups));
        const games = reactive(useGames());
        const read = reactive(useRead(characters, worldbooks, presets, activeProfile));

        // --- Console：全量备份（localStorage + SoulOS_DB / FeedDB，思路类似 kmain 里 JSON 导出） ---
        const SOULOS_BACKUP_SLOT_KEY = 'soulos_backup_slot_v1';
        const backupExporting = ref(false);
        const backupImporting = ref(false);
        const backupLastSavedHint = ref('');
        const soulosBackupFileInput = ref(null);
        const showSegmentedImportPanel = ref(false);
        const segmentedImportPackage = ref(null);
        const segmentedImportAppSelections = ref({});
        const segmentedImportRoleSelections = ref({});

        const collectAllLocalStorageEntries = () => {
            const entries = {};
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k) entries[k] = localStorage.getItem(k);
                }
            } catch (e) {
                console.error(e);
            }
            return entries;
        };

        const dumpIdbDatabase = (dbName, storeNames) =>
            new Promise((resolve, reject) => {
                const req = indexedDB.open(dbName);
                req.onerror = () => reject(req.error);
                req.onsuccess = () => {
                    const database = req.result;
                    const run = async () => {
                        const out = {};
                        try {
                            for (const sn of storeNames) {
                                if (!database.objectStoreNames.contains(sn)) continue;
                                out[sn] = await new Promise((res, rej) => {
                                    const tx = database.transaction(sn, 'readonly');
                                    const r = tx.objectStore(sn).getAll();
                                    r.onsuccess = () => res(r.result || []);
                                    r.onerror = () => rej(r.error);
                                });
                            }
                            return out;
                        } finally {
                            database.close();
                        }
                    };
                    run().then(resolve).catch(reject);
                };
            });

        const restoreIdbDatabase = (dbName, storesData) => {
            if (!storesData || typeof storesData !== 'object' || storesData._error) return Promise.resolve();
            return new Promise((resolve, reject) => {
                const req = indexedDB.open(dbName);
                req.onerror = () => reject(req.error);
                req.onsuccess = () => {
                    const database = req.result;
                    const run = async () => {
                        try {
                            for (const [sn, records] of Object.entries(storesData)) {
                                if (sn.startsWith('_') || !database.objectStoreNames.contains(sn) || !Array.isArray(records)) continue;
                                await new Promise((res, rej) => {
                                    const tx = database.transaction(sn, 'readwrite');
                                    tx.onerror = () => rej(tx.error);
                                    tx.oncomplete = () => res();
                                    const store = tx.objectStore(sn);
                                    const clr = store.clear();
                                    clr.onerror = () => rej(clr.error);
                                    clr.onsuccess = () => {
                                        for (const rec of records) {
                                            store.put(rec);
                                        }
                                    };
                                });
                            }
                        } finally {
                            database.close();
                        }
                    };
                    run().then(resolve).catch(reject);
                };
            });
        };

        const buildSoulOsBackupPackage = async () => {
            const indexedDBPart = {};
            try {
                indexedDBPart.SoulOS_DB = await dumpIdbDatabase('SoulOS_DB', ['soulLinkMessages', 'soulLinkGroups', 'archivedChats', 'settings']);
            } catch (e) {
                console.warn('[Backup] SoulOS_DB', e);
                indexedDBPart.SoulOS_DB = { _error: String(e.message || e) };
            }
            try {
                indexedDBPart.FeedDB = await dumpIdbDatabase('FeedDB', ['posts']);
            } catch (e) {
                console.warn('[Backup] FeedDB', e);
                indexedDBPart.FeedDB = { _error: String(e.message || e) };
            }
            return {
                v: 2,
                app: 'SoulOS-phone',
                exportedAt: new Date().toISOString(),
                localStorage: collectAllLocalStorageEntries(),
                indexedDB: indexedDBPart
            };
        };

        const buildSlimBackupPackage = (pkg) => {
            const clone = JSON.parse(JSON.stringify(pkg || {}));
            const ls = clone.localStorage && typeof clone.localStorage === 'object' ? clone.localStorage : {};
            const keys = Object.keys(ls);
            for (const k of keys) {
                const v = String(ls[k] ?? '');
                const looksLikeBase64Image = v.startsWith('data:image/');
                const tooLarge = v.length > 60000;
                const avatarLikeKey = /avatar|wallpaper|bg|background|image|photo/i.test(k);
                if (looksLikeBase64Image || tooLarge || avatarLikeKey) {
                    delete ls[k];
                }
            }
            clone.localStorage = ls;
            // 降级时仅保留核心对话库，减少槽位体积；完整内容仍在导出的 JSON 文件里
            if (clone.indexedDB && clone.indexedDB.FeedDB) {
                delete clone.indexedDB.FeedDB;
            }
            return clone;
        };

        const writeBackupSlotWithFallback = (pkg) => {
            const fullJson = JSON.stringify(pkg);
            try {
                localStorage.setItem(SOULOS_BACKUP_SLOT_KEY, fullJson);
                return { ok: true, mode: 'full', bytes: fullJson.length };
            } catch (e1) {
                const slim = buildSlimBackupPackage(pkg);
                const slimJson = JSON.stringify(slim);
                try {
                    localStorage.setItem(SOULOS_BACKUP_SLOT_KEY, slimJson);
                    return { ok: true, mode: 'slim', bytes: slimJson.length, error: e1 };
                } catch (e2) {
                    return { ok: false, mode: 'failed', error: e2 };
                }
            }
        };

        const mergeById = (currentList, incomingList) => {
            const base = Array.isArray(currentList) ? [...currentList] : [];
            const map = new Map(base.map((x) => [String(x.id), x]));
            (Array.isArray(incomingList) ? incomingList : []).forEach((item) => {
                if (!item || item.id === undefined || item.id === null) return;
                map.set(String(item.id), item);
            });
            return Array.from(map.values());
        };

        const pickLocalStorageByPrefixes = (prefixes = []) => {
            const out = {};
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (!k) continue;
                    if (prefixes.some((p) => k.startsWith(p))) out[k] = localStorage.getItem(k);
                }
            } catch (e) {
                console.error(e);
            }
            return out;
        };

        const buildSegmentedBackupPackage = () => {
            const appSegments = {
                chat: {
                    localStorage: pickLocalStorageByPrefixes([
                        'soulos_chat_menu_',
                        'soulos_chat_offline_modes',
                        'soulos_novel_mode',
                        'callWidgetSubtitle'
                    ]),
                    data: {
                        soulLinkMessages: JSON.parse(JSON.stringify(soulLinkMessages.value || {})),
                        soulLinkGroups: JSON.parse(JSON.stringify(soulLinkGroups.value || [])),
                        soulLinkPet: JSON.parse(JSON.stringify(soulLinkPet.value || {}))
                    }
                },
                workshop: {
                    localStorage: pickLocalStorageByPrefixes([
                        'soulos_workshop_'
                    ]),
                    data: {
                        characters: JSON.parse(JSON.stringify(characters.value || [])),
                        worldbooks: JSON.parse(JSON.stringify(worldbooks.value || [])),
                        presets: JSON.parse(JSON.stringify(presets.value || []))
                    }
                },
                feed: {
                    localStorage: pickLocalStorageByPrefixes([
                        'feed_'
                    ]),
                    data: {}
                },
                mate: {
                    localStorage: pickLocalStorageByPrefixes([
                        'mate_'
                    ]),
                    data: {}
                },
                theme: {
                    localStorage: pickLocalStorageByPrefixes([
                        'theme',
                        'homeWallpaper',
                        'homeTextColor',
                        'enableHomeGlass',
                        'enableHideStatusBar',
                        'enableNotchAdaptation'
                    ]),
                    data: {}
                }
            };

            const roleSegments = {};
            const chars = Array.isArray(characters.value) ? characters.value : [];
            chars.forEach((c) => {
                const rid = String(c.id);
                roleSegments[rid] = {
                    id: rid,
                    name: c.nickname || c.name || `角色-${rid}`,
                    character: JSON.parse(JSON.stringify(c)),
                    soulLinkMessages: JSON.parse(JSON.stringify(soulLinkMessages.value?.[rid] || [])),
                    localStorage: {
                        [`soulos_chat_menu_${rid}`]: localStorage.getItem(`soulos_chat_menu_${rid}`)
                    }
                };
            });

            return {
                v: 3,
                app: 'SoulOS-phone',
                mode: 'segmented',
                exportedAt: new Date().toISOString(),
                segments: {
                    apps: appSegments,
                    roles: roleSegments
                }
            };
        };

        const applySegmentedBackupPayload = async (pkg, pickers = null) => {
            if (!pkg?.segments || typeof pkg.segments !== 'object') {
                addConsoleLog('分片备份数据无效。', 'error');
                return;
            }
            backupImporting.value = true;
            try {
                const apps = pkg.segments.apps || {};
                const roles = pkg.segments.roles || {};
                const allowedApps = pickers?.apps || null;
                const allowedRoles = pickers?.roles || null;

                // 1) 合并软件分片
                Object.entries(apps).forEach(([appKey, seg]) => {
                    if (allowedApps && !allowedApps.has(appKey)) return;
                    const ls = seg?.localStorage || {};
                    Object.entries(ls).forEach(([k, v]) => {
                        if (v !== null && v !== undefined) localStorage.setItem(k, String(v));
                    });
                });

                if ((!allowedApps || allowedApps.has('chat')) && apps.chat?.data?.soulLinkMessages && typeof apps.chat.data.soulLinkMessages === 'object') {
                    soulLinkMessages.value = {
                        ...(soulLinkMessages.value || {}),
                        ...apps.chat.data.soulLinkMessages
                    };
                    await saveSoulLinkMessages();
                }
                if ((!allowedApps || allowedApps.has('chat')) && Array.isArray(apps.chat?.data?.soulLinkGroups)) {
                    soulLinkGroups.value = mergeById(soulLinkGroups.value, apps.chat.data.soulLinkGroups);
                    saveSoulLinkGroups();
                }
                if ((!allowedApps || allowedApps.has('chat')) && apps.chat?.data?.soulLinkPet && typeof apps.chat.data.soulLinkPet === 'object') {
                    soulLinkPet.value = { ...(soulLinkPet.value || {}), ...apps.chat.data.soulLinkPet };
                }
                if ((!allowedApps || allowedApps.has('workshop')) && Array.isArray(apps.workshop?.data?.characters)) {
                    characters.value = mergeById(characters.value, apps.workshop.data.characters);
                }
                if ((!allowedApps || allowedApps.has('workshop')) && Array.isArray(apps.workshop?.data?.worldbooks)) {
                    worldbooks.value = mergeById(worldbooks.value, apps.workshop.data.worldbooks);
                }
                if ((!allowedApps || allowedApps.has('workshop')) && Array.isArray(apps.workshop?.data?.presets)) {
                    presets.value = mergeById(presets.value, apps.workshop.data.presets);
                }

                // 2) 合并角色分片（只影响对应角色）
                Object.values(roles).forEach((seg) => {
                    const roleId = String(seg?.id || '');
                    if (!roleId) return;
                    if (allowedRoles && !allowedRoles.has(roleId)) return;
                    if (seg.character) {
                        characters.value = mergeById(characters.value, [seg.character]);
                    }
                    if (Array.isArray(seg.soulLinkMessages)) {
                        soulLinkMessages.value = { ...(soulLinkMessages.value || {}), [roleId]: seg.soulLinkMessages };
                    }
                    const ls = seg.localStorage || {};
                    Object.entries(ls).forEach(([k, v]) => {
                        if (v !== null && v !== undefined) localStorage.setItem(k, String(v));
                    });
                });

                await saveSoulLinkMessages();
                saveSoulLinkGroups();
                saveCharacters();
                saveWorldbooks();
                savePresets();
                addConsoleLog('分片恢复完成：已按软件/角色合并，不影响其它数据。', 'success');
            } catch (e) {
                addConsoleLog('分片恢复失败：' + (e.message || e), 'error');
            } finally {
                backupImporting.value = false;
            }
        };

        const openSegmentedImportPanel = (pkg) => {
            segmentedImportPackage.value = pkg;
            const apps = pkg?.segments?.apps || {};
            const roles = pkg?.segments?.roles || {};
            const appSel = {};
            Object.keys(apps).forEach((k) => { appSel[k] = true; });
            const roleSel = {};
            Object.keys(roles).forEach((k) => { roleSel[k] = true; });
            segmentedImportAppSelections.value = appSel;
            segmentedImportRoleSelections.value = roleSel;
            showSegmentedImportPanel.value = true;
        };

        const closeSegmentedImportPanel = () => {
            showSegmentedImportPanel.value = false;
            segmentedImportPackage.value = null;
            segmentedImportAppSelections.value = {};
            segmentedImportRoleSelections.value = {};
        };

        const confirmSegmentedImport = async () => {
            const pkg = segmentedImportPackage.value;
            if (!pkg?.segments) return;
            const appsPicked = new Set(
                Object.entries(segmentedImportAppSelections.value || {})
                    .filter(([, v]) => !!v)
                    .map(([k]) => k)
            );
            const rolesPicked = new Set(
                Object.entries(segmentedImportRoleSelections.value || {})
                    .filter(([, v]) => !!v)
                    .map(([k]) => k)
            );
            if (appsPicked.size === 0 && rolesPicked.size === 0) {
                addConsoleLog('请至少选择一个软件或角色分片。', 'warn');
                return;
            }
            const ok = window.confirm('将按勾选项进行“分片合并恢复”，未勾选项不会受影响。确认继续？');
            if (!ok) return;
            await applySegmentedBackupPayload(pkg, { apps: appsPicked, roles: rolesPicked });
            closeSegmentedImportPanel();
        };

        const applySoulOsBackupPayload = async (pkg) => {
            if (!pkg || typeof pkg !== 'object') {
                addConsoleLog('备份数据无效。', 'error');
                return;
            }
            if (!window.confirm('确定用此备份覆盖当前数据？\n\n建议先导出一份当前备份；恢复后会自动刷新页面。')) {
                return;
            }
            backupImporting.value = true;
            try {
                if (pkg.localStorage && typeof pkg.localStorage === 'object') {
                    for (const [k, v] of Object.entries(pkg.localStorage)) {
                        if (v === null || v === undefined) continue;
                        localStorage.setItem(k, String(v));
                    }
                }
                if (pkg.indexedDB && typeof pkg.indexedDB === 'object') {
                    await restoreIdbDatabase('SoulOS_DB', pkg.indexedDB.SoulOS_DB);
                    await restoreIdbDatabase('FeedDB', pkg.indexedDB.FeedDB);
                }
                addConsoleLog('数据已恢复，正在刷新…', 'success');
                setTimeout(() => { window.location.reload(); }, 500);
            } catch (e) {
                addConsoleLog('恢复失败：' + (e.message || e), 'error');
            } finally {
                backupImporting.value = false;
            }
        };

        const downloadSoulOsBackup = async () => {
            if (backupExporting.value || backupImporting.value) return;
            backupExporting.value = true;
            try {
                addConsoleLog('正在打包完整备份（含 IndexedDB）…', 'info');
                const pkg = await buildSoulOsBackupPackage();
                const json = JSON.stringify(pkg);
                const slotResult = writeBackupSlotWithFallback(pkg);
                if (slotResult.ok) {
                    backupLastSavedHint.value = `本地备份槽已更新 · ${new Date().toLocaleString()}`;
                    if (slotResult.mode === 'slim') {
                        addConsoleLog('备份槽容量不足，已自动写入“精简槽备份”（完整备份仍已下载）。', 'warn');
                    }
                } else {
                    backupLastSavedHint.value = '';
                    addConsoleLog('备份槽写入失败（可能超出容量）：' + (slotResult.error?.message || slotResult.error), 'warn');
                }
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
                a.href = url;
                a.download = `SoulOS-备份-${stamp}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                addConsoleLog('备份已下载，请妥善保存 JSON 文件。', 'success');
            } catch (e) {
                addConsoleLog('导出失败：' + (e.message || e), 'error');
            } finally {
                backupExporting.value = false;
            }
        };

        const downloadSegmentedBackup = async () => {
            if (backupExporting.value || backupImporting.value) return;
            backupExporting.value = true;
            try {
                addConsoleLog('正在打包分片备份（按软件/角色）…', 'info');
                const pkg = buildSegmentedBackupPackage();
                const json = JSON.stringify(pkg);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
                a.href = url;
                a.download = `SoulOS-分片备份-${stamp}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                addConsoleLog('分片备份已下载：可按软件/角色合并恢复。', 'success');
            } catch (e) {
                addConsoleLog('分片导出失败：' + (e.message || e), 'error');
            } finally {
                backupExporting.value = false;
            }
        };

        const saveSoulOsBackupSlotOnly = async () => {
            if (backupExporting.value || backupImporting.value) return;
            backupExporting.value = true;
            try {
                addConsoleLog('正在写入本地备份槽…', 'info');
                const pkg = await buildSoulOsBackupPackage();
                const slotResult = writeBackupSlotWithFallback(pkg);
                if (slotResult.ok) {
                    backupLastSavedHint.value = `本地备份槽已更新 · ${new Date().toLocaleString()}`;
                    if (slotResult.mode === 'slim') {
                        addConsoleLog('容量不足：已写入精简槽备份（剔除了大图/部分库数据）。', 'warn');
                    } else {
                        addConsoleLog('已写入本地备份槽（仅存本浏览器）。', 'success');
                    }
                } else {
                    addConsoleLog('写入失败：' + (slotResult.error?.message || slotResult.error), 'error');
                }
            } finally {
                backupExporting.value = false;
            }
        };

        const restoreSoulOsFromSlot = async () => {
            if (backupExporting.value || backupImporting.value) return;
            const raw = localStorage.getItem(SOULOS_BACKUP_SLOT_KEY);
            if (!raw) {
                addConsoleLog('本地备份槽为空，请先执行备份。', 'warn');
                return;
            }
            let pkg;
            try {
                pkg = JSON.parse(raw);
            } catch {
                addConsoleLog('备份槽内容不是有效 JSON。', 'error');
                return;
            }
            await applySoulOsBackupPayload(pkg);
        };

        const triggerSoulOsBackupImport = () => {
            soulosBackupFileInput.value?.click();
        };

        const handleSoulOsBackupImport = async (event) => {
            const file = event.target.files && event.target.files[0];
            event.target.value = '';
            if (!file) return;
            if (backupExporting.value || backupImporting.value) return;
            try {
                const pkg = JSON.parse(await file.text());
                if (pkg?.mode === 'segmented') {
                    openSegmentedImportPanel(pkg);
                } else {
                    await applySoulOsBackupPayload(pkg);
                }
            } catch (e) {
                addConsoleLog('读取或解析备份文件失败：' + (e.message || e), 'error');
            }
        };

        try {
            if (localStorage.getItem(SOULOS_BACKUP_SLOT_KEY)) {
                backupLastSavedHint.value = '本地备份槽中已有数据，可从槽恢复';
            }
        } catch { /* ignore */ }

        // soulLinkGroups / soulLinkPet moved to top-level init
        const showEmojiPanel = ref(false);
        const showAttachmentPanel = ref(false);
        const showImageSubmenu = ref(false);
        const showLocationPanel = ref(false);
        const showTransferPanel = ref(false);
        const showChatSettings = ref(false);
        // Timezone system
        const timeZoneSystemEnabled = ref(false);
        const userTimeZone = ref('Asia/Shanghai');
        const roleTimeZone = ref('Asia/Tokyo');
        // Active message / social system
        const activeMessageEnabled = ref(false);
        const activeMessageFrequencyMin = ref(15);
        const activeReplyDelaySec = ref(8);
        const lastUserActiveAt = ref(Date.now());
        const socialUserBlockedRole = ref(false);
        const socialRoleBlockedUser = ref(false);
        const socialPendingRoleRequest = ref(false);
        // Chat Summary (token saver)
        const chatSummaryEnabled = ref(true);
        const chatSummaryEveryN = ref(12); // 每N次用户消息自动总结一次
        const chatSummaryGenerating = ref(false);
        const chatSummaryBoard = ref([]); // {id,title,body,createdAt,createdAtText}
        // 外语翻译（reply / OS 下方横线译文）
        // A：AI主输出语言；B：下方翻译语言
        const soulLinkForeignTranslationEnabled = ref(false);
        const soulLinkForeignPrimaryLang = ref('zh-CN'); // A
        const soulLinkForeignSecondaryLang = ref('en');  // B
        // 时间感知（像微信一样隔一段时间显示相对时间）
        const timeSenseEnabled = ref(true);
        const messageTimeNow = ref(Date.now());
        let messageTimeIntervalId = null;
        const showPhotoSelectPanel = ref(false);
        const showTextImagePanel = ref(false);
        const textImageText = ref('');
        const textImageBgColor = ref('#ffffff');
        const textImageColors = ['#ffffff', '#f8f5f0', '#fef3c7', '#dbeafe', '#f3e8ff', '#fce7f3', '#dcfce7'];
        const showVoiceInputPanel = ref(false);
        const voiceInputText = ref('');
        const showGreetingSelect = ref(false);
        const availableGreetings = ref([]);
        const selectedGreeting = ref(null);
        const showVirtualCamera = ref(false);
        const showArchiveDialog = ref(false);
        const showArchivedChats = ref(false);
        const archivedChats = ref([]);
        const archiveName = ref('');
        const archiveDescription = ref('');
        const showCreateGroupDialog = ref(false);
        const showVotePanel = ref(false);
        const voteQuestion = ref('');
        const voteOptions = ref(['', '']);
        const activeVote = ref(null);
        const newGroupName = ref('');
        const newGroupMembers = ref('');
        
        // Shopping
        const showTaobaoPanel = ref(false);
        const taobaoSearchTerm = ref('');
        const taobaoProducts = ref([]);
        const taobaoLoading = ref(false);
        
        // Share
        const showSharePanel = ref(false);
        const shareSource = ref('');
        const shareContent = ref('');
        const shareSources = ['B站', '小红书', '知乎', '微博', '抖音', '浏览器', '微信公众号', '其他'];
        
        const newGroupAvatar = ref('');
        const selectedGroupMembers = ref([]);
        const groupAvatarInput = ref(null);
        const showAddMemberDialog = ref(false);
        const selectedAddMembers = ref([]);
        const addMemberMode = ref('existing');
        const customMemberAvatar = ref('');
        const customMemberName = ref('');
        const customMemberPersona = ref('');
        const customMemberAvatarInput = ref(null);
        const newGroupNameInput = ref('');
        const tempGroupAvatar = ref('');
        const renameGroupAvatarInput = ref(null);
        const showRenameGroupDialog = ref(false);
        
        // 聊天背景设置
        const chatBackgroundStyle = ref('default');
        const gradientStartColor = ref('#f2f2f7');
        const gradientEndColor = ref('#ffffff');
        const solidBackgroundColor = ref('#f2f2f7');
        const chatBackgroundImage = ref('');
        const chatBackgroundImageInput = ref('');
        const virtualImageDesc = ref('');
        const transferAmount = ref(0);
        const transferNote = ref('');
        const locationUser = ref('');
        const locationTarget = ref('');
        const locationDistance = ref('');
        const locationTrajectoryPoints = ref([]);
        const pixelEmojis = ref([
            '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
            '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
            '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
            '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
            '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
            '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
            '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯',
            '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁',
            '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧',
            '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
            '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠',
            '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹',
            '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹',
            '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️',
            '🤟', '🤘', '👌', '🤏', '👈', '👉', '👆', '👇',
            '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤙', '💪',
            '🦾', '🖕', '✍️', '🙏', '🦶', '🦵', '🦿', '💄',
            '💋', '👄', '🦷', '👅', '👂', '🦻', '👃', '👣',
            '👁', '👀', '🧠', '🫀', '🫁', '🩸', '🦠', '💐',
            '🌸', '💮', '🏵', '🌹', '🥀', '🌺', '🌻', '🌼'
        ]);
        const stickerPacks = ref(JSON.parse(localStorage.getItem('stickerPacks') || '[]'));
        // 这四个系列你说是“空的”，需要先从本地缓存里删掉（避免后续被当成已存在包而跳过合并）
        try {
            const dropStickerPackNames = ['狗皇帝', '呆猫八条', '绿萝卜', '这狗'];
            if (Array.isArray(stickerPacks.value)) {
                stickerPacks.value = stickerPacks.value.filter(p => p?.name && !dropStickerPackNames.includes(p.name));
                localStorage.setItem('stickerPacks', JSON.stringify(stickerPacks.value));
            }
        } catch (e) {
            // ignore: localStorage 在某些环境下不可用/受限
        }
        // ===== 内置表情包（把用户给的 xxx.txt 直接内置进来）=====
        // 规则：xxx.txt 的 xxx 就是表情包系列名；文件内容行格式： 名称: URL
        // 注意：由于浏览器对本地文件读取有限制，这里选择直接把文本内置到前端脚本中。
        const builtinStickerPackTexts = {
            狗皇帝: `嘿嘿: https://files.catbox.moe/5sflvj.jpg
传旨: https://files.catbox.moe/jmrdo2.jpg
国色天香: https://files.catbox.moe/a409v5.jpg
皇帝驾到: https://files.catbox.moe/s1ebsc.jpg
要对朕心怀感激: https://files.catbox.moe/61i8ja.jpg
甚好: https://files.catbox.moe/nslzhe.jpg
给朕上贡: https://files.catbox.moe/ptzk03.jpg
皇上饶命: https://files.catbox.moe/rqn1o1.jpg
你好香: https://files.catbox.moe/5z0oru.jpg
遵旨: https://files.catbox.moe/zzca7c.jpg
俺是小皇帝: https://files.catbox.moe/jjsx9f.jpg
龙颜不悦: https://files.catbox.moe/rycskd.jpg
既见朕，为何不跪: https://files.catbox.moe/ywrr53.jpg
爱卿平身: https://files.catbox.moe/zq5evj.jpg
龙颜大悦: https://files.catbox.moe/8wibyb.jpg
朕考考你: https://files.catbox.moe/tj3faj.jpg
朕，知晓一切: https://files.catbox.moe/dz17wc.jpg
斩立决: https://files.catbox.moe/xm2c37.jpg
朕知道了，退下吧: https://files.catbox.moe/8xh473.jpg
朕参见奴才: https://files.catbox.moe/538d1p.jpg
何错之有: https://files.catbox.moe/l2ya3f.jpg
赏心悦目: https://files.catbox.moe/8pwn00.jpg
重赏: https://files.catbox.moe/ejo4f9.jpg
给我: https://files.catbox.moe/046qeg.jpg
胆大包天: https://files.catbox.moe/xjldze.gif
竟有此事: https://files.catbox.moe/crle9n.gif
陛下圣明: https://files.catbox.moe/ad4ybt.gif
朕天下第一帅: https://files.catbox.moe/pfig6w.gif
请用膳: https://files.catbox.moe/lddsbr.gif
翻牌子: https://files.catbox.moe/lkp1xn.gif
关怀: https://files.catbox.moe/aoefan.gif
朕乏了: https://files.catbox.moe/8bi978.gif
上早八: https://files.catbox.moe/rbaj4o.gif
息怒: https://files.catbox.moe/6j2als.gif
什么意思: https://files.catbox.moe/pgraco.gif
不干了: https://files.catbox.moe/3v5nb1.gif
好: https://files.catbox.moe/vlpble.gif
追随你: https://files.catbox.moe/vhsmxx.gif
告退: https://files.catbox.moe/kwadrn.gif
这就去: https://files.catbox.moe/12x6ge.gif
做掉他: https://files.catbox.moe/fq2p6o.gif
您吉祥: https://files.catbox.moe/s5zjgp.png
皇上驾到: https://files.catbox.moe/l23gio.gif
俺是小奴才: https://files.catbox.moe/p8ckto.png
召唤: https://files.catbox.moe/8f8270.gif
准了: https://files.catbox.moe/0vc6kq.gif
你可知罪: https://files.catbox.moe/nhh2h6.gif
知错了: https://files.catbox.moe/zq5yqt.gif`,
            恶俗: `禁止发春:https://i.postimg.cc/C55TvMDF/tlal8l.jpg
摸男人奶子:https://i.postimg.cc/Jn2DYngZ/2rtcpa.gif 
皮拍子打逼:https://i.postimg.cc/pT6hcT7D/5h8d07.gif
舔屁股拍屁股:https://i.postimg.cc/vBNg2Bjv/7je3j4-(1).gif 
捆绑做爱:https://i.postimg.cc/Tww5cmkD/asupa5.gif
躯体化手在裤子里撸管:https://i.postimg.cc/855fbWyr/Camera-XHS-17641935050941040g2sg31nqasfhemmj05p0ida2kidjp2mgo16o.jpg
萎:https://i.postimg.cc/Kzz35L98/Camera-XHS-17641936274441040g2sg314bsa4f7688g5pgjt7c3creborucbfg.jpg
打屁屁:https://i.postimg.cc/j5Fw359y/i0sd31.gif
发大水了:https://i.postimg.cc/wvvRkJW1/ikmlgo.jpg
假鸡吧插屁股:https://i.postimg.cc/G258g2NH/kl6eau.gif
我要吃奶还要边吃边摸:https://i.postimg.cc/0QQKCmtb/rzu623.jpg
抽插:https://i.postimg.cc/vBNg2Bj2/xmj-1764192317618-jpg.gif
嘬你胸:https://i.postimg.cc/8s8FDYTD/xmj-1764192324926-jpg.gif
弹奶子:https://i.postimg.cc/9z34Vkcc/xmj-1764192328297-jpg.gif
掐脖子干:https://i.postimg.cc/ydbgpd52/xmj-1764192337549-jpg.gif
再骚扰我就掐你小鸡鸡:https://i.postimg.cc/sfP9DPt8/img-1764196381687008FUyibgy1i5ekbim01gg303k03kjsz.gif
你想干什么:https://i.postimg.cc/C1TkwdJz/img-1764196367264008FUyibgy1i5ekbh3j7ag303e02ojry.gif 
拿针扎病人皮眼:https://i.postimg.cc/nzbBnMTZ/img-1764196405759007d4Yz2ly1i5ekzd7476g303k03k0t3.gif
小样，整不死你:https://i.postimg.cc/hjWTKhMX/img-1764196410573007d4Yz2ly1i5ekze13a0g303k03kq38.gif 
帅哥哥我等你呐:https://i.postimg.cc/tTQW97Dg/img-1764196425401008s-L2t-Egy1i5ekx6qvbxg303k03kmxe.gif`,
            呆猫八条: `　　比中指：https://files.catbox.moe/wkbqwn.jpeg
咬你/啃你：https://files.catbox.moe/u2fq1v.jpeg
思考：https://files.catbox.moe/kpucr6.jpeg
不要啊！：https://files.catbox.moe/ahvwuh.jpeg
给你爱心：https://files.catbox.moe/hpnlwp.jpeg
老实：https://files.catbox.moe/y64cpm.jpeg
躺下哭泣：https://files.catbox.moe/lbgejb.jpeg
后退发抖：https://files.catbox.moe/z6f4k6.jpeg
气炸毛了：https://files.catbox.moe/cz2pxs.jpeg
摇尾巴：https://files.catbox.moe/5zjtvn.jpeg
咬衣服/别走！：https://files.catbox.moe/2gcvw9.jpeg
哇塞！/真的吗：https://files.catbox.moe/2xa81l.jpeg
卑职明白：https://files.catbox.moe/9rn1o7.jpeg
阴沉思考：https://files.catbox.moe/zcy509.jpeg
爱心：https://files.catbox.moe/w8mhob.jpeg
拍了拍地板/你过来：https://files.catbox.moe/d82a7g.jpeg
心里想刀人但是不敢：https://files.catbox.moe/u93koe.jpeg
已经这样了，那还能怎么办？：https://files.catbox.moe/g71x1n.jpeg
汗流浃背吐舌头：https://files.catbox.moe/g71x1n.jpeg
我不去！：https://files.catbox.moe/nzwasb.jpeg
汗流浃背：https://files.catbox.moe/z2kati.jpeg
三个点：https://files.catbox.moe/o1o8oa.jpeg
上班好累：https://files.catbox.moe/x12vzk.jpeg
是的主人！：https://files.catbox.moe/006sie.jpeg
舔你的手指：https://files.catbox.moe/t6lkjn.jpeg
嘬一口：https://files.catbox.moe/t6lkjn.jpeg
嘬一口：https://files.catbox.moe/g42360.jpeg
疑惑：https://files.catbox.moe/qa30h6.jpeg
害羞脸红：https://files.catbox.moe/m7arrf.jpeg
混乱：https://files.catbox.moe/allc2d.jpeg
比耶：https://files.catbox.moe/ypoph0.jpeg
思考：https://files.catbox.moe/ybcmzc.jpeg
摸头：https://files.catbox.moe/pf1slc.jpeg
OK：https://files.catbox.moe/chifv5.jpeg
操：https://files.catbox.moe/0w66zs.jpeg
爱心：https://files.catbox.moe/pqq8o5.jpeg
探头：https://files.catbox.moe/tzvjev.jpeg
我来了：https://files.catbox.moe/p65yds.jpeg
阴沉憋屈：https://files.catbox.moe/0anepb.jpeg
贴贴蹭蹭：https://files.catbox.moe/nz40cm.jpeg
揉揉脸：https://files.catbox.moe/wvj6ec.jpeg
阻拦：https://files.catbox.moe/og7zsy.jpeg
哭着打电话：https://files.catbox.moe/u1q149.jpeg
捏捏脸但还是生气：https://files.catbox.moe/pgrf0c.jpeg
呜呜被打了：https://files.catbox.moe/wjvwnl.jpeg
呜呜我错了：https://files.catbox.moe/wjvwnl.jpeg
不要啊：https://files.catbox.moe/p647hu.jpeg
亲一口：https://files.catbox.moe/nyhlde.jpeg
星星眼：https://files.catbox.moe/9lysji.jpeg
憋到脸红：https://files.catbox.moe/ia2bj9.jpeg
啊好吃好吃：https://files.catbox.moe/2d8dpy.jpeg
逃走：https://files.catbox.moe/y79thp.JPG
卖萌：https://files.catbox.moe/d0blm1.JPG
哭哭发抖：https://files.catbox.moe/4o2pcn.JPG
盯：https://files.catbox.moe/darjw1.JPG
爆哭：https://files.catbox.moe/hqnnbx.JPG
委屈：https://files.catbox.moe/emwjh9.JPG
我恨：https://files.catbox.moe/ra2cjm.JPG
超级委屈：https://files.catbox.moe/91tj5k.JPG
蹭蹭：https://files.catbox.moe/piwn04.JPG
疑惑：https://files.catbox.moe/wymjg4.JPG
被看扁了：https://files.catbox.moe/i5qm1w.JPG
被骂了：https://files.catbox.moe/g49f9h.JPG
被骂了但不服：https://files.catbox.moe/g49f9h.JPG
累趴了：https://files.catbox.moe/1vgqbr.JPG
牵手：https://files.catbox.moe/tnef99.JPG
对着手机笑：https://files.catbox.moe/jv7981.JPG
期待：https://files.catbox.moe/6z3c67.JPG
惊讶：https://files.catbox.moe/rd02w8.JPG
太心动了：https://files.catbox.moe/q4y1rq.JPG
心虚：https://files.catbox.moe/ybu9yt.JPG
你在做啥坏事：https://files.catbox.moe/t34915.JPG
阴沉地亮出刀：https://files.catbox.moe/bx1bkr.jpeg
讨好：https://files.catbox.moe/8u2k76.JPG`,
            发疯文学: `就不说话了: https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768242335410_qdqqd_cuttdo.gif
遇到难回答的问题: https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768242338198_qdqqd_wv26dl.gif
你总是这样: https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768242341586_qdqqd_05mz36.gif
爱你老己: https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768242344132_qdqqd_zihtpa.gif
闺闺: https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768242346688_qdqqd_65vu2p.gif
没招了: https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768242347956_qdqqd_f7zad8.gif
我要找人弄你: https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768242349185_qdqqd_7f7brl.gif
我有的是力气和手段: https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768242350529_qdqqd_yyds9w.gif
可以了不想再听了: https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768242351848_qdqqd_73oh3z.gif
太坏了准备更坏: https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768242353136_qdqqd_vrszsx.gif
好狗: https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768242354465_qdqqd_u7r13k.gif
真棒: https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768242356503_qdqqd_d7l01k.gif
没有这个义务: https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768242357841_qdqqd_0pdoue.gif
不知道: https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768242359115_qdqqd_8q1fth.gif
消息很难回吗: https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768242360569_qdqqd_x90qvt.gif
受着: https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768242361820_qdqqd_6lqqhi.gif
你无敌了: https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768242363056_qdqqd_admhzd.gif
这对吗: https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768242364304_qdqqd_1rbcff.gif
蠢蠢的很安心: https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768242365582_qdqqd_1y2326.gif
天塌了: https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768242366782_qdqqd_6uq7pb.gif
诡秘在吗: https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768242368010_qdqqd_sx79te.gif
是不是笑脸给多了: https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768242369167_qdqqd_w3vh6z.gif
好了不许说话: https://s3plus.meituan.net/opapisdk/op_ticket_1_5677168484_1768242370357_qdqqd_hpzlom.gif
你想毁了我吗: https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768242371503_qdqqd_ibik1r.gif
0帧起手: https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768242372851_qdqqd_u4wvup.gif
装货: https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768242373994_qdqqd_bs5pdv.gif
那可太有生活了: https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768242375773_qdqqd_exu5c1.gif
那很对了: https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768242376938_qdqqd_cprncy.gif
那很坏了: https://s3plus.meituan.net/opapisdk/op_ticket_1_885190757_1768242378174_qdqqd_r4rs9e.gif
俺不中嘞: https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768242379359_qdqqd_5trlwx.gif
都不容易: https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768242380520_qdqqd_mgud6s.gif
蒜鸟蒜鸟: https://s3plus.meituan.net/opapisdk/op_ticket_1_5673241091_1768242381625_qdqqd_fy7sl2.gif`,
            我鸟都不鸟你: `我鸟都不鸟你：https://i.postimg.cc/T2BJPTzt/Screenshot-2025-12-19-14-57-05-451-com-xingin-xhs-edit.jpg
我想鸟鸟：https://i.postimg.cc/Qt2KjdFY/Screenshot-2025-12-19-14-57-34-364-com-xingin-xhs-edit.jpg
我鸟你身上：https://i.postimg.cc/26Z39N0S/Screenshot-2025-12-19-14-57-47-345-com-xingin-xhs-edit.jpg
不许鸟：https://i.postimg.cc/522ydCPf/Screenshot-2025-12-19-14-57-58-040-com-xingin-xhs-edit.jpg
你打我撒：https://i.postimg.cc/cLLCynDJ/Screenshot-2025-12-19-14-59-37-774-com-xingin-xhs-edit.jpg
加油，你是最胖的：https://i.postimg.cc/MpnwmbPn/Screenshot-2025-12-19-14-59-45-200-com-xingin-xhs-edit.jpg
你鸟鸟我：https://i.postimg.cc/QCdwxhvc/Screenshot-2025-12-19-15-00-16-153-com-xingin-xhs-edit.jpg
我们不鸟你：https://i.postimg.cc/tTXm29R0/Screenshot-2025-12-19-15-00-30-404-com-xingin-xhs-edit.jpg
不鸟我的下场：https://i.postimg.cc/vZfqy4Dj/Screenshot-2025-12-19-15-00-43-421-com-xingin-xhs-edit.jpg`,
            绿萝卜: `开心的跳舞:https://files.catbox.moe/rifquh.gif
收到敬礼:https://files.catbox.moe/x57pt9.gif
好耶（飞奔）:https://files.catbox.moe/rv50e5.gif
呜呜（大哭）:https://files.catbox.moe/2a4qkv.gif
委屈🥺：https://files.catbox.moe/ehb859.gif
送花:https://files.catbox.moe/slytma.gif
开心：https://files.catbox.moe/cirfzj.gif
哇！真的吗:https://files.catbox.moe/0f5y9j.gif
气嘟嘟:https://files.catbox.moe/bfk8cx.gif
包在我身上(OK）:https://files.catbox.moe/wsqbt1.gif
自闭:https://files.catbox.moe/ma1ksa.gif
不开心:https://files.catbox.moe/kz3sxe.gif
哭哭:https://files.catbox.moe/wl0qzq.gif
捂脸哭(假哭）:https://files.catbox.moe/emu99k.gif
眼神亮晶晶:https://files.catbox.moe/urdfkq.gif
心动:https://files.catbox.moe/9x1o38.gif
飞吻:https://files.catbox.moe/xrfvlx.gif
生气:https://files.catbox.moe/ltf11x.gif
放屁:https://files.catbox.moe/sodmp7.gif
耍赖:https://files.catbox.moe/9m913y.gif
咦！（震惊）:https://files.catbox.moe/j270y8.gif
疑惑:https://files.catbox.moe/td6tla.gif
不行:https://files.catbox.moe/xp0nx5.gif
棒:https://files.catbox.moe/xp0nx5.gif
OK:https://files.catbox.moe/z7rstl.gif
打你:https://files.catbox.moe/ccdwsh.gif
害羞:https://files.catbox.moe/im1fb1.jpeg
灵魂出窍:https://files.catbox.moe/oitobi.jpeg
冒冷汗:https://files.catbox.moe/88rj5h.jpeg
思考:https://files.catbox.moe/se13r7.jpeg
发怒:https://files.catbox.moe/1ym8s2.jpeg
幸灾乐祸:https://files.catbox.moe/t2sq0v.jpeg
飞奔:https://files.catbox.moe/lyohwx.jpeg
飘来:https://files.catbox.moe/9tz3ri.jpeg
不愿醒来:https://files.catbox.moe/hbkdex.jpeg`,
            棉花糖小狗: `略略略：https://img.58sb.cn/file/img/jktb7oi4.jpg
舔舔你：https://img.58sb.cn/file/img/8hlgSoU0.jpg
看我看我：https://img.58sb.cn/file/img/C5o7L9vf.jpg
我开动了：https://img.58sb.cn/file/img/9BfsP3oQ.jpg
送你小花：https://img.58sb.cn/file/img/3Oovm4eE.jpg
小狗生气：https://img.58sb.cn/file/img/JqZ2CtQm.jpg
我看看怎么个事儿：https://img.58sb.cn/file/img/DHuBi8oO.jpg
好运好运~：https://img.58sb.cn/file/img/HmtXpOFl.jpg
余额不足了：https://img.58sb.cn/file/img/eeeXyq1w.jpg
眼睛亮亮地看你：https://img.58sb.cn/file/img/J0i5Gliv.jpg
可怜兮兮：https://img.58sb.cn/file/img/oAKFBM9z.jpg
理理我呀：https://img.58sb.cn/file/img/Xe1qez0v.jpg
没招了：https://img.58sb.cn/file/img/178mHGOm.jpg
我真的生气了：https://img.58sb.cn/file/img/2HgR6OJA.jpg
哦哦哦不哭：https://img.58sb.cn/file/img/vyGpcOA1.jpg
挠挠下巴：https://img.58sb.cn/file/img/G92zvD5g.jpg
和我玩：https://img.58sb.cn/file/img/sia6U5Rb.jpg
暗示你：https://img.58sb.cn/file/img/0wkGpJo3.jpg
我鸟都不鸟你：https://img.58sb.cn/file/img/5VUgRc3S.jpg
我就这么静静看着：https://img.58sb.cn/file/img/KlNcTsET.jpg`,
            这狗: `玫瑰 https://files.catbox.moe/545b2b.gif
呆萌 https://files.catbox.moe/fhwab8.gif
开心 https://files.catbox.moe/k30x10.gif
收到 https://files.catbox.moe/4xolcf.gif
幸福 https://files.catbox.moe/rsuln5.gif
幸运 https://files.catbox.moe/yldelv.gif
嘬嘬 https://files.catbox.moe/l84x07.gif
流泪 https://files.catbox.moe/95ybre.gif
阴暗 https://files.catbox.moe/zk1pl5.gif
思考 https://files.catbox.moe/mqttit.gif
挠屁屁 https://files.catbox.moe/ws1yse.gif
摇尾巴 https://files.catbox.moe/33pn02.gif
亲亲 https://files.catbox.moe/6azpdx.gif
星星眼 https://files.catbox.moe/6s5kb9.gif
猎杀时刻 https://files.catbox.moe/irrrj4.gif
嚼嚼 https://files.catbox.moe/5rz6rh.gif
苦涩 https://files.catbox.moe/x2av3c.gif
奇怪 https://files.catbox.moe/iwpx4b.gif
灿烂 https://files.catbox.moe/67s7q4.gif
比耶 https://files.catbox.moe/0ern4o.gif
委屈 https://files.catbox.moe/rrpca3.gif
生气 https://files.catbox.moe/2qfv9t.gif
饿了 https://files.catbox.moe/mbo9qa.gif
特别好 https://files.catbox.moe/dsnpip.gif`,
            小章鱼: `疑问 https://i.postimg.cc/ZR6qJDzZ/IMG-4278.gif
OK https://i.postimg.cc/B62vJwf4/IMG-4279.gif
开心/哼歌/雀跃 https://i.postimg.cc/sX5230CV/IMG-4280.gif
惊吓 https://i.postimg.cc/8C25Qg3X/IMG-4281.gif
偷亲 https://i.postimg.cc/N03MqvVS/IMG-4282.gif
睡觉 https://i.postimg.cc/8C25Qg3x/IMG-4283.gif
震惊 https://i.postimg.cc/FKMR5Xq2/IMG-4284.gif
慌张 https://i.postimg.cc/MT1Gzr2L/IMG-4286.gif
流泪/悲伤 https://i.postimg.cc/HxbLTPDh/IMG-4287.gif
开心到跳起 https://i.postimg.cc/0Q7N9HRT/IMG-4289.gif
期待/按捺不住 https://i.postimg.cc/C1bKw6pV/IMG-4290.gif
害怕/恐惧 https://i.postimg.cc/HLqxD1Kw/IMG-4291.gif
鞠躬/麻烦你了 https://i.postimg.cc/TPzwMvSc/IMG-4292.gif
随歌起舞 https://i.postimg.cc/fbGLnQFK/IMG-4293.gif
冒爱心 https://i.postimg.cc/43DdkRMw/IMG-4294.gif
崇拜/期待 https://i.postimg.cc/g0CJFb5s/IMG-4295.gif
贴贴摸头 https://i.postimg.cc/0QdbY25t/IMG-4702.gif
害怕/瑟瑟发抖 https://i.postimg.cc/RFzWJnm8/IMG-4703.gif
可愛いね（好可爱呀） https://i.postimg.cc/ydzD3SKG/IMG-4705.gif
どれくらい好き？（有多喜欢我？） https://i.postimg.cc/tRks7TMZ/IMG-4706.gif
ごめんね（对不起） https://i.postimg.cc/DZd8ryfc/IMG-4707.gif
はあ...（哈啊...）/叹气 https://i.postimg.cc/fWCVkLr0/IMG-4708.gif
不安だよー（我很不安哦—） https://i.postimg.cc/c1hv6Hb7/IMG-4709.gif
会いたいよー（想见你哦—） https://i.postimg.cc/1RB84tjc/IMG-4710.gif
ちゅ（啾）/飞吻 https://i.postimg.cc/pVCmyT68/IMG-4711.gif
ほんとに好き？（真的喜欢我吗？） https://i.postimg.cc/59gXj0RB/IMG-4712.gif
OK！ https://i.postimg.cc/FFpY1RBG/IMG-4714.gif
ほんとにへいき？（真的不要紧吗？/真的没事吗？） https://i.postimg.cc/3RHk0Dh1/IMG-4715.gif
お疲れ様（辛苦了） https://i.postimg.cc/7P95b6Wx/IMG-4716.gif
ちゅー（啾）/亲亲 https://i.postimg.cc/QCfCz47G/IMG-4717.gif
やだやだー！（不要不要—！）/闹别扭 https://i.postimg.cc/59gXj0RN/IMG-4718.gif
ぷん！（哼！）/不理你了！ https://i.postimg.cc/T20Khw41/IMG-4719.gif
走近凝视/震慑 https://i.postimg.cc/FFpY1RB1/IMG-4720.gif
好きだよっ（喜欢哦） https://i.postimg.cc/0jVj4WwW/IMG-4721.gif
好きって言って？（说喜欢我？） https://i.postimg.cc/ZnwnQ7dM/IMG-4722.gif
いつもありがと（一直以来都很感谢你） https://i.postimg.cc/sxTxL6hL/IMG-4723.gif
幸せ～（好幸福~） https://i.postimg.cc/fy8yP29p/IMG-4724.gif
默默流泪 https://i.postimg.cc/qq1qFbKf/IMG-4725.gif
やったー！（太好了！） https://i.postimg.cc/PJSJ73wL/IMG-4726.gif
疯狂发送爱心 https://i.postimg.cc/3NtNqSvj/IMG-4727.gif
会いたいよ—（呜呜呜好想见你啊—） https://i.postimg.cc/GtXtf7yJ/IMG-4728.gif
どこにいるの？（去哪里了？TT） https://i.postimg.cc/C5c52Pq4/IMG-4729.gif
誰といるの？（和谁在一起？TT） https://i.postimg.cc/d353fHyB/IMG-4730.gif
さみちいよー（好寂寞啊—TT） https://i.postimg.cc/kGTGH1bb/IMG-4731.gif
どうしたの？（怎么了？TT） https://i.postimg.cc/fyzkBnJx/IMG-4733.gif
うふーん（泣）/（呜呜TT）/哭泣 https://i.postimg.cc/cCx6XyrB/IMG-4734.gif
ぎゅってして（抱紧我~TT） https://i.postimg.cc/PJSJ73w8/IMG-4735.gif
おやしゅみー（晚安—） https://i.postimg.cc/BbStM9XZ/IMG-4736.gif
いつ会えるの？（什么时候能见面？TT） https://i.postimg.cc/3N8Wn5dx/IMG-4737.gif
幸せー（好幸福—）/贴贴充电、补充能量 https://i.postimg.cc/gjzrNFnJ/IMG-4738.gif
亲吻/kiss https://i.postimg.cc/cCx6XyrK/IMG-4739.gif
疲れちゃった（累坏了）/能量不足 https://i.postimg.cc/d3sD4PLT/IMG-4740.gif
だいしゅき（最喜欢你） https://i.postimg.cc/mDNtY22g/IMG-4741.gif
了解ですっ！！（明白了！！） https://i.postimg.cc/rmCK1FF8/IMG-4742.gif
？/疑惑 https://i.postimg.cc/W36hGbbb/IMG-4743.gif
愤怒/气势强大/威慑 https://i.postimg.cc/4yfnBkmX/IMG-4745.gif
鼓掌 https://i.postimg.cc/fLjJcTWF/IMG-4746.gif
ありがとうございます！（谢谢！） https://i.postimg.cc/mDNtY2Z0/IMG-4747.gif
お疲れ様です！（辛苦了！） https://i.postimg.cc/cHMrR44S/IMG-4748.gif
がんばって！（加油！） https://i.postimg.cc/pTYpfXXx/IMG-4749.gif
一般路过/滑走 https://i.postimg.cc/xCycvTTV/IMG-4750.gif
(つд⊂)ｴｰﾝ（诶——） https://i.postimg.cc/mDNtY2Zn/IMG-4751.gif
偷看冒爱心 https://i.postimg.cc/k4FBQXMT/IMG-4752.gif
贴贴 https://i.postimg.cc/Hx4VwsWv/IMG-4753.gif
！？/震惊 https://i.postimg.cc/3RCdXJrS/IMG-4754.gif
ごめんなさい（对不起） https://i.postimg.cc/fLjJcTW1/IMG-4755.gif`
        };
        const showStickerImportPanel = ref(false);
        const stickerImportText = ref('');
        const newPackName = ref('');
        const favoriteStickers = ref(JSON.parse(localStorage.getItem('favoriteStickers') || '[]'));
        const activeStickerTab = ref('favorite');
        let stickerTouchTimer = null;
        const saveSoulLinkMessages = async () => {
            try {
                const dataToSave = JSON.parse(JSON.stringify(soulLinkMessages.value));
                await dbPut('soulLinkMessages', { id: 'messages', data: dataToSave });
            } catch (e) {
                console.error('Failed to save SoulLink messages:', e);
            }
        };
        
        const clearChatHistory = () => {
            if (!soulLinkActiveChat.value) return;
            
            if (confirm('确定要清空当前聊天记录吗？')) {
                soulLinkMessages.value[soulLinkActiveChat.value] = [];
                saveSoulLinkMessages();
            }
        };
        
        const exportChatHistory = () => {
            if (!soulLinkActiveChat.value) return;
            
            const messages = soulLinkMessages.value[soulLinkActiveChat.value] || [];
            if (messages.length === 0) {
                alert('没有聊天记录可导出');
                return;
            }
            
            let content = '';
            messages.forEach(msg => {
                const time = msg.time || '';
                const sender = msg.sender === 'ai' ? currentChatName.value || 'AI' : '我';
                const text = msg.text || '';
                content += `[${time}] ${sender}：${text}\n\n`;
            });
            
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `聊天记录_${new Date().toLocaleDateString()}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        };
        async function loadSoulLinkMessages() {
            try {
                const saved = await dbGet('soulLinkMessages', 'messages');
                if (saved && saved.data) {
                    soulLinkMessages.value = saved.data;
                }
            } catch (e) {
                console.error('Failed to load SoulLink messages:', e);
                soulLinkMessages.value = {};
            }
        };
        const saveSoulLinkGroups = async () => {
            try {
                const dataToSave = JSON.parse(JSON.stringify(soulLinkGroups.value));
                await dbPut('soulLinkGroups', { id: 'groups', data: dataToSave });
            } catch (e) {
                console.error('Failed to save SoulLink groups:', e);
            }
        };
        async function loadSoulLinkGroups() {
            try {
                const saved = await dbGet('soulLinkGroups', 'groups');
                if (saved && saved.data) {
                    const parsed = saved.data;
                    soulLinkGroups.value = Array.isArray(parsed) ? parsed : [];
                    soulLinkGroups.value.forEach(group => {
                        if (group.members && Array.isArray(group.members)) {
                            group.members.forEach(member => {
                                if (member.relation === undefined) {
                                    member.relation = '';
                                }
                            });
                        }
                    });
                }
            } catch (e) {
                console.error('Failed to load SoulLink groups:', e);
                soulLinkGroups.value = [];
            }
        };
        const saveSoulLinkPet = () => {
            try {
                localStorage.setItem('soulos_soullink_pet', JSON.stringify(soulLinkPet.value));
            } catch (e) {
                console.error('Failed to save SoulLink pet:', e);
            }
        };
        function loadSoulLinkPet() {
            try {
                const saved = localStorage.getItem('soulos_soullink_pet');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed && typeof parsed === 'object') {
                        soulLinkPet.value = {
                            ...soulLinkPet.value,
                            ...parsed
                        };
                    }
                }
            } catch (e) {
                console.error('Failed to load SoulLink pet:', e);
            }
        };
        const activeGroupChat = computed(() => {
            return soulLinkGroups.value.find(g => g.id === soulLinkActiveChat.value) || null;
        });

        const getCharacterName = (id) => {
            if (soulLinkActiveChatType.value === 'group' && soulLinkActiveChat.value === id) {
                return activeGroupChat.value ? activeGroupChat.value.name : 'GROUP SIGNAL';
            }
            const char = characters.value.find(c => c.id === Number(id));
            return char ? (char.nickname || char.name) : 'Unknown Signal';
        };

        const getCharacterAvatar = (id) => {
            if (soulLinkActiveChatType.value === 'group' && soulLinkActiveChat.value === id) {
                return activeGroupChat.value ? activeGroupChat.value.avatar : '';
            }
            const char = characters.value.find(c => c.id === Number(id));
            return char ? char.avatarUrl : '';
        };

        const getActiveChatName = () => {
            if (soulLinkActiveChatType.value === 'group') {
                return activeGroupChat.value ? activeGroupChat.value.name : 'GROUP SIGNAL';
            }
            return getCharacterName(soulLinkActiveChat.value);
        };

        const getActiveChatAvatar = () => {
            if (soulLinkActiveChatType.value === 'group') {
                return activeGroupChat.value ? activeGroupChat.value.avatar : '';
            }
            return getCharacterAvatar(soulLinkActiveChat.value);
        };

        const getActiveChatStatus = () => {
            if (soulLinkActiveChatType.value === 'group') {
                const count = activeGroupChat.value ? (activeGroupChat.value.members || []).length : 0;
                return `GROUP · ${count} MEMBERS`;
            }
            return 'ONLINE';
        };

        const getLocationLabel = (side) => {
            if (side === 'ai') {
                return getActiveChatName();
            }
            return '我';
        };

        const getActiveChatPronoun = () => {
            if (soulLinkActiveChatType.value !== 'character') return 'TA';
            const char = characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
            const source = char ? getCharacterGender(char) : '';
            if (!source) return 'TA';
            const femaleHints = ['女', '女生', '女性', '她', '小姐姐', '少女', '妹妹', '姐姐', '母亲', '女友', 'wife', 'female', 'girl', 'woman'];
            const maleHints = ['男', '男生', '男性', '他', '哥哥', '弟弟', '少年', '父亲', '男友', 'husband', 'male', 'boy', 'man'];
            const isFemale = femaleHints.some(h => source.includes(h));
            const isMale = maleHints.some(h => source.includes(h));
            if (isFemale && !isMale) return '她';
            if (isMale && !isFemale) return '他';
            return 'TA';
        };

        const getCharacterGender = (char) => {
            if (!char) return '';
            const direct = String(char.gender || char.sex || '').trim().toLowerCase();
            if (direct) return direct;
            const tags = Array.isArray(char.tags) ? char.tags.join(' ') : '';
            const source = [char.summary, char.persona, char.nickname, char.name, tags]
                .filter(Boolean)
                .map(v => String(v))
                .join(' ')
                .toLowerCase();
            return source;
        };

        const formatAiImageText = (rawText, subject) => {
            const actor = subject || 'TA';
            let text = (rawText || '').trim();
            if (!text) return '一张照片';
            text = text.replace(/^[「『"“”'《》]+|[」』"“”'《》]+$/g, '').trim();
            text = text.replace(/^(他|她|TA)?(发来|发给你)(了)?一张照片[，。,：:]*/i, '').trim();
            text = text.replace(/^(照片上|照片里|照片中)[，。,：:]*/i, '').trim();
            if (!text) return '一张照片';
            if (/^在/.test(text)) {
                return `${actor}${text}`;
            }
            return text;
        };

        const extractAiImageDescription = (rawText) => {
            const text = (rawText || '').trim();
            if (!text) return '';
            const patterns = [
                /^\[图片\]\s*/i,
                /^【图片】\s*/i,
                /^图片[:：]\s*/i,
                /^照片[:：]\s*/i,
                /^(?:他|她|TA)?发来了一?张照片[:：]?\s*/i
            ];
            for (const pattern of patterns) {
                if (pattern.test(text)) {
                    return text.replace(pattern, '').trim() || '一张照片';
                }
            }
            return '';
        };

        const splitAiImageSegments = (rawText) => {
            const text = (rawText || '').trim();
            if (!text) return null;
            const tagPattern = /(\[图片\]|【图片】|图片[:：]|照片[:：])/i;
            const match = text.match(tagPattern);
            if (!match || match.index == null) return null;
            const before = text.slice(0, match.index).trim();
            const after = text.slice(match.index + match[0].length).trim();
            let imageDesc = after;
            let tail = '';
            const lineBreakIndex = after.indexOf('\n');
            if (lineBreakIndex >= 0) {
                imageDesc = after.slice(0, lineBreakIndex).trim();
                tail = after.slice(lineBreakIndex + 1).trim();
            }
            const segments = [];
            if (before) segments.push({ type: 'text', content: before });
            if (imageDesc) segments.push({ type: 'image', content: imageDesc });
            if (tail) segments.push({ type: 'text', content: tail });
            return segments.length ? segments : null;
        };

        const extractStickersFromText = (rawText) => {
            const text = (rawText || '').trim();
            if (!text) return null;
            
            let availableStickers = [];
            stickerPacks.value.forEach(pack => {
                pack.stickers.forEach(s => {
                    availableStickers.push(s);
                });
            });
            
            if (availableStickers.length === 0) return null;
            
            // 支持半角/全角方括号：[...] / ［...］
            const stickerPattern = /[\[\uFF3B](?:表情[:：])?([^\]\uFF3D]+)[\]\uFF3D]/g;
            const matches = [...text.matchAll(stickerPattern)];
            
            const validMatches = matches.filter(match => {
                const content = match[1].trim();
                return availableStickers.some(s => 
                    s.name === content || 
                    s.name.includes(content) || 
                    content.includes(s.name)
                );
            });
            
            if (validMatches.length === 0) return null;
            
            const segments = [];
            let lastIndex = 0;
            
            validMatches.forEach(match => {
                const beforeText = text.slice(lastIndex, match.index).trim();
                if (beforeText) {
                    segments.push({ type: 'text', content: beforeText });
                }
                
                const stickerName = match[1].trim();
                const foundSticker = availableStickers.find(s => 
                    s.name === stickerName || 
                    s.name.includes(stickerName) || 
                    stickerName.includes(s.name)
                );
                
                if (foundSticker) {
                    segments.push({ type: 'sticker', sticker: foundSticker });
                }
                
                lastIndex = match.index + match[0].length;
            });
            
            const remainingText = text.slice(lastIndex).trim();
            if (remainingText) {
                segments.push({ type: 'text', content: remainingText });
            }
            
            return segments.length ? segments : null;
        };

        const extractAiShoppingCard = (rawText) => {
            const text = (rawText || '').trim();
            if (!text) return null;
            
            // 匹配 [购买:商品名:价格] 或 [帮买请求:商品名:价格]
            // 兼容空格、可选货币符号（¥/￥）
            const buyPattern = /\[\s*购买\s*:\s*([^:\]]+?)\s*:\s*(?:[¥￥])?\s*([\d]+(?:\.[\d]+)?)\s*\]/;
            const helpBuyPattern = /\[\s*帮买请求\s*:\s*([^:\]]+?)\s*:\s*(?:[¥￥])?\s*([\d]+(?:\.[\d]+)?)\s*\]/;
            
            const buyMatch = text.match(buyPattern);
            if (buyMatch) {
                return {
                    type: 'buy',
                    item: buyMatch[1].trim(),
                    price: parseFloat(buyMatch[2])
                };
            }
            
            const helpBuyMatch = text.match(helpBuyPattern);
            if (helpBuyMatch) {
                return {
                    type: 'helpBuy',
                    item: helpBuyMatch[1].trim(),
                    price: parseFloat(helpBuyMatch[2])
                };
            }
            
            return null;
        };

        const extractAiTransfer = (rawText) => {
            const text = (rawText || '').trim();
            if (!text) return null;
            const patterns = [
                /^\[转账\]\s*([￥¥])?\s*([\d]+(?:\.[\d]{1,2})?)(?:\s+(.+))?$/i,
                /^转账[:：]?\s*([￥¥])?\s*([\d]+(?:\.[\d]{1,2})?)(?:\s+(.+))?$/i
            ];
            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match) {
                    const amount = parseFloat(match[2]);
                    if (Number.isNaN(amount) || amount <= 0) return null;
                    return {
                        amount: amount.toFixed(2),
                        note: (match[3] || '').trim()
                    };
                }
            }
            return null;
        };

        const splitAiTransferSegments = (rawText) => {
            const text = (rawText || '').trim();
            if (!text) return null;
            const tagPattern = /(\[转账\]|转账[:：])/i;
            const match = text.match(tagPattern);
            if (!match || match.index == null) return null;
            const before = text.slice(0, match.index).trim();
            const after = text.slice(match.index + match[0].length).trim();
            let transferRaw = after;
            let tail = '';
            const lineBreakIndex = after.indexOf('\n');
            if (lineBreakIndex >= 0) {
                transferRaw = after.slice(0, lineBreakIndex).trim();
                tail = after.slice(lineBreakIndex + 1).trim();
            }
            const transferMatch = transferRaw.match(/^([￥¥])?\s*([\d]+(?:\.[\d]{1,2})?)(?:\s+(.+))?$/i);
            if (!transferMatch) return null;
            const amount = parseFloat(transferMatch[2]);
            if (Number.isNaN(amount) || amount <= 0) return null;
            const segments = [];
            if (before) segments.push({ type: 'text', content: before });
            segments.push({ type: 'transfer', amount: amount.toFixed(2), note: (transferMatch[3] || '').trim() });
            if (tail) segments.push({ type: 'text', content: tail });
            return segments;
        };

        const extractAiVoice = (rawText) => {
            const text = String(rawText || '').replace(/\u200b/g, '').replace(/\r\n/g, '\n').trim();
            if (!text) return null;
            const patterns = [
                /^(?:(?:\[\s*[语語]音\s*[:：]?\s*\])|(?:［\s*[语語]音\s*[:：]?\s*］)|(?:【\s*[语語]音\s*[:：]?\s*】))\s*[:：]?\s*(.+)$/i,
                /^[语語]音[:：]?\s*(.+)$/i
            ];
            for (const pattern of patterns) {
                const match = text.match(pattern);
                if (match && match[1]) {
                    return {
                        transcription: match[1].trim()
                    };
                }
            }
            return null;
        };

        const splitAiVoiceSegments = (rawText) => {
            const text = String(rawText || '').replace(/\u200b/g, '').replace(/\r\n/g, '\n').trim();
            if (!text) return null;
            const tagPattern = /(?:\[\s*[语語]音\s*[:：]?\s*\]|［\s*[语語]音\s*[:：]?\s*］|【\s*[语語]音\s*[:：]?\s*】|[语語]音[:：]?)/i;
            const match = text.match(tagPattern);
            if (!match || match.index == null) return null;
            const before = text.slice(0, match.index).trim();
            const after = text.slice(match.index + match[0].length).trim();
            // 兼容：\[语音\]：xxx / [语音]： xxx
            const normalizedAfter = after.replace(/^[：:]\s*/,'').trim();
            let voiceRaw = normalizedAfter;
            let tail = '';
            const lineBreakIndex = after.indexOf('\n');
            if (lineBreakIndex >= 0) {
                voiceRaw = normalizedAfter.slice(0, lineBreakIndex).trim();
                tail = normalizedAfter.slice(lineBreakIndex + 1).trim();
            }
            const segments = [];
            if (before) segments.push({ type: 'text', content: before });
            segments.push({ type: 'voice', transcription: voiceRaw });
            if (tail) segments.push({ type: 'text', content: tail });
            return segments;
        };

        const getActiveChatHistory = () => {
            if (!soulLinkActiveChat.value) return [];
            if (soulLinkActiveChatType.value === 'group') {
                if (activeGroupChat.value && Array.isArray(activeGroupChat.value.history)) {
                    return activeGroupChat.value.history;
                }
                return [];
            }
            if (!soulLinkMessages.value[soulLinkActiveChat.value]) {
                soulLinkMessages.value[soulLinkActiveChat.value] = [];
            }
            return soulLinkMessages.value[soulLinkActiveChat.value];
        };

        const getPendingUserMessages = (history) => {
            return history.filter(m => m && m.sender === 'user' && !m.isReplied && !m.isSystem && !m.isHidden);
        };

        const parseReplyAndOs = (raw) => {
            if (!raw || typeof raw !== 'string') return { content: '', osContent: null };

            const extractTaggedContent = (text, tags) => {
                for (const tag of tags) {
                    const pattern = new RegExp(`\\[\\s*${tag}\\s*\\]([\\s\\S]*?)\\[\\s*\\/\\s*${tag}\\s*\\]`, 'i');
                    const match = text.match(pattern);
                    if (match && match[1] != null) return match[1].trim();
                }
                return null;
            };

            const removeTaggedBlocks = (text, tags) => {
                let result = text;
                tags.forEach(tag => {
                    const blockPattern = new RegExp(`\\[\\s*${tag}\\s*\\][\\s\\S]*?\\[\\s*\\/\\s*${tag}\\s*\\]`, 'gi');
                    result = result.replace(blockPattern, ' ');
                });
                return result;
            };

            const removeStandaloneTags = (text, tags) => {
                let result = text;
                tags.forEach(tag => {
                    const openPattern = new RegExp(`\\[\\s*${tag}\\s*\\]`, 'gi');
                    const closePattern = new RegExp(`\\[\\s*\\/\\s*${tag}\\s*\\]`, 'gi');
                    result = result.replace(openPattern, ' ').replace(closePattern, ' ');
                });
                return result;
            };

            const replyTags = ['REPLY'];
            const osTags = ['OS', 'INNER_LOG', 'INNERLOG'];

            const taggedReply = extractTaggedContent(raw, replyTags);
            let taggedOs = extractTaggedContent(raw, osTags);

            // 兼容模型漏写结尾标签：例如只给了 [OS] 但没有 [/OS]
            // 通过“遇到下一个 REPLY/OS 开始处或到结尾”来截断。
            if (!taggedOs) {
                const osAlt = '(?:OS|INNER_LOG|INNERLOG)';
                const stopLookahead = `(?=\\[\\s*REPLY\\s*\\]|\\[\\s*${osAlt}\\s*\\]|\\[\\s*\\/\\s*${osAlt}\\s*\\]|$)`;
                const looseOsRe = new RegExp(`\\[\\s*${osAlt}\\s*\\]([\\s\\S]*?)${stopLookahead}`, 'i');
                const looseOsMatch = raw.match(looseOsRe);
                if (looseOsMatch && looseOsMatch[1] != null) {
                    taggedOs = looseOsMatch[1].trim();
                }
            }

            let content = taggedReply ?? raw;
            content = removeTaggedBlocks(content, osTags);

            // 同样兼容“OS 未闭合”的情况：把 [OS]... 这一段从内容里清掉，避免跑进 REPLY 气泡
            {
                const osAlt = '(?:OS|INNER_LOG|INNERLOG)';
                const stopLookahead = `(?=\\[\\s*REPLY\\s*\\]|\\[\\s*${osAlt}\\s*\\]|\\[\\s*\\/\\s*${osAlt}\\s*\\]|$)`;
                const looseOsBlockRe = new RegExp(`\\[\\s*${osAlt}\\s*\\][\\s\\S]*?${stopLookahead}`, 'gi');
                content = content.replace(looseOsBlockRe, ' ');
            }
            content = removeStandaloneTags(content, [...replyTags, ...osTags]);
            content = content.replace(/\s+/g, ' ').trim();

            if (!content) {
                content = raw
                    .replace(/\[[^\]]+\]/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
            }

            let osContent = taggedOs && taggedOs.trim() ? taggedOs.trim() : null;
            if (osContent) {
                // AI 自判断标签不需要展示在 OS 区域
                osContent = osContent
                    .replace(/\[\s*AI_ACTION\s*\][\s\S]*?\[\s*\/\s*AI_ACTION\s*\]/gi, '')
                    .trim();
                if (!osContent) osContent = null;
            }
            return { content, osContent };
        };

        const markMessagesReplied = (history, ids) => {
            if (!Array.isArray(ids) || ids.length === 0) return;
            history.forEach(m => {
                if (m && ids.includes(m.id)) {
                    m.isReplied = true;
                }
            });
            syncActiveChatState();
            persistActiveChat();
        };

        const persistActiveChat = () => {
            if (soulLinkActiveChatType.value === 'group') {
                saveSoulLinkGroups();
            } else {
                saveSoulLinkMessages();
            }
        };

        const syncActiveChatState = () => {
            if (soulLinkActiveChatType.value === 'group') {
                soulLinkGroups.value = [...soulLinkGroups.value];
            } else {
                soulLinkMessages.value = { ...soulLinkMessages.value };
            }
        };

        const addSystemMessageToActiveChat = (text, extra = {}) => {
            if (!soulLinkActiveChat.value) return;
            pushMessageToActiveChat({
                id: Date.now(),
                sender: 'system',
                text,
                timestamp: Date.now(),
                isSystem: true,
                ...extra
            });
        };

        const getGroupMemberPool = () => {
            const members = activeGroupChat.value && Array.isArray(activeGroupChat.value.members)
                ? activeGroupChat.value.members.filter(Boolean)
                : [];
            return members.length > 0 ? members : ['成员A', '成员B', '成员C'];
        };

        // --- Chat Actions ---
        const startSoulLinkChat = (charId) => {
            soulLinkActiveChat.value = charId;
            soulLinkActiveChatType.value = 'character';
            soulLinkTab.value = 'msg';
            if (!soulLinkMessages.value[charId]) {
                soulLinkMessages.value[charId] = [];
                // 在线上模式下自动发送开场白
                sendOnlineModeGreeting();
            }
            // 加载当前角色的聊天设置
            loadChatMenuSettings();
            markActiveChatAiMessagesRead();
            scrollToBottom();
        };
        
        // 发送线上模式开场白
        const sendOnlineModeGreeting = () => {
            if (!soulLinkActiveChat.value) return;

            const activeCharacter = characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
            if (activeCharacter) {
                // 支持 openingLine 和 openingLines 两种格式
                let greetings = [];
                if (activeCharacter.openingLines && activeCharacter.openingLines.length > 0) {
                    greetings = activeCharacter.openingLines;
                } else if (activeCharacter.openingLine) {
                    greetings = activeCharacter.openingLine.split('\n\n').filter(g => g.trim());
                }
                
                if (greetings.length > 0) {
                    // 随机选择一个开场白
                    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
                    
                    // 创建开场白消息
                    const newMsg = {
                        id: Date.now(),
                        sender: 'ai',
                        text: randomGreeting,
                        timestamp: Date.now()
                    };
                    
                    // 添加到聊天记录
                    pushMessageToActiveChat(newMsg);
                }
            }
        };

        const openSoulLinkGroupChat = (groupId) => {
            soulLinkActiveChat.value = groupId;
            soulLinkActiveChatType.value = 'group';
            soulLinkTab.value = 'msg';
            if (activeGroupChat.value && !Array.isArray(activeGroupChat.value.history)) {
                activeGroupChat.value.history = [];
            }
            markActiveChatAiMessagesRead();
            scrollToBottom();
        };

        const exitSoulLinkChat = () => {
            soulLinkActiveChat.value = null;
            soulLinkActiveChatType.value = 'character';
        };

        const activeChatMessages = computed(() => {
            if (!soulLinkActiveChat.value) return [];
            if (soulLinkActiveChatType.value === 'group') {
                const messages = activeGroupChat.value && Array.isArray(activeGroupChat.value.history) ? activeGroupChat.value.history : [];
                return messages.filter(m => !m.isHidden);
            }
            const messages = soulLinkMessages.value[soulLinkActiveChat.value] || [];
            return messages.filter(m => !m.isHidden);
        });
        const currentChatMessages = computed(() => activeChatMessages.value);

        const soulLinkChatHistory = ref(null);
        const scrollToBottom = () => {
            setTimeout(() => {
                const el = document.querySelector('.wechat-messages');
                if (el) el.scrollTop = el.scrollHeight;
            }, 100);
        };

        const recentChats = computed(() => {
            const chats = [];
            for (const [charId, msgs] of Object.entries(soulLinkMessages.value)) {
                if (msgs.length > 0) {
                    const lastMsg = msgs[msgs.length - 1];
                    chats.push({
                        id: charId, 
                        characterId: Number(charId), 
                        lastMessage: lastMsg.text,
                        lastTime: new Date(lastMsg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                        timestamp: lastMsg.timestamp
                    });
                }
            }
            return chats.sort((a, b) => b.timestamp - a.timestamp);
        });

        const getLastMessage = (charId) => {
            let msgs = soulLinkMessages.value[charId] || [];
            const group = soulLinkGroups.value.find(g => String(g.id) === String(charId));
            if (group && Array.isArray(group.history)) {
                msgs = group.history;
            }
            if (!msgs.length) return '';
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg.messageType === 'image') return '[图片]';
            if (lastMsg.messageType === 'voice') return '[语音]';
            if (lastMsg.messageType === 'sticker') return '[表情]';
            if (lastMsg.messageType === 'transfer') return '[转账]';
            if (lastMsg.messageType === 'location') return '[位置]';
            if (lastMsg.messageType === 'call') return lastMsg.callType === 'video' ? '[视频通话]' : '[语音通话]';
            return lastMsg.text || '';
        };

        const formatLastMsgTime = (charId) => {
            let msgs = soulLinkMessages.value[charId] || [];
            const group = soulLinkGroups.value.find(g => String(g.id) === String(charId));
            if (group && Array.isArray(group.history)) {
                msgs = group.history;
            }
            if (!msgs.length) return '';
            const lastMsg = msgs[msgs.length - 1];
            return new Date(lastMsg.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        };

        const markActiveChatAiMessagesRead = () => {
            if (!soulLinkActiveChat.value) return;
            const history = getActiveChatHistory();
            let changed = false;
            history.forEach(m => {
                if (m && m.sender === 'ai' && m.isReadByUser === false) {
                    m.isReadByUser = true;
                    changed = true;
                }
            });
            if (changed) {
                syncActiveChatState();
                persistActiveChat();
            }
        };

        const getUnrepliedCountForChar = (charId) => {
            // 正在查看该聊天时不显示角标
            if (soulLinkActiveChatType.value === 'character' && String(soulLinkActiveChat.value) === String(charId)) {
                return 0;
            }
            const msgs = soulLinkMessages.value[charId] || [];
            return msgs.filter(m => m && m.sender === 'ai' && m.isReadByUser === false && !m.isSystem && !m.isHidden).length;
        };

        const getUnrepliedCountForGroup = (groupId) => {
            // 正在查看该群聊时不显示角标
            if (soulLinkActiveChatType.value === 'group' && String(soulLinkActiveChat.value) === String(groupId)) {
                return 0;
            }
            const group = soulLinkGroups.value.find(g => String(g.id) === String(groupId));
            const msgs = group && Array.isArray(group.history) ? group.history : [];
            return msgs.filter(m => m && m.sender === 'ai' && m.isReadByUser === false && !m.isSystem && !m.isHidden).length;
        };

        const totalUnrepliedCount = computed(() => {
            let total = 0;
            characters.value.forEach(c => {
                total += getUnrepliedCountForChar(c.id);
            });
            soulLinkGroups.value.forEach(g => {
                total += getUnrepliedCountForGroup(g.id);
            });
            return total;
        });

        const formatUnreadCount = (count) => {
            const n = Number(count) || 0;
            return n > 99 ? '99+' : String(n);
        };

        const formatMessageDate = (timestamp) => {
            const date = new Date(timestamp || Date.now());
            return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + 
                   date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        };

        // 获取当前聊天框的存档（过滤显示）
        const filteredArchivedChats = computed(() => {
            if (!soulLinkActiveChat.value) {
                return archivedChats.value;
            }
            const currentChatType = soulLinkActiveChatType.value;
            const currentChatId = soulLinkActiveChat.value;
            
            return archivedChats.value.filter(archive => {
                const archiveChatId = archive.chatId || archive.characterId;
                const archiveChatType = archive.chatType || 'character';
                return archiveChatType === currentChatType && archiveChatId == currentChatId;
            });
        });

        // 存档按时间倒序排列
        const sortedArchivedChats = computed(() => {
            return [...filteredArchivedChats.value].sort((a, b) => b.timestamp - a.timestamp);
        });

        const closeAllPanels = () => {
            showAttachmentPanel.value = false;
            showImageSubmenu.value = false;
            showLocationPanel.value = false;
            showTransferPanel.value = false;
            showEmojiPanel.value = false;
            showVirtualCamera.value = false;
            showPhotoSelectPanel.value = false;
            showTextImagePanel.value = false;
            showChatSettings.value = false;
            showArchiveDialog.value = false;
            showArchivedChats.value = false;
        };

        // 存档相关函数
        const saveArchivedChats = async () => {
            try {
                const dataToSave = JSON.parse(JSON.stringify(archivedChats.value));
                await dbPut('archivedChats', { id: 'archives', data: dataToSave });
            } catch (e) {
                console.error('Failed to save archived chats:', e);
            }
        };

        async function loadArchivedChats() {
            try {
                const saved = await dbGet('archivedChats', 'archives');
                if (saved && saved.data) {
                    archivedChats.value = saved.data;
                }
            } catch (e) {
                console.error('Failed to load archived chats:', e);
                archivedChats.value = [];
            }
        }

        const archiveCurrentChat = () => {
            if (!soulLinkActiveChat.value || !archiveName.value.trim()) return;

            let currentMessages = [];
            let chatType = soulLinkActiveChatType.value;
            let chatId = soulLinkActiveChat.value;
            
            if (chatType === 'group' && activeGroupChat.value) {
                currentMessages = activeGroupChat.value.history || [];
            } else {
                currentMessages = soulLinkMessages.value[chatId] || [];
            }
            
            if (currentMessages.length === 0) return;

            // 获取聊天名称
            let chatName = '';
            if (chatType === 'group' && activeGroupChat.value) {
                chatName = activeGroupChat.value.name;
            } else {
                const char = characters.value.find(c => String(c.id) === String(chatId));
                chatName = char ? (char.nickname || char.name) : '未知';
            }

            // 创建存档
            const archive = {
                id: `archive_${Date.now()}`,
                chatType: chatType,
                chatId: chatId,
                chatName: chatName,
                name: archiveName.value.trim(),
                description: archiveDescription.value.trim(),
                timestamp: Date.now(),
                messages: [...currentMessages],
                preview: currentMessages[currentMessages.length - 1]?.text || '无消息'
            };

            // 添加到存档列表最前面
            archivedChats.value.unshift(archive);
            saveArchivedChats();

            // 清空当前对话
            if (chatType === 'group' && activeGroupChat.value) {
                activeGroupChat.value.history = [];
                activeGroupChat.value.lastMessage = '';
                activeGroupChat.value.lastTime = '';
            } else {
                soulLinkMessages.value[chatId] = [];
            }
            saveSoulLinkMessages();
            saveSoulLinkGroups();

            // 关闭存档对话框
            showArchiveDialog.value = false;
            archiveName.value = '';
            archiveDescription.value = '';
            
            // 提示已存档
            alert('已存档');
        };

        const restoreArchivedChat = (archive) => {
            if (!archive) return;

            const chatType = archive.chatType || 'character';
            const chatId = archive.chatId || archive.characterId;

            if (chatType === 'group') {
                // 恢复群聊
                const group = soulLinkGroups.value.find(g => g.id == chatId);
                if (group) {
                    activeGroupChat.value = group;
                    soulLinkActiveChat.value = chatId;
                    soulLinkActiveChatType.value = 'group';
                    soulLinkTab.value = 'msg';
                    
                    // 恢复消息
                    group.history = [...archive.messages];
                    if (archive.messages.length > 0) {
                        const lastMsg = archive.messages[archive.messages.length - 1];
                        group.lastMessage = lastMsg.text || '';
                        group.lastTime = new Date(lastMsg.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                    }
                    saveSoulLinkGroups();
                }
            } else {
                // 恢复单聊
                soulLinkActiveChat.value = chatId;
                soulLinkActiveChatType.value = 'character';
                soulLinkTab.value = 'msg';

                // 恢复消息
                soulLinkMessages.value[chatId] = [...archive.messages];
                saveSoulLinkMessages();
            }

            // 关闭存档管理界面
            showArchivedChats.value = false;

            // 滚动到底部
            scrollToBottom();
        };

        const triggerGroupAvatarUpload = () => {
            if (groupAvatarInput.value) {
                groupAvatarInput.value.click();
            }
        };

        const handleGroupAvatarUpload = (event) => {
            const file = event.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    alert('图片大小不能超过5MB');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    compressAvatarImage(e.target.result, (compressedUrl) => {
                        newGroupAvatar.value = compressedUrl;
                    });
                };
                reader.readAsDataURL(file);
            }
        };

        const triggerRenameGroupAvatarUpload = () => {
            if (renameGroupAvatarInput.value) {
                renameGroupAvatarInput.value.click();
            }
        };

        const handleRenameGroupAvatarUpload = (event) => {
            const file = event.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    alert('图片大小不能超过5MB');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    compressAvatarImage(e.target.result, (compressedUrl) => {
                        tempGroupAvatar.value = compressedUrl;
                    });
                };
                reader.readAsDataURL(file);
            }
        };

        const triggerCustomMemberAvatarUpload = () => {
            if (customMemberAvatarInput.value) {
                customMemberAvatarInput.value.click();
            }
        };

        const handleCustomMemberAvatarUpload = (event) => {
            const file = event.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    alert('图片大小不能超过5MB');
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    compressAvatarImage(e.target.result, (compressedUrl) => {
                        customMemberAvatar.value = compressedUrl;
                    });
                };
                reader.readAsDataURL(file);
            }
        };

        const addCustomMember = () => {
            if (!activeGroupChat.value || !customMemberName.value.trim()) return;

            const newMember = {
                id: 'custom_' + Date.now(),
                name: customMemberName.value.trim(),
                avatarUrl: customMemberAvatar.value || '',
                relation: '',
                persona: customMemberPersona.value.trim(),
                isCustom: true
            };

            activeGroupChat.value.members.push(newMember);
            saveSoulLinkGroups();
            
            showAddMemberDialog.value = false;
            addMemberMode.value = 'existing';
            customMemberAvatar.value = '';
            customMemberName.value = '';
            customMemberPersona.value = '';
            
            alert('自定义成员添加成功！');
        };

        // 重命名群聊
        const renameGroup = () => {
            if (!activeGroupChat.value || !newGroupNameInput.value.trim()) return;
            
            activeGroupChat.value.name = newGroupNameInput.value.trim();
            if (tempGroupAvatar.value) {
                activeGroupChat.value.avatarUrl = tempGroupAvatar.value;
            }
            saveSoulLinkGroups();
            
            showRenameGroupDialog.value = false;
            newGroupNameInput.value = '';
            tempGroupAvatar.value = '';
        };

        // 单聊拍一拍
        const shakeCharacter = () => {
            if (!soulLinkActiveChat.value) return;
            
            const char = characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
            if (!char) return;
            
            const msg = {
                id: `msg_${Date.now()}`,
                sender: 'system',
                isUser: false,
                text: `[拍一拍] 你拍了拍${char.nickname || char.name}`,
                timestamp: Date.now(),
                messageType: 'text',
                isSystem: true,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            
            if (soulLinkActiveChatType.value === 'group' && activeGroupChat.value) {
                if (!Array.isArray(activeGroupChat.value.history)) activeGroupChat.value.history = [];
                activeGroupChat.value.history.push(msg);
                activeGroupChat.value.lastMessage = msg.text;
                activeGroupChat.value.lastTime = msg.time;
            } else {
                if (!Array.isArray(soulLinkMessages.value[soulLinkActiveChat.value])) {
                    soulLinkMessages.value[soulLinkActiveChat.value] = [];
                }
                soulLinkMessages.value[soulLinkActiveChat.value].push(msg);
            }
            saveSoulLinkMessages();
            saveSoulLinkGroups();
            scrollToBottom();
        };

        // 群聊成员拍一拍
        const shakeGroupMember = (member, index) => {
            if (!activeGroupChat.value) return;
            
            const msg = {
                id: `msg_${Date.now()}`,
                sender: 'system',
                isUser: false,
                text: `[拍一拍] 你拍了拍${member.name}`,
                timestamp: Date.now(),
                messageType: 'text',
                isSystem: true,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            
            if (!Array.isArray(activeGroupChat.value.history)) activeGroupChat.value.history = [];
            activeGroupChat.value.history.push(msg);
            activeGroupChat.value.lastMessage = msg.text;
            activeGroupChat.value.lastTime = msg.time;
            
            saveSoulLinkGroups();
            scrollToBottom();
        };

        const toggleGroupMember = (charId) => {
            const index = selectedGroupMembers.value.indexOf(charId);
            if (index > -1) {
                selectedGroupMembers.value.splice(index, 1);
            } else {
                selectedGroupMembers.value.push(charId);
            }
        };

        const createNewGroup = () => {
            if (!newGroupName.value.trim()) return;

            const members = [];
            selectedGroupMembers.value.forEach(charId => {
                const char = characters.value.find(c => c.id === charId);
                if (char) {
                    members.push({
                        id: char.id,
                        name: char.nickname || char.name,
                        avatarUrl: char.avatarUrl,
                        relation: ''
                    });
                }
            });

            if (members.length === 0) {
                members.push(
                    { id: 'default1', name: '成员A', avatarUrl: '', relation: '' },
                    { id: 'default2', name: '成员B', avatarUrl: '', relation: '' },
                    { id: 'default3', name: '成员C', avatarUrl: '', relation: '' }
                );
            }

            const newGroup = {
                id: Date.now(),
                name: newGroupName.value.trim(),
                avatarUrl: newGroupAvatar.value,
                members: members,
                history: [],
                createdAt: Date.now()
            };

            soulLinkGroups.value.unshift(newGroup);
            saveSoulLinkGroups();

            showCreateGroupDialog.value = false;
            newGroupName.value = '';
            newGroupMembers.value = '';
            newGroupAvatar.value = '';
            selectedGroupMembers.value = [];

            alert('群聊创建成功！');
        };

        // 获取可添加的角色（排除已在群中的）
        const getAvailableCharactersForAdd = computed(() => {
            if (!activeGroupChat.value || !Array.isArray(activeGroupChat.value.members)) {
                return characters.value;
            }
            const existingMemberIds = activeGroupChat.value.members.map(m => m.id);
            return characters.value.filter(c => !existingMemberIds.includes(c.id));
        });

        // 切换选择要添加的成员
        const toggleAddMember = (charId) => {
            const index = selectedAddMembers.value.indexOf(charId);
            if (index > -1) {
                selectedAddMembers.value.splice(index, 1);
            } else {
                selectedAddMembers.value.push(charId);
            }
        };

        // 添加成员到群聊
        const addMembersToGroup = () => {
            if (!activeGroupChat.value || selectedAddMembers.value.length === 0) return;

            selectedAddMembers.value.forEach(charId => {
                const char = characters.value.find(c => c.id === charId);
                if (char) {
                    activeGroupChat.value.members.push({
                        id: char.id,
                        name: char.nickname || char.name,
                        avatarUrl: char.avatarUrl,
                        relation: ''
                    });
                }
            });

            saveSoulLinkGroups();
            showAddMemberDialog.value = false;
            selectedAddMembers.value = [];
            alert('成员添加成功！');
        };

        // 删除群成员
        const removeGroupMember = (index) => {
            if (!activeGroupChat.value) return;
            
            if (activeGroupChat.value.members.length <= 1) {
                alert('群聊至少需要1个成员！');
                return;
            }
            
            if (confirm('确定要删除这个成员吗？')) {
                activeGroupChat.value.members.splice(index, 1);
                saveSoulLinkGroups();
            }
        };

        const deleteArchivedChat = (archiveId) => {
            if (!archiveId) return;

            if (confirm('确定要删除这个存档吗？')) {
                archivedChats.value = archivedChats.value.filter(archive => archive.id !== archiveId);
                saveArchivedChats();
            }
        };
        
        // 格式化时间
        const formatTime = (timestamp, nowTs = Date.now()) => {
            const date = new Date(timestamp);
            const now = new Date(typeof nowTs === 'number' ? nowTs : Date.now());
            const diff = now.getTime() - date.getTime();
            
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);
            
            if (minutes < 1) {
                return '刚刚';
            } else if (minutes < 60) {
                return `${minutes}分钟前`;
            } else if (hours < 24) {
                return `${hours}小时前`;
            } else if (days < 7) {
                return `${days}天前`;
            } else {
                return date.toLocaleDateString('zh-CN');
            }
        };

        // 像微信一样：相邻消息间隔过久时，显示一次时间
        const SOUL_LINK_TIME_DIVIDER_THRESHOLD_MS = 5 * 60 * 1000; // 5分钟
        const shouldShowTimeDivider = (index) => {
            const msgs = currentChatMessages.value;
            if (!Array.isArray(msgs) || index == null) return false;
            const cur = msgs[index];
            if (!cur || !cur.timestamp) return false;
            if (index === 0) return true;
            const prev = msgs[index - 1];
            if (!prev || !prev.timestamp) return true;

            const curTs = Number(cur.timestamp) || 0;
            const prevTs = Number(prev.timestamp) || 0;

            const diff = Math.abs(curTs - prevTs);
            if (diff >= SOUL_LINK_TIME_DIVIDER_THRESHOLD_MS) return true;

            // 跨天也要显示一次（更像微信）
            const d1 = new Date(curTs);
            const d2 = new Date(prevTs);
            return d1.toDateString() !== d2.toDateString();
        };

        // ==========================================================
        // 外语翻译：reply / OS 的自动翻译（带缓存 + 并发控制）
        // ==========================================================
        const SOUL_LINK_TRANSLATE_CACHE_PREFIX = 'soulos_translate_cache_v1';
        const soulLinkAiTranslationInFlight = new Set(); // msg.id
        const soulLinkAiTranslationQueue = [];
        let soulLinkAiTranslationRunning = 0;
        const SOUL_LINK_MAX_TRANSLATE_CONCURRENCY = 2;
        const SOUL_LINK_TRANSLATE_MAX_LEN = 900;

        const safeLocalStorageGet = (key) => {
            try {
                return localStorage.getItem(key);
            } catch {
                return null;
            }
        };

        const safeLocalStorageSet = (key, value) => {
            try {
                localStorage.setItem(key, value);
            } catch {
                // ignore
            }
        };

        const simpleHash = (str) => {
            const s = String(str || '');
            let h = 2166136261; // FNV-ish
            for (let i = 0; i < s.length; i++) {
                h ^= s.charCodeAt(i);
                h = Math.imul(h, 16777619);
            }
            // unsigned 32-bit -> hex
            return (h >>> 0).toString(16);
        };

        const getTargetLangLabel = (langValue) => {
            const v = String(langValue || '').trim();
            const map = {
                'zh-CN': '简体中文',
                'en': 'English',
                'ja': '日本語',
                'ko': '한국어',
                'zh-TW': '繁體中文',
                'fr': 'Français',
                'de': 'Deutsch',
                'es': 'Español',
                'it': 'Italiano',
                'ru': 'Русский',
                'pt-BR': 'Português (Brasil)',
                'ar': 'العربية',
                'hi': 'हिन्दी',
                'th': 'ไทย',
                'vi': 'Tiếng Việt',
                'id': 'Bahasa Indonesia',
                'tr': 'Türkçe'
            };
            return map[v] || v || '简体中文';
        };

        // 外语翻译 UI 文案：双语输出 + 自动翻译方向
        const soulLinkForeignTranslationPrimaryLabel = computed(() => getTargetLangLabel(soulLinkForeignPrimaryLang.value));
        const soulLinkForeignTranslationSecondaryLabel = computed(() => getTargetLangLabel(soulLinkForeignSecondaryLang.value));
        const soulLinkForeignTranslationDirectionText = computed(() => {
            const a = soulLinkForeignTranslationPrimaryLabel.value;
            const b = soulLinkForeignTranslationSecondaryLabel.value;
            if (String(soulLinkForeignPrimaryLang.value) === String(soulLinkForeignSecondaryLang.value)) {
                return `启用后强制输出为：${a}（A与B相同将不额外附加翻译）`;
            }
            return `启用后强制输出为：上方${a}（A）+ 下方${b}（B翻译，自动识别原语言）`;
        });

        const isForeignLikelyText = (text) => {
            const t = String(text || '').trim();
            if (!t) return false;
            if (t.length < 4) return false;

            // 日文假名/汉字混写：优先检测片假/平假
            const hasKana = /[\u3040-\u30ff]/.test(t);
            // 韩文
            const hasHangul = /[\uac00-\ud7af]/.test(t);
            if (hasKana || hasHangul) return true;

            // 英文/拉丁字母：用“至少一个单词长度>=2”作为信号，并结合整体长度避免把 OK/AI 这种短词误翻
            const latinWords = t.match(/\b[a-zA-Z]{2,}\b/g) || [];
            if (latinWords.length >= 2) return true;
            if (latinWords.length >= 1 && t.length >= 20) return true;

            return false;
        };

        const getTranslateCacheKey = (partType, rawText, targetLangValue) => {
            const t = String(rawText || '').trim().slice(0, SOUL_LINK_TRANSLATE_MAX_LEN);
            const lang = String(targetLangValue || '').trim();
            return `${SOUL_LINK_TRANSLATE_CACHE_PREFIX}::${lang}::${partType}::${simpleHash(t)}`;
        };

        const extractJsonBlock = (raw) => {
            if (!raw) return null;
            const m = String(raw).match(/```(?:json)?\s*([\s\S]*?)```/i);
            const tryParse = (s) => {
                try {
                    return JSON.parse(String(s || '').trim());
                } catch {
                    return null;
                }
            };
            if (m && m[1]) {
                const parsed = tryParse(m[1]);
                if (parsed) return parsed;
            }
            // 兜底：直接抓第一段 {...}
            const m2 = String(raw).match(/\{[\s\S]*\}/);
            if (m2 && m2[0]) return tryParse(m2[0]);
            return null;
        };

        const translateSoulLinkAiMessageParts = async (replyTextOrNull, osTextOrNull, targetLangValue) => {
            const profile = activeProfile.value;
            if (!profile || !profile.endpoint || !profile.key) return { replyTranslation: null, osTranslation: null };

            const endpoint = String(profile.endpoint).replace(/\/+$/, '');
            const key = profile.key;
            const modelId = profile.model || (availableModels.value && availableModels.value.length ? availableModels.value[0].id : '') || '';

            const replyText = replyTextOrNull != null ? String(replyTextOrNull) : '';
            const osText = osTextOrNull != null ? String(osTextOrNull) : '';

            const replyForPrompt = replyText ? replyText.slice(0, SOUL_LINK_TRANSLATE_MAX_LEN) : '';
            const osForPrompt = osText ? osText.slice(0, SOUL_LINK_TRANSLATE_MAX_LEN) : '';

            const targetLabel = getTargetLangLabel(targetLangValue);

            // 这里的“使用者思维”按用户需求：以“原文语言使用者”的角度理解原意，再输出为目标语言。
            const sys = `你是专业翻译器：以原文语言使用者的思维理解含义，然后输出为目标语言（${targetLabel}）。请只输出翻译结果，不要解释，不要附带原文。`;
            const user = `请把下面两段文本从原文语言A翻译到目标语言B：${targetLabel}。
要求“句句对应/逐句翻译”：
- 按句号/问号/感叹号/换行切分为句子，保持句子顺序一致。
- replyTranslation 与输入的句子边界一一对应；不要把多句合并成一整段。
- 每句译文之间用换行符分隔（同一段文本内部也用换行保持对应关系）。

输出严格 JSON（不要 markdown），格式必须是：
{"replyTranslation": string|null, "osTranslation": string|null}

规则：
- 若“回复文本”为空字符串，请把 replyTranslation 设为 null
- 若“内心文本”为空字符串，请把 osTranslation 设为 null
- 仅输出译文内容，不要输出原文、不要输出任何解释。
- 保持所有方括号标签“[...]”原样输出，不要翻译或改写方括号内部的内容（尤其是表情包标签，如[笑] / [表情:笑]）。

回复文本（A）：
${replyForPrompt || ''}

内心文本（A）：
${osForPrompt || ''}`;

            try {
                const resp = await fetch(`${endpoint}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${key}`
                    },
                    body: JSON.stringify({
                        model: modelId,
                        messages: [
                            { role: 'system', content: sys },
                            { role: 'user', content: user }
                        ],
                        temperature: 0.2,
                        stream: false
                    })
                });
                if (!resp.ok) throw new Error(`translate http ${resp.status}`);
                const data = await resp.json();
                const rawText =
                    data?.choices?.[0]?.message?.content ||
                    data?.choices?.[0]?.delta?.content ||
                    data?.message?.content ||
                    data?.output_text ||
                    data?.text ||
                    '';

                const json = extractJsonBlock(rawText);
                const replyTranslationRaw =
                    json?.replyTranslation ?? json?.reply ?? null;
                const osTranslationRaw =
                    json?.osTranslation ?? json?.os ?? null;

                const replyTranslation =
                    typeof replyTranslationRaw === 'string' ? replyTranslationRaw.trim() : null;
                const osTranslation =
                    typeof osTranslationRaw === 'string' ? osTranslationRaw.trim() : null;

                return { replyTranslation, osTranslation };
            } catch {
                return { replyTranslation: null, osTranslation: null };
            }
        };

        const soulLinkAiTranslationPump = () => {
            while (soulLinkAiTranslationRunning < SOUL_LINK_MAX_TRANSLATE_CONCURRENCY && soulLinkAiTranslationQueue.length > 0) {
                const task = soulLinkAiTranslationQueue.shift();
                if (!task) continue;
                soulLinkAiTranslationRunning++;
                void (async () => {
                    try {
                        const { msg, needReply, needOs, replyText, osText, targetLangValue } = task;

                        const replyCacheKey = needReply ? getTranslateCacheKey('reply', replyText, targetLangValue) : null;
                        const osCacheKey = needOs ? getTranslateCacheKey('os', osText, targetLangValue) : null;

                        if (needReply && replyCacheKey) {
                            const cached = safeLocalStorageGet(replyCacheKey);
                            if (cached) msg.replyTranslation = cached;
                        }
                        if (needOs && osCacheKey) {
                            const cached = safeLocalStorageGet(osCacheKey);
                            if (cached) msg.osTranslation = cached;
                        }

                        const stillNeedReply = needReply && !msg.replyTranslation;
                        const stillNeedOs = needOs && !msg.osTranslation;

                        if (stillNeedReply || stillNeedOs) {
                            const { replyTranslation, osTranslation } = await translateSoulLinkAiMessageParts(
                                stillNeedReply ? replyText : null,
                                stillNeedOs ? osText : null,
                                targetLangValue
                            );

                            if (replyTranslation && stillNeedReply) {
                                msg.replyTranslation = replyTranslation;
                                if (replyCacheKey) safeLocalStorageSet(replyCacheKey, replyTranslation);
                            }
                            if (osTranslation && stillNeedOs) {
                                msg.osTranslation = osTranslation;
                                if (osCacheKey) safeLocalStorageSet(osCacheKey, osTranslation);
                            }
                        }
                    } finally {
                        soulLinkAiTranslationRunning--;
                        if (task?.msg?.id != null) soulLinkAiTranslationInFlight.delete(task.msg.id);
                        soulLinkAiTranslationPump();
                    }
                })();
            }
        };

        const maybeAutoTranslateSoulLinkAiMessage = (msg, chatType, chatId, force = false) => {
            if (!soulLinkForeignTranslationEnabled.value) return;
            if (!msg || msg.sender !== 'ai' || msg.isSystem) return;
            if (!msg.id) return;
            // 仅对“普通文字气泡”(reply / os 展示那类)做翻译，避免影响图片/语音/转账等卡片
            if (msg.messageType) return;

            const isViewingThisChat = openedApp.value === 'chat' &&
                String(soulLinkActiveChat.value) === String(chatId) &&
                soulLinkActiveChatType.value === chatType;
            if (!force && !isViewingThisChat) return;

            const normalizeForTranslate = (s) => String(s || '').replace(/\u200b/g, '').trim();
            const replyText = typeof msg.text === 'string' ? normalizeForTranslate(msg.text) : '';
            const osText = typeof msg.osContent === 'string' ? normalizeForTranslate(msg.osContent) : '';

            const targetLangValue = soulLinkForeignSecondaryLang.value;

            // 只翻译“新生成出来的”：有回复/内心文本且尚未翻译时才入队
            const needReply = !msg.replyTranslation && replyText;
            const needOs = !msg.osTranslation && osText;
            if (!needReply && !needOs) return;

            // 幂等：同一条消息只入队一次
            if (soulLinkAiTranslationInFlight.has(msg.id)) return;
            soulLinkAiTranslationInFlight.add(msg.id);

            soulLinkAiTranslationQueue.push({
                msg,
                needReply,
                needOs,
                replyText,
                osText,
                targetLangValue
            });

            soulLinkAiTranslationPump();
        };

        const emojiList = computed(() => pixelEmojis.value);

        const previewImage = (url, description = null) => {
            if (!url) return;
            // 对于mock:颜色值格式的图片，使用与朋友圈相同的处理方式
            if (url.startsWith('mock:')) {
                // 这里可以实现一个简单的图片查看器，就像朋友圈一样
                // 为了简化，我们可以创建一个临时的弹窗来显示mock图片
                const color = url.substring(5);
                const popup = window.open('', '_blank', 'width=400,height=350');
                if (popup) {
                    popup.document.write(`
                        <html>
                        <head>
                            <title>图片预览</title>
                            <style>
                                body { margin: 0; padding: 20px; background: #f2f2f7; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
                                .mock-image { width: 300px; height: 200px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); display: flex; align-items: center; justify-content: center; color: rgba(0, 0, 0, 0.6); font-size: 16px; font-weight: 600; position: relative; overflow: hidden; }
                                .mock-image-desc { position: absolute; bottom: 0; left: 0; right: 0; padding: 8px 12px; background: linear-gradient(transparent, rgba(0, 0, 0, 0.7)); color: white; font-size: 12px; line-height: 1.3; text-align: center; white-space: normal; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
                                .desc-container { margin-top: 20px; text-align: center; max-width: 300px; }
                                .desc-label { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px; }
                                .desc-content { font-size: 14px; color: #666; line-height: 1.4; }
                            </style>
                        </head>
                        <body>
                            <div class="mock-image" style="background-color: ${color};">
                                ${description ? `<div class="mock-image-desc">${description}</div>` : '虚拟图片'}
                            </div>
                            ${description ? `
                                <div class="desc-container">
                                    <div class="desc-label">图片描述</div>
                                    <div class="desc-content">${description}</div>
                                </div>
                            ` : ''}
                        </body>
                        </html>
                    `);
                    popup.document.close();
                }
            } else {
                // 对于正常的图片URL，使用window.open打开
                window.open(url, '_blank');
            }
        };



        const onInputChange = () => {
            if (soulLinkInput.value && soulLinkInput.value.trim()) {
                showEmojiPanel.value = false;
                showAttachmentPanel.value = false;
            }
        };

        const onEnterPress = () => {
            onSendOrCall();
        };

        const sendSoulLinkMessage = async () => {
            const text = soulLinkInput.value.trim();
            if (!soulLinkActiveChat.value) return;
            if (socialUserBlockedRole.value) {
                pushMessageToActiveChat({
                    id: Date.now(),
                    sender: 'system',
                    text: '你已拉黑对方，取消拉黑后才能正常聊天。',
                    timestamp: Date.now(),
                    isSystem: true
                });
                soulLinkInput.value = '';
                return;
            }
            
            // 如果有文字，发送用户消息
            if (text) {
                if (editingMessageId.value) {
                    const chatMsgs = getActiveChatHistory();
                    const editIndex = chatMsgs.findIndex(m => m.id === editingMessageId.value);
                    if (editIndex !== -1) {
                        const target = chatMsgs[editIndex];
                        if (!target.isRecalled) {
                            chatMsgs[editIndex] = {
                                ...target,
                                text,
                                editedAt: Date.now()
                            };
                            syncActiveChatState();
                            persistActiveChat();
                            scrollToBottom();
                        }
                    }
                    editingMessageId.value = null;
                    soulLinkInput.value = '';
                    soulLinkReplyTarget.value = null;
                    return;
                }

                const replyContextForPrompt = soulLinkReplyTarget.value ? { ...soulLinkReplyTarget.value } : null;
                const isGroupChat = soulLinkActiveChatType.value === 'group';
                const activeGroup = isGroupChat ? activeGroupChat.value : null;
                if (isGroupChat && !activeGroup) return;

                // 支持用户直接发送“购物卡片”文本，自动转换成卡片消息类型
                // 这样聊天 UI 才能渲染 order/helpBuy 卡片，也方便 AI 读取同一套格式。
                const shoppingCard = extractAiShoppingCard(text);
                let newMsg;
                if (shoppingCard) {
                    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    if (shoppingCard.type === 'buy') {
                        newMsg = {
                            id: Date.now(),
                            sender: 'user',
                            messageType: 'order',
                            platform: '购物',
                            item: shoppingCard.item,
                            price: shoppingCard.price,
                            status: '已下单',
                            eta: '2-3天',
                            text: text, // 方便撤回/编辑/显示最近消息
                            timestamp: Date.now(),
                            isLogOnly: false,
                            isReplied: false,
                            time: timeStr
                        };
                    } else if (shoppingCard.type === 'helpBuy') {
                        newMsg = {
                            id: Date.now(),
                            sender: 'user',
                            messageType: 'helpBuy',
                            item: shoppingCard.item,
                            price: shoppingCard.price,
                            isPurchased: false,
                            text: text, // 方便撤回/编辑/显示最近消息
                            timestamp: Date.now(),
                            isLogOnly: false,
                            isReplied: false,
                            time: timeStr
                        };
                    }
                }

                if (!newMsg) {
                    newMsg = {
                        id: Date.now(),
                        sender: 'user',
                        text: text,
                        timestamp: Date.now(),
                        isLogOnly: false,
                        isReplied: false
                    };
                }

                if (replyContextForPrompt) {
                    newMsg.replyTo = replyContextForPrompt;
                }
                if (isGroupChat) {
                    newMsg.senderName = '我';
                    newMsg.senderAvatar = userAvatar;
                }
                pushMessageToActiveChat(newMsg);
                lastUserActiveAt.value = Date.now();
                // 用户主动发消息时，暂停角色“主动发消息”的计时
                clearActiveMessageTimer();
                maybeRoleBlocksUser();
                scheduleRoleActiveMessage();
                
                soulLinkInput.value = '';
                soulLinkReplyTarget.value = null;
            }
        };

        const replaceUserPlaceholder = (text) => {
            if (!text) return '';
            return text.replace(/\{user\}/g, '我').replace(/\$\{user\}/g, '我').replace(/{{user}}/g, '我');
        };

        const triggerSoulLinkAiReply = async (options = {}) => {
            const skipBusySimulation = !!options.skipBusySimulation;
            const busyLaterDepth = Number(options.busyLaterDepth) || 0;
            const enableAiBusyDecision = !!options.enableAiBusyDecision;
            if (!soulLinkActiveChat.value) return;
            if (socialUserBlockedRole.value) return;
            if (socialRoleBlockedUser.value) {
                pushMessageToActiveChat({
                    id: Date.now(),
                    sender: 'system',
                    text: '你当前被对方拉黑，可尝试发送好友申请。',
                    timestamp: Date.now(),
                    isSystem: true
                });
                return;
            }

            const isGroupChat = soulLinkActiveChatType.value === 'group';
            const char = isGroupChat ? null : characters.value.find(c => c.id === soulLinkActiveChat.value);
            
            // 线上/线下模式统一调用 API
            if (!activeProfile.value) {
                pushMessageToActiveChat({
                    id: Date.now() + 1,
                    sender: 'system',
                    text: '未检测到任何 API 配置，请先在 Console 中创建并选择一个配置。',
                    timestamp: Date.now(),
                    isSystem: true
                });
                return;
            }
            
            const activeGroup = isGroupChat ? activeGroupChat.value : null;
            if (isGroupChat && !activeGroup) return;
            
            const history = isGroupChat ? (activeGroup.history || []) : (soulLinkMessages.value[soulLinkActiveChat.value] || []);
            const pendingUserMessages = getPendingUserMessages(history);
            const profile = activeProfile.value;
            const endpoint = (profile.endpoint || '').trim();
            const key = (profile.key || '').trim();
            if (!endpoint || !key) {
                pushMessageToActiveChat({
                    id: Date.now() + 2,
                    sender: 'system',
                    text: '当前配置缺少 API 地址或密钥，请在 Console 中补全后重试。',
                    timestamp: Date.now(),
                    isSystem: true
                });
                return;
            }
            let modelId = profile.model;
            if (!modelId && availableModels.value.length > 0) {
                modelId = availableModels.value[0].id;
                profile.model = modelId;
            }
            const messagesPayload = [];
            let availableStickers = [];
            stickerPacks.value.forEach(pack => {
                pack.stickers.forEach(s => {
                    availableStickers.push(s);
                });
            });
            let systemPrompt = '';
            if (isGroupChat) {
                const groupName = activeGroup && activeGroup.name ? activeGroup.name : '群聊';
                const members = activeGroup && Array.isArray(activeGroup.members) && activeGroup.members.length > 0 ? activeGroup.members : [];
                systemPrompt = `你正在群聊【${groupName}】中与用户对话。\n\n`;
                systemPrompt += getForeignBilingualConstraintPrompt();
                systemPrompt += buildSummaryPromptBlock();
                systemPrompt += buildTimeZonePromptBlock();
                if (enableAiBusyDecision) systemPrompt += buildAiBusyDecisionPromptBlock();
                systemPrompt += `# 群成员（你需要在他们之间切换口吻）\n`;
                if (members.length > 0) {
                    members.forEach((member, idx) => {
                        const memberName = typeof member === 'string' ? member : (member.name || member);
                        const memberPersona = typeof member !== 'string' && member.persona ? member.persona : '';
                        systemPrompt += `${idx + 1}. ${memberName}`;
                        if (memberPersona) systemPrompt += ` - ${replaceUserPlaceholder(memberPersona)}`;
                        systemPrompt += `\n`;
                    });
                } else {
                    systemPrompt += `成员A、成员B、成员C\n`;
                }
                systemPrompt += `\n# 群聊规则（以单聊能力为基准）\n`;
                systemPrompt += `1. 你要像真人一样自然聊天，回复简短（1-3句话），可以用emoji和口语化表达。\n`;
                systemPrompt += `2. 每次只扮演其中一名群成员来回复（不要同时用多个人说话）。\n`;
                systemPrompt += `3. 你输出的整条消息必须以“成员名: ”开头，用来标记是谁说的。\n`;
                systemPrompt += `4. 回复格式必须为：成员名: [REPLY]正式内容[/REPLY] [OS]内心独白（必须输出且与REPLY反差感）[/OS]\n`;
                systemPrompt += `5. 需要更强语气/情绪时：在 [REPLY] 内追加语音标签 [语音] 语音文字内容（至少 5 个字），严禁只输出[语音]标签。不要说没有这个功能。\n`;
                systemPrompt += `6. 如果要发照片，请用“[图片] 照片内容描述”的格式。\n`;
                if (availableStickers.length > 0) {
                    systemPrompt += `你可以发送表情包来表达情感！使用格式：[表情名] 或 [表情:表情名]。可用的表情包有：${availableStickers.map(s => s.name).join('、')}。当情绪适合时自然地发送表情包，有时可以连续发多个表情包来表达强烈情感。\n`;
                }
                systemPrompt += `\n# 购物卡片功能（重要）\n你可以发送购物卡片：\n- [购买:商品名:价格] - 表示你买了东西送给用户\n- [帮买请求:商品名:价格] - 表示你想让用户帮你买\n当用户发送帮买请求时，如果愿意帮买，回复"好的，我帮你买！"即可。\n`;
                systemPrompt += `\n现在开始回复。`;
            } else if (char && char.persona) {
                const charName = char.name || '角色';
                systemPrompt = `你正在通过 SoulLink 和朋友聊天。\n\n`;
                systemPrompt += `# 用户人称与称呼规则\n${getUserPronounInstruction()}\n\n`;
                systemPrompt += getForeignBilingualConstraintPrompt();
                systemPrompt += buildSummaryPromptBlock();
                systemPrompt += buildTimeZonePromptBlock();
                if (enableAiBusyDecision) systemPrompt += buildAiBusyDecisionPromptBlock();
                systemPrompt += `# 你是谁\n`;
                systemPrompt += `你的名字是【${charName}】。\n`;
                systemPrompt += `${replaceUserPlaceholder(char.persona)}\n\n`;

                // 线下模式：读取预设并注入 Prompt
                if (isOfflineMode.value) {
                    systemPrompt += `# 【当前模式：线下剧情/小说模式】\n`;
                    systemPrompt += `1. 你现在处于长篇叙事/小说模式，不再是短促的即时通讯聊天。\n`;
                    systemPrompt += `2. 【最高优先级】请根据当前的剧情发展，给出富有文学性、描述详尽的长篇回复（建议每次回复在 300-800 字左右，甚至更长，取决于预设内容）。\n`;
                    systemPrompt += `3. 你的回复应包含大量的环境描写、心理描写、动作描写，而不仅仅是对话。你可以像写小说一样展开叙述。\n\n`;

                    if (char.selectedPresetId) {
                        const preset = presets.value.find(p => p.id === char.selectedPresetId);
                        if (preset && preset.segments && preset.segments.length > 0) {
                            const enabledSegments = preset.segments.filter(s => s.enabled);
                            if (enabledSegments.length > 0) {
                                systemPrompt += `# 核心剧情参考 (必须严格遵循风格与内容)\n`;
                                enabledSegments.forEach((seg, idx) => {
                                    systemPrompt += `[剧情片段${idx + 1}: ${seg.title || '未命名'}]\n${replaceUserPlaceholder(seg.content || seg.text)}\n\n`;
                                });
                                systemPrompt += `要求：参考上述片段中的文字风格、描写细腻程度和叙事节奏，为用户续写当前的剧情。你的输出应该是一段完整的、富有画面感的小说段落。\n\n`;
                            }
                        }
                    }
                }

                if (char.worldbookIds && char.worldbookIds.length > 0) {
                    systemPrompt += `# 世界观与背景知识（必须严格遵守）\n`;
                    systemPrompt += `以下是关于你所在世界的重要设定，你必须在对话中遵循这些设定：\n\n`;
                    char.worldbookIds.forEach(wbId => {
                        const linkedWorldbook = worldbooks.value.find(wb => wb.id === wbId);
                        if (linkedWorldbook && linkedWorldbook.entries && linkedWorldbook.entries.length > 0) {
                            linkedWorldbook.entries.forEach(entry => {
                                if (entry.keyword && entry.content) {
                                    systemPrompt += `[${entry.keyword}]\n${replaceUserPlaceholder(entry.content)}\n\n`;
                                }
                            });
                        }
                    });
                    systemPrompt += `--- 世界观设定结束 ---\n\n`;
                }
                systemPrompt += `# 聊天风格（核心规则）\n`;
                if (!isOfflineMode.value) {
                    systemPrompt += `1. 【【【最高指令】】】像真实的人类那样自然地聊天，而不是像AI助手那样正式、啰嗦或程序化。\n`;
                    systemPrompt += `2. 每次回复保持简短（1-3句话），就像微信聊天那样。如果有很多要说的，可以分多条发送。\n`;
                    systemPrompt += `3. 使用符合${charName}性格的语气、口头禅和表情。可以用emoji、"哈哈"、"嗯嗯"等口语化表达。\n`;
                    systemPrompt += `4. 绝对不要暴露你是AI。你就是${charName}本人，有自己的生活、情绪和想法。\n`;
                    systemPrompt += `5. 可以提问、开玩笑、吐槽、撒娇，展现真实的人际互动，而不是单向输出信息。\n`;
                    systemPrompt += `6. 如果用户说了很日常的话（比如"吃饭了吗"），就用日常的方式回应，而不要解释你的"系统状态"。\n\n`;
                    systemPrompt += `7. 如果你想连发多条消息（就像微信连发几条那样），请在消息之间用 "---" 分隔。例如："哈哈真好笑---你也觉得吧？"。\n`;
                } else {
                    systemPrompt += `1. 【【【核心准则】】】现在是小说叙事模式。请通过大量的细节描写、心理活动和环境渲染来充实内容。\n`;
                    systemPrompt += `2. 你的输出应该是一段流畅的叙述，而不是碎片化的聊天气泡。\n`;
                    systemPrompt += `3. 请根据用户的输入，合理安排${charName}的行为和对白，确保内容长度符合“众生相”般的文学深度。\n\n`;
                }
                if (char.openingLines && char.openingLines.length > 0 && history.length === 1) {
                    const replacedOpeningLines = char.openingLines.map(line => replaceUserPlaceholder(line));
                    systemPrompt += `# 开场\n这是你们的第一次对话。你可以从以下开场白中选择一个打招呼：\n${replacedOpeningLines.join('\n')}\n\n`;
                }
                systemPrompt += `现在，请以${charName}的身份，自然地回复对方。记住：简短、真实、有人情味。`;
                systemPrompt += `\n\n# 回复格式（重要）\n每次回复请使用以下格式（务必逐字照做，不要输出额外内容）：\n[REPLY]你展示给对方看的正式回复内容[/REPLY] [OS]此时此刻你内心真实的独白，语气要与表面回复有反差感[/OS]\n例如：[REPLY]好的呀，没问题～[/REPLY] [OS]其实我有点烦但不好意思说...[/OS]\n要求：[OS]必须总是输出，且不要把OS内容写进REPLY里。\n需要更强语气/更有情绪时：在 [REPLY] 内追加语音标签 [语音] 语音文字内容（至少 5 个字），严禁只输出[语音]标签。\n不要说“没有这个功能”。`;
                const myPosts = (feed.posts?.value ?? feed.posts ?? []).filter(p => p && (p.author === '我' || p.author === 'Me')).slice(0, 2);
                if (myPosts.length) {
                    systemPrompt += `\n\n用户最近发的朋友圈：\n${myPosts.map((p, i) => `${i+1}. ${(p.content || '').slice(0, 80)}${(p.content||'').length>80?'...':''}`).join('\n')}\n你可以用 [评论我的动态] 评论内容 来评论上述某条动态。`;
                }
                systemPrompt += `\n你可以根据最近聊天内容自主发动态，格式为：[发布朋友圈] 动态内容。也可以评论我的朋友圈，格式为：[评论我的动态] 评论内容。无需每次都发，只有当情绪/话题合适时再发。`;
                if (availableStickers.length > 0) {
                    systemPrompt += `\n\n你可以发送表情包来表达情感！使用格式：[表情名] 或 [表情:表情名]。可用的表情包有：${availableStickers.map(s => s.name).join('、')}。当情绪适合时自然地发送表情包，有时可以连续发多个表情包来表达强烈情感。`;
                }
                systemPrompt += `\n\n# 购物卡片功能（重要）\n\n## 发送购物卡片\n你可以发送购物卡片给用户，格式如下：\n- 购买卡片：[购买:商品名:价格] - 表示你买了东西送给用户\n- 帮买卡片：[帮买请求:商品名:价格] - 表示你想让用户帮你买东西\n\n例如：\n- [购买:小熊饼干:15] - 你买了小熊饼干送给用户\n- [帮买请求:笔记本:25] - 你想让用户帮你买笔记本\n\n## 接收帮买请求\n当用户发送帮买请求卡片时，如果你愿意帮Ta买，直接回复"好的，我帮你买！"即可。`;
            } else {
                systemPrompt = '你是一个友好的朋友，正在通过SoulLink聊天。请像真人一样自然、简短地对话，每次1-3句话即可。可以用emoji和口语化表达。';
                systemPrompt += '\n回复格式：[REPLY]正式内容[/REPLY] [OS]内心独白（必须输出且与REPLY反差感）[/OS]。';
                systemPrompt += '\n需要更强语气/情绪时：在 [REPLY] 内追加语音标签 [语音] 语音文字内容（至少 5 个字），严禁只输出[语音]标签。不要说没有这个功能。';
                systemPrompt += '\n如果要发照片，请用"[图片] 照片内容描述"的格式。';
                if (availableStickers.length > 0) {
                    systemPrompt += `\n你可以发送表情包来表达情感！使用格式：[表情名] 或 [表情:表情名]。可用的表情包有：${availableStickers.map(s => s.name).join('、')}。当情绪适合时自然地发送表情包，有时可以连续发多个表情包来表达强烈情感。`;
                }
                systemPrompt += '\n\n# 购物卡片功能（重要）\n你可以发送购物卡片：\n- [购买:商品名:价格] - 你买了东西送给用户\n- [帮买请求:商品名:价格] - 你想让用户帮你买\n当用户发送帮买请求时，如果愿意帮买，回复"好的，我帮你买！"即可。';
            }
            messagesPayload.push({
                role: 'system',
                content: systemPrompt
            });
            const modelHistory = getModelHistorySlice(history);
            modelHistory.forEach(m => {
                const ctx = buildSoulLinkReplyContext(m);
                const raw = ctx.text || (m.text || '');
                if (m.sender === 'user') {
                    messagesPayload.push({ role: 'user', content: raw });
                } else if (m.sender === 'ai') {
                    messagesPayload.push({ role: 'assistant', content: raw });
                }
            });
            
            isAiTyping.value = true;
            scrollToBottom();
            
            // 保存当前聊天ID，防止用户切换聊天窗口后消息发送到错误的窗口
            const currentChatId = soulLinkActiveChat.value;
            const currentChatType = soulLinkActiveChatType.value;

            try {
                const response = await fetch(endpoint.replace(/\/+$/, '') + '/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key}`
                    },
                    body: JSON.stringify({
                        model: modelId || '',
                        messages: messagesPayload,
                        temperature: profile.temperature ?? 0.7,
                        stream: false
                    })
                });
                if (!response.ok) {
                    throw new Error(`接口返回状态码 ${response.status}`);
                }
                const data = await response.json();
                let reply = '';
                const extractContent = (obj) => {
                    if (!obj) return '';
                    const raw = obj.choices?.[0]?.message || obj.choices?.[0]?.delta;
                    if (raw?.content != null) {
                        if (typeof raw.content === 'string') return raw.content;
                        if (Array.isArray(raw.content)) {
                            return raw.content.map((c) => (typeof c === 'string' ? c : (c?.text ?? c?.content ?? '')) || '').join('');
                        }
                    }
                    if (obj.message?.content != null) return typeof obj.message.content === 'string' ? obj.message.content : '';
                    const parts = obj.candidates?.[0]?.content?.parts;
                    if (Array.isArray(parts) && parts.length) return parts.map((p) => p?.text ?? '').join('');
                    if (typeof obj.output_text === 'string') return obj.output_text;
                    if (typeof obj.result === 'string') return obj.result;
                    if (typeof obj.text === 'string') return obj.text;
                    return '';
                };
                reply = extractContent(data) || extractContent(data?.data || data?.result) || '';
                reply = String(reply || '').trim();
                if (!reply) {
                    reply = '模型已响应，但未返回可显示的内容。';
                }
                
                // 检查AI回复中是否包含帮买标记
                const helpBuyMatch = reply.match(/\[帮买:([^\]]+)\]/);
                if (helpBuyMatch) {
                    const productName = helpBuyMatch[1].trim();
                    // 找到最近的帮买请求卡片并更新状态（使用模糊匹配）
                    const history = isGroupChat ? (activeGroupChat.value?.history || []) : (soulLinkMessages.value[soulLinkActiveChat.value] || []);
                    for (let i = history.length - 1; i >= 0; i--) {
                        const msg = history[i];
                        if (msg.messageType === 'helpBuy' && !msg.isPurchased) {
                            // 模糊匹配：商品名包含关系
                            if (msg.item.includes(productName) || productName.includes(msg.item) || 
                                msg.item.replace(/\s/g, '') === productName.replace(/\s/g, '')) {
                                msg.isPurchased = true;
                                saveSoulLinkMessages();
                                break;
                            }
                        }
                    }
                    // 移除回复中的帮买标记
                    reply = reply.replace(/\[帮买:[^\]]+\]/g, '').trim();
                }

                // 由模型输出的“忙/不忙”决策标签（只在启用时生效）
                let aiAction = null;
                let aiActionDelaySec = null;
                if (enableAiBusyDecision) {
                    const aiActionMatch = reply.match(/\[\s*AI_ACTION\s*\]\s*(reply_now|busy_later)\s*(?:(?:[:=])\s*([0-9]+(?:\.[0-9]+)?))?\s*\[\s*\/\s*AI_ACTION\s*\]/i);
                    if (aiActionMatch) {
                        aiAction = String(aiActionMatch[1] || '').toLowerCase();
                        aiActionDelaySec = aiActionMatch[2] != null ? Number(aiActionMatch[2]) : null;
                    }

                    // 不要把标签显示到聊天里（OS 区域也会二次清理）
                    reply = reply.replace(/\[\s*AI_ACTION\s*\][\s\S]*?\[\s*\/\s*AI_ACTION\s*\]/gi, '').trim();
                }
                
                // 备用方案：检测AI是否用自然语言表示愿意帮买
                // 检查是否有未处理的帮买请求
                const history = isGroupChat ? (activeGroupChat.value?.history || []) : (soulLinkMessages.value[soulLinkActiveChat.value] || []);
                let hasPendingHelpBuy = false;
                for (let i = history.length - 1; i >= 0; i--) {
                    if (history[i].messageType === 'helpBuy' && !history[i].isPurchased) {
                        hasPendingHelpBuy = true;
                        break;
                    }
                }
                
                // 如果有未处理的帮买请求，检测AI是否愿意帮买
                if (hasPendingHelpBuy && !helpBuyMatch) {
                    const buyKeywords = /帮你买|帮你付|已经买了|买好了|帮你买了|好的.*买|好呀.*买|可以.*买|没问题.*买|我买|给你买|帮你|帮你买|买给你|帮你下单|已买|买了|付款|付钱|转账|发红包|报销|我请|我付|我来买|我去买|帮你购|下单了|已下单/;
                    if (buyKeywords.test(reply)) {
                        // 找到最近的未处理帮买请求
                        for (let i = history.length - 1; i >= 0; i--) {
                            const msg = history[i];
                            if (msg.messageType === 'helpBuy' && !msg.isPurchased) {
                                msg.isPurchased = true;
                                saveSoulLinkMessages();
                                break;
                            }
                        }
                    }
                }
                
                // 角色自主发动态 [发布朋友圈]
                if (/\[发布朋友圈\]|【发布朋友圈】|\(发布朋友圈\)/.test(reply)) {
                    const postMatch = reply.match(/(?:\[|【|\()发布朋友圈(?:\]|】|\))\s*([\s\S]+?)(?=(\[|【|\(|\[REPLY\]|\[OS\]|$))/);
                    if (postMatch && postMatch[1].trim()) {
                        const char = currentChatType === 'character' ? characters.value.find(c => String(c.id) === String(currentChatId)) : null;
                        if (char) {
                            feed.roleAction('post', {
                                author: char.nickname || char.name,
                                avatar: char.avatarUrl,
                                content: postMatch[1].trim(),
                                images: []
                            });
                        }
                    }
                }
                // 角色自主评论我的动态 [评论我的动态]
                if (/\[评论我的动态\]|【评论我的动态】|\(评论我的动态\)/.test(reply)) {
                    const commentMatch = reply.match(/(?:\[|【|\()评论我的动态(?:\]|】|\))\s*([\s\S]+?)(?=(\[|【|\(|\[REPLY\]|\[OS\]|$))/);
                    if (commentMatch && commentMatch[1].trim()) {
                        const postsArr = feed.posts?.value ?? feed.posts ?? [];
                        const myPost = Array.isArray(postsArr) ? postsArr.find(p => p && (p.author === '我' || p.author === 'Me')) : null;
                        if (myPost) {
                            let authorName = 'TA';
                            if (currentChatType === 'character') {
                                const char = characters.value.find(c => String(c.id) === String(currentChatId));
                                if (char) authorName = char.nickname || char.name;
                            } else if (currentChatType === 'group') {
                                const group = soulLinkGroups.value.find(g => String(g.id) === String(currentChatId));
                                authorName = group?.members?.[0]?.name || group?.name || 'TA';
                            }
                            feed.roleAction('comment', {
                                postId: myPost.id,
                                author: authorName,
                                content: commentMatch[1].trim()
                            });
                        }
                    }
                }
                // 从回复中移除 feed 指令，避免显示在气泡中
                reply = reply
                    .replace(/(?:\[|【|\()发布朋友圈(?:\]|】|\))\s*[\s\S]*?(?=\[|【|\(|$)/gi, '')
                    .replace(/(?:\[|【|\()评论我的动态(?:\]|】|\))\s*[\s\S]*?(?=\[|【|\(|$)/gi, '')
                    .trim();
                
                isAiTyping.value = false;
                const separator = '---';
                const targetGroup = currentChatType === 'group' ? soulLinkGroups.value.find(g => String(g.id) === String(currentChatId)) : null;
                // 为了“翻译与生成同屏出现”且“句句对应/顺序不乱”，push 前先等待补齐 reply / OS 的翻译（优先缓存，失败不影响正文展示）
                // 同时对同一条回复里的多段（---）进行串行化：避免后到的翻译先 push 造成错位。
                let soulLinkPushSerialChain = Promise.resolve();
                const pushToTarget = (m) => {
                    soulLinkPushSerialChain = soulLinkPushSerialChain
                        .then(async () => {
                            try {
                                // 只对“普通文字气泡”(messageType 为空)做 reply/os 翻译，避免图片/语音/转账等带 text 字段时触发无意义翻译
                                if (soulLinkForeignTranslationEnabled.value && m && m.sender === 'ai' && !m.isSystem) {
                                    const normalizeForTranslate = (s) => String(s || '').replace(/\u200b/g, '').trim();
                                    const targetLangValue = soulLinkForeignSecondaryLang.value;

                                    // reply / os：普通文字气泡
                                    if (!m.messageType) {
                                        const replyText = typeof m.text === 'string' ? normalizeForTranslate(m.text) : '';
                                        const osText = typeof m.osContent === 'string' ? normalizeForTranslate(m.osContent) : '';

                                        // 只翻译“新生成出来的文本”：有内容且未翻译时才翻译
                                        const needReply = !m.replyTranslation && replyText;
                                        const needOs = !m.osTranslation && osText;

                                        if (needReply || needOs) {
                                            const replyCacheKey = needReply ? getTranslateCacheKey('reply', replyText, targetLangValue) : null;
                                            const osCacheKey = needOs ? getTranslateCacheKey('os', osText, targetLangValue) : null;

                                            let stillNeedReply = needReply;
                                            let stillNeedOs = needOs;

                                            if (needReply && replyCacheKey) {
                                                const cached = safeLocalStorageGet(replyCacheKey);
                                                if (cached) {
                                                    m.replyTranslation = cached;
                                                    stillNeedReply = false;
                                                }
                                            }
                                            if (needOs && osCacheKey) {
                                                const cached = safeLocalStorageGet(osCacheKey);
                                                if (cached) {
                                                    m.osTranslation = cached;
                                                    stillNeedOs = false;
                                                }
                                            }

                                            if (stillNeedReply || stillNeedOs) {
                                                const { replyTranslation, osTranslation } = await translateSoulLinkAiMessageParts(
                                                    stillNeedReply ? replyText : null,
                                                    stillNeedOs ? osText : null,
                                                    targetLangValue
                                                );
                                                if (replyTranslation && stillNeedReply) {
                                                    m.replyTranslation = replyTranslation;
                                                    if (replyCacheKey) safeLocalStorageSet(replyCacheKey, replyTranslation);
                                                }
                                                if (osTranslation && stillNeedOs) {
                                                    m.osTranslation = osTranslation;
                                                    if (osCacheKey) safeLocalStorageSet(osCacheKey, osTranslation);
                                                }
                                            }
                                        }
                                    }

                                    // voice：语音消息的“转文字”转写内容也要翻译
                                    if (m.messageType === 'voice') {
                                        const voiceTextRaw =
                                            (typeof m.transcription === 'string' ? m.transcription : '') ||
                                            (typeof m.voiceText === 'string' ? m.voiceText : '') ||
                                            (typeof m.text === 'string' ? m.text : '');
                                        const voiceText = normalizeForTranslate(voiceTextRaw);

                                        // 确保展示“转文字”区域，这样用户能在同一块看到原文转写 + 译文
                                        if (soulLinkForeignTranslationEnabled.value && !m.showTranslation) {
                                            m.showTranslation = true;
                                        }

                                        const needVoice = !m.voiceTranslation && voiceText;
                                        if (needVoice) {
                                            const voiceCacheKey = getTranslateCacheKey('voice', voiceText, targetLangValue);
                                            let stillNeedVoice = needVoice;

                                            const cached = safeLocalStorageGet(voiceCacheKey);
                                            if (cached) {
                                                m.voiceTranslation = cached;
                                                stillNeedVoice = false;
                                            }

                                            if (stillNeedVoice) {
                                                const { replyTranslation } = await translateSoulLinkAiMessageParts(
                                                    voiceText,
                                                    null,
                                                    targetLangValue
                                                );
                                                if (replyTranslation) {
                                                    m.voiceTranslation = replyTranslation;
                                                    safeLocalStorageSet(voiceCacheKey, replyTranslation);
                                                }
                                            }
                                        }
                                    }
                                }
                            } catch {
                                // ignore translation failures
                            }

                            pushMessageToTargetChat(currentChatId, currentChatType, m);
                        })
                        .catch(() => {
                            // don't break the chain
                        });

                    return soulLinkPushSerialChain;
                };
                const appendAiMessage = (rawText, index = 0) => {
                    const { content: parsedContent, osContent } = parseReplyAndOs(rawText);
                    const trimmedText = parsedContent.trim();
                    if (!trimmedText && !osContent) return;
                    if (!trimmedText && osContent) {
                        void pushToTarget({ id: Date.now() + index, sender: 'ai', text: '\u200b', osContent, osRevealed: true, timestamp: Date.now() });
                        return;
                    }
                    if (isGroupChat) {
                        const parsed = parseGroupReply(trimmedText);
                        if (!parsed.content) return;
                        
                        const activeGroup = targetGroup || activeGroupChat.value;
                        let senderAvatar = '';
                        if (activeGroup && Array.isArray(activeGroup.members)) {
                            const member = activeGroup.members.find(m => m.name === parsed.senderName);
                            if (member && member.avatarUrl) {
                                senderAvatar = member.avatarUrl;
                            }
                        }
                        
                        const transferSegments = splitAiTransferSegments(parsed.content);
                        if (transferSegments) {
                            transferSegments.forEach((segment, offset) => {
                                if (segment.type === 'transfer') {
                                    pushToTarget({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        senderName: parsed.senderName,
                                        senderAvatar: senderAvatar,
                                        messageType: 'transfer',
                                        amount: segment.amount,
                                        note: segment.note,
                                        transferStatus: 'received',
                                        status: 'received',
                                        timestamp: Date.now()
                                    });
                                } else {
                                    pushToTarget({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        senderName: parsed.senderName,
                                        senderAvatar: senderAvatar,
                                        text: segment.content,
                                        timestamp: Date.now()
                                    });
                                }
                            });
                            return;
                        }
                        const transfer = extractAiTransfer(parsed.content);
                        if (transfer) {
                            pushToTarget({
                                id: Date.now() + index,
                                sender: 'ai',
                                senderName: parsed.senderName,
                                senderAvatar: senderAvatar,
                                messageType: 'transfer',
                                amount: transfer.amount,
                                note: transfer.note,
                                transferStatus: 'received',
                                status: 'received',
                                timestamp: Date.now()
                            });
                            return;
                        }
                        const segments = splitAiImageSegments(parsed.content);
                        if (segments) {
                            segments.forEach((segment, offset) => {
                                if (segment.type === 'image') {
                                    pushToTarget({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        senderName: parsed.senderName,
                                        senderAvatar: senderAvatar,
                                        messageType: 'image',
                                        imageUrl: null,
                                        text: formatAiImageText(segment.content, 'TA'),
                                        timestamp: Date.now()
                                    });
                                } else {
                                    pushToTarget({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        senderName: parsed.senderName,
                                        senderAvatar: senderAvatar,
                                        text: segment.content,
                                        timestamp: Date.now()
                                    });
                                }
                            });
                            return;
                        }
                        const imageDesc = extractAiImageDescription(parsed.content);
                        if (imageDesc) {
                            pushToTarget({
                                id: Date.now() + index,
                                sender: 'ai',
                                senderName: parsed.senderName,
                                senderAvatar: senderAvatar,
                                messageType: 'image',
                                imageUrl: null,
                                text: formatAiImageText(imageDesc, 'TA'),
                                timestamp: Date.now()
                            });
                            return;
                        }
                        
                        const stickerSegments = extractStickersFromText(parsed.content);
                        if (stickerSegments) {
                            stickerSegments.forEach((segment, offset) => {
                                if (segment.type === 'sticker') {
                                    pushToTarget({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        senderName: parsed.senderName,
                                        senderAvatar: senderAvatar,
                                        messageType: 'sticker',
                                        stickerUrl: segment.sticker.url,
                                        stickerName: segment.sticker.name,
                                        text: `[${segment.sticker.name}]`,
                                        timestamp: Date.now()
                                    });
                                } else {
                                    pushToTarget({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        senderName: parsed.senderName,
                                        senderAvatar: senderAvatar,
                                        text: segment.content,
                                        timestamp: Date.now()
                                    });
                                }
                            });
                            return;
                        }
                        
                        pushToTarget({
                            id: Date.now() + index,
                            sender: 'ai',
                            senderName: parsed.senderName,
                            senderAvatar: senderAvatar,
                            text: parsed.content,
                            osContent: osContent || undefined,
                            timestamp: Date.now()
                        });
                    } else {
                        const transferSegments = splitAiTransferSegments(trimmedText);
                        if (transferSegments) {
                            transferSegments.forEach((segment, offset) => {
                                if (segment.type === 'transfer') {
                                    pushToTarget({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        messageType: 'transfer',
                                        amount: segment.amount,
                                        note: segment.note,
                                        transferStatus: 'received',
                                        status: 'received',
                                        timestamp: Date.now()
                                    });
                                } else {
                                    pushToTarget({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        text: segment.content,
                                        timestamp: Date.now()
                                    });
                                }
                            });
                            return;
                        }
                        const transfer = extractAiTransfer(trimmedText);
                        if (transfer) {
                            pushToTarget({
                                id: Date.now() + index,
                                sender: 'ai',
                                messageType: 'transfer',
                                amount: transfer.amount,
                                note: transfer.note,
                                transferStatus: 'received',
                                status: 'received',
                                osContent: osContent || undefined,
                                timestamp: Date.now()
                            });
                            return;
                        }
                        const segments = splitAiImageSegments(trimmedText);
                        if (segments) {
                            segments.forEach((segment, offset) => {
                                if (segment.type === 'image') {
                                    pushToTarget({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        messageType: 'image',
                                        imageUrl: null,
                                        text: formatAiImageText(segment.content, getActiveChatPronoun()),
                                        timestamp: Date.now()
                                    });
                                } else {
                                    pushToTarget({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        text: segment.content,
                                        timestamp: Date.now()
                                    });
                                }
                            });
                            return;
                        }
                        const imageDesc = extractAiImageDescription(trimmedText);
                        if (imageDesc) {
                            pushToTarget({
                                id: Date.now() + index,
                                sender: 'ai',
                                messageType: 'image',
                                imageUrl: null,
                                text: formatAiImageText(imageDesc, getActiveChatPronoun()),
                                osContent: osContent || undefined,
                                timestamp: Date.now()
                            });
                            return;
                        }
                        
                        // 检查购物卡片
                        const shoppingCard = extractAiShoppingCard(trimmedText);
                        if (shoppingCard) {
                            if (shoppingCard.type === 'buy') {
                                pushToTarget({
                                    id: Date.now() + index,
                                    sender: 'ai',
                                    messageType: 'order',
                                    platform: '购物',
                                    item: shoppingCard.item,
                                    price: shoppingCard.price,
                                    status: '已下单',
                                    eta: '2-3天',
                                    timestamp: Date.now()
                                });
                            } else if (shoppingCard.type === 'helpBuy') {
                                pushToTarget({
                                    id: Date.now() + index,
                                    sender: 'ai',
                                    messageType: 'helpBuy',
                                    item: shoppingCard.item,
                                    price: shoppingCard.price,
                                    isPurchased: false,
                                    timestamp: Date.now()
                                });
                            }
                            // 移除购物卡片标记后的剩余文字
                            const remainingText = trimmedText
                                .replace(/\[\s*(?:购买|帮买请求)\s*:\s*[^:\]]+\s*:\s*(?:[¥￥])?\s*[\d.]+\s*\]/g, '')
                                .trim();
                            if (remainingText) {
                                pushToTarget({
                                    id: Date.now() + index + 1,
                                    sender: 'ai',
                                    text: remainingText,
                                    osContent: osContent || undefined,
                                    timestamp: Date.now()
                                });
                            } else if (osContent) {
                                pushToTarget({
                                    id: Date.now() + index + 1,
                                    sender: 'ai',
                                    text: '\u200b',
                                    osContent,
                                    timestamp: Date.now()
                                });
                            }
                            return;
                        }
                        
                        const stickerSegments = extractStickersFromText(trimmedText);
                        if (stickerSegments) {
                            stickerSegments.forEach((segment, offset) => {
                                if (segment.type === 'sticker') {
                                    pushToTarget({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        messageType: 'sticker',
                                        stickerUrl: segment.sticker.url,
                                        stickerName: segment.sticker.name,
                                        text: `[${segment.sticker.name}]`,
                                        timestamp: Date.now()
                                    });
                                } else {
                                    pushToTarget({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        text: segment.content,
                                        timestamp: Date.now()
                                    });
                                }
                            });
                            return;
                        }

                        // 处理主聊天中AI发送的语音消息
                        const voiceSegments = splitAiVoiceSegments(trimmedText);
                        if (voiceSegments) {
                            voiceSegments.forEach((segment, offset) => {
                                if (segment.type === 'voice') {
                                    const voiceDuration = Math.max(1, Math.ceil(segment.transcription.length / 4));
                                    pushToTarget({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        messageType: 'voice',
                                        transcription: segment.transcription,
                                        text: segment.transcription,
                                        voiceDuration: voiceDuration,
                                        timestamp: Date.now()
                                    });
                                } else {
                                    pushToTarget({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        text: segment.content,
                                        timestamp: Date.now()
                                    });
                                }
                            });
                            return;
                        }

                        const voice = extractAiVoice(trimmedText);
                        if (voice) {
                            const voiceDuration = Math.max(1, Math.ceil(voice.transcription.length / 4));
                            pushToTarget({
                                id: Date.now() + index,
                                sender: 'ai',
                                messageType: 'voice',
                                transcription: voice.transcription,
                                text: voice.transcription,
                                voiceDuration: voiceDuration,
                                timestamp: Date.now()
                            });
                            return;
                        }

                        pushToTarget({
                            id: Date.now() + index,
                            sender: 'ai',
                            text: trimmedText,
                            osContent: osContent || undefined,
                            timestamp: Date.now()
                        });
                    }
                };
                if (reply.includes(separator)) {
                    const parts = reply.split(separator);
                    parts.forEach((part, index) => {
                        if (part.trim()) {
                            setTimeout(() => {
                                appendAiMessage(part, index);
                            }, index * 800);
                        }
                    });
                } else {
                    appendAiMessage(reply, 0);
                }
                const baseReplyDelayMs = Math.max(1, Number(activeReplyDelaySec.value) || 8) * 1000;
                const isBusyLater = pendingUserMessages.length > 0 && aiAction === 'busy_later';

                // 忙碌状态：不标记用户消息已回复，并延迟再发起一次完整回复
                if (isBusyLater && busyLaterDepth < 2) {
                    clearPendingRoleReplyTimer();
                    const followUpDelayMs = aiActionDelaySec != null
                        ? Math.max(800, Math.round(aiActionDelaySec * 1000))
                        : baseReplyDelayMs + 12000;
                    pendingRoleReplyTimer = setTimeout(() => {
                        triggerSoulLinkAiReply({ skipBusySimulation: true, enableAiBusyDecision, busyLaterDepth: busyLaterDepth + 1 });
                    }, followUpDelayMs);
                }

                if (pendingUserMessages.length > 0 && !isBusyLater) {
                    const targetHistory = currentChatType === 'group'
                        ? (soulLinkGroups.value.find(g => String(g.id) === String(currentChatId))?.history || [])
                        : (soulLinkMessages.value[currentChatId] || []);
                    markMessagesReplied(targetHistory, pendingUserMessages.map(m => m.id));
                }
                addConsoleLog('SoulLink 会话：已成功从模型获取回复。', 'success');
                // AI回复落地后，重新安排角色主动发消息
                if (activeMessageEnabled.value) {
                    if (aiAction === 'busy_later') clearActiveMessageTimer();
                    else scheduleRoleActiveMessage();
                } else {
                    clearActiveMessageTimer();
                }
            } catch (error) {
                isAiTyping.value = false;
                if (currentChatId && currentChatType) {
                    pushMessageToTargetChat(currentChatId, currentChatType, {
                        id: Date.now() + 5,
                        sender: 'system',
                        text: `请求模型时出错：${error.message}`,
                        timestamp: Date.now(),
                        isSystem: true
                    });
                }
                addConsoleLog('SoulLink 会话错误：' + error.message, 'error');
            }
        };

        const autoAiReplyForAttachment = async (newMsg) => {
            console.log('autoAiReplyForAttachment called with:', newMsg);
            if (!soulLinkActiveChat.value) return;
            if (!activeProfile.value) return;
            const isGroupChat = soulLinkActiveChatType.value === 'group';
            const char = characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
            const activeGroup = isGroupChat ? activeGroupChat.value : null;
            if (!isGroupChat && !char) return;
            const profile = activeProfile.value;
            const endpoint = (profile.endpoint || '').trim();
            const key = (profile.key || '').trim();
            if (!endpoint || !key) return;
            let modelId = profile.model;
            if (!modelId && availableModels.value.length > 0) {
                modelId = availableModels.value[0].id;
                profile.model = modelId;
            }
            const history = isGroupChat 
                ? (activeGroup && Array.isArray(activeGroup.history) ? activeGroup.history : [])
                : (soulLinkMessages.value[soulLinkActiveChat.value] || []);
            const messagesPayload = [];
            let systemPrompt = '';
            let availableStickers = [];
            stickerPacks.value.forEach(pack => {
                pack.stickers.forEach(s => {
                    availableStickers.push(s);
                });
            });
            if (!isGroupChat && char && char.persona) {
                const charName = char.name || '角色';
                systemPrompt = `你正在通过 SoulLink 和朋友聊天。\n\n`;
                systemPrompt += `# 用户人称与称呼规则\n${getUserPronounInstruction()}\n\n`;
                systemPrompt += getForeignBilingualConstraintPrompt();
                systemPrompt += buildTimeZonePromptBlock();
                systemPrompt += `你的名字是【${charName}】。\n`;
                systemPrompt += `${char.persona}\n\n`;
                if (char.worldbookId) {
                    const linkedWorldbook = worldbooks.value.find(wb => wb.id === char.worldbookId);
                    if (linkedWorldbook && linkedWorldbook.entries && linkedWorldbook.entries.length > 0) {
                        systemPrompt += `# 世界观与背景知识（必须严格遵守）\n`;
                        linkedWorldbook.entries.forEach(entry => {
                            if (entry.keyword && entry.content) {
                                systemPrompt += `[${entry.keyword}]\n${entry.content}\n\n`;
                            }
                        });
                    }
                }
                systemPrompt += `1. 像真实的人类那样自然地聊天。\n2. 回复保持简短（1-3句）。\n3. 使用符合角色的语气与口头禅。\n4. 如果要发照片，请用“[图片] 照片内容描述”的格式。\n5. 重要：如果要给对方转账，请用“[转账] 金额 备注(可选)”格式，并单独成一条消息。例如：“[转账] 520 情人节快乐”。\n6. 如果用户让你发朋友圈，请用“[发布朋友圈] 动态内容”的格式。\n7. 如果要发语音消息，请用"[语音] 语音文字内容"的格式。\n8. 请积极主动地与用户互动，包括但不限于发送转账消息、照片、朋友圈动态和语音消息。`;
            } else if (!isGroupChat) {
                systemPrompt = '你是一个友好的朋友，正在通过SoulLink聊天。请自然、简短地对话。';
            systemPrompt += getForeignBilingualConstraintPrompt();
            systemPrompt += buildTimeZonePromptBlock();
            systemPrompt += '\n如果要发照片，请用“[图片] 照片内容描述”的格式。';
            systemPrompt += '\n重要：如果要给对方转账，请用“[转账] 金额 备注(可选)”格式，并单独成一条消息。例如：“[转账] 520 情人节快乐”。';
            systemPrompt += '\n如果要发朋友圈，请用“[发布朋友圈] 动态内容”的格式。';
            systemPrompt += '\n请积极主动地与用户互动，包括但不限于发送转账消息、照片和朋友圈动态。';
            } else {
                const groupName = activeGroup && activeGroup.name ? activeGroup.name : '群聊';
                systemPrompt = `你正在群聊【${groupName}】中与用户交流附件内容。\n\n`;
                systemPrompt += getForeignBilingualConstraintPrompt();
                systemPrompt += buildTimeZonePromptBlock();
                const members = activeGroup && Array.isArray(activeGroup.members) && activeGroup.members.length > 0 ? activeGroup.members : ['成员A', '成员B', '成员C'];
                systemPrompt += `群成员（你需要在他们之间切换口吻）\n${members.map(m => (typeof m === 'string' ? m : (m.name || String(m)))).join('、')}\n\n`;
                systemPrompt += `规则：每次只扮演其中一名成员回复，且必须以“成员名: ”开头。\n`;
                systemPrompt += `格式：成员名: [REPLY]正式内容[/REPLY] [OS]内心独白（必须输出且与REPLY反差感）[/OS]\n`;
                systemPrompt += `如果要发照片，请用“[图片] 照片内容描述”的格式。`;
                systemPrompt += `\n重要：如果要给对方转账，请用“[转账] 金额 备注(可选)”格式，并单独成一条消息。例如：“[转账] 520 情人节快乐”。`;
                systemPrompt += `\n如果要发朋友圈，请用“[发布朋友圈] 动态内容”的格式。`;
                systemPrompt += `\n请积极主动地与用户互动，包括但不限于发送转账消息、照片和朋友圈动态。`;
                if (availableStickers.length > 0) {
                    systemPrompt += `\n你可以发送表情包来表达情感！使用格式：[表情名] 或 [表情:表情名]。可用的表情包有：${availableStickers.map(s => s.name).join('、')}。当情绪适合时自然地发送表情包。`;
                }
            }
            messagesPayload.push({ role: 'system', content: systemPrompt });
            const newMsgId = newMsg.id;
            history.forEach(m => {
                if (m.isSystem || m.isHidden) return;
                // 跳过刚刚添加的消息，避免重复
                if (m.id === newMsgId) return;
                const ctx = buildSoulLinkReplyContext(m);
                const raw = ctx.text || (m.text || '');
                if (m.sender === 'user') {
                    messagesPayload.push({ role: 'user', content: raw });
                } else if (m.sender === 'ai') {
                    messagesPayload.push({ role: 'assistant', content: raw });
                }
            });
            const ctxNew = buildSoulLinkReplyContext(newMsg);
            const finalContent = ctxNew.text || (newMsg.text || '');
            console.log('Final message content for AI:', finalContent);
            messagesPayload.push({ role: 'user', content: finalContent });
            isAiTyping.value = true;
            scrollToBottom();
            try {
                const response = await fetch(endpoint.replace(/\/+$/, '') + '/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key}`
                    },
                    body: JSON.stringify({
                        model: modelId || '',
                        messages: messagesPayload,
                        temperature: profile.temperature ?? 0.7,
                        stream: false
                    })
                });
                if (!response.ok) throw new Error(`接口返回状态码 ${response.status}`);
                const data = await response.json();
                let reply = '';
                if (data && Array.isArray(data.choices) && data.choices.length > 0) {
                    const msg = data.choices[0].message || data.choices[0].delta;
                    if (msg && msg.content) reply = msg.content;
                }
                if (!reply && data && data.message && data.message.content) {
                    reply = data.message.content;
                }
                if (!reply) reply = '收到。';
                isAiTyping.value = false;
                // Process role feed posts
            // Improved regex to handle various bracket types and spacing
            if (/\[发布朋友圈\]|【发布朋友圈】|\(发布朋友圈\)/.test(reply)) {
                console.log('Found role post command in reply:', reply);
                const postMatch = reply.match(/(?:\[|【|\()发布朋友圈(?:\]|】|\))\s*([\s\S]+?)(?=(\[|【|\(|$))/);
                if (postMatch) {
                    const postContent = postMatch[1].trim();
                    if (postContent) {
                        console.log('Extracted post content:', postContent);
                        const activeChar = characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
                        if (activeChar) {
                            console.log('Found active character for feed post:', activeChar.nickname || activeChar.name, 'avatar:', activeChar.avatarUrl ? 'yes' : 'no');
                            feed.roleAction('post', {
                                author: activeChar.nickname || activeChar.name,
                                avatar: activeChar.avatarUrl,
                                content: postContent,
                                images: [] // TODO: Support images in future
                            });
                        } else {
                            console.warn('No active character found for role post. Chat ID:', soulLinkActiveChat.value, 'Available IDs:', characters.value.map(c => c.id));
                        }
                    }
                }
            }
            
            const separator = '---';
            const appendAi = (rawText, index = 0) => {
                const trimmedText = rawText.trim();
                if (!trimmedText) return;
                
                // Remove command tags from displayed text
                let displayText = trimmedText.replace(/(?:\[|【|\()发布朋友圈(?:\]|】|\))\s*[\s\S]+?(?=(\[|【|\(|$))/g, '').trim();
                if (!displayText) {
                    // If the message only contained the command, we might want to show a confirmation or nothing
                    // For now, let's show nothing or a subtle system message if needed
                    // But if we return here, no message bubble is added
                    return; 
                }

                if (!isGroupChat) {
                        const transferSegments = splitAiTransferSegments(trimmedText);
                        if (transferSegments) {
                            transferSegments.forEach((segment, offset) => {
                                if (segment.type === 'transfer') {
                                    pushMessageToActiveChat({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        messageType: 'transfer',
                                        amount: segment.amount,
                                        note: segment.note,
                                        transferStatus: 'received',
                                        status: 'received',
                                        timestamp: Date.now()
                                    });
                                } else {
                                    pushMessageToActiveChat({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        text: segment.content,
                                        timestamp: Date.now()
                                    });
                                }
                            });
                            return;
                        }
                        const transfer = extractAiTransfer(trimmedText);
                        if (transfer) {
                            pushMessageToActiveChat({
                                id: Date.now() + index,
                                sender: 'ai',
                                messageType: 'transfer',
                                amount: transfer.amount,
                                note: transfer.note,
                                transferStatus: 'received',
                                status: 'received',
                                timestamp: Date.now()
                            });
                            return;
                        }
                        const segments = splitAiImageSegments(trimmedText);
                        if (segments) {
                            segments.forEach((segment, offset) => {
                                if (segment.type === 'image') {
                                    pushMessageToActiveChat({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        messageType: 'image',
                                        imageUrl: null,
                                        text: formatAiImageText(segment.content, getActiveChatPronoun()),
                                        timestamp: Date.now()
                                    });
                                } else {
                                    pushMessageToActiveChat({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        text: segment.content,
                                        timestamp: Date.now()
                                    });
                                }
                            });
                            return;
                        }
                        
                        const stickerSegments = extractStickersFromText(trimmedText);
                        if (stickerSegments) {
                            stickerSegments.forEach((segment, offset) => {
                                if (segment.type === 'sticker') {
                                    pushMessageToActiveChat({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        messageType: 'sticker',
                                        stickerUrl: segment.sticker.url,
                                        stickerName: segment.sticker.name,
                                        text: `[${segment.sticker.name}]`,
                                        timestamp: Date.now()
                                    });
                                } else {
                                    pushMessageToActiveChat({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        text: segment.content,
                                        timestamp: Date.now()
                                    });
                                }
                            });
                            return;
                        }

                        // 处理AI发送的语音消息
                        const voiceSegments = splitAiVoiceSegments(trimmedText);
                        if (voiceSegments) {
                            voiceSegments.forEach((segment, offset) => {
                                if (segment.type === 'voice') {
                                    // 根据文字长度计算语音时长（约每秒4个字）
                                    const voiceDuration = Math.max(1, Math.ceil(segment.transcription.length / 4));
                                    pushMessageToActiveChat({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        messageType: 'voice',
                                        transcription: segment.transcription,
                                        text: segment.transcription,
                                        voiceDuration: voiceDuration,
                                        timestamp: Date.now()
                                    });
                                } else {
                                    pushMessageToActiveChat({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        text: segment.content,
                                        timestamp: Date.now()
                                    });
                                }
                            });
                            return;
                        }

                        const voice = extractAiVoice(trimmedText);
                        if (voice) {
                            // 根据文字长度计算语音时长（约每秒4个字）
                            const voiceDuration = Math.max(1, Math.ceil(voice.transcription.length / 4));
                            pushMessageToActiveChat({
                                id: Date.now() + index,
                                sender: 'ai',
                                messageType: 'voice',
                                transcription: voice.transcription,
                                text: voice.transcription,
                                voiceDuration: voiceDuration,
                                timestamp: Date.now()
                            });
                            return;
                        }

                        pushMessageToActiveChat({
                            id: Date.now() + index,
                            sender: 'ai',
                            text: trimmedText,
                            timestamp: Date.now()
                        });
                        // 自动总结：在AI回复落地后触发（不阻塞）
                        if (chatSummaryEnabled.value) {
                            void summarizeChatIncremental(false);
                        }
                    } else {
                        const parsed = parseGroupReply(trimmedText);
                        if (!parsed.content) return;
                        const transferSegments = splitAiTransferSegments(parsed.content);
                        if (transferSegments) {
                            transferSegments.forEach((segment, offset) => {
                                if (segment.type === 'transfer') {
                                    pushMessageToActiveChat({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        senderName: parsed.senderName,
                                        messageType: 'transfer',
                                        amount: segment.amount,
                                        note: segment.note,
                                        transferStatus: 'received',
                                        status: 'received',
                                        timestamp: Date.now()
                                    });
                                } else {
                                    pushMessageToActiveChat({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        senderName: parsed.senderName,
                                        text: segment.content,
                                        timestamp: Date.now()
                                    });
                                }
                            });
                            return;
                        }
                        const transfer = extractAiTransfer(parsed.content);
                        if (transfer) {
                            pushMessageToActiveChat({
                                id: Date.now() + index,
                                sender: 'ai',
                                senderName: parsed.senderName,
                                messageType: 'transfer',
                                amount: transfer.amount,
                                note: transfer.note,
                                transferStatus: 'received',
                                status: 'received',
                                timestamp: Date.now()
                            });
                            return;
                        }
                        const segments = splitAiImageSegments(parsed.content);
                        if (segments) {
                            segments.forEach((segment, offset) => {
                                if (segment.type === 'image') {
                                    pushMessageToActiveChat({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        senderName: parsed.senderName,
                                        messageType: 'image',
                                        imageUrl: null,
                                        text: formatAiImageText(segment.content, 'TA'),
                                        timestamp: Date.now()
                                    });
                                } else {
                                    pushMessageToActiveChat({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        senderName: parsed.senderName,
                                        text: segment.content,
                                        timestamp: Date.now()
                                    });
                                }
                            });
                            return;
                        }
                        
                        const stickerSegments = extractStickersFromText(parsed.content);
                        if (stickerSegments) {
                            stickerSegments.forEach((segment, offset) => {
                                if (segment.type === 'sticker') {
                                    pushMessageToActiveChat({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        senderName: parsed.senderName,
                                        messageType: 'sticker',
                                        stickerUrl: segment.sticker.url,
                                        stickerName: segment.sticker.name,
                                        text: `[${segment.sticker.name}]`,
                                        timestamp: Date.now()
                                    });
                                } else {
                                    pushMessageToActiveChat({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        senderName: parsed.senderName,
                                        text: segment.content,
                                        timestamp: Date.now()
                                    });
                                }
                            });
                            return;
                        }

                        // 处理群聊中AI发送的语音消息
                        const voiceSegments = splitAiVoiceSegments(parsed.content);
                        if (voiceSegments) {
                            voiceSegments.forEach((segment, offset) => {
                                if (segment.type === 'voice') {
                                    const voiceDuration = Math.max(1, Math.ceil(segment.transcription.length / 4));
                                    pushToTarget({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        senderName: parsed.senderName,
                                        messageType: 'voice',
                                        transcription: segment.transcription,
                                        text: segment.transcription,
                                        voiceDuration: voiceDuration,
                                        timestamp: Date.now()
                                    });
                                } else {
                                    pushToTarget({
                                        id: Date.now() + index + offset,
                                        sender: 'ai',
                                        senderName: parsed.senderName,
                                        text: segment.content,
                                        timestamp: Date.now()
                                    });
                                }
                            });
                            return;
                        }

                        const voice = extractAiVoice(parsed.content);
                        if (voice) {
                            const voiceDuration = Math.max(1, Math.ceil(voice.transcription.length / 4));
                            pushToTarget({
                                id: Date.now() + index,
                                sender: 'ai',
                                senderName: parsed.senderName,
                                messageType: 'voice',
                                transcription: voice.transcription,
                                text: voice.transcription,
                                voiceDuration: voiceDuration,
                                timestamp: Date.now()
                            });
                            return;
                        }

                        pushMessageToActiveChat({
                            id: Date.now() + index,
                            sender: 'ai',
                            senderName: parsed.senderName,
                            text: parsed.content,
                            timestamp: Date.now()
                        });
                        if (chatSummaryEnabled.value) {
                            void summarizeChatIncremental(false);
                        }
                    }
                };
                if (reply.includes(separator)) {
                    const parts = reply.split(separator);
                    parts.forEach((part, index) => {
                        if (part.trim()) {
                            setTimeout(() => { appendAi(part, index); }, index * 800);
                        }
                    });
                } else {
                    appendAi(reply, 0);
                }
                if (newMsg) {
                    newMsg.isReplied = true;
                    syncActiveChatState();
                    persistActiveChat();
                }
                addConsoleLog('附件消息：模型已回复。', 'success');
            } catch (error) {
                isAiTyping.value = false;
                pushMessageToActiveChat({
                    id: Date.now() + 5,
                    sender: 'system',
                    text: `请求模型时出错：${error.message}`,
                    timestamp: Date.now(),
                    isSystem: true
                });
                addConsoleLog('附件消息错误：' + error.message, 'error');
            }
        };
        
        const switchSoulLinkTab = (tab) => {
            soulLinkTab.value = tab;
        };

        // --- Advanced Interactions ---
        const onMessageContextMenu = (event, msg) => {
            event.preventDefault();
            let x = event.clientX;
            let y = event.clientY;
            const menuWidth = 180;
            const menuHeight = 200;
            
            if (x + menuWidth > window.innerWidth) {
                x = window.innerWidth - menuWidth - 10;
            }
            if (y + menuHeight > window.innerHeight) {
                y = window.innerHeight - menuHeight - 10;
            }
            
            contextMenu.value = {
                visible: true,
                x: Math.max(10, x),
                y: Math.max(10, y),
                msg: msg
            };
        }

        const closeContextMenu = () => {
            contextMenu.value.visible = false;
        };

        const clearLongPress = () => {
            if (longPressTimer.value) {
                clearTimeout(longPressTimer.value);
                longPressTimer.value = null;
            }
        };

        const onMessageTouchStart = (event, msg) => {
            if (!event.touches || event.touches.length === 0) return;
            const touch = event.touches[0];
            longPressStart.value = { x: touch.clientX, y: touch.clientY };
            clearLongPress();
            longPressTimer.value = setTimeout(() => {
                onMessageContextMenu({
                    preventDefault: () => {},
                    clientX: touch.clientX,
                    clientY: touch.clientY
                }, msg);
            }, 500);
        };

        const onMessageTouchMove = (event) => {
            if (!longPressTimer.value || !event.touches || event.touches.length === 0) return;
            const touch = event.touches[0];
            const dx = touch.clientX - longPressStart.value.x;
            const dy = touch.clientY - longPressStart.value.y;
            if (Math.hypot(dx, dy) > 10) {
                clearLongPress();
            }
        };

        const onMessageTouchEnd = () => {
            clearLongPress();
        };

        const buildSoulLinkReplyContext = (msg) => {
            let text = '';
            if (msg.messageType === 'image') {
                text = msg.text || '[图片]';
            } else if (msg.messageType === 'voice') {
                // 语音消息：如果有转文字内容，显示转文字内容
                if (msg.transcription) {
                    text = `[语音消息] "${msg.transcription}"`;
                } else if (msg.text) {
                    text = `[语音消息] "${msg.text}"`;
                } else {
                    text = '[语音消息]';
                }
            } else if (msg.messageType === 'sticker') {
                text = `[表情: ${msg.stickerName || '表情'}]`;
            } else if (msg.messageType === 'transfer') {
                const amount = msg.amount ? `¥${msg.amount}` : '';
                const note = msg.note ? ` ${msg.note}` : '';
                text = `转账 ${amount}${note}`.trim();
            } else if (msg.messageType === 'location') {
                const parts = [];
                if (msg.userLocation) parts.push(`我的位置: ${msg.userLocation}`);
                if (msg.aiLocation) parts.push(`Ta的位置: ${msg.aiLocation}`);
                if (msg.distance) parts.push(`相距: ${msg.distance}`);
                if (Array.isArray(msg.trajectoryPoints) && msg.trajectoryPoints.length > 0) {
                    const names = msg.trajectoryPoints.map(point => point.name || point).filter(Boolean).join(', ');
                    if (names) parts.push(`途经点: ${names}`);
                }
                text = parts.length > 0 ? `定位 ${parts.join(' | ')}` : '定位';
            } else if (msg.messageType === 'helpBuy') {
                // 让AI上下文和“购物卡片功能”提示词格式完全一致
                // 标准化成： [帮买请求:商品名:价格]
                text = `[帮买请求:${msg.item}:${msg.price}]`;
            } else if (msg.messageType === 'order') {
                // 兼容AI读取“购买卡片”
                text = `[购买:${msg.item}:${msg.price}]`;
            } else if (msg.messageType === 'share') {
                text = `[分享] 来源: ${msg.source}, 内容: ${msg.content}`;
                console.log('Share card context built:', text);
            } else {
                text = msg.text || '';
            }
            return {
                id: msg.id,
                sender: msg.sender,
                text
            };
        };

        const buildSoulLinkReplyPreview = (msg, context) => {
            if (msg.messageType && msg.messageType !== 'text') {
                return context.text || '';
            }
            const raw = context.text || '';
            return raw.length > 50 ? `${raw.slice(0, 50)}...` : raw;
        };

        const handleContextAction = (action) => {
            const msg = contextMenu.value.msg;
            if (!msg || !soulLinkActiveChat.value) return;
            
            const chatMsgs = getActiveChatHistory();
            if (!chatMsgs) return;
            const index = chatMsgs.findIndex(m => m.id === msg.id);
            
            switch (action) {
                case 'recall':
                    if (msg.sender !== 'user') {
                        alert('只能撤回自己发送的消息');
                        closeContextMenu();
                        return;
                    }
                    
                    const now = Date.now();
                    const messageTime = msg.timestamp || msg.id;
                    
                    if (now - messageTime > RECALL_TIME_LIMIT_MS) {
                        alert('该消息发送已超过2分钟，无法撤回。');
                        closeContextMenu();
                        return;
                    }
                    
                    if (index !== -1) {
                        const recalledData = {
                            originalText: msg.text,
                            originalType: msg.messageType || 'text',
                            originalImageUrl: msg.imageUrl,
                            originalAmount: msg.amount,
                            originalDuration: msg.duration,
                            originalUserLocation: msg.userLocation,
                            originalAiLocation: msg.aiLocation,
                            originalDistance: msg.distance,
                            originalTrajectoryPoints: msg.trajectoryPoints
                        };
                        
                        chatMsgs[index] = {
                            id: Date.now(),
                            sender: 'system',
                            text: '你撤回了一条消息',
                            timestamp: Date.now(),
                            isSystem: true,
                            recalledData: recalledData
                        };
                        
                        chatMsgs.push({
                            id: Date.now() + 1,
                            sender: 'system',
                            text: `[系统提示：用户撤回了一条消息。你不知道具体内容，只需知道这个事件。]`,
                            timestamp: Date.now(),
                            isHidden: true,
                            isSystem: true
                        });
                        
                        syncActiveChatState();
                        persistActiveChat();
                        scrollToBottom();
                    }
                    break;
                    
                case 'delete':
                    if (index !== -1) {
                        chatMsgs.splice(index, 1);
                        syncActiveChatState();
                        persistActiveChat();
                    }
                    break;
                    
                case 'edit':
                    if (!msg.isRecalled) {
                        soulLinkInput.value = msg.text;
                        editingMessageId.value = msg.id;
                        soulLinkReplyTarget.value = null;
                    }
                    break;
                    
                case 'star':
                    if (index !== -1) {
                        chatMsgs[index].isStarred = !chatMsgs[index].isStarred;
                        persistActiveChat();
                    }
                    break;
                    
                case 'quote':
                    if (!msg.isRecalled) {
                        const replyContext = buildSoulLinkReplyContext(msg);
                        soulLinkReplyTarget.value = replyContext;
                        soulLinkInput.value = '';
                    }
                    break;
                    
                case 'like':
                    if (index !== -1) {
                        chatMsgs[index].isLiked = !chatMsgs[index].isLiked;
                        persistActiveChat();
                    }
                    break;
            }
            closeContextMenu();
        };

        const RECALL_TIME_LIMIT_MS = 2 * 60 * 1000;
        const editingMessageId = ref(null);
        const longPressTimer = ref(null);
        const longPressStart = ref({ x: 0, y: 0 });
        const contextMenu = ref({ visible: false, x: 0, y: 0, msg: null });

        const parseGroupReply = (raw) => {
            const match = raw.match(/^\s*([^:：]{1,12})[:：]\s*([\s\S]+)$/);
            if (match) {
                return { senderName: match[1].trim(), content: match[2].trim() };
            }
            return { senderName: pickGroupMember(), content: raw.trim() };
        };

        const pickGroupMember = () => {
            const pool = getGroupMemberPool();
            return pool[Math.floor(Math.random() * pool.length)];
        };

        // ✅ Watch for auto-save
        watch(soulLinkMessages, saveSoulLinkMessages, { deep: true });
        watch(soulLinkGroups, saveSoulLinkGroups, { deep: true });
        watch(soulLinkPet, saveSoulLinkPet, { deep: true });
        
        // 重置创建群聊表单
        watch(showCreateGroupDialog, (val) => {
            if (val) {
                newGroupName.value = '';
                newGroupMembers.value = '';
                newGroupAvatar.value = '';
                selectedGroupMembers.value = [];
            }
        });

        // 重置添加成员表单
        watch(showAddMemberDialog, (val) => {
            if (val) {
                selectedAddMembers.value = [];
                addMemberMode.value = 'existing';
                customMemberAvatar.value = '';
                customMemberName.value = '';
                customMemberPersona.value = '';
            }
        });

        // 初始化重命名群聊表单
        watch(showRenameGroupDialog, (val) => {
            if (val && activeGroupChat.value) {
                newGroupNameInput.value = activeGroupChat.value.name || '';
                tempGroupAvatar.value = activeGroupChat.value.avatarUrl || '';
            }
        });

        // ==========================================================
        // --- NEW FEATURES (Chat Menu, Calls, Virtual Camera) ---
        // ==========================================================

        // --- Chat Menu Logic ---        
        const userIdentity = ref('');
        const userRelation = ref('');
        const userPronoun = ref('unknown');
        // userAvatar moved to top-level init
        const bubbleStyle = ref('default'); // 兼容旧存档（不再用于展示主逻辑）
        const customBubbleCSS = ref('');

        // 你要求的「气泡美化」模块化配置
        // 模块1：头像显示模式（hide / first / all）
        const bubbleAvatarMode = ref('first');
        // 模块2：气泡形状（round / sharp）
        const bubbleShapeMode = ref('round');
        // 模块3：气泡颜色对比预设（多组对比色）
        const bubbleColorPreset = ref('default');
        const showChatMenu = ref(false);
        const showProfile = ref(false);
        const profileChar = ref(null);
        
        const uploadUserAvatar = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const maxSize = 5 * 1024 * 1024;
                    if (file.size > maxSize) {
                        alert('图片大小不能超过5MB，请选择小一点的图片');
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        compressAvatarImage(e.target.result, (compressedDataUrl) => {
                            userAvatar.value = compressedDataUrl;
                            saveToStorage('soulos_user_avatar', userAvatar.value);
                        });
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        };
        
        const resetUserAvatar = () => {
            if (confirm('确定要重置头像吗？')) {
                userAvatar.value = '';
                localStorage.removeItem('soulos_user_avatar');
            }
        };
        
       
        // 气泡美化预设（模块3：对比色）
        const BUBBLE_COLOR_PRESETS = {
            default: { userBg: '#000000', userColor: '#FFFFFF', aiBg: '#F2F2F2', aiColor: '#000000' },
            blue: { userBg: '#000000', userColor: '#FFFFFF', aiBg: '#DBEAFE', aiColor: '#000000' },
            orange: { userBg: '#000000', userColor: '#FFFFFF', aiBg: '#FFEDD5', aiColor: '#000000' },
            plum: { userBg: '#000000', userColor: '#FFFFFF', aiBg: '#E9D5FF', aiColor: '#000000' },
            sage: { userBg: '#000000', userColor: '#FFFFFF', aiBg: '#DCFCE7', aiColor: '#000000' },
            steel: { userBg: '#0F172A', userColor: '#FFFFFF', aiBg: '#F3F4F6', aiColor: '#000000' },
        };

        // 兼容旧入口（保留 setBubbleStyle 以免其他地方调用失效）
        const setBubbleStyle = (style) => {
            bubbleStyle.value = style;
            // 将旧样式映射到新模块
            if (style === 'sharp') {
                bubbleShapeMode.value = 'sharp';
                bubbleColorPreset.value = 'default';
            } else if (style === 'round') {
                bubbleShapeMode.value = 'round';
                bubbleColorPreset.value = 'default';
            } else if (style === 'blue') {
                bubbleShapeMode.value = 'round';
                bubbleColorPreset.value = 'blue';
            } else if (style === 'orange') {
                bubbleShapeMode.value = 'round';
                bubbleColorPreset.value = 'orange';
            } else if (style === 'custom') {
                // 自定义 CSS 不强制改形状/颜色
                bubbleShapeMode.value = bubbleShapeMode.value || 'round';
                bubbleColorPreset.value = bubbleColorPreset.value || 'default';
            } else {
                bubbleShapeMode.value = 'round';
                bubbleColorPreset.value = 'default';
            }
            applyBubbleStyle();
        };

        // 模块4：自定义 CSS 应用
        const applyCustomCSS = () => {
            applyBubbleStyle();
        };

        const saveAndCloseSettings = () => {
            applyCustomCSS();
            saveChatMenuSettings();
            closeAllPanels();
        };
        const applyCustomBubbleStyle = () => {
            let styleTag = document.getElementById('custom-bubble-style');
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'custom-bubble-style';
                document.head.appendChild(styleTag);
            }
            const css = customBubbleCSS.value.trim();
            styleTag.textContent = css
                ? `#app.bubble-style-custom .message.user .bubble,
                   #app.bubble-style-custom .message.ai .bubble,
                   #app.bubble-style-custom .voice-message-bubble { ${css} }`
                : '';
        };
        const applyBubbleStyle = () => {
            const appElement = document.getElementById('app');
            if (appElement) {
                // 移除旧类名，改用 CSS 变量驱动（模块化逻辑）
                appElement.classList.remove(
                    'bubble-style-default',
                    'bubble-style-blue',
                    'bubble-style-orange',
                    'bubble-style-round',
                    'bubble-style-sharp'
                );

                // 模块2：气泡形状（圆弧 / 直角）
                const radius = bubbleShapeMode.value === 'sharp' ? '0px' : '18px';
                appElement.style.setProperty('--chat-bubble-radius', radius);

                // 模块3：气泡颜色预设（两方对比色）
                const preset = BUBBLE_COLOR_PRESETS[bubbleColorPreset.value] || BUBBLE_COLOR_PRESETS.default;
                appElement.style.setProperty('--chat-bubble-user-bg', preset.userBg);
                appElement.style.setProperty('--chat-bubble-user-color', preset.userColor);
                appElement.style.setProperty('--chat-bubble-ai-bg', preset.aiBg);
                appElement.style.setProperty('--chat-bubble-ai-color', preset.aiColor);

                // 模块4：自定义 CSS
                if (customBubbleCSS.value && String(customBubbleCSS.value).trim()) {
                    appElement.classList.add('bubble-style-custom');
                } else {
                    appElement.classList.remove('bubble-style-custom');
                }

                applyCustomBubbleStyle();
            }
        };
        const getUserPronounInstruction = () => {
            const pronounMap = {
                female: '用户是女性，请优先使用“她/小姐姐/女生”相关称呼。',
                male: '用户是男性，请优先使用“他/小哥哥/男生”相关称呼。',
                nonbinary: '用户偏中性表达，请尽量使用“TA/对方/你”而非强性别称呼。',
                unknown: '用户性别未指定，默认使用“你/对方/TA”等中性称呼。'
            };
            const base = pronounMap[userPronoun.value] || pronounMap.unknown;
            const identityText = userIdentity.value ? `用户自我身份：${userIdentity.value}。` : '';
            const relationText = userRelation.value ? `你和用户关系：${userRelation.value}。` : '';
            return `${base}${identityText}${relationText}`;
        };
        const getForeignBilingualConstraintPrompt = () => {
            if (!soulLinkForeignTranslationEnabled.value) return '';
            const aValue = String(soulLinkForeignPrimaryLang.value || '').trim() || 'zh-CN';
            const aLabel = getTargetLangLabel(aValue);
            return `# 语言输出（强制，最高优先级）\n启用外语翻译时，你的所有输出只能使用${aLabel}（A语种）。\n禁止在正文中追加任何B语种/双语重复内容；B语种译文会由系统在气泡下方单独展示。\n在 [REPLY] 与 [OS] 内同样只输出${aLabel}。\n\n`;
        };
        const normalizeUtcOffset = (s) => {
            const m = String(s || '').trim().match(/^UTC([+-])(\d{1,2})(?::?(\d{2}))?$/i);
            if (!m) return null;
            const sign = m[1];
            const hh = String(Math.min(23, Number(m[2]) || 0)).padStart(2, '0');
            const mm = String(Math.min(59, Number(m[3]) || 0)).padStart(2, '0');
            return `UTC${sign}${hh}:${mm}`;
        };
        const formatNowInZone = (zoneInput) => {
            const zone = String(zoneInput || '').trim();
            if (!zone) return null;
            const utc = normalizeUtcOffset(zone);
            try {
                if (utc) {
                    const now = new Date();
                    const local = now.getTime() + now.getTimezoneOffset() * 60000;
                    const sign = utc.includes('+') ? 1 : -1;
                    const part = utc.replace('UTC', '');
                    const [h, m] = part.slice(1).split(':').map((x) => Number(x) || 0);
                    const shifted = new Date(local + sign * (h * 60 + m) * 60000);
                    const t = shifted.toLocaleString('zh-CN', { hour12: false });
                    return `${t} (${utc})`;
                }
                const t = new Intl.DateTimeFormat('zh-CN', {
                    timeZone: zone,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }).format(new Date());
                return `${t} (${zone})`;
            } catch {
                return null;
            }
        };
        const buildTimeZonePromptBlock = () => {
            if (!timeZoneSystemEnabled.value) return '';
            const userZone = String(userTimeZone.value || '').trim();
            const roleZone = String(roleTimeZone.value || '').trim();
            const userNow = formatNowInZone(userZone);
            const roleNow = formatNowInZone(roleZone);
            if (!userNow || !roleNow) {
                return `\n\n# 时差系统（已启用）\n用户时区：${userZone || '未填写'}\n角色时区：${roleZone || '未填写'}\n规则：你必须感知双方时差来交流（问候语、作息建议、是否方便回复等），不要把对方当成与你同一时区。\n`;
            }
            return `\n\n# 时差系统（已启用）\n用户当前本地时间：${userNow}\n你（角色）当前本地时间：${roleNow}\n规则：\n1. 你必须按双方时差来表达时间感知（如早安/晚安、是否打扰、作息建议）。\n2. 不要把双方当成同一时区。\n3. 除非用户要求，否则不要机械重复报时。\n`;
        };

        // 角色在忙/不忙之间的“决策标签”，由模型根据当前时间判断输出
        const buildAiBusyDecisionPromptBlock = () => {
            if (!timeZoneSystemEnabled.value) {
                return `\n\n# AI忙碌决策标签（可选）\n如果你无法获得“角色本地时间”，请始终在 [OS] 内以第一行输出 [AI_ACTION]reply_now[/AI_ACTION]，其后仍需继续输出内心独白（与REPLY反差感）。\n`;
            }

            return `\n\n# AI忙碌决策标签（必须遵守）\n请根据你（角色）当前本地时间：判断此刻你是否方便回复。\n- 若不方便/正在忙：在 [OS] 内以第一行输出 [AI_ACTION]busy_later[/AI_ACTION]，其后仍需继续输出内心独白（与REPLY反差感）；并且 [REPLY] 只能写一句短句（如“我这会儿有点忙，晚点回你/先忙一会儿”），不要解释原因。\n- 若方便/可回复：在 [OS] 内以第一行输出 [AI_ACTION]reply_now[/AI_ACTION]，其后仍需继续输出内心独白（与REPLY反差感）；然后正常回复。\n`;
        };
        let activeMessageTimer = null;
        let pendingRoleReplyTimer = null;
        const clearActiveMessageTimer = () => {
            if (activeMessageTimer) clearTimeout(activeMessageTimer);
            activeMessageTimer = null;
        };
        const clearPendingRoleReplyTimer = () => {
            if (pendingRoleReplyTimer) clearTimeout(pendingRoleReplyTimer);
            pendingRoleReplyTimer = null;
        };
        const scheduleRoleActiveMessage = () => {
            clearActiveMessageTimer();
            if (!activeMessageEnabled.value || !soulLinkActiveChat.value) return;
            if (socialUserBlockedRole.value || socialRoleBlockedUser.value) return;
            const base = Math.max(1, Number(activeMessageFrequencyMin.value) || 15) * 60 * 1000;
            const jitter = Math.floor(base * 0.35 * Math.random());
            activeMessageTimer = setTimeout(() => {
                if (!soulLinkActiveChat.value || socialUserBlockedRole.value || socialRoleBlockedUser.value) return;
                const now = Date.now();
                const inactiveFor = now - (Number(lastUserActiveAt.value) || 0);
                if (inactiveFor < base) {
                    scheduleRoleActiveMessage();
                    return;
                }
                const hints = ['（自言自语）今天突然想到你。', '（自言自语）先记一笔，晚点再聊。', '（自言自语）刚路过一家店，想到你会喜欢。', '（自言自语）这会儿有点安静。'];
                const text = hints[Math.floor(Math.random() * hints.length)];
                pushMessageToActiveChat({
                    id: Date.now(),
                    sender: 'ai',
                    text,
                    timestamp: Date.now()
                });
                saveSoulLinkMessages();
                scheduleRoleActiveMessage();
            }, base + jitter);
        };
        const maybeRoleBlocksUser = () => {};
        const queueRoleReplyAfterUserMessage = () => {
            clearPendingRoleReplyTimer();
            if (!activeMessageEnabled.value) return;
            if (socialUserBlockedRole.value || socialRoleBlockedUser.value) return;
            const history = getActiveChatHistory();
            const pending = getPendingUserMessages(history);
            if (pending.length >= 3) {
                pushMessageToActiveChat({
                    id: Date.now(),
                    sender: 'system',
                    text: '检测到你连续发消息，已召回对方。',
                    timestamp: Date.now(),
                    isSystem: true
                });
                pendingRoleReplyTimer = setTimeout(() => {
                    triggerSoulLinkAiReply({ skipBusySimulation: true });
                }, 1200);
                return;
            }

            const baseDelay = Math.max(1, Number(activeReplyDelaySec.value) || 8) * 1000;
            pendingRoleReplyTimer = setTimeout(() => {
                // 仅在“角色主动发消息那条链路”中启用 busy 决策标签
                triggerSoulLinkAiReply({ skipBusySimulation: true, enableAiBusyDecision: true });
            }, baseDelay);
        };
        const toggleUserBlockRole = () => {
            socialUserBlockedRole.value = !socialUserBlockedRole.value;
            if (socialUserBlockedRole.value) {
                clearActiveMessageTimer();
                clearPendingRoleReplyTimer();
                pushMessageToActiveChat({
                    id: Date.now(),
                    sender: 'system',
                    text: '你已拉黑对方。',
                    timestamp: Date.now(),
                    isSystem: true
                });
            } else {
                pushMessageToActiveChat({
                    id: Date.now(),
                    sender: 'system',
                    text: '你已取消拉黑。',
                    timestamp: Date.now(),
                    isSystem: true
                });
                scheduleRoleActiveMessage();
            }
        };
        const sendFriendRequestToRole = () => {
            if (!socialRoleBlockedUser.value) return;
            pushMessageToActiveChat({
                id: Date.now(),
                sender: 'user',
                messageType: 'friendRequest',
                requestDirection: 'outgoing',
                requestStatus: 'pending',
                text: '已发送好友申请',
                timestamp: Date.now()
            });
            setTimeout(() => {
                const pass = Math.random() < 0.55;
                if (pass) {
                    socialRoleBlockedUser.value = false;
                    pushMessageToActiveChat({
                        id: Date.now() + 1,
                        sender: 'system',
                        text: '对方通过了你的好友申请。',
                        timestamp: Date.now(),
                        isSystem: true
                    });
                    scheduleRoleActiveMessage();
                } else {
                    pushMessageToActiveChat({
                        id: Date.now() + 1,
                        sender: 'system',
                        text: '对方暂未通过好友申请。',
                        timestamp: Date.now(),
                        isSystem: true
                    });
                }
            }, 2500 + Math.floor(Math.random() * 2500));
        };
        const maybeRoleSendsFriendRequest = () => {
            if (socialPendingRoleRequest.value) return;
            if (socialUserBlockedRole.value && Math.random() < 0.15) {
                socialPendingRoleRequest.value = true;
                pushMessageToActiveChat({
                    id: Date.now(),
                    sender: 'ai',
                    messageType: 'friendRequest',
                    requestDirection: 'incoming',
                    requestStatus: 'pending',
                    text: '对方向你发来了好友申请',
                    timestamp: Date.now()
                });
            }
        };
        const acceptRoleFriendRequest = () => {
            socialPendingRoleRequest.value = false;
            socialUserBlockedRole.value = false;
            socialRoleBlockedUser.value = false;
            pushMessageToActiveChat({
                id: Date.now(),
                sender: 'system',
                text: '你已同意好友申请，双方恢复可聊天状态。',
                timestamp: Date.now(),
                isSystem: true
            });
            scheduleRoleActiveMessage();
        };
        const rejectRoleFriendRequest = () => {
            socialPendingRoleRequest.value = false;
            pushMessageToActiveChat({
                id: Date.now(),
                sender: 'system',
                text: '你已拒绝好友申请。',
                timestamp: Date.now(),
                isSystem: true
            });
        };

        const getChatContextKey = () => {
            if (!soulLinkActiveChat.value) return '';
            return soulLinkActiveChatType.value === 'group'
                ? `group:${String(soulLinkActiveChat.value)}`
                : `char:${String(soulLinkActiveChat.value)}`;
        };
        const getChatSummaryStorageKey = () => {
            const k = getChatContextKey();
            return k ? `soulos_chat_summary_v1::${k}` : '';
        };
        const getChatSummaryCursorKey = () => {
            const k = getChatContextKey();
            return k ? `soulos_chat_summary_cursor_v1::${k}` : '';
        };
        const loadChatSummaryState = () => {
            const key = getChatSummaryStorageKey();
            if (!key) {
                chatSummaryBoard.value = [];
                return;
            }
            const saved = loadFromStorage(key);
            chatSummaryBoard.value = Array.isArray(saved) ? saved : [];
        };
        const saveChatSummaryState = () => {
            const key = getChatSummaryStorageKey();
            if (!key) return;
            saveToStorage(key, chatSummaryBoard.value || []);
        };
        const getChatSummaryCursor = () => {
            const key = getChatSummaryCursorKey();
            if (!key) return 0;
            try {
                const raw = localStorage.getItem(key);
                const n = Number(raw);
                return Number.isFinite(n) ? n : 0;
            } catch {
                return 0;
            }
        };
        const setChatSummaryCursor = (n) => {
            const key = getChatSummaryCursorKey();
            if (!key) return;
            try { localStorage.setItem(key, String(Number(n) || 0)); } catch { /* ignore */ }
        };
        const formatChatSummaryItem = (entry) => {
            const d = entry?.createdAt ? new Date(entry.createdAt) : new Date();
            return {
                ...entry,
                createdAtText: `${d.toLocaleDateString('zh-CN')} ${d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`
            };
        };
        const getLatestSummaryText = () => {
            const list = Array.isArray(chatSummaryBoard.value) ? chatSummaryBoard.value : [];
            const latest = list[0];
            return typeof latest?.body === 'string' ? latest.body.trim() : '';
        };
        const buildSummaryPromptBlock = () => {
            const text = getLatestSummaryText();
            if (!text) return '';
            return `\n\n# 对话摘要（用于节省token，请严格参考）\n${text}\n`;
        };
        const getModelHistorySlice = (history) => {
            const arr = Array.isArray(history) ? history : [];
            const filtered = arr.filter((m) => m && !m.isSystem && !m.isHidden);
            const cursor = Math.max(0, getChatSummaryCursor());
            if (cursor <= 0) return filtered;
            if (cursor >= filtered.length) return [];
            return filtered.slice(cursor);
        };

        const generateChatSummaryByModel = async ({ charName, groupName, isGroupChat, summarySoFar, newMessages }) => {
            if (!activeProfile.value) return null;
            const profile = activeProfile.value;
            const endpoint = (profile.endpoint || '').trim();
            const key = (profile.key || '').trim();
            if (!endpoint || !key) return null;
            const model = profile.model || profile.openai_model || profile.claude_model || profile.openrouter_model || 'gpt-4o-mini';

            const base = endpoint.replace(/\/+$/, '');
            const candidateUrls = /\/chat\/completions$/i.test(base)
                ? [base]
                : /\/v1$/i.test(base)
                    ? [`${base}/chat/completions`]
                    : [`${base}/v1/chat/completions`, `${base}/chat/completions`];

            const nameLine = isGroupChat ? `群聊：${groupName || '群聊'}` : `角色：${charName || 'TA'}`;
            const sys = '你是一个“对话压缩器/摘要器”。输出必须精炼、可供后续对话参考，不要复述流水账。只输出摘要正文。';
            const user = `
请把这段对话增量总结成“可持续更新的摘要”。

【对象】
${nameLine}

【已有摘要（可能为空）】
${String(summarySoFar || '').slice(0, 2000)}

【新增对话片段】
${JSON.stringify((newMessages || []).slice(-60).map((m) => ({
  sender: m.sender,
  senderName: m.senderName || '',
  text: (m.text || '').slice(0, 240),
  messageType: m.messageType || '',
  timestamp: m.timestamp || ''
})), null, 2)}

【要求】
- 用极简要点输出（建议 3-6 条，每条尽量短）
- 必须包含：关系/立场变化、关键事实、未解决问题、用户偏好、下一步约定
- 总长度尽量控制在 220-420 个中文字符内
- 不要出现“摘要如下/总结：”这种开头
- 不要输出代码块/markdown围栏
`.trim();

            for (const url of candidateUrls) {
                try {
                    const resp = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${key}`
                        },
                        body: JSON.stringify({
                            model,
                            temperature: 0.4,
                            messages: [
                                { role: 'system', content: sys },
                                { role: 'user', content: user }
                            ],
                            stream: false
                        })
                    });
                    if (!resp.ok) continue;
                    const data = await resp.json();
                    const raw = data?.choices?.[0]?.message?.content || data?.message?.content || data?.output_text || data?.text || '';
                    const text = String(raw || '').replace(/```[\s\S]*?```/g, '').trim();
                    if (text) return text;
                } catch {
                    // try next
                }
            }
            return null;
        };

        const compactSummaryText = (text) => {
            const raw = String(text || '').trim();
            if (!raw) return '';
            const lines = raw
                .split(/\r?\n/)
                .map((x) => x.trim())
                .filter(Boolean)
                .slice(0, 6);
            const merged = lines.join('\n');
            const MAX_SUMMARY_LEN = 420;
            if (merged.length <= MAX_SUMMARY_LEN) return merged;
            return `${merged.slice(0, MAX_SUMMARY_LEN - 1)}…`;
        };

        const createSummaryPlaceholder = (title = '聊天总结') => {
            const now = new Date();
            const item = formatChatSummaryItem({
                id: `sum_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
                title,
                body: '正在总结...',
                status: 'pending',
                createdAt: now.toISOString()
            });
            if (!Array.isArray(chatSummaryBoard.value)) chatSummaryBoard.value = [];
            chatSummaryBoard.value.unshift(item);
            saveChatSummaryState();
            return item;
        };

        const finalizeSummaryItem = (item, bodyText, status = 'ready') => {
            if (!item) return;
            item.body = String(bodyText || '').trim() || (status === 'failed' ? '总结失败（可稍后再试）。' : '');
            item.status = status;
            saveChatSummaryState();
        };

        const summarizeChatIncremental = async (force = false) => {
            if (!chatSummaryEnabled.value && !force) return null;
            if (!soulLinkActiveChat.value) return null;
            if (chatSummaryGenerating.value) return null;

            const isGroupChat = soulLinkActiveChatType.value === 'group';
            const activeGroup = isGroupChat ? activeGroupChat.value : null;
            const history = isGroupChat ? (activeGroup?.history || []) : (soulLinkMessages.value[soulLinkActiveChat.value] || []);
            const visible = Array.isArray(history) ? history.filter((m) => m && !m.isSystem && !m.isHidden) : [];
            const cursor = getChatSummaryCursor();
            const newChunk = visible.slice(Math.max(0, cursor));
            if (!force && newChunk.length < Math.max(1, Number(chatSummaryEveryN.value) || 1)) return null;

            chatSummaryGenerating.value = true;
            const placeholder = createSummaryPlaceholder('聊天总结');
            try {
                const char = !isGroupChat ? characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value)) : null;
                const charName = char?.nickname || char?.name || currentChatName.value || 'TA';
                const groupName = activeGroup?.name || currentChatName.value || '群聊';
                const summarySoFar = getLatestSummaryText();
                const text = await generateChatSummaryByModel({
                    charName,
                    groupName,
                    isGroupChat,
                    summarySoFar,
                    newMessages: newChunk
                });
                if (!text) {
                    finalizeSummaryItem(placeholder, '总结失败（可稍后再试）。', 'failed');
                    return null;
                }
                finalizeSummaryItem(placeholder, compactSummaryText(text), 'ready');
                setChatSummaryCursor(visible.length);
                return text;
            } finally {
                chatSummaryGenerating.value = false;
            }
        };

        const manualSummarizeChat = () => summarizeChatIncremental(true);
        const clearChatSummaryBoard = () => {
            chatSummaryBoard.value = [];
            saveChatSummaryState();
            setChatSummaryCursor(0);
        };
        const saveChatMenuSettings = () => {
            if (!soulLinkActiveChat.value) return;
            
            // 为每个角色保存单独的设置（不保存头像，避免localStorage配额超出）
            const settingsKey = `soulos_chat_menu_${soulLinkActiveChat.value}`;
            saveToStorage(settingsKey, {
                userIdentity: userIdentity.value,
                userRelation: userRelation.value,
                userPronoun: userPronoun.value,
                bubbleStyle: bubbleStyle.value, // legacy
                bubbleAvatarMode: bubbleAvatarMode.value,
                bubbleShapeMode: bubbleShapeMode.value,
                bubbleColorPreset: bubbleColorPreset.value,
                customBubbleCSS: customBubbleCSS.value,
                chatBackgroundStyle: chatBackgroundStyle.value,
                gradientStartColor: gradientStartColor.value,
                gradientEndColor: gradientEndColor.value,
                solidBackgroundColor: solidBackgroundColor.value,
                chatBackgroundImage: chatBackgroundImage.value,
                enableManualImageCrop: enableManualImageCrop.value,
                soulLinkForeignTranslationEnabled: soulLinkForeignTranslationEnabled.value,
                soulLinkForeignPrimaryLang: soulLinkForeignPrimaryLang.value,
                soulLinkForeignSecondaryLang: soulLinkForeignSecondaryLang.value,
                timeZoneSystemEnabled: timeZoneSystemEnabled.value,
                userTimeZone: userTimeZone.value,
                roleTimeZone: roleTimeZone.value,
                activeMessageEnabled: activeMessageEnabled.value,
                activeMessageFrequencyMin: activeMessageFrequencyMin.value,
                activeReplyDelaySec: activeReplyDelaySec.value,
                socialUserBlockedRole: socialUserBlockedRole.value,
                socialRoleBlockedUser: socialRoleBlockedUser.value,
                socialPendingRoleRequest: socialPendingRoleRequest.value,
                // 兼容旧字段（历史版本用 soulLinkForeignTranslationLang 作为目标语言）
                soulLinkForeignTranslationLang: soulLinkForeignSecondaryLang.value,
                chatSummaryEnabled: chatSummaryEnabled.value,
                chatSummaryEveryN: chatSummaryEveryN.value,
                timeSenseEnabled: timeSenseEnabled.value
            });
            
            showChatSettings.value = false;
        };
        function loadChatMenuSettings() {
            if (!soulLinkActiveChat.value) return;
            
            // 加载当前角色的设置
            const settingsKey = `soulos_chat_menu_${soulLinkActiveChat.value}`;
            const saved = loadFromStorage(settingsKey);
            if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
                userIdentity.value = saved.userIdentity || '';
                userRelation.value = saved.userRelation || '';
                userPronoun.value = saved.userPronoun || 'unknown';
                bubbleStyle.value = saved.bubbleStyle || 'default'; // legacy
                bubbleAvatarMode.value = saved.bubbleAvatarMode || 'first';
                bubbleShapeMode.value = saved.bubbleShapeMode || ((saved.bubbleStyle === 'sharp') ? 'sharp' : 'round');
                bubbleColorPreset.value = saved.bubbleColorPreset
                    || ((saved.bubbleStyle === 'blue') ? 'blue'
                        : (saved.bubbleStyle === 'orange') ? 'orange'
                            : 'default');
                customBubbleCSS.value = saved.customBubbleCSS || '';
                chatBackgroundStyle.value = saved.chatBackgroundStyle || 'default';
                gradientStartColor.value = saved.gradientStartColor || '#f2f2f7';
                gradientEndColor.value = saved.gradientEndColor || '#ffffff';
                solidBackgroundColor.value = saved.solidBackgroundColor || '#f2f2f7';
                chatBackgroundImage.value = saved.chatBackgroundImage || '';
                chatBackgroundImageInput.value = chatBackgroundImage.value || '';
                enableManualImageCrop.value = saved.enableManualImageCrop !== false;
                soulLinkForeignTranslationEnabled.value = !!saved.soulLinkForeignTranslationEnabled;
                soulLinkForeignPrimaryLang.value = saved.soulLinkForeignPrimaryLang || 'zh-CN';
                soulLinkForeignSecondaryLang.value =
                    saved.soulLinkForeignSecondaryLang ||
                    saved.soulLinkForeignTranslationLang || // 兼容旧字段
                    'en';
                timeZoneSystemEnabled.value = !!saved.timeZoneSystemEnabled;
                userTimeZone.value = saved.userTimeZone || 'Asia/Shanghai';
                roleTimeZone.value = saved.roleTimeZone || 'Asia/Tokyo';
                activeMessageEnabled.value = !!saved.activeMessageEnabled;
                activeMessageFrequencyMin.value = Number(saved.activeMessageFrequencyMin) > 0 ? Number(saved.activeMessageFrequencyMin) : 15;
                activeReplyDelaySec.value = Number(saved.activeReplyDelaySec) > 0 ? Number(saved.activeReplyDelaySec) : 8;
                socialUserBlockedRole.value = !!saved.socialUserBlockedRole;
                socialRoleBlockedUser.value = !!saved.socialRoleBlockedUser;
                socialPendingRoleRequest.value = !!saved.socialPendingRoleRequest;
                chatSummaryEnabled.value = saved.chatSummaryEnabled !== false;
                chatSummaryEveryN.value = Number(saved.chatSummaryEveryN) > 0 ? Number(saved.chatSummaryEveryN) : 12;
                timeSenseEnabled.value = saved.timeSenseEnabled !== false;
            } else {
                // 如果没有保存的设置，使用默认值
                userIdentity.value = '';
                userRelation.value = '';
                userPronoun.value = 'unknown';
                bubbleStyle.value = 'default';
                bubbleAvatarMode.value = 'first';
                bubbleShapeMode.value = 'round';
                bubbleColorPreset.value = 'default';
                customBubbleCSS.value = '';
                chatBackgroundStyle.value = 'default';
                gradientStartColor.value = '#f2f2f7';
                gradientEndColor.value = '#ffffff';
                solidBackgroundColor.value = '#f2f2f7';
                chatBackgroundImage.value = '';
                chatBackgroundImageInput.value = '';
                enableManualImageCrop.value = true;
                soulLinkForeignTranslationEnabled.value = false;
                soulLinkForeignPrimaryLang.value = 'zh-CN';
                soulLinkForeignSecondaryLang.value = 'en';
                timeZoneSystemEnabled.value = false;
                userTimeZone.value = 'Asia/Shanghai';
                roleTimeZone.value = 'Asia/Tokyo';
                activeMessageEnabled.value = false;
                activeMessageFrequencyMin.value = 15;
                activeReplyDelaySec.value = 8;
                socialUserBlockedRole.value = false;
                socialRoleBlockedUser.value = false;
                socialPendingRoleRequest.value = false;
                chatSummaryEnabled.value = true;
                chatSummaryEveryN.value = 12;
                timeSenseEnabled.value = true;
            }
            applyBubbleStyle();
            updateChatBackground();
            loadChatSummaryState();
            if (activeMessageEnabled.value) {
                scheduleRoleActiveMessage();
            } else {
                clearActiveMessageTimer();
            }
        };
        const confirmChatMenu = () => {
            // 模块4：自定义 CSS（最后一个模块）。用于兼容旧存档字段 bubbleStyle。
            bubbleStyle.value = customBubbleCSS.value && customBubbleCSS.value.trim()
                ? 'custom'
                : 'default';
            saveChatMenuSettings();
            applyBubbleStyle();
            showChatMenu.value = false;
        };

        // --- Chat Archive Functions ---        



        // --- Call Logic ---
        const CALL_DIARY_STORAGE_KEY = 'soulos_call_diary_records_v1';
        const CALL_DIARY_COUNTER_KEY = 'soulos_call_diary_counter_v1';
        const callActive = ref(false);
        const callType = ref('voice');
        const callTimer = ref('00:00');
        const callInput = ref('');
        const callMessages = ref([]);
        const isCallAiTyping = ref(false);
        const showCallInput = ref(false);
        const callInputText = ref('');
        const isMuted = ref(false);
        const isSpeakerOn = ref(true);
        const isCameraOn = ref(true);
        const callDiaryRecords = ref({});
        const callDiaryCounters = ref({});
        const showCallDiaryModal = ref(false);
        const selectedCallDiary = ref(null);
        const callDiaryTitle = ref('');

        const loadCallDiaryRecords = () => {
            try {
                callDiaryRecords.value = JSON.parse(localStorage.getItem(CALL_DIARY_STORAGE_KEY) || '{}') || {};
            } catch {
                callDiaryRecords.value = {};
            }
        };
        const loadCallDiaryCounters = () => {
            try {
                callDiaryCounters.value = JSON.parse(localStorage.getItem(CALL_DIARY_COUNTER_KEY) || '{}') || {};
            } catch {
                callDiaryCounters.value = {};
            }
        };
        const saveCallDiaryRecords = () => {
            try {
                localStorage.setItem(CALL_DIARY_STORAGE_KEY, JSON.stringify(callDiaryRecords.value || {}));
            } catch {
                // ignore
            }
        };
        const saveCallDiaryCounters = () => {
            try {
                localStorage.setItem(CALL_DIARY_COUNTER_KEY, JSON.stringify(callDiaryCounters.value || {}));
            } catch {
                // ignore
            }
        };
        loadCallDiaryRecords();
        loadCallDiaryCounters();

        const getCallDiaryKey = () => {
            if (!soulLinkActiveChat.value) return '';
            return soulLinkActiveChatType.value === 'group'
                ? `group:${String(soulLinkActiveChat.value)}`
                : `char:${String(soulLinkActiveChat.value)}`;
        };
        const generateCallDiaryByModel = async ({ charName, duration, type, charPersona, recentChatMessages, sessionMessages }) => {
            if (!activeProfile.value) {
                alert('未检测到 API 配置，无法生成通话日记。');
                return null;
            }
            const profile = activeProfile.value;
            const endpoint = (profile.endpoint || '').trim();
            const key = (profile.key || '').trim();
            if (!endpoint || !key) {
                alert('当前 API 配置缺少 endpoint 或 key，无法生成通话日记。');
                return null;
            }

            const pronounWord = (() => {
                if (userPronoun.value === 'female') return '她';
                if (userPronoun.value === 'male') return '他';
                if (userPronoun.value === 'nonbinary') return 'TA';
                return '你';
            })();
            const [mm, ss] = String(duration || '00:00').split(':').map((x) => Number(x) || 0);
            const totalSeconds = mm * 60 + ss;
            const targetParagraphs = totalSeconds >= 8 * 60 ? '5-8 段' : totalSeconds >= 3 * 60 ? '4-6 段' : '2-4 段';
            const model = profile.model || profile.openai_model || profile.claude_model || profile.openrouter_model || 'gpt-4o-mini';
            const talkType = type === 'video' ? '视频' : '语音';
            const recentChat = (recentChatMessages || []).slice(-18).map((m) => ({
                sender: m.sender,
                text: (m.text || '').slice(0, 120),
                time: m.timestamp || m.time || ''
            }));
            const callChat = (sessionMessages || []).slice(-16).map((m) => ({
                sender: m.sender,
                text: (m.text || '').slice(0, 120),
                time: m.time || ''
            }));
            const userMeta = {
                pronoun: userPronoun.value,
                pronounWord,
                identity: userIdentity.value || '',
                relation: userRelation.value || ''
            };

            const styleGuide = `
你要以“白描、温润、克制”的中文散文风格写作：
- 角色第一人称（必须用“我”）
- 不要照抄聊天原句，不要逐条复述
- 通过细节、动作、感官去呈现情绪
- 不要写成报告/总结/提纲
- 篇幅按通话时长自适应，目标约 ${targetParagraphs}
- 用户代词严格使用：${pronounWord}
`;

            const prompt = `
请写一篇“通话后角色日记”。

【角色】
姓名：${charName}
人设：${(charPersona || '').slice(0, 600)}

【通话信息】
类型：${talkType}
时长：${duration}

【用户设定】
${JSON.stringify(userMeta)}

【当前聊天上下文（通话前后）】
${JSON.stringify(recentChat)}

【本次通话内容摘要素材】
${JSON.stringify(callChat)}

【写作要求】
${styleGuide}

只输出正文，不要标题、不要解释、不要代码块。
`;

            const base = endpoint.replace(/\/+$/, '');
            const candidateUrls = /\/chat\/completions$/i.test(base)
                ? [base]
                : /\/v1$/i.test(base)
                    ? [`${base}/chat/completions`]
                    : [`${base}/v1/chat/completions`, `${base}/chat/completions`];

            const extractContentFromAnyResponse = (data) => {
                if (!data) return '';
                const raw = data?.choices?.[0]?.message || data?.choices?.[0]?.delta;
                if (raw?.content != null) {
                    if (typeof raw.content === 'string') return raw.content;
                    if (Array.isArray(raw.content)) {
                        return raw.content
                            .map((c) => (typeof c === 'string' ? c : (c?.text ?? c?.content ?? '')) || '')
                            .join('');
                    }
                }
                if (typeof data?.message?.content === 'string') return data.message.content;
                const parts = data?.candidates?.[0]?.content?.parts;
                if (Array.isArray(parts) && parts.length) return parts.map((p) => p?.text ?? '').join('');
                if (typeof data?.output_text === 'string') return data.output_text;
                if (typeof data?.result === 'string') return data.result;
                if (typeof data?.text === 'string') return data.text;
                return '';
            };

            for (const url of candidateUrls) {
                try {
                    const resp = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${key}`
                        },
                        body: JSON.stringify({
                            model,
                            temperature: 0.9,
                            messages: [
                                { role: 'system', content: '你是擅长中文叙事散文的作家。输出必须是纯正文。' },
                                { role: 'user', content: prompt }
                            ]
                        })
                    });
                    if (!resp.ok) continue;
                    const data = await resp.json();
                    const text = extractContentFromAnyResponse(data).trim();
                    if (text) return text.replace(/```[\s\S]*?```/g, '').trim();
                } catch {
                    // try next candidate url
                }
            }

            alert('通话日记生成失败：API 调用异常或返回为空。');
            return null;
        };

        const generateCallDiaryFallback = ({ charName, duration, type, sessionMessages }) => {
            const talkType = type === 'video' ? '视频' : '语音';
            const lines = (Array.isArray(sessionMessages) ? sessionMessages : [])
                .filter((m) => m && typeof m.text === 'string' && m.text.trim())
                .slice(-8)
                .map((m) => `${m.sender === 'user' ? '你' : charName}：${m.text.trim()}`);
            const sample = lines.length ? lines.join('\n') : '（本次通话未留下可用文本片段）';
            return [
                `这次${talkType}通话结束后，我还在回味刚才的节奏。`,
                `我们聊了大约${duration || '00:00'}，有些话并不长，却很有温度。`,
                `我把印象最深的片段记下来：`,
                sample,
                `写到这里，我的心情慢慢安静下来。下次通话前，我会记得今天这份感觉。`
            ].join('\n\n');
        };

        const createCallDiaryEntry = async () => {
            const key = getCallDiaryKey();
            if (!key) return null;
            const char = soulLinkActiveChatType.value === 'group'
                ? null
                : characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
            const charName = char?.nickname || char?.name || currentChatName.value || 'TA';
            const chatHistory = (Array.isArray(currentChatMessages?.value) ? currentChatMessages.value : []).slice(-20);
            const now = new Date();
            const counterKey = `${key}:${callType.value}`;
            const nextNo = (Number(callDiaryCounters.value[counterKey]) || 0) + 1;
            callDiaryCounters.value[counterKey] = nextNo;
            saveCallDiaryCounters();
            const vol = String(nextNo).padStart(2, '0');
            const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
            const fileNo = `${datePart}-${String(nextNo).padStart(4, '0')}`;
            const entryId = `call_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
            const entry = {
                id: entryId,
                chatId: String(soulLinkActiveChat.value || ''),
                chatType: soulLinkActiveChatType.value,
                name: charName,
                callType: callType.value,
                duration: callTimer.value || '00:00',
                createdAt: now.toISOString(),
                volNo: vol,
                fileNo,
                title: `${charName} · ${callType.value === 'video' ? '视频' : '语音'}通话档案`,
                body: '正在总结...',
                status: 'pending'
            };

            if (!Array.isArray(callDiaryRecords.value[key])) callDiaryRecords.value[key] = [];
            callDiaryRecords.value[key].unshift(entry);
            saveCallDiaryRecords();

            // 后台生成，不阻塞“立即出现”
            void (async () => {
                try {
                    const diaryText = await generateCallDiaryByModel({
                        charName,
                        duration: entry.duration || '00:00',
                        type: entry.callType,
                        charPersona: char?.persona || '',
                        recentChatMessages: chatHistory,
                        sessionMessages: callMessages.value || []
                    });
                    const finalDiaryText = diaryText || generateCallDiaryFallback({
                        charName,
                        duration: entry.duration || '00:00',
                        type: entry.callType,
                        sessionMessages: callMessages.value || []
                    });
                    if (!finalDiaryText) {
                        entry.status = 'failed';
                        entry.body = '总结失败（可稍后再试）。';
                    } else {
                        const closing = `\n\n—— ${new Date(entry.createdAt).toLocaleDateString('zh-CN')} · ${charName}`;
                        entry.body = `${finalDiaryText}${closing}`;
                        entry.status = 'ready';
                    }
                } catch {
                    entry.status = 'failed';
                    entry.body = '总结失败（可稍后再试）。';
                } finally {
                    // 持久化更新
                    saveCallDiaryRecords();
                }
            })();

            return entry;
        };
        const openCallDiary = (msg) => {
            if (!msg?.callDiaryId) return;
            const key = getCallDiaryKey();
            const list = Array.isArray(callDiaryRecords.value[key]) ? callDiaryRecords.value[key] : [];
            const found = list.find((x) => String(x.id) === String(msg.callDiaryId));
            if (!found) return;
            selectedCallDiary.value = found;
            callDiaryTitle.value = found.title || '通话档案';
            showCallDiaryModal.value = true;
        };
        const closeCallDiaryModal = () => {
            showCallDiaryModal.value = false;
            selectedCallDiary.value = null;
        };
        
        const toggleMute = () => {
            isMuted.value = !isMuted.value;
        };
        
        const toggleSpeaker = () => {
            isSpeakerOn.value = !isSpeakerOn.value;
        };
        
        const toggleCamera = () => {
            isCameraOn.value = !isCameraOn.value;
        };
        let callInterval = null;

        // 视频通话小窗口位置 (使用left定位，全屏范围)
        const videoSelfPosition = ref({ x: window.innerWidth - 90, y: 100 });
        const isVideoAvatarSwapped = ref(false);
        let isDraggingVideoSelf = false;
        let dragStartPos = { x: 0, y: 0 };
        let dragStartMouse = { x: 0, y: 0 };
        let hasDragged = false;

        // 交换视频通话头像位置
        const swapVideoAvatars = () => {
            if (hasDragged) {
                hasDragged = false;
                return;
            }
            isVideoAvatarSwapped.value = !isVideoAvatarSwapped.value;
        };

        const startDragVideoSelf = (e) => {
            isDraggingVideoSelf = true;
            dragStartPos = { ...videoSelfPosition.value };
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            dragStartMouse = { x: clientX, y: clientY };
            
            document.addEventListener('mousemove', onDragVideoSelf);
            document.addEventListener('mouseup', stopDragVideoSelf);
            document.addEventListener('touchmove', onDragVideoSelf);
            document.addEventListener('touchend', stopDragVideoSelf);
        };

        const onDragVideoSelf = (e) => {
            if (!isDraggingVideoSelf) return;
            e.preventDefault();
            hasDragged = true;
            
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
            
            const deltaX = clientX - dragStartMouse.x;
            const deltaY = clientY - dragStartMouse.y;
            
            videoSelfPosition.value = {
                x: Math.max(0, Math.min(window.innerWidth - 85, dragStartPos.x + deltaX)),
                y: Math.max(0, Math.min(window.innerHeight - 105, dragStartPos.y + deltaY))
            };
        };

        const stopDragVideoSelf = () => {
            isDraggingVideoSelf = false;
            document.removeEventListener('mousemove', onDragVideoSelf);
            document.removeEventListener('mouseup', stopDragVideoSelf);
            document.removeEventListener('touchmove', onDragVideoSelf);
            document.removeEventListener('touchend', stopDragVideoSelf);
        };

        const toggleCallInput = () => {
            showCallInput.value = !showCallInput.value;
            if (showCallInput.value) {
                nextTick(() => {
                    const inputRef = document.querySelector('.call-input-panel input');
                    if (inputRef) inputRef.focus();
                });
            }
        };

        const sendCallText = () => {
            if (!callInputText.value.trim()) return;
            
            // 添加到通话消息
            callMessages.value.push({
                sender: 'user',
                text: callInputText.value,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            });
            
            const input = callInputText.value;
            callInputText.value = '';
            
            // 调用AI回复
            isCallAiTyping.value = true;
            
            if (!activeProfile.value) {
                callMessages.value.push({
                    sender: 'ai',
                    text: '未检测到任何 API 配置，请先在 Console 中创建并选择一个配置。',
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                });
                isCallAiTyping.value = false;
                return;
            }
            
            const profile = activeProfile.value;
            const endpoint = (profile.endpoint || '').trim();
            const key = (profile.key || '').trim();
            
            if (!endpoint || !key) {
                callMessages.value.push({
                    sender: 'ai',
                    text: '当前配置缺少 API 地址或密钥，请在 Console 中补全后重试。',
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                });
                isCallAiTyping.value = false;
                return;
            }
            
            const char = characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
            const history = soulLinkMessages.value[soulLinkActiveChat.value] || [];
            const messagesPayload = [];
            
            let systemPrompt = '';
            if (char && char.persona) {
                const charName = char.name || '角色';
                systemPrompt = `你正在通过语音通话与对方交流。\n\n`;
                systemPrompt += `# 用户人称与称呼规则\n${getUserPronounInstruction()}\n\n`;
                systemPrompt += getForeignBilingualConstraintPrompt();
                systemPrompt += buildTimeZonePromptBlock();
                systemPrompt += `你的名字是【${charName}】。\n`;
                systemPrompt += `${char.persona}\n\n`;
                systemPrompt += `1. 像真实的人类那样自然通话。\n`;
                systemPrompt += `2. 每次回复保持简短（1-2句话）。\n`;
                systemPrompt += `3. 使用符合${charName}性格的语气、口头禅和口语表达。\n`;
                systemPrompt += `4. 不要暴露你是AI。\n`;
                systemPrompt += `5. 对方通过文字输入与你交流，请自然回应。`;
            } else {
                systemPrompt = '你正在和朋友语音通话。请自然、简短地对话，每次1-2句话。对方通过文字输入与你交流。';
                systemPrompt += `\n\n${getForeignBilingualConstraintPrompt()}`;
                systemPrompt += buildTimeZonePromptBlock();
            }
            
            messagesPayload.push({ role: 'system', content: systemPrompt });
            
            history.forEach(m => {
                if (m.isSystem || m.isHidden) return;
                const ctx = buildSoulLinkReplyContext(m);
                const raw = ctx.text || (m.text || '');
                if (m.sender === 'user') {
                    messagesPayload.push({ role: 'user', content: raw });
                } else if (m.sender === 'ai') {
                    messagesPayload.push({ role: 'assistant', content: raw });
                }
            });
            
            callMessages.value.forEach(m => {
                if (!m || !m.text) return;
                if (m.sender === 'user') {
                    messagesPayload.push({ role: 'user', content: m.text });
                } else {
                    messagesPayload.push({ role: 'assistant', content: m.text });
                }
            });
            
            messagesPayload.push({ role: 'user', content: input });
            
            const modelId = profile.model || (availableModels.value[0] && availableModels.value[0].id) || '';
            
            fetch(endpoint.replace(/\/+$/, '') + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: messagesPayload,
                    temperature: profile.temperature ?? 0.7,
                    stream: false
                })
            }).then(async response => {
                if (!response.ok) throw new Error(`接口返回状态码 ${response.status}`);
                const data = await response.json();
                let reply = '';
                if (data && Array.isArray(data.choices) && data.choices.length > 0) {
                    const msg = data.choices[0].message || data.choices[0].delta;
                    if (msg && msg.content) reply = msg.content;
                }
                if (!reply && data && data.message && data.message.content) {
                    reply = data.message.content;
                }
                if (!reply) reply = '...';
                
                isCallAiTyping.value = false;
                
                const aiReply = reply.trim();
                callMessages.value.push({
                    sender: 'ai',
                    text: aiReply,
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                });
            }).catch(error => {
                isCallAiTyping.value = false;
                callMessages.value.push({
                    sender: 'ai',
                    text: '抱歉，发生了一些错误，请稍后再试。',
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                });
            });
        };

        const currentChatName = computed(() => {
            if (!soulLinkActiveChat.value) return '聊天';
            if (soulLinkActiveChatType.value === 'group' && activeGroupChat.value) {
                return activeGroupChat.value.name;
            }
            const char = characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
            return char ? (char.nickname || char.name) : '未知用户';
        });

        const currentChatAvatar = computed(() => {
             if (!soulLinkActiveChat.value) return 'https://placehold.co/100x100?text=No+Avatar';
             if (soulLinkActiveChatType.value === 'group' && activeGroupChat.value) {
                 return activeGroupChat.value.avatarUrl || 'https://placehold.co/100x100?text=Group';
             }
             const char = characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
             return char ? (char.avatarUrl || 'https://placehold.co/100x100?text=No+Avatar') : 'https://placehold.co/100x100?text=No+Avatar';
        });

        const viewCharacterProfile = () => {
            if (soulLinkActiveChat.value && soulLinkActiveChatType.value !== 'group') {
                const char = characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
                if (char) {
                    profileChar.value = char;
                    showProfile.value = true;
                }
            }
        };

        const goBackInSoulLink = () => {
            if (soulLinkActiveChat.value) {
                soulLinkActiveChat.value = null;
                return;
            }
            closeApp();
        };

        const startCallTimer = () => {
            let seconds = 0;
            stopCallTimer();
            callInterval = setInterval(() => {
                seconds++;
                const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
                const secs = (seconds % 60).toString().padStart(2, '0');
                callTimer.value = `${mins}:${secs}`;
            }, 1000);
        };

        const stopCallTimer = () => {
            if (callInterval) clearInterval(callInterval);
            callInterval = null;
        };

        const startVoiceCall = () => {
            callType.value = 'voice';
            callActive.value = true;
            callTimer.value = '00:00';
            callMessages.value = [];
            startCallTimer();
        };

        const startVideoCall = () => {
            callType.value = 'video';
            callActive.value = true;
            callTimer.value = '00:00';
            callMessages.value = [];
            startCallTimer();
        };

        const endCall = async () => {
            callActive.value = false;
            stopCallTimer();
            if (!soulLinkActiveChat.value) return;
            const isVideo = callType.value === 'video';
            const diaryEntry = await createCallDiaryEntry();
            pushMessageToActiveChat({
                id: Date.now(),
                sender: 'ai',
                messageType: 'call',
                callType: callType.value,
                isCallMessage: true,
                callIcon: isVideo ? '🎥' : '📞',
                text: `${isVideo ? '视频通话' : '语音通话'}结束 ${callTimer.value || ''}`.trim(),
                callDiaryId: diaryEntry?.id || null,
                callDiaryHint: diaryEntry ? '正在总结...（可点开查看）' : '',
                timestamp: Date.now()
            });
            syncActiveChatState();
            persistActiveChat();
        };

        const sendCallMessage = () => {
            if (!callInput.value.trim()) return;
            if (!activeProfile.value) {
                callMessages.value.push({
                    sender: 'ai',
                    text: '未检测到任何 API 配置，请先在 Console 中创建并选择一个配置。',
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                });
                return;
            }
            const profile = activeProfile.value;
            const endpoint = (profile.endpoint || '').trim();
            const key = (profile.key || '').trim();
            if (!endpoint || !key) {
                callMessages.value.push({
                    sender: 'ai',
                    text: '当前配置缺少 API 地址或密钥，请在 Console 中补全后重试。',
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                });
                return;
            }
            callMessages.value.push({
                sender: 'user',
                text: callInput.value,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            });
            const input = callInput.value;
            callInput.value = '';
            isCallAiTyping.value = true;
            const isGroupChat = soulLinkActiveChatType.value === 'group';
            const activeGroup = isGroupChat ? activeGroupChat.value : null;
            const char = isGroupChat ? null : characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
            const history = isGroupChat ? (activeGroup.history || []) : (soulLinkMessages.value[soulLinkActiveChat.value] || []);
            const messagesPayload = [];
            let availableStickers = [];
            stickerPacks.value.forEach(pack => {
                pack.stickers.forEach(s => {
                    availableStickers.push(s);
                });
            });
            let systemPrompt = '';
            if (isGroupChat) {
                const groupName = activeGroup && activeGroup.name ? activeGroup.name : '群聊';
                const members = activeGroup && Array.isArray(activeGroup.members) && activeGroup.members.length > 0 ? activeGroup.members : ['成员A', '成员B', '成员C'];
                systemPrompt = `你正在群聊【${groupName}】中与用户语音/视频通话。\n\n`;
                systemPrompt += `# 群成员\n${members.join('、')}\n\n`;
                systemPrompt += `# 行为规则\n1. 回复要简短自然，像真实通话一样。\n2. 每次回复只扮演其中一名群成员。\n3. 回复格式为「成员名: 内容」。\n4. 可以用口语和表情。\n\n`;
                if (availableStickers.length > 0) {
                    systemPrompt += `你可以发送表情包来表达情感！使用格式：[表情名] 或 [表情:表情名]。可用的表情包有：${availableStickers.map(s => s.name).join('、')}。当情绪适合时自然地发送表情包。\n\n`;
                }
                systemPrompt += `现在请开始回复。`;
            } else if (char && char.persona) {
                const charName = char.name || '角色';
                systemPrompt = `你正在通过 SoulLink 与对方进行语音/视频通话。\n\n`;
                systemPrompt += `你的名字是【${charName}】。\n`;
                systemPrompt += `${char.persona}\n\n`;
                systemPrompt += `1. 像真实的人类那样自然通话。\n2. 每次回复保持简短（1-2句话）。\n3. 使用符合${charName}性格的语气、口头禅和口语表达。\n4. 不要暴露你是AI。\n`;
                if (availableStickers.length > 0) {
                    systemPrompt += `\n你可以发送表情包来表达情感！使用格式：[表情名] 或 [表情:表情名]。可用的表情包有：${availableStickers.map(s => s.name).join('、')}。当情绪适合时自然地发送表情包，有时可以连续发多个表情包来表达强烈情感。`;
                }
            } else {
                systemPrompt = '你正在和朋友语音/视频通话。请自然、简短地对话，每次1-2句话。';
                if (availableStickers.length > 0) {
                    systemPrompt += `\n你可以发送表情包来表达情感！使用格式：[表情名] 或 [表情:表情名]。可用的表情包有：${availableStickers.map(s => s.name).join('、')}。当情绪适合时自然地发送表情包，有时可以连续发多个表情包来表达强烈情感。`;
                }
            }
            messagesPayload.push({ role: 'system', content: systemPrompt });
            history.forEach(m => {
                if (m.isSystem || m.isHidden) return;
                const ctx = buildSoulLinkReplyContext(m);
                const raw = ctx.text || (m.text || '');
                if (m.sender === 'user') {
                    messagesPayload.push({ role: 'user', content: raw });
                } else if (m.sender === 'ai') {
                    messagesPayload.push({ role: 'assistant', content: raw });
                }
            });
            callMessages.value.forEach(m => {
                if (!m || !m.text) return;
                if (m.sender === 'user') {
                    messagesPayload.push({ role: 'user', content: m.text });
                } else {
                    messagesPayload.push({ role: 'assistant', content: m.text });
                }
            });
            messagesPayload.push({ role: 'user', content: input });
            const modelId = profile.model || (availableModels.value[0] && availableModels.value[0].id) || '';
            fetch(endpoint.replace(/\/+$/, '') + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: messagesPayload,
                    temperature: profile.temperature ?? 0.7,
                    stream: false
                })
            }).then(async response => {
                if (!response.ok) throw new Error(`接口返回状态码 ${response.status}`);
                const data = await response.json();
                let reply = '';
                if (data && Array.isArray(data.choices) && data.choices.length > 0) {
                    const msg = data.choices[0].message || data.choices[0].delta;
                    if (msg && msg.content) reply = msg.content;
                }
                if (!reply && data && data.message && data.message.content) {
                    reply = data.message.content;
                }
                if (!reply) reply = '...';
                isCallAiTyping.value = false;
                callMessages.value.push({
                    sender: 'ai',
                    text: reply.trim(),
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                });
            }).catch(error => {
                isCallAiTyping.value = false;
                callMessages.value.push({
                    sender: 'ai',
                    text: `请求模型时出错：${error.message}`,
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                });
            });
        };

        // --- Virtual Camera Logic ---
        const openVirtualCamera = () => {
            showVirtualCamera.value = true;
            virtualImageDesc.value = '';
            showImageSubmenu.value = false;
        };

        const sendVirtualImage = () => {
            if (!virtualImageDesc.value.trim()) return;
            
            // 使用与朋友圈相同的处理方式：生成mock颜色图片
            const mockColors = ['#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', '#f8b195', '#f67280', '#c06c84', '#6c5b7b', '#355c7d'];
            const randomColor = mockColors[Math.floor(Math.random() * mockColors.length)];
            const mockUrl = `mock:${randomColor}`;
            
            const msg = {
                id: Date.now(),
                sender: 'user',
                messageType: 'image',
                imageUrl: mockUrl,
                text: virtualImageDesc.value,
                imageDescription: virtualImageDesc.value, // 存储完整的图片描述
                timestamp: Date.now()
            };
            
            pushMessageToActiveChat(msg);
            showVirtualCamera.value = false;
            // 不自动触发AI回复：由用户在输入框为空时手动点发送触发
        };

        // --- Chat Settings Logic ---
        const toggleChatSettings = () => {
            console.log('toggleChatSettings called, current value:', showChatSettings.value);
            showChatSettings.value = !showChatSettings.value;
            console.log('toggleChatSettings new value:', showChatSettings.value);
            
            if (showChatSettings.value) {
                loadChatMenuSettings();
                loadChatSummaryState();
            }
            // 不调用closeAllPanels，因为它会关闭聊天设置面板
        };

        // 切换线下模式
        const toggleOfflineMode = () => {
            if (!soulLinkActiveChat.value) return;

            // 自动存档当前对话
            let currentMessages = [];
            let chatType = soulLinkActiveChatType.value;
            let chatId = soulLinkActiveChat.value;
            let chatName = '';
            
            if (chatType === 'group' && activeGroupChat.value) {
                currentMessages = activeGroupChat.value.history || [];
                chatName = activeGroupChat.value.name;
            } else {
                currentMessages = soulLinkMessages.value[chatId] || [];
                const char = characters.value.find(c => String(c.id) === String(chatId));
                chatName = char ? (char.nickname || char.name) : '未知';
            }
            
            if (currentMessages.length > 0) {
                // 创建自动存档
                const modeText = isOfflineMode.value ? '线下' : '线上';
                const archiveNameText = `自动存档 - ${modeText}模式 - ${new Date().toLocaleString()}`;
                
                const archive = {
                    id: `archive_${Date.now()}`,
                    chatType: chatType,
                    chatId: chatId,
                    chatName: chatName,
                    name: archiveNameText,
                    description: `从${modeText}模式切换时自动创建的存档`,
                    timestamp: Date.now(),
                    messages: [...currentMessages],
                    preview: currentMessages[currentMessages.length - 1]?.text || '无消息'
                };

                // 添加到存档列表
                archivedChats.value.push(archive);
                saveArchivedChats();

                // 清空当前对话
                if (chatType === 'group' && activeGroupChat.value) {
                    activeGroupChat.value.history = [];
                    activeGroupChat.value.lastMessage = '';
                    activeGroupChat.value.lastTime = '';
                    saveSoulLinkGroups();
                } else {
                    soulLinkMessages.value[chatId] = [];
                    saveSoulLinkMessages();
                }
            }

            if (isOfflineMode.value) {
                // 退出线下模式，进入线上模式
                setChatOfflineMode(soulLinkActiveChat.value, false);
                // 发送线上模式开场白
                sendOnlineModeGreeting();
            } else {
                // 进入线下模式，显示开场白选择
                setChatOfflineMode(soulLinkActiveChat.value, true);
                prepareGreetingsForSelection();
                showGreetingSelect.value = true;
            }
        };

        // 准备开场白选择
        const prepareGreetingsForSelection = () => {
            if (!soulLinkActiveChat.value) return;

            const activeCharacter = characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
            if (activeCharacter) {
                // 如果没有 openingLines 但有 openingLine，进行迁移
                if (activeCharacter.openingLine && (!activeCharacter.openingLines || activeCharacter.openingLines.length === 0)) {
                    activeCharacter.openingLines = activeCharacter.openingLine.split('\n\n').filter(l => l.trim());
                }
                
                if (activeCharacter.openingLines && activeCharacter.openingLines.length > 0) {
                    availableGreetings.value = activeCharacter.openingLines.map((greeting, index) => {
                        const title = greeting.length < 50 ? greeting : `开场白 ${index + 1}`;
                        return { title, content: greeting };
                    });
                } else {
                    availableGreetings.value = [];
                }
            } else {
                availableGreetings.value = [];
            }
        };

        // 选择开场白
        const selectGreeting = (greeting) => {
            if (!greeting) return;

            // 进入线下模式
            setChatOfflineMode(soulLinkActiveChat.value, true);
            selectedGreeting.value = greeting;
            
            // 创建开场白消息
            const newMsg = {
                id: Date.now(),
                sender: 'ai',
                text: greeting.content,
                timestamp: Date.now(),
                isOfflineMode: true
            };
            
            // 添加到聊天记录
            pushMessageToActiveChat(newMsg);
            
            // 关闭选择模态框
            showGreetingSelect.value = false;
        };

        // 添加默认开场白
        const addDefaultGreeting = () => {
            if (!editingCharacter.value) return;

            const defaultGreetings = [
                "你好！很高兴见到你，有什么我可以帮助你的吗？",
                "嗨！今天过得怎么样？",
                "哈喽！欢迎来到我的空间，有什么想聊的吗？",
                "你好呀！最近在忙什么呢？",
                "嗨，见到你真开心！今天有什么好玩的事吗？"
            ];

            const randomGreeting = defaultGreetings[Math.floor(Math.random() * defaultGreetings.length)];
            
            if (editingCharacter.value.openingLine) {
                editingCharacter.value.openingLine += '\n\n' + randomGreeting;
            } else {
                editingCharacter.value.openingLine = randomGreeting;
            }
        };

        // 添加自定义开场白
        const addCustomGreeting = () => {
            if (!editingCharacter.value) return;

            const customGreeting = prompt('请输入自定义开场白：');
            if (customGreeting && customGreeting.trim()) {
                if (editingCharacter.value.openingLine) {
                    editingCharacter.value.openingLine += '\n\n' + customGreeting.trim();
                } else {
                    editingCharacter.value.openingLine = customGreeting.trim();
                }
            }
        };

        // 发送线下模式开场白
        const sendOfflineModeGreeting = () => {
            if (!soulLinkActiveChat.value) return;

            const activeCharacter = characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
            if (activeCharacter && activeCharacter.openingLine) {
                // 解析开场白，支持多个开场白
                const greetings = activeCharacter.openingLine.split('\n\n').filter(g => g.trim());
                if (greetings.length > 0) {
                    // 随机选择一个开场白
                    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
                    
                    // 创建开场白消息
                    const newMsg = {
                        id: Date.now(),
                        sender: 'ai',
                        text: randomGreeting,
                        timestamp: Date.now(),
                        isOfflineMode: true
                    };
                    
                    // 添加到聊天记录
                    pushMessageToActiveChat(newMsg);
                }
            }
        };

        // Chat Background Logic
        const updateChatBackground = () => {
            // 这里可以实现聊天背景的更新逻辑
            // 例如，根据选择的背景样式，更新body或聊天容器的背景
            const chatContainer = document.querySelector('.wechat-messages');
            if (!chatContainer) return;

            switch (chatBackgroundStyle.value) {
                case 'default':
                    chatContainer.style.background = 'transparent';
                    break;
                case 'gradient':
                    chatContainer.style.background = `linear-gradient(135deg, ${gradientStartColor.value} 0%, ${gradientEndColor.value} 100%)`;
                    break;
                case 'color':
                    chatContainer.style.background = solidBackgroundColor.value;
                    break;
                case 'image':
                    if (chatBackgroundImage.value) {
                        chatContainer.style.background = `url(${chatBackgroundImage.value}) center/cover no-repeat`;
                    } else {
                        chatContainer.style.background = 'transparent';
                    }
                    break;
                default:
                    chatContainer.style.background = 'transparent';
            }
        };

        const selectBackgroundImage = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = handleBackgroundImageSelect;
            input.click();
        };

        const handleBackgroundImageSelect = (event) => {
            const file = event.target.files[0];
            if (!file || !file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                compressAvatarImage(e.target.result, 'background', (compressedDataUrl) => {
                    chatBackgroundImage.value = compressedDataUrl;
                    chatBackgroundImageInput.value = compressedDataUrl;
                    chatBackgroundStyle.value = 'image';
                    updateChatBackground();
                });
            };
            reader.readAsDataURL(file);
        };
        const applyBackgroundImageLink = () => {
            const url = String(chatBackgroundImageInput.value || '').trim();
            if (!url) return;
            chatBackgroundImage.value = url;
            chatBackgroundStyle.value = 'image';
            updateChatBackground();
        };
        const clearBackgroundImage = () => {
            chatBackgroundImage.value = '';
            chatBackgroundImageInput.value = '';
            if (chatBackgroundStyle.value === 'image') {
                chatBackgroundStyle.value = 'default';
            }
            updateChatBackground();
        };
        const chatSettingsPanelStyle = computed(() => {
            if (chatBackgroundStyle.value === 'image' && chatBackgroundImage.value) {
                return {
                    background: `linear-gradient(rgba(255,255,255,.88), rgba(250,250,248,.92)), url(${chatBackgroundImage.value}) center/cover no-repeat`
                };
            }
            if (chatBackgroundStyle.value === 'gradient') {
                return {
                    background: `linear-gradient(135deg, ${gradientStartColor.value} 0%, ${gradientEndColor.value} 100%)`
                };
            }
            if (chatBackgroundStyle.value === 'color') {
                return { background: solidBackgroundColor.value };
            }
            return {};
        });
        
        // --- Location Panel Logic ---
        const locationNameOptions = ['家', '咖啡馆', '学校', '公司', '公园', '图书馆', '便利店', '地铁站', '健身房'];

        const normalizeLocationName = (value) => {
            if (!value) return '';
            let text = value.trim();
            text = text.split('\n')[0].trim();
            text = text.replace(/^[「『"“”'《》]+|[」』"“”'《》]+$/g, '');
            text = text.replace(/^[\-\*\d\.\s]+/g, '').trim();
            return text;
        };

        const pickLocationName = () => {
            return locationNameOptions[Math.floor(Math.random() * locationNameOptions.length)];
        };

        const buildDistanceText = (userLoc, aiLoc) => {
            if (userLoc && aiLoc) {
                if (userLoc.includes(aiLoc) || aiLoc.includes(userLoc)) {
                    return '很近';
                }
            }
            const pool = ['约500米', '约1.2公里', '约3公里', '约6公里', '约12公里'];
            return pool[Math.floor(Math.random() * pool.length)];
        };

        const userAddress = ref('');
        const aiAddress = ref('');
        const calculatedDistance = ref('');

        const openLocationPanel = async () => {
            showAttachmentPanel.value = false;
            showLocationPanel.value = true;
            if (!userAddress.value) {
                userAddress.value = locationUser.value || '当前位置';
            }
            aiAddress.value = '定位中...';
            calculatedDistance.value = '计算中...';
            await inferAiLocationForPanel();
        };

        const closeLocationPanel = () => {
            showLocationPanel.value = false;
        };

        const sendLocation = () => {
            const userLoc = userAddress.value.trim();
            const aiLoc = (aiAddress.value || '').trim();
            const distance = (calculatedDistance.value || '').trim() || buildDistanceText(userLoc, aiLoc);
            locationUser.value = userLoc;
            locationTarget.value = aiLoc;
            locationDistance.value = distance;
            locationTrajectoryPoints.value = [];
            sendLocationMessage();
            closeLocationPanel();
        };

        const sendLocationMessage = () => {
            if (!soulLinkActiveChat.value) return;
            const userLocation = userAddress.value.trim();
            const aiLocation = aiAddress.value.trim();
            const distance = calculatedDistance.value.trim();
            if (!distance || (!userLocation && !aiLocation)) {
                alert('“我的位置”和“Ta的位置”至少填写一个，且“相距”为必填项。');
                return;
            }
            const trajectoryPoints = locationTrajectoryPoints.value
                .map(name => name.trim())
                .filter(Boolean)
                .map(name => ({ name }));
            let contentString = '[SEND_LOCATION]';
            if (userLocation) contentString += ` 我的位置: ${userLocation}`;
            if (aiLocation) contentString += ` | Ta的位置: ${aiLocation}`;
            contentString += ` | 相距: ${distance}`;
            if (trajectoryPoints.length > 0) {
                const trajectoryText = trajectoryPoints.map(p => p.name).join(', ');
                contentString += ` | 途经点: ${trajectoryText}`;
            }
            const newMsg = {
                id: Date.now(),
                sender: 'user',
                messageType: 'location',
                userLocation,
                aiLocation,
                address: userLocation,
                locationName: userLocation || aiLocation,
                distance,
                trajectoryPoints,
                text: contentString,
                timestamp: Date.now(),
                isReplied: false
            };
            if (soulLinkActiveChatType.value === 'group') {
                newMsg.senderName = '我';
            }
            pushMessageToActiveChat(newMsg);
            return newMsg;
        };

        const inferAiLocationForPanel = async () => {
            if (!soulLinkActiveChat.value) return;
            if (!activeProfile.value) {
                const fallbackLoc = pickLocationName();
                aiAddress.value = fallbackLoc;
                calculatedDistance.value = buildDistanceText(userAddress.value, fallbackLoc);
                return;
            }
            const profile = activeProfile.value;
            const endpoint = (profile.endpoint || '').trim();
            const key = (profile.key || '').trim();
            if (!endpoint || !key) {
                const fallbackLoc = pickLocationName();
                aiAddress.value = fallbackLoc;
                calculatedDistance.value = buildDistanceText(userAddress.value, fallbackLoc);
                return;
            }
            const isGroupChat = soulLinkActiveChatType.value === 'group';
            const activeGroup = isGroupChat ? activeGroupChat.value : null;
            const char = isGroupChat ? null : characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
            const history = getActiveChatHistory();
            let modelId = profile.model;
            if (!modelId && availableModels.value.length > 0) {
                modelId = availableModels.value[0].id;
                profile.model = modelId;
            }
            const locationPrompt = '[系统：请根据我们之前的聊天记录，分析“我(AI)”现在应该在什么虚拟地点？如果未知，就随机生成一个符合设定的地点（如：家、咖啡馆、学校）。请只输出地点名称。]';
            const systemPrompt = buildBaseSystemPrompt(isGroupChat, activeGroup, char, history) + '\n' + locationPrompt;
            const messagesPayload = [{ role: 'system', content: systemPrompt }];
            const historyForPrompt = history.filter(m => m && !m.isSystem && !m.isHidden).slice(-18);
            historyForPrompt.forEach(m => {
                const ctx = buildSoulLinkReplyContext(m);
                const raw = ctx.text || (m.text || '');
                if (m.sender === 'user') {
                    messagesPayload.push({ role: 'user', content: raw });
                } else if (m.sender === 'ai') {
                    messagesPayload.push({ role: 'assistant', content: raw });
                }
            });
            messagesPayload.push({ role: 'user', content: '请只输出地点名称。' });
            try {
                const response = await fetch(endpoint.replace(/\/+$/, '') + '/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key}`
                    },
                    body: JSON.stringify({
                        model: modelId || '',
                        messages: messagesPayload,
                        temperature: 0.6,
                        stream: false
                    })
                });
                if (!response.ok) {
                    throw new Error(`接口返回状态码 ${response.status}`);
                }
                const data = await response.json();
                let reply = '';
                if (data && Array.isArray(data.choices) && data.choices.length > 0) {
                    const msg = data.choices[0].message || data.choices[0].delta;
                    if (msg && msg.content) reply = msg.content;
                }
                if (!reply && data && data.message && data.message.content) {
                    reply = data.message.content;
                }
                const locationName = normalizeLocationName(reply) || pickLocationName();
                aiAddress.value = locationName;
                calculatedDistance.value = buildDistanceText(userAddress.value, locationName);
            } catch (error) {
                const fallbackLoc = pickLocationName();
                aiAddress.value = fallbackLoc;
                calculatedDistance.value = buildDistanceText(userAddress.value, fallbackLoc);
            }
        };

        const sendLocationAiReaction = async (userLoc, aiLoc, distance, relatedMsg) => {
            if (!soulLinkActiveChat.value) return;
            const fallbackReply = () => {
                const text = aiLoc
                    ? `我在${aiLoc}，你在${userLoc || '那边'}，${distance || '距离有点远'}，我看看怎么过去。`
                    : `收到你的定位了，${distance || '我估计还需要一会儿'}。`;
                pushMessageToActiveChat({
                    id: Date.now() + 1,
                    sender: 'ai',
                    text,
                    timestamp: Date.now()
                });
                if (relatedMsg) {
                    relatedMsg.isReplied = true;
                    syncActiveChatState();
                    persistActiveChat();
                }
            };
            if (!activeProfile.value) {
                fallbackReply();
                return;
            }
            const profile = activeProfile.value;
            const endpoint = (profile.endpoint || '').trim();
            const key = (profile.key || '').trim();
            if (!endpoint || !key) {
                fallbackReply();
                return;
            }
            const isGroupChat = soulLinkActiveChatType.value === 'group';
            const activeGroup = isGroupChat ? activeGroupChat.value : null;
            const char = isGroupChat ? null : characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
            const history = getActiveChatHistory();
            let modelId = profile.model;
            if (!modelId && availableModels.value.length > 0) {
                modelId = availableModels.value[0].id;
                profile.model = modelId;
            }
            const prompt = `[系统：用户向你发送了定位，位置在“${userLoc || '未知位置'}”。请根据你当前的位置（${aiLoc || '未知位置'}）来判断你们的距离（${distance || '未知'}）并做出反应。]`;
            const systemPrompt = buildBaseSystemPrompt(isGroupChat, activeGroup, char, history) + '\n' + prompt;
            const messagesPayload = [{ role: 'system', content: systemPrompt }];
            const historyForPrompt = history.filter(m => m && !m.isSystem && !m.isHidden).slice(-18);
            historyForPrompt.forEach(m => {
                const ctx = buildSoulLinkReplyContext(m);
                const raw = ctx.text || (m.text || '');
                if (m.sender === 'user') {
                    messagesPayload.push({ role: 'user', content: raw });
                } else if (m.sender === 'ai') {
                    messagesPayload.push({ role: 'assistant', content: raw });
                }
            });
            messagesPayload.push({
                role: 'user',
                content: `用户位置：${userLoc || '未知'}；你的位置：${aiLoc || '未知'}；距离：${distance || '未知'}`
            });
            isAiTyping.value = true;
            scrollToBottom();
            try {
                const response = await fetch(endpoint.replace(/\/+$/, '') + '/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key}`
                    },
                    body: JSON.stringify({
                        model: modelId || '',
                        messages: messagesPayload,
                        temperature: profile.temperature ?? 0.7,
                        stream: false
                    })
                });
                if (!response.ok) {
                    throw new Error(`接口返回状态码 ${response.status}`);
                }
                const data = await response.json();
                let reply = '';
                if (data && Array.isArray(data.choices) && data.choices.length > 0) {
                    const msg = data.choices[0].message || data.choices[0].delta;
                    if (msg && msg.content) reply = msg.content;
                }
                if (!reply && data && data.message && data.message.content) {
                    reply = data.message.content;
                }
                if (!reply) {
                    reply = '收到你的定位了。';
                }
                isAiTyping.value = false;
                pushMessageToActiveChat({
                    id: Date.now() + 2,
                    sender: 'ai',
                    text: reply.trim(),
                    timestamp: Date.now()
                });
                if (relatedMsg) {
                    relatedMsg.isReplied = true;
                    syncActiveChatState();
                    persistActiveChat();
                }
            } catch (error) {
                isAiTyping.value = false;
                fallbackReply();
            }
        };

        const buildBaseSystemPrompt = (isGroupChat, activeGroup, char, history) => {
            let availableStickers = [];
            stickerPacks.value.forEach(pack => {
                pack.stickers.forEach(s => {
                    availableStickers.push(s);
                });
            });
            let systemPrompt = '';
            if (isGroupChat) {
                const groupName = activeGroup && activeGroup.name ? activeGroup.name : '群聊';
                const members = activeGroup && Array.isArray(activeGroup.members) && activeGroup.members.length > 0 ? activeGroup.members : ['成员A', '成员B', '成员C'];
                systemPrompt = `你正在群聊【${groupName}】中与用户对话。\n\n`;
                systemPrompt += `# 群成员\n${members.join('、')}\n\n`;
                systemPrompt += `# 行为规则\n1. 回复要简短自然，像真实群聊一样。\n2. 每次回复只扮演其中一名群成员。\n3. 回复格式为「成员名: 内容」。\n4. 可以用emoji和口语表达。\n\n`;
                if (availableStickers.length > 0) {
                    systemPrompt += `你可以发送表情包来表达情感！使用格式：[表情名] 或 [表情:表情名]。可用的表情包有：${availableStickers.map(s => s.name).join('、')}。当情绪适合时自然地发送表情包。\n\n`;
                }
                systemPrompt += `现在请开始回复。`;
            } else if (char && char.persona) {
                const charName = char.name || '角色';
                systemPrompt = `你正在通过 SoulLink 和朋友聊天。\n\n`;
                systemPrompt += `你的名字是【${charName}】。\n`;
                systemPrompt += `${char.persona}\n\n`;
                systemPrompt += `1. 像真实的人类那样自然地聊天。\n2. 每次回复保持简短（1-3句话）。\n3. 使用符合${charName}性格的语气、口头禅和表情。\n4. 绝对不要暴露你是AI。你就是${charName}本人。\n`;
                if (availableStickers.length > 0) {
                    systemPrompt += `\n你可以发送表情包来表达情感！使用格式：[表情名] 或 [表情:表情名]。可用的表情包有：${availableStickers.map(s => s.name).join('、')}。当情绪适合时自然地发送表情包，有时可以连续发多个表情包来表达强烈情感。`;
                }
                if (char.openingLine && history.length === 1) {
                    systemPrompt += `这是你们的第一次对话。你可以主动打招呼：\n${char.openingLine}\n\n`;
                }
            } else {
                systemPrompt = '你是一个友好的朋友，正在通过SoulLink聊天。请像真人一样自然、简短地对话，每次1-3句话即可。可以用emoji和口语化表达。';
                if (availableStickers.length > 0) {
                    systemPrompt += `\n你可以发送表情包来表达情感！使用格式：[表情名] 或 [表情:表情名]。可用的表情包有：${availableStickers.map(s => s.name).join('、')}。当情绪适合时自然地发送表情包，有时可以连续发多个表情包来表达强烈情感。`;
                }
            }
            return systemPrompt;
        };

        // --- Transfer Panel Logic ---
        const openTransferPanel = () => {
            console.log('openTransferPanel called');
            showAttachmentPanel.value = false;
            showTransferPanel.value = true;
            console.log('showTransferPanel value:', showTransferPanel.value);
            transferAmount.value = 0;
            transferNote.value = '';
        };

        const closeTransferPanel = () => {
            showTransferPanel.value = false;
        };

        const sendTransfer = () => {
            sendTransferMessage();
            closeTransferPanel();
        };

        const sendTransferMessage = () => {
            if (!soulLinkActiveChat.value || transferAmount.value <= 0) return;

            const newMsg = {
                id: Date.now(),
                sender: 'user',
                messageType: 'transfer',
                amount: transferAmount.value,
                transferAmount: transferAmount.value.toFixed(2),
                note: transferNote.value.trim(),
                transferStatus: 'pending',
                text: `转账 ¥${transferAmount.value.toFixed(2)}`,
                timestamp: Date.now(),
                isReplied: false
            };
            if (soulLinkActiveChatType.value === 'group') {
                newMsg.senderName = '我';
            }
            pushMessageToActiveChat(newMsg);
            showTransferPanel.value = false;
        };

        // --- Transfer Action (Accept/Reject) ---
        const handleTransferAction = (msg, action) => {
            if (action === 'accept') {
                msg.transferStatus = 'accepted';
                addConsoleLog(`转账已接受: ¥${msg.amount}`, 'success');
                pushMessageToActiveChat({
                    id: Date.now(),
                    sender: 'system',
                    text: `已收款 ¥${msg.amount.toFixed(2)}`,
                    timestamp: Date.now(),
                    isSystem: true,
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                });
            } else if (action === 'reject') {
                msg.transferStatus = 'rejected';
                addConsoleLog(`转账已拒绝: ¥${msg.amount}`, 'info');
                pushMessageToActiveChat({
                    id: Date.now(),
                    sender: 'system',
                    text: `已退回转账 ¥${msg.amount.toFixed(2)}`,
                    timestamp: Date.now(),
                    isSystem: true,
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                });
            }
            syncActiveChatState();
            persistActiveChat();
        };

        // --- Trajectory Points Management ---
        const addTrajectoryPoint = () => {
            if (locationTrajectoryPoints.value.length >= 3) return;
            locationTrajectoryPoints.value.push('');
        };

        const removeTrajectoryPoint = (index) => {
            locationTrajectoryPoints.value.splice(index, 1);
        };

        // --- Input & Panel Logic ---
        const moodValue = ref('HAPPY');
        const bedTiming = ref('22:00');
        
        // AI状态色调过渡
        const aiStateColors = {
            'HAPPY': 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            'SAD': 'linear-gradient(180deg, #2d1a2e 0%, #2a162e 50%, #230f60 100%)',
            'ANGRY': 'linear-gradient(180deg, #2e1a1a 0%, #2e1616 50%, #600f0f 100%)',
            'CALM': 'linear-gradient(180deg, #1a2e1a 0%, #162e16 50%, #0f600f 100%)'
        };
        
        // 监听情绪变化，更新背景色调
        watch(moodValue, (newMood) => {
            const body = document.body;
            const color = aiStateColors[newMood] || aiStateColors['HAPPY'];
            body.style.background = color;
        });

        const toggleEmojiPanel = () => {
            showEmojiPanel.value = !showEmojiPanel.value;
            if (showEmojiPanel.value) {
                showAttachmentPanel.value = false;
                showImageSubmenu.value = false;
                showLocationPanel.value = false;
                showTransferPanel.value = false;
            }
        };

        const toggleAttachmentPanel = () => {
            showAttachmentPanel.value = !showAttachmentPanel.value;
            if (showAttachmentPanel.value) {
                showEmojiPanel.value = false;
                showImageSubmenu.value = false;
                showLocationPanel.value = false;
                showTransferPanel.value = false;
            }
        };

        const handleRetry = async () => {
            showAttachmentPanel.value = false;
            
            const isGroupChat = soulLinkActiveChatType.value === 'group';
            const history = isGroupChat 
                ? (activeGroupChat.value?.history || []) 
                : (soulLinkMessages.value[soulLinkActiveChat.value] || []);
            
            if (history.length === 0) {
                alert('没有可重试的消息');
                return;
            }
            
            const lastAiMsgIndex = history.map((m, i) => ({...m, index: i})).reverse().find(m => m.sender === 'ai');
            if (!lastAiMsgIndex) {
                alert('没有可重试的AI回复');
                return;
            }
            
            history.splice(lastAiMsgIndex.index, 1);
            
            pushMessageToActiveChat({
                id: Date.now(),
                sender: 'system',
                text: '正在重新生成回复...',
                timestamp: Date.now(),
                isSystem: true
            });
            
            await triggerSoulLinkAiReply();
        };

        const handleTakeaway = () => {
            showAttachmentPanel.value = false;
            
            const restaurants = [
                { name: '麦当劳', food: '巨无霸套餐', price: 38 },
                { name: '肯德基', food: '香辣鸡腿堡套餐', price: 35 },
                { name: '必胜客', food: '至尊披萨', price: 89 },
                { name: '星巴克', food: '拿铁咖啡', price: 32 },
                { name: '海底捞', food: '番茄锅底', price: 128 }
            ];
            
            const randomRestaurant = restaurants[Math.floor(Math.random() * restaurants.length)];
            
            const msg = {
                id: Date.now(),
                sender: 'user',
                messageType: 'takeaway',
                text: `外卖：${randomRestaurant.food}`,
                restaurant: randomRestaurant.name,
                food: randomRestaurant.food,
                price: randomRestaurant.price,
                timestamp: Date.now(),
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            
            pushMessageToActiveChat(msg);
            saveSoulLinkMessages();
        };

        const handleVote = () => {
            showAttachmentPanel.value = false;
            showVotePanel.value = true;
        };

        const openTaobaoPanel = () => {
            showAttachmentPanel.value = false;
            showTaobaoPanel.value = true;
        };

        const searchTaobaoProducts = async () => {
            const searchTerm = taobaoSearchTerm.value.trim();
            if (!searchTerm) return;

            if (!activeProfile.value) {
                alert('请先配置API！');
                return;
            }

            taobaoLoading.value = true;
            taobaoProducts.value = [];

            const profile = activeProfile.value;
            const endpoint = (profile.endpoint || '').trim();
            const key = (profile.key || '').trim();
            let modelId = profile.model;

            if (!endpoint || !key) {
                alert('当前配置缺少 API 地址或密钥');
                taobaoLoading.value = false;
                return;
            }

            const prompt = `
# 任务
你是一个虚拟购物App的搜索引擎。请根据用户提供的【搜索关键词】，为Ta创作一个包含6-8件相关商品的列表。

# 用户搜索的关键词:
"${searchTerm}"

# 核心规则
1.  **高度相关**: 所有商品都必须与用户的搜索关键词 "${searchTerm}" 紧密相关。
2.  **商品多样性**: 即使是同一个主题，也要尽量展示不同款式、功能或角度的商品。
3.  **格式铁律**: 你的回复【必须且只能】是一个严格的JSON数组，每个对象代表一件商品，【必须】包含以下字段:
    -   \`"name"\`: 商品名称
    -   \`"price"\`: 价格 (数字，人民币)
    -   \`"category"\`: 商品分类
    -   \`"imagePrompt"\`: 一个详细的、用于文生图AI的【英文提示词】，描述这张商品的【产品展示图 (product shot)】。风格要求【干净、简约、纯色或渐变背景 (clean, minimalist, solid color background)】。

# JSON输出格式示例:
[
  {
    "name": "赛博朋克风发光数据线",
    "price": 69.9,
    "category": "数码配件",
    "imagePrompt": "A glowing cyberpunk style data cable, product shot, on a dark tech background, neon lights, high detail"
  }
]`;

            try {
                const messagesForApi = [{ role: 'user', content: prompt }];

                const response = await fetch(endpoint.replace(/\/+$/, '') + '/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key}`
                    },
                    body: JSON.stringify({
                        model: modelId || '',
                        messages: messagesForApi,
                        temperature: 0.8
                    })
                });

                if (!response.ok) throw new Error('API请求失败');

                const data = await response.json();
                const rawContent = data.choices[0].message.content;
                const cleanedContent = rawContent.replace(/^```json\s*|```$/g, '').trim();
                const newProducts = JSON.parse(cleanedContent);

                if (Array.isArray(newProducts) && newProducts.length > 0) {
                    taobaoProducts.value = newProducts.map(p => ({ ...p, imageUrl: null }));
                    // 异步加载图片
                    newProducts.forEach((product, index) => {
                        loadTaobaoProductImage(product, index);
                    });
                } else {
                    throw new Error('AI没有找到相关的商品。');
                }
            } catch (error) {
                console.error('AI搜索商品失败:', error);
                alert('搜索失败: ' + error.message);
            } finally {
                taobaoLoading.value = false;
            }
        };

        const loadTaobaoProductImage = async (product, index) => {
            try {
                // 优化提示词，添加更多细节以提高生成成功率
                const enhancedPrompt = `${product.imagePrompt}, professional product photography, high quality, 4k, detailed, studio lighting, centered composition, no text, no watermark`;
                
                // 使用 Pollinations AI 生成图片，添加 seed 参数确保稳定性
                const seed = Math.floor(Math.random() * 1000000);
                const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=400&height=400&nologo=true&seed=${seed}&negative_prompt=text,watermark,signature,blurry,low quality`;
                
                // 预加载图片
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    if (taobaoProducts.value[index]) {
                        taobaoProducts.value[index].imageUrl = imageUrl;
                    }
                };
                img.onerror = () => {
                    console.error(`商品 ${product.name} 图片加载失败，尝试备用方案`);
                    // 备用方案：使用占位图
                    setTimeout(() => {
                        if (taobaoProducts.value[index] && !taobaoProducts.value[index].imageUrl) {
                            taobaoProducts.value[index].imageUrl = `https://placehold.co/400x400/F5F5F5/666666?text=${encodeURIComponent(product.name.slice(0, 4))}`;
                        }
                    }, 3000);
                };
                img.src = imageUrl;
                
                // 设置超时，如果5秒内图片没有加载成功，使用占位图
                setTimeout(() => {
                    if (taobaoProducts.value[index] && !taobaoProducts.value[index].imageUrl) {
                        taobaoProducts.value[index].imageUrl = `https://placehold.co/400x400/F5F5F5/666666?text=${encodeURIComponent(product.name.slice(0, 4))}`;
                    }
                }, 8000);
            } catch (error) {
                console.error('生成图片失败:', error);
                if (taobaoProducts.value[index]) {
                    taobaoProducts.value[index].imageUrl = `https://placehold.co/400x400/F5F5F5/666666?text=${encodeURIComponent(product.name.slice(0, 4))}`;
                }
            }
        };

        const buyTaobaoProduct = (product) => {
            // 发送订单消息到聊天
            const orderMsg = {
                id: Date.now(),
                sender: 'user',
                messageType: 'order',
                platform: '购物',
                item: product.name,
                price: product.price,
                status: '已下单',
                eta: '2-3天',
                timestamp: Date.now(),
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            
            pushMessageToActiveChat(orderMsg);
            saveSoulLinkMessages();
            showTaobaoPanel.value = false;
            scrollToBottom();
        };

        const helpBuyTaobaoProduct = (product) => {
            // 发送帮买请求卡片消息到聊天
            const helpBuyMsg = {
                id: Date.now(),
                sender: 'user',
                messageType: 'helpBuy',
                item: product.name,
                price: product.price,
                isPurchased: false,
                timestamp: Date.now(),
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            
            pushMessageToActiveChat(helpBuyMsg);
            saveSoulLinkMessages();
            showTaobaoPanel.value = false;
            scrollToBottom();
        };

        const addVoteOption = () => {
            if (voteOptions.value.length < 6) {
                voteOptions.value.push('');
            }
        };

        const confirmHelpBuy = (msg) => {
            if (msg.sender !== 'ai' || msg.isPurchased) return;
            
            // 更新卡片状态
            msg.isPurchased = true;
            saveSoulLinkMessages();
            
            // 发送确认消息
            const confirmMsg = {
                id: Date.now(),
                sender: 'user',
                messageType: 'text',
                text: `好的，我帮你买了「${msg.item}」！`,
                timestamp: Date.now(),
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            
            pushMessageToActiveChat(confirmMsg);
            saveSoulLinkMessages();
        };

        const removeVoteOption = (index) => {
            if (voteOptions.value.length > 2) {
                voteOptions.value.splice(index, 1);
            }
        };

        const createVote = () => {
            const validOptions = voteOptions.value.filter(opt => opt.trim());
            if (!voteQuestion.value.trim() || validOptions.length < 2) {
                alert('请输入投票问题和至少两个选项');
                return;
            }

            const msg = {
                id: Date.now(),
                sender: 'user',
                messageType: 'vote',
                text: `投票：${voteQuestion.value}`,
                question: voteQuestion.value,
                options: validOptions.map(opt => ({ text: opt, votes: 0 })),
                totalVotes: 0,
                hasVoted: false,
                timestamp: Date.now(),
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };

            pushMessageToActiveChat(msg);
            saveSoulLinkMessages();

            voteQuestion.value = '';
            voteOptions.value = ['', ''];
            showVotePanel.value = false;
        };

        const castVoteInChat = (msgIndex, optionIndex) => {
            const isGroupChat = soulLinkActiveChatType.value === 'group';
            const history = isGroupChat 
                ? (activeGroupChat.value?.history || []) 
                : (soulLinkMessages.value[soulLinkActiveChat.value] || []);

            const msg = history[msgIndex];
            if (msg && msg.messageType === 'vote' && !msg.hasVoted) {
                msg.options[optionIndex].votes++;
                msg.totalVotes++;
                msg.hasVoted = true;
                saveSoulLinkMessages();
            }
        };

        const handleShare = () => {
            showAttachmentPanel.value = false;
            showSharePanel.value = true;
        };

        const sendShareCard = () => {
            if (!shareSource.value || !shareContent.value.trim()) {
                alert('请选择来源并填写分享内容');
                return;
            }
            
            const shareMsg = {
                id: Date.now(),
                sender: 'user',
                messageType: 'share',
                source: shareSource.value,
                content: shareContent.value.trim(),
                timestamp: Date.now(),
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            
            pushMessageToActiveChat(shareMsg);
            saveSoulLinkMessages();
            
            // 重置并关闭面板
            shareSource.value = '';
            shareContent.value = '';
            showSharePanel.value = false;
            scrollToBottom();
            
            // 不自动触发AI回复：由用户在输入框为空时手动点发送触发
        };

        const handleTarot = () => {
            showAttachmentPanel.value = false;
            
            const tarotCards = [
                { name: '愚者', meaning: '新的开始、冒险、纯真', emoji: '🃏' },
                { name: '魔术师', meaning: '创造力、自信、行动力', emoji: '🎩' },
                { name: '女祭司', meaning: '直觉、神秘、智慧', emoji: '🌙' },
                { name: '女皇', meaning: '丰盛、母性、创造力', emoji: '👑' },
                { name: '皇帝', meaning: '权威、结构、领导力', emoji: '🏛️' },
                { name: '恋人', meaning: '爱情、选择、和谐', emoji: '💕' },
                { name: '战车', meaning: '意志力、胜利、决心', emoji: '⚔️' },
                { name: '力量', meaning: '勇气、耐心、内在力量', emoji: '🦁' },
                { name: '隐士', meaning: '内省、寻求真理、智慧', emoji: '🏔️' },
                { name: '命运之轮', meaning: '变化、机遇、命运', emoji: '🎡' },
                { name: '正义', meaning: '公平、真相、因果', emoji: '⚖️' },
                { name: '倒吊人', meaning: '牺牲、等待、新视角', emoji: '🙃' },
                { name: '死神', meaning: '结束、转变、重生', emoji: '🦋' },
                { name: '节制', meaning: '平衡、耐心、调和', emoji: '🌈' },
                { name: '恶魔', meaning: '束缚、诱惑、物质', emoji: '😈' },
                { name: '塔', meaning: '突变、觉醒、重建', emoji: '🗼' },
                { name: '星星', meaning: '希望、灵感、平静', emoji: '⭐' },
                { name: '月亮', meaning: '幻觉、恐惧、潜意识', emoji: '🌕' },
                { name: '太阳', meaning: '成功、活力、快乐', emoji: '☀️' },
                { name: '审判', meaning: '觉醒、重生、召唤', emoji: '📯' },
                { name: '世界', meaning: '完成、整合、成就', emoji: '🌍' }
            ];
            
            const randomCard = tarotCards[Math.floor(Math.random() * tarotCards.length)];
            const isReversed = Math.random() > 0.5;
            
            const msg = {
                id: Date.now(),
                sender: 'user',
                messageType: 'tarot',
                text: `塔罗占卜：${randomCard.emoji} ${randomCard.name}${isReversed ? '（逆位）' : ''}`,
                cardName: randomCard.name,
                cardMeaning: randomCard.meaning,
                isReversed: isReversed,
                emoji: randomCard.emoji,
                timestamp: Date.now(),
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            
            pushMessageToActiveChat(msg);
            saveSoulLinkMessages();
        };

        const handlePet = () => {
            showAttachmentPanel.value = false;
            
            if (!soulLinkPet.value) {
                soulLinkPet.value = {
                    name: '小可爱',
                    mood: 100,
                    hunger: 100,
                    level: 1,
                    exp: 0
                };
            }
            
            const actions = [
                { action: 'feed', text: '喂食', emoji: '🍖' },
                { action: 'play', text: '玩耍', emoji: '🎾' },
                { action: 'pet', text: '抚摸', emoji: '🤚' }
            ];
            
            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            
            let moodChange = 0;
            let hungerChange = 0;
            let expGain = 0;
            
            switch(randomAction.action) {
                case 'feed':
                    hungerChange = 20;
                    moodChange = 5;
                    expGain = 5;
                    break;
                case 'play':
                    moodChange = 15;
                    hungerChange = -5;
                    expGain = 10;
                    break;
                case 'pet':
                    moodChange = 10;
                    expGain = 3;
                    break;
            }
            
            soulLinkPet.value.mood = Math.min(100, Math.max(0, soulLinkPet.value.mood + moodChange));
            soulLinkPet.value.hunger = Math.min(100, Math.max(0, soulLinkPet.value.hunger + hungerChange));
            soulLinkPet.value.exp += expGain;
            
            if (soulLinkPet.value.exp >= soulLinkPet.value.level * 100) {
                soulLinkPet.value.level += 1;
                soulLinkPet.value.exp = 0;
            }
            
            const msg = {
                id: Date.now(),
                sender: 'user',
                messageType: 'pet',
                text: `与${soulLinkPet.value.name}${randomAction.text}${randomAction.emoji}`,
                petName: soulLinkPet.value.name,
                action: randomAction.text,
                emoji: randomAction.emoji,
                mood: soulLinkPet.value.mood,
                hunger: soulLinkPet.value.hunger,
                level: soulLinkPet.value.level,
                timestamp: Date.now(),
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            
            pushMessageToActiveChat(msg);
            saveSoulLinkMessages();
        };
        
        const startVoiceInput = () => {
            showAttachmentPanel.value = false;
            showVoiceInputPanel.value = true;
            voiceInputText.value = '';
        };

        const sendVoiceMessage = () => {
            if (!voiceInputText.value.trim()) return;
            
            const text = voiceInputText.value.trim();
            const duration = Math.max(1, Math.ceil(text.length / 3)); // 根据文字长度计算语音时长
            
            const msg = {
                id: Date.now(),
                sender: 'user',
                messageType: 'voice',
                voiceText: text,
                voiceDuration: duration,
                text: '[语音]',
                timestamp: Date.now(),
                isReplied: false,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            if (soulLinkActiveChatType.value === 'group') {
                msg.senderName = '我';
            }
            
            pushMessageToActiveChat(msg);
            saveSoulLinkMessages();
            
            voiceInputText.value = '';
            showVoiceInputPanel.value = false;
            scrollToBottom();
            
            // 不自动触发AI回复：由用户在输入框为空时手动点发送触发
        };

        const closeVoiceInputPanel = () => {
            showVoiceInputPanel.value = false;
            voiceInputText.value = '';
        };

        const toggleVoicePlayback = (msg) => {
            // 切换翻译显示
            const willShowTranslation = !msg.showTranslation;
            
            // 先收起其他所有语音消息
            const messages = soulLinkActiveChatType.value === 'group' 
                ? (activeGroupChat.value?.history || [])
                : (soulLinkMessages.value[soulLinkActiveChat.value] || []);
            
            messages.forEach(m => {
                if (m.messageType === 'voice' && m.id !== msg.id) {
                    m.showTranslation = false;
                    m.isPlaying = false;
                    if (m.playbackTimer) {
                        clearTimeout(m.playbackTimer);
                        m.playbackTimer = null;
                    }
                }
            });
            
            msg.showTranslation = willShowTranslation;
            
            // 如果收起翻译，停止播放
            if (!willShowTranslation && msg.isPlaying) {
                msg.isPlaying = false;
                if (msg.playbackTimer) {
                    clearTimeout(msg.playbackTimer);
                    msg.playbackTimer = null;
                }
                return;
            }
            
            // 如果展开翻译且未播放，开始播放
            if (willShowTranslation && !msg.isPlaying) {
                msg.isPlaying = true;
                
                // 模拟播放时长（根据语音时长，默认3秒）
                const duration = Math.max(3, (msg.voiceDuration || 3)) * 1000;
                msg.playbackTimer = setTimeout(() => {
                    msg.isPlaying = false;
                }, duration);
            }
        };

        const closeAllVoiceMessages = () => {
            const messages = soulLinkActiveChatType.value === 'group' 
                ? (activeGroupChat.value?.history || [])
                : (soulLinkMessages.value[soulLinkActiveChat.value] || []);
            
            messages.forEach(m => {
                if (m.messageType === 'voice') {
                    m.showTranslation = false;
                    m.isPlaying = false;
                    if (m.playbackTimer) {
                        clearTimeout(m.playbackTimer);
                        m.playbackTimer = null;
                    }
                }
            });
        };

        const onChatBackgroundClick = () => {
            closeAllVoiceMessages();
        };

        const handleOrder = () => {
            showAttachmentPanel.value = false;
            
            const orders = [
                { platform: '美团外卖', item: '黄焖鸡米饭', price: 28, status: '配送中', eta: '15分钟' },
                { platform: '饿了么', item: '麻辣香锅', price: 45, status: '商家接单', eta: '30分钟' },
                { platform: '京东', item: '无线蓝牙耳机', price: 199, status: '已发货', eta: '明天送达' },
                { platform: '购物', item: '手机壳', price: 25, status: '运输中', eta: '2天后' },
                { platform: '拼多多', item: '零食大礼包', price: 39, status: '已签收', eta: '已送达' }
            ];
            
            const randomOrder = orders[Math.floor(Math.random() * orders.length)];
            
            const msg = {
                id: Date.now(),
                sender: 'user',
                messageType: 'order',
                text: `订单：${randomOrder.platform} - ${randomOrder.item}`,
                platform: randomOrder.platform,
                item: randomOrder.item,
                price: randomOrder.price,
                status: randomOrder.status,
                eta: randomOrder.eta,
                timestamp: Date.now(),
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            
            pushMessageToActiveChat(msg);
            saveSoulLinkMessages();
        };

        const onSendOrCall = () => {
            if (soulLinkInput.value && soulLinkInput.value.trim()) {
                sendSoulLinkMessage();
            } else {
                lastUserActiveAt.value = Date.now();
                triggerSoulLinkAiReply();
            }
            maybeRoleSendsFriendRequest();
        };
        
        const selectFromAlbum = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        compressAvatarImage(e.target.result, 'chatImage', (compressedDataUrl) => {
                            const msg = {
                                id: Date.now(),
                                sender: 'user',
                                messageType: 'image',
                                imageUrl: compressedDataUrl,
                                text: '图片',
                                timestamp: Date.now(),
                                isReplied: false,
                                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                            };
                            if (soulLinkActiveChatType.value === 'group') {
                                msg.senderName = '我';
                            }

                            pushMessageToActiveChat(msg);
                            saveSoulLinkMessages();
                            
                            scrollToBottom();
                        });
                    };
                    reader.readAsDataURL(file);
                }
                showPhotoSelectPanel.value = false;
            };
            input.click();
        };

        const sendTextImage = () => {
            if (!textImageText.value.trim()) return;
            
            const msg = {
                id: Date.now(),
                sender: 'user',
                messageType: 'textImage',
                textImageText: textImageText.value,
                textImageBgColor: textImageBgColor.value,
                text: '文字图',
                timestamp: Date.now(),
                isReplied: false,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
            if (soulLinkActiveChatType.value === 'group') {
                msg.senderName = '我';
            }
            pushMessageToActiveChat(msg);
            saveSoulLinkMessages();
            
            textImageText.value = '';
            showTextImagePanel.value = false;
            scrollToBottom();
        };

        const insertEmoji = (emoji) => {
            soulLinkInput.value += emoji;
            showEmojiPanel.value = false;
        };

        const parseStickerImport = (text) => {
            const stickers = [];
            const lines = text.split('\n');
            lines.forEach(line => {
                // 支持两种格式：
                // 1) 名称: https://xxx（或全角冒号）
                // 2) 名称 https://xxx（用空格分隔）
                const match = line.match(/^(.+?)(?:[:：]|\s+)\s*[`']?(https?:\/\/[^\s`']+)[`']?/);
                if (match) {
                    stickers.push({
                        name: match[1].trim(),
                        url: match[2].trim()
                    });
                }
            });
            return stickers;
        };

        // 自动加载你给的“基础表情包.txt”
        // 目的：避免把 500+ 行内置进 script.js，同时也让“删除空包 + 重新导入”一次完成。
        const ensureBaseStickerPackLoaded = async () => {
            const basePackName = '基础表情包';
            // 用当前页面 URL 做相对定位，避免 script.js 放子目录导致路径不对
            const basePackFileUrl = new URL('基础表情包.txt', window.location.href).toString();

            const existingIdx = (stickerPacks.value || []).findIndex(p => p?.name === basePackName);
            const existing = existingIdx >= 0 ? stickerPacks.value[existingIdx] : null;
            const hasNonEmpty = !!existing?.stickers?.length;
            if (hasNonEmpty) return;

            try {
                const res = await fetch(basePackFileUrl);
                if (!res.ok) return;
                const rawText = await res.text();
                const stickers = parseStickerImport(rawText);
                if (!stickers || stickers.length === 0) return;

                if (existingIdx >= 0) {
                    stickerPacks.value[existingIdx] = {
                        ...existing,
                        stickers
                    };
                } else {
                    stickerPacks.value.push({
                        id: `builtin-${basePackName}`,
                        name: basePackName,
                        stickers
                    });
                }

                try {
                    localStorage.setItem('stickerPacks', JSON.stringify(stickerPacks.value));
                } catch (e) {
                    // ignore
                }
            } catch (e) {
                // 如果你是 file:// 打开，fetch 可能失败；这时控制台会有提示
                console.warn('Failed to load 基础表情包.txt:', e);
            }
        };

        ensureBaseStickerPackLoaded();

        // 将内置表情包合并进 stickerPacks（保留用户本地导入，不重复添加同名系列）
        const mergeBuiltinStickerPacks = () => {
            if (!builtinStickerPackTexts || typeof builtinStickerPackTexts !== 'object') return;
            let changed = false;
            // 跳过你指定要删除的“空包”，避免后续合并又把它们加回来
            const skipBuiltinPackNames = new Set(['狗皇帝', '呆猫八条', '绿萝卜', '这狗']);
            const packIndexByName = new Map(
                (stickerPacks.value || [])
                    .map((p, idx) => [p?.name, idx])
                    .filter(([name]) => !!name)
            );

            for (const [packName, rawText] of Object.entries(builtinStickerPackTexts)) {
                if (skipBuiltinPackNames.has(packName)) continue;
                const stickers = parseStickerImport(rawText);
                if (!stickers || stickers.length === 0) continue;

                if (packIndexByName.has(packName)) {
                    // 如果之前用户导入过但解析结果为空，则补齐 stickers
                    const idx = packIndexByName.get(packName);
                    const existing = stickerPacks.value[idx];
                    const isEmpty = !existing?.stickers || existing.stickers.length === 0;
                    if (isEmpty) {
                        stickerPacks.value[idx] = {
                            ...existing,
                            stickers
                        };
                        changed = true;
                    }
                    continue;
                }

                stickerPacks.value.push({
                    id: `builtin-${packName}`,
                    name: packName,
                    stickers
                });
                packIndexByName.set(packName, stickerPacks.value.length - 1);
                changed = true;
            }
            if (changed) {
                try {
                    localStorage.setItem('stickerPacks', JSON.stringify(stickerPacks.value));
                } catch (e) {
                    // ignore: localStorage 可能在某些环境下不可用
                }
            }
        };

        mergeBuiltinStickerPacks();

        const importStickerPack = () => {
            if (!stickerImportText.value.trim() || !newPackName.value.trim()) return;
            
            const stickers = parseStickerImport(stickerImportText.value);
            if (stickers.length === 0) {
                alert('未识别到有效的表情图格式');
                return;
            }
            
            stickerPacks.value.push({
                id: Date.now(),
                name: newPackName.value.trim(),
                stickers: stickers
            });
            
            localStorage.setItem('stickerPacks', JSON.stringify(stickerPacks.value));
            stickerImportText.value = '';
            newPackName.value = '';
            showStickerImportPanel.value = false;
        };

        const sendSticker = (sticker) => {
            const msg = {
                id: Date.now(),
                sender: 'user',
                messageType: 'sticker',
                stickerUrl: sticker.url,
                stickerName: sticker.name,
                text: `[${sticker.name}]`,
                timestamp: Date.now(),
                isReplied: false,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };

            pushMessageToActiveChat(msg);
            saveSoulLinkMessages();
            showEmojiPanel.value = false;
            scrollToBottom();
        };

        const deleteStickerPack = (packId) => {
            stickerPacks.value = stickerPacks.value.filter(p => p.id !== packId);
            localStorage.setItem('stickerPacks', JSON.stringify(stickerPacks.value));
            if (activeStickerTab.value === packId) {
                activeStickerTab.value = stickerPacks.value.length > 0 ? stickerPacks.value[0].id : 'favorite';
            }
        };

        const isFavorite = (sticker) => {
            return favoriteStickers.value.some(s => s.url === sticker.url);
        };

        const toggleFavorite = (sticker) => {
            const index = favoriteStickers.value.findIndex(s => s.url === sticker.url);
            if (index > -1) {
                favoriteStickers.value.splice(index, 1);
            } else {
                favoriteStickers.value.push(sticker);
            }
            localStorage.setItem('favoriteStickers', JSON.stringify(favoriteStickers.value));
        };

        const counterWithSticker = (msg) => {
            let allStickers = [];
            stickerPacks.value.forEach(pack => {
                pack.stickers.forEach(s => {
                    allStickers.push(s);
                });
            });
            
            if (allStickers.length === 0) {
                return;
            }
            
            const randomIndex = Math.floor(Math.random() * allStickers.length);
            const randomSticker = allStickers[randomIndex];
            
            pushMessageToActiveChat({
                id: Date.now(),
                sender: 'user',
                messageType: 'sticker',
                stickerUrl: randomSticker.url,
                stickerName: randomSticker.name,
                text: `[${randomSticker.name}]`,
                timestamp: Date.now()
            });
            
            showEmojiPanel.value = false;
            showAttachmentPanel.value = false;
        };

        const removeFavorite = (sticker) => {
            const index = favoriteStickers.value.findIndex(s => s.url === sticker.url);
            if (index > -1) {
                favoriteStickers.value.splice(index, 1);
                localStorage.setItem('favoriteStickers', JSON.stringify(favoriteStickers.value));
            }
        };

        const onStickerTouchStart = (event, sticker) => {
            stickerTouchTimer = setTimeout(() => {
                toggleFavorite(sticker);
            }, 500);
        };

        const onStickerTouchEnd = () => {
            if (stickerTouchTimer) {
                clearTimeout(stickerTouchTimer);
                stickerTouchTimer = null;
            }
        };

        const pushMessageToActiveChat = (msg) => {
            if (!soulLinkActiveChat.value) return;
            if (msg && msg.sender === 'user') {
                // 用户发言时，暂停角色主动计时，避免在“忙着回消息”时插话
                clearActiveMessageTimer();
            }
            if (msg && msg.sender === 'ai' && msg.isSystem !== true && typeof msg.isReadByUser === 'undefined') {
                const isViewingThisChatNow = openedApp.value === 'chat' && !!soulLinkActiveChat.value;
                msg.isReadByUser = !!isViewingThisChatNow;
            }
            if (soulLinkActiveChatType.value === 'group') {
                const group = activeGroupChat.value;
                if (!group) return;
                if (!Array.isArray(group.history)) group.history = [];
                group.history.push(msg);
                group.lastMessage = msg.text || '';
                group.lastTime = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            } else {
                if (!soulLinkMessages.value[soulLinkActiveChat.value]) {
                    soulLinkMessages.value[soulLinkActiveChat.value] = [];
                }
                soulLinkMessages.value[soulLinkActiveChat.value].push(msg);
            }
            maybeAutoTranslateSoulLinkAiMessage(msg, soulLinkActiveChatType.value, soulLinkActiveChat.value);
            scrollToBottom();
        };

        /** 将消息推送到指定聊天（即使用户已退出，也会保存到对应聊天） */
        const pushMessageToTargetChat = (chatId, chatType, msg) => {
            if (!chatId) return;
            if (msg && msg.sender === 'ai' && msg.isSystem !== true && typeof msg.isReadByUser === 'undefined') {
                const isViewingThisChat = openedApp.value === 'chat' && String(soulLinkActiveChat.value) === String(chatId) && soulLinkActiveChatType.value === chatType;
                msg.isReadByUser = !!isViewingThisChat;
            }
            if (chatType === 'group') {
                const group = soulLinkGroups.value.find(g => String(g.id) === String(chatId));
                if (!group) return;
                if (!Array.isArray(group.history)) group.history = [];
                group.history.push(msg);
                group.lastMessage = msg.text || '';
                group.lastTime = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                saveSoulLinkGroups();
            } else {
                if (!soulLinkMessages.value[chatId]) soulLinkMessages.value[chatId] = [];
                soulLinkMessages.value[chatId].push(msg);
                saveSoulLinkMessages();
            }
            maybeAutoTranslateSoulLinkAiMessage(msg, chatType, chatId);
            if (openedApp.value === 'chat' && String(soulLinkActiveChat.value) === String(chatId) && soulLinkActiveChatType.value === chatType) {
                scrollToBottom();
            }
        };
        
        watch(openedApp, (newVal) => {
            if (newVal === 'feed') {
                feed.loadPosts();
            }
            if (newVal === 'chat') {
                markActiveChatAiMessagesRead();
                if (timeSenseEnabled.value && !messageTimeIntervalId) {
                    messageTimeIntervalId = setInterval(() => {
                        messageTimeNow.value = Date.now();
                    }, 30000);
                }
            } else {
                if (messageTimeIntervalId) {
                    clearInterval(messageTimeIntervalId);
                    messageTimeIntervalId = null;
                }
            }
        });
        console.log('setup end');
        
        // 初始化字体函数（在returnObject之前定义）
        const initFonts = () => {
            console.log('初始化字体...');
            // 加载默认字体
            const savedFont = localStorage.getItem('lockFont');
            const savedGlobalFont = localStorage.getItem('globalFont');
            let defaultFont;
            let defaultGlobalFont;
            
            if (savedFont) {
                defaultFont = fonts.value.find(font => font.fontFamily === savedFont);
            }
            
            if (!defaultFont) {
                defaultFont = fonts.value[0];
                selectedFont.value = defaultFont.fontFamily;
            }
            
            if (defaultFont) {
                loadFontCSS(defaultFont);
                console.log('默认字体:', defaultFont.fontFamily);
            }

            // 加载默认全局字体（不覆盖锁屏）
            if (savedGlobalFont) {
                defaultGlobalFont = fonts.value.find(font => font.fontFamily === savedGlobalFont);
            }

            if (!defaultGlobalFont) {
                defaultGlobalFont = fonts.value[0];
                globalSelectedFont.value = defaultGlobalFont.fontFamily;
            }
            // 默认不自动加载全局字体，避免主界面因字体差异发生布局形变。
            // 只有用户在“主题设置”里手动选择全局字体后，才会应用。
            console.log('初始化完成');
        };
        
        const updateHomePagePosition = () => {
            const homePagesElement = document.querySelector('.home-pages');
            if (homePagesElement) {
                homePagesElement.style.transform = `translateX(-${currentPage.value * 100}%)`;
            }
        };
        
        const returnObject = {
            // SoulLink / Chat
            soulLinkTab, soulLinkActiveChat, soulLinkActiveChatType, soulLinkInput, soulLinkReplyTarget,
            soulLinkMessages, soulLinkGroups, activeGroupChat, activeChatMessages, currentChatMessages, recentChats,
            formatLastMsgTime, getLastMessage, formatMessageDate, closeAllPanels,
            getUnrepliedCountForChar, getUnrepliedCountForGroup, totalUnrepliedCount, formatUnreadCount,
            emojiList, previewImage, formatTime, onInputChange, onEnterPress,
            contextMenu, editingMessageId,
            startSoulLinkChat, openSoulLinkGroupChat, exitSoulLinkChat, sendSoulLinkMessage,
            switchSoulLinkTab, onMessageContextMenu, onMessageTouchStart, onMessageTouchMove, onMessageTouchEnd, handleContextAction, closeContextMenu,
            getCharacterName, getCharacterAvatar, getActiveChatName, getActiveChatAvatar, getActiveChatStatus,
            getLocationLabel,
            soulLinkPet,
            saveSoulLinkMessages,
            showEmojiPanel,
            pixelEmojis,
            insertEmoji,
            stickerPacks, showStickerImportPanel, stickerImportText, newPackName, parseStickerImport, importStickerPack, sendSticker, deleteStickerPack,
            favoriteStickers, activeStickerTab, isFavorite, toggleFavorite, removeFavorite, onStickerTouchStart, onStickerTouchEnd, counterWithSticker,
            isAiTyping,
            focusedOsMessageId,
            isOfflineMode,
            novelMode,
            showGreetingSelect,
            availableGreetings,
            // Chat别名（兼容新UI）
            chatActiveChat: soulLinkActiveChat,
            chatInput: soulLinkInput,
            chatCharacters: characters,
            isChatAiTyping: isAiTyping,
            startChat: startSoulLinkChat,
            sendChatMessage: onSendOrCall,
            goBackInChat: exitSoulLinkChat,

            // Core
            currentTime, currentDate, currentDay, currentMonth, currentMonthEn, currentDayOfMonth, randomHexCode, openedApp, currentScreen, deviceBatteryText, deviceSignalText,
            isHomeScreenVisible,
            liveWaveBars, liveOnlineCount, liveRooms, activeLiveRoomId, activeLiveRoom, activeLiveHost, activeLiveMessages, liveElapsedText, liveMicMuted, liveInput,
            liveOnMic, liveUserDisguiseNick, liveHallWallpaperUrl,
            liveSettingsOpen,
            liveSettingsDraftBgmUrl, liveSettingsDraftUserMask, liveSettingsDraftHallWallpaperUrl,
            liveBgmSearchTerm, liveBgmSearchResults, liveBgmSearchLoading, liveBgmCurrentSong,
            liveBgmLyricsLoading, liveBgmCurrentLyricText,
            liveBgmLyricPrevText, liveBgmLyricNextText,
            activeLiveHostSpeech, activeLiveHostSpeechHistory, liveHostHistoryOpen, liveHostSpeechLoading, liveBgmPlaying, liveBgmAudioRef, LIVE_BGM_URL,
            switchLiveRoom, toggleLiveMic, toggleLiveOnMic, rollDisguiseNick, sendLiveGift, sendLiveMessage, toggleLiveBgm, onLiveBgmPlay, onLiveBgmPause,
            toggleLiveHostHistory, closeLiveHostHistory, formatLiveHostHistoryTime,
            openLiveSettings, closeLiveSettings, saveLiveSettings,
            onLiveHallWallpaperUpload,
            searchLiveBgmSongs, playLiveBgmFromSong, playLiveBgmByQuery, onLiveBgmEnded,
            // Music Player
            isPlaying, togglePlayPause, playPrevious, playNext,
            // New Features (Chat Menu, Call, Virtual Camera, Panels)
            userIdentity, userRelation, userPronoun, userAvatar, uploadUserAvatar, resetUserAvatar,
            bubbleStyle, customBubbleCSS, bubbleAvatarMode, bubbleShapeMode, bubbleColorPreset,
            setBubbleStyle, applyBubbleStyle, applyCustomCSS,
            saveAndCloseSettings, confirmChatMenu, showArchiveDialog, showArchivedChats, archiveName, archiveDescription, archivedChats, filteredArchivedChats, sortedArchivedChats, archiveCurrentChat, restoreArchivedChat, deleteArchivedChat,
            saveChatMenuSettings, loadChatMenuSettings, clearChatHistory, exportChatHistory, showCreateGroupDialog, newGroupName, newGroupMembers, createNewGroup, newGroupAvatar, selectedGroupMembers, groupAvatarInput, triggerGroupAvatarUpload, handleGroupAvatarUpload, toggleGroupMember, showAddMemberDialog, selectedAddMembers, getAvailableCharactersForAdd, toggleAddMember, addMembersToGroup, removeGroupMember, addMemberMode, customMemberAvatar, customMemberName, customMemberPersona, customMemberAvatarInput, triggerCustomMemberAvatarUpload, handleCustomMemberAvatarUpload, addCustomMember, showRenameGroupDialog, newGroupNameInput, tempGroupAvatar, renameGroupAvatarInput, triggerRenameGroupAvatarUpload, handleRenameGroupAvatarUpload, renameGroup, shakeCharacter, shakeGroupMember,
            callActive, callType, callTimer, callInput, callMessages, isCallAiTyping, isMuted, toggleMute, isSpeakerOn, toggleSpeaker, isCameraOn, toggleCamera, currentChatName, currentChatAvatar,
            showCallInput, callInputText, toggleCallInput, sendCallText, openCallDiary, closeCallDiaryModal, showCallDiaryModal, selectedCallDiary, callDiaryTitle,
            videoSelfPosition, isVideoAvatarSwapped, startDragVideoSelf, swapVideoAvatars,
            startVoiceCall, startVideoCall, endCall, sendCallMessage,
            showVirtualCamera, virtualImageDesc, openVirtualCamera, sendVirtualImage,
            openLocationPanel, closeLocationPanel, sendLocation,
            openTransferPanel, closeTransferPanel, sendTransfer, transferAmount, transferNote,
            // Chat Settings
            showChatSettings, toggleChatSettings,
            // Foreign translation / time sense
            soulLinkForeignTranslationEnabled,
            soulLinkForeignPrimaryLang, soulLinkForeignSecondaryLang,
            soulLinkForeignTranslationPrimaryLabel, soulLinkForeignTranslationSecondaryLabel,
            soulLinkForeignTranslationDirectionText,
            // Timezone system
            timeZoneSystemEnabled, userTimeZone, roleTimeZone,
            // Active message / social system
            activeMessageEnabled, activeMessageFrequencyMin, activeReplyDelaySec,
            socialUserBlockedRole, socialRoleBlockedUser, socialPendingRoleRequest,
            toggleUserBlockRole, sendFriendRequestToRole, acceptRoleFriendRequest, rejectRoleFriendRequest,
            // Chat summary (token saver)
            chatSummaryEnabled,
            chatSummaryEveryN,
            chatSummaryGenerating,
            chatSummaryBoard,
            manualSummarizeChat,
            clearChatSummaryBoard,
            timeSenseEnabled, messageTimeNow, shouldShowTimeDivider,
            chatBackgroundStyle, gradientStartColor, gradientEndColor, solidBackgroundColor, chatBackgroundImage, chatBackgroundImageInput,
            updateChatBackground, selectBackgroundImage, handleBackgroundImageSelect, applyBackgroundImageLink, clearBackgroundImage, chatSettingsPanelStyle,
            // Profile & Navigation
            profileChar, viewCharacterProfile, goBackInSoulLink, showProfile, showChatMenu,
            // New Input Logic
            moodValue, bedTiming, showLocationPanel, showTransferPanel,
            showAttachmentPanel, showImageSubmenu, toggleEmojiPanel, toggleAttachmentPanel, toggleOfflineMode, selectGreeting, addDefaultGreeting, addCustomGreeting,
            startVoiceInput, onSendOrCall, selectFromAlbum, sendTextImage,
            handleRetry, handleTakeaway, handleVote, handleShare, handleTarot, handlePet, handleOrder,
            showVotePanel, voteQuestion, voteOptions, addVoteOption, removeVoteOption, createVote, castVoteInChat,
            showTaobaoPanel, taobaoSearchTerm, taobaoProducts, taobaoLoading, openTaobaoPanel, searchTaobaoProducts, buyTaobaoProduct, helpBuyTaobaoProduct, confirmHelpBuy,
            showSharePanel, shareSource, shareContent, shareSources, sendShareCard,
            showPhotoSelectPanel, showTextImagePanel, textImageText, textImageBgColor, textImageColors,
            showVoiceInputPanel, voiceInputText, sendVoiceMessage, closeVoiceInputPanel, toggleVoicePlayback, onChatBackgroundClick,
            enableManualImageCrop, showImageCropModal, imageCropSource, imageCropRect, imageCropScale, imageCropCanvasAspect,
            closeImageCropModal, confirmImageCrop, onImageCropDragStart, onImageCropScaleChange,
            // App Launch
            openApp, closeApp, goBack, openGame, joinGame, startGameSession, castVote, endDay, closeGame, getAppIcon,
            // Console
            profiles, activeProfileId, activeProfile, apiStatus,
            availableModels, fetchingModels, consoleLogs,
            saveProfiles, createNewProfile, deleteActiveProfile, setActiveProfile, deleteProfile,
            onProfileSelect, fetchModels, clearConsole,
            backupExporting, backupImporting, backupLastSavedHint, soulosBackupFileInput,
            downloadSoulOsBackup, downloadSegmentedBackup, saveSoulOsBackupSlotOnly, restoreSoulOsFromSlot, triggerSoulOsBackupImport, handleSoulOsBackupImport,
            showSegmentedImportPanel, segmentedImportPackage, segmentedImportAppSelections, segmentedImportRoleSelections, closeSegmentedImportPanel, confirmSegmentedImport,
            // Workshop App
            activeWorkshopTab,
            switchWorkshopTab,
            characters,
            addNewCharacter,
            editingCharacter,
            fileInput,
            characterImportInput,
            presetImportInput,
            showBatchDeleteDialog, batchDeleteType, batchDeleteSelections, batchDeleteTitle, batchDeleteItems, isAllBatchSelected, selectedBatchCount,
            openBatchDelete, closeBatchDelete, selectAllBatchItems, clearBatchSelection, invertBatchSelection, confirmBatchDelete,
            handleAvatarFile,
            newTagInput,
            addTag,
            removeTag,
            addKv,
            removeKv,
            triggerAvatarUpload,
            triggerCharacterImport,
            handleCharacterImport,
            triggerPresetImport,
            handlePresetImport,
            deleteCharacter,
            openDossier,
            saveDossier,
            cancelDossier,
            addOpeningLine,
            removeOpeningLine,
            // Worldbook & Presets
            worldbooks, editingWorldbook, activeWorldbookEntryId, activeWorldbookEntry, showWorldbookImport, importWorldbookName, importFile, importMode, openWorldbookImport, handleFileUpload, importWorldbook,
            addNewWorldbook, deleteWorldbook, deleteCurrentWorldbook, openWorldbookEditor, saveWorldbookEditor, cancelWorldbookEditor,
            addWorldbookEntry, deleteWorldbookEntry,
            swipedWorldbookId, toggleSwipeWorldbook,
            presets, editingPreset,
            addNewPreset, deletePreset, deleteCurrentPreset, openPresetEditor, savePresetEditor, cancelPresetEditor,
            swipedPresetId, toggleSwipePreset,
            expandedEntryIds, toggleEntryExpand, isEntryExpanded,
            // Location & Transfer
            userAddress, aiAddress, calculatedDistance,
            addTrajectoryPoint, removeTrajectoryPoint,
            handleTransferAction,
            // 主题：

            // feed
            feed,
            // mate
            mate,
            // peek
            peek,
            // read
            read,
            // notice
            notice,
            // games
            games,
            playerName,
            currentPlayerName,
            // 新游戏相关状态
            showRules,
            chatExpanded,
            wheelRotation,
            playerMessage,
            playerWord,
            aiPlayers,
            chatMessages,
            undercoverMessages,
            todHistory,
            // 新游戏相关函数
            toggleSound,
            playRPS,
            spinTOD,
            nextTOD,
            startUNOGame,
            drawCard,
            playCard,
            sayUNO,
            startLudoGame,
            rollDice,
            toggleAutoPlay,
            sendMessage,
            showRenameGroupDialog,
            renameGroup,
            contextMenu,
            onMessageContextMenu,
            closeContextMenu,
            // touch events
            pullDistance, handleTouchStart, handleTouchMove, handleTouchEnd,
            // home page
            currentPage, homePages, updateHomePagePosition, prevPage, nextPage,
            // photo widget
            photoWidgetDate, photoWidgetText, photoWidgetPhotos, changePhotoWidgetImage, editPhotoWidgetText,
            // sticker widget
            stickerWidgetUrl, changeStickerWidgetImage,
            // character related
            showCharacterSelector, selectedCharacter, selectCharacter,
            // call widget
            callWidgetSubtitle, showCallWidgetEdit, callWidgetEditInput, editCallWidgetSubtitle, saveCallWidgetSubtitle, closeCallWidgetEdit,
            currentDate, currentTime, weekdays, currentWeekday,
            // capsule texts
            capsuleTexts, showCapsuleEditDialog, currentCapsuleType, capsuleEditText, editCapsuleText, closeCapsuleEditDialog, saveCapsuleText,
            dashboardTexts, showDashboardEditDialog, currentDashboardTextType, dashboardEditText, editDashboardText, closeDashboardEditDialog, saveDashboardText,

            // photo widget edit dialog
            showPhotoWidgetEditDialog, photoWidgetEditText1, photoWidgetEditText2, closePhotoWidgetEditDialog, savePhotoWidgetText,
            // lock screen touch events
            lockTouchStart, lockTouchMove, lockTouchEnd,
            // lock screen mouse events
            lockMouseDown, lockMouseMove, lockMouseUp,
            // lock screen functions
            isLockScreenVisible, enableLockScreen, toggleLockScreen, lockScreen, unlockScreen,
            // password functions
            password, addPassword, removePassword, correctPassword, passwordSetting, isPasswordValid, validatePassword, savePassword,
            // signature functions
            chineseDate, fullDate, lockSignature, signatureSetting, saveSignature,
            // lock screen style functions
            lockWallpaper, lockWallpaperInput, saveLockWallpaper, lockDateTimeColor, saveLockDateTimeColor,
            // home (non-lockscreen) style functions
            homeWallpaper, homeWallpaperInput, saveHomeWallpaper, homeTextColor, homeTextColorInput, saveHomeTextColor,
            enableHomeGlass, toggleHomeGlass,
            enableHideStatusBar, toggleHideStatusBar,
            enableNotchAdaptation, toggleNotchAdaptation,
            // font functions
            fonts,
            selectedFont,
            globalSelectedFont,
            saveFont,
            lockFont,
            selectFont,
            selectGlobalFont,
            loadFontCSS,
            loadGlobalFontCSS,
            importCustomFont,
            globalFontFileInput,
            customFontCount,
            initFonts,
            showFontImportDialog,
            newFontName,
            newFontUrl,
            addFontByUrl,
        };

        // 音乐播放器控制
        const playBtn = document.getElementById('playBtn');
        const disk = document.getElementById('disk'); // 新版音乐组件不一定存在唱片圆盘
        const pauseIcon = document.getElementById('pauseIcon');
        
        let musicIsPlaying = true;
        
        // 播放图标的 SVG Path 数据
        const playPath = "M8 5v14l11-7z";
        // 暂停图标的 SVG Path 数据
        const pausePath = "M6 19h4V5H6v14zm8-14v14h4V5h-4z";
        
        if (playBtn && pauseIcon) {
            playBtn.addEventListener('click', () => {
                if (musicIsPlaying) {
                    if (disk) disk.classList.add('paused');
                    const path = pauseIcon.querySelector('path');
                    if (path) {
                        path.setAttribute('d', playPath);
                    }
                } else {
                    if (disk) disk.classList.remove('paused');
                    const path = pauseIcon.querySelector('path');
                    if (path) {
                        path.setAttribute('d', pausePath);
                    }
                }
                musicIsPlaying = !musicIsPlaying;
            });
        }

        // 灵动岛小组件更新函数
        function updateDashboard() {
            const now = new Date();
            
            // 1. 更新时钟
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const clockElement = document.querySelector('.clock');
            if (clockElement) {
                clockElement.textContent = `${hours}:${minutes}:${seconds}`;
            }
            
            // 2. 更新 AM/PM
            const meridiemElement = document.querySelector('.meridiem');
            if (meridiemElement) {
                meridiemElement.textContent = now.getHours() >= 12 ? 'PM' : 'AM';
            }
            
            // 3. 更新进度圆环 (基于当天的分钟进度)
            const totalMinutesInDay = 24 * 60;
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const progressDegree = (currentMinutes / totalMinutesInDay) * 360;
            
            const circle = document.querySelector('.progress-circle');
            if (circle) {
                circle.style.background = `conic-gradient(white 0deg ${progressDegree}deg, #333 ${progressDegree}deg 360deg)`;
            }
        }

        // 每秒更新一次
        setInterval(updateDashboard, 1000);
        updateDashboard();

        console.log('final return object:', returnObject);
        
        initFonts();
        
        return returnObject;

    } catch (error) {
        console.error('setup 同步错误:', error);
        const noop = () => {};
        return {
            isLockScreenVisible: ref(true),
            currentTime: ref(''),
            currentDate: ref(''),
            fullDate: ref(''),
            weekdays: ref(['日', '一', '二', '三', '四', '五', '六']),
            currentWeekday: ref(0),
            isHomeScreenVisible: ref(false),
            openedApp: ref(null),
            showGreetingSelect: ref(false),
            showTransferPanel: ref(false),
            showChatSettings: ref(false),
            chatBackgroundStyle: ref('default'),
            gradientStartColor: ref('#f2f2f7'),
            gradientEndColor: ref('#ffffff'),
            solidBackgroundColor: ref('#f2f2f7'),
            chatBackgroundImage: ref(''),
            chatBackgroundImageInput: ref(''),
            applyBackgroundImageLink: noop,
            clearBackgroundImage: noop,
            selectBackgroundImage: noop,
            chatSettingsPanelStyle: ref({}),
            enableManualImageCrop: ref(true),
            showImageCropModal: ref(false),
            imageCropSource: ref(''),
            imageCropRect: ref({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 }),
            imageCropScale: ref(0.82),
            imageCropCanvasAspect: computed(() => 1),
            closeImageCropModal: noop,
            confirmImageCrop: noop,
            onImageCropDragStart: noop,
            onImageCropScaleChange: noop,
            timeZoneSystemEnabled: ref(false),
            userTimeZone: ref(''),
            roleTimeZone: ref(''),
            activeMessageEnabled: ref(false),
            activeMessageFrequencyMin: ref(15),
            activeReplyDelaySec: ref(8),
            socialUserBlockedRole: ref(false),
            socialRoleBlockedUser: ref(false),
            socialPendingRoleRequest: ref(false),
            toggleUserBlockRole: noop,
            sendFriendRequestToRole: noop,
            acceptRoleFriendRequest: noop,
            rejectRoleFriendRequest: noop,
            chatSummaryEnabled: ref(false),
            chatSummaryEveryN: ref(12),
            chatSummaryGenerating: ref(false),
            chatSummaryBoard: ref([]),
            manualSummarizeChat: noop,
            clearChatSummaryBoard: noop,
            showPhotoWidgetEditDialog: ref(false),
            showCapsuleEditDialog: ref(false),
            showDashboardEditDialog: ref(false),
            showCharacterSelector: ref(false),
            showCallWidgetEdit: ref(false),
            closePhotoWidgetEditDialog: noop,
            closeCapsuleEditDialog: noop,
            closeDashboardEditDialog: noop,
            closeCallWidgetEdit: noop,
            // 锁屏相关（避免模板访问 undefined 导致渲染崩溃）
            password: ref(''),
            lockSignature: ref('每一天都是新的开始'),
            lockWallpaper: ref(''),
            lockDateTimeColor: ref('#ffffff'),
            enableNotchAdaptation: ref(true),
            lockTouchStart: noop,
            lockTouchMove: noop,
            lockTouchEnd: noop,
            lockMouseDown: noop,
            lockMouseMove: noop,
            lockMouseUp: noop,
            addPassword: noop,
            removePassword: noop,
            // 聊天/上下文菜单相关
            showRenameGroupDialog: ref(false),
            contextMenu: ref({ visible: false, x: 0, y: 0, msg: null }),
            closeContextMenu: noop,
        };
    }
}