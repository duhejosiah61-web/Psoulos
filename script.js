// =========================================================================
// == SOUL OS SCRIPT (FIXED VERSION)
// =========================================================================
import { ref, computed, onMounted, watch, reactive } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import { useFeed } from './feed.js';
import { useHub } from './hub.js';
import { useMate } from './mate.js';

export function setupApp() {
    console.log('setup start'); 
    try {
        // --- DATA (State) ---
        const currentTime = ref('');
        const currentDate = ref('');
        const deviceBatteryLevel = ref(null);
        const deviceBatteryCharging = ref(false);
        const deviceNetworkType = ref('');
        const deviceNetworkOnline = ref(true);
        const openedApp = ref(null);
        const isAiTyping = ref(false);
        const themeMode = ref(localStorage.getItem('themeMode') || 'light');
        const themeWallpaper = ref(localStorage.getItem('themeWallpaper') || 'var(--bg-primary)');
        const customWallpaperInput = ref('');
        const wallpaperPresets = ref([
            '#f5f5f5',                         // 默认亮色背景
            'linear-gradient(145deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(145deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(145deg, #4facfe 0%, #00f2fe 100%)',
            'url(https://images.unsplash.com/photo-1557683316-973673baf926?w=300)',
            'url(https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=300)'
        ]);
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
            const newId = Date.now();
            const newCharacter = {
                id: newId,
                internalName: `Char_${newId}`,
                nickname: `新角色 ${characters.value.length + 1}`,
                name: `新角色 ${characters.value.length + 1}`,
                summary: '点击卡片进行编辑...', 
                avatarUrl: `./assets/avatar-placeholder.png`, 
                tags: ['新角色'],
                persona: '',
                kvData: [],
                openingLines: [''],
                userPersona: '',
                worldbookIds: [],
                selectedPresetId: null
            };
            characters.value.unshift(newCharacter); 
        };

        const triggerAvatarUpload = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file && editingCharacter.value) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        editingCharacter.value.avatarUrl = e.target.result;
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
            const newId = Date.now();
            const newCharacter = {
                id: newId,
                internalName: `Char_${newId}`,
                nickname: characterName,
                name: characterName,
                summary,
                avatarUrl: avatarBase64 || `./assets/avatar-placeholder.png`,
                tags: tags.length > 0 ? tags : ['导入'],
                persona,
                kvData: [],
                openingLine,
                userPersona: '',
                worldbookId
            };
            characters.value.unshift(newCharacter);
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
                    avatarBase64 = characterData && characterData.avatar ? characterData.avatar : `./assets/avatar-placeholder.png`;
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
                const reader = new FileReader();
                reader.onload = (e) => {
                    editingCharacter.value.avatarUrl = e.target.result;
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
            const copy = JSON.parse(JSON.stringify(character));
            if (!copy.tags) copy.tags = [];
            if (!copy.kvData) copy.kvData = [];
            if (!copy.worldbookIds) copy.worldbookIds = [];
            if (!copy.internalName) copy.internalName = copy.name || `Char_${copy.id}`;
            if (!copy.nickname) copy.nickname = copy.name || '未命名';
            if (!copy.userPersona) copy.userPersona = '';
            if (!copy.selectedPresetId) copy.selectedPresetId = null;
            
            // 兼容旧数据：将 openingLine (string) 转换为 openingLines (array)
            if (copy.openingLine && (!copy.openingLines || copy.openingLines.length === 0)) {
                copy.openingLines = copy.openingLine.split('\n\n').filter(l => l.trim());
            }
            if (!copy.openingLines || copy.openingLines.length === 0) {
                copy.openingLines = [''];
            }
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
            if (!editingCharacter.value) return;
            
            // 将 openingLines 合并回 openingLine 以保持兼容性
            editingCharacter.value.openingLine = editingCharacter.value.openingLines
                .filter(l => l.trim())
                .join('\n\n');
                
            editingCharacter.value.name = editingCharacter.value.nickname || editingCharacter.value.internalName || '未命名角色';
            const index = characters.value.findIndex(c => c.id === editingCharacter.value.id);
            if (index !== -1) {
                characters.value[index] = editingCharacter.value;
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
        const isHomeScreenVisible = computed(() => !openedApp.value);
        
        const activeProfile = computed(() => {
            if (!activeProfileId.value) return null;
            return profiles.value.find(p => p.id === activeProfileId.value);
        });

        const apiStatus = computed(() => {
            if (!activeProfile.value) return 'unconfigured';
            if (activeProfile.value.endpoint && activeProfile.value.key) return 'valid';
            return 'invalid';
        });

        // --- METHODS ---
        const updateTime = () => {
            const now = new Date();
            currentTime.value = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            currentDate.value = now.toLocaleDateString('en-CA');
        };

        const setThemeMode = (mode) => {
            themeMode.value = mode;
            localStorage.setItem('themeMode', mode);
            applyTheme();
        };
        
        const setWallpaper = (wallpaper) => {
            themeWallpaper.value = wallpaper;
            localStorage.setItem('themeWallpaper', wallpaper);
            applyTheme();
        };
        
        const applyCustomWallpaper = () => {
            if (customWallpaperInput.value.trim()) {
                themeWallpaper.value = customWallpaperInput.value.trim();
                localStorage.setItem('themeWallpaper', themeWallpaper.value);
                applyTheme();
                customWallpaperInput.value = '';
            }
        };
        
       const applyTheme = () => {
           const root = document.documentElement;
           // 设置主题模式类
           if (themeMode.value === 'dark') {
               root.classList.add('theme-dark');
           } else if (themeMode.value === 'light') {
               root.classList.remove('theme-dark');
           } else if (themeMode.value === 'system') {
               const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
               if (prefersDark) {
                   root.classList.add('theme-dark');
               } else {
                   root.classList.remove('theme-dark');
               }
           }
       
           // 设置壁纸（直接应用到 #app 的背景）
           const appElement = document.getElementById('app');
           if (appElement) {
               appElement.style.background = themeWallpaper.value;
           }
       };

        // 监听系统主题变化
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = (e) => {
            if (themeMode.value === 'system') {
                if (e.matches) {
                    document.documentElement.classList.add('theme-dark');
                } else {
                    document.documentElement.classList.remove('theme-dark');
                }
            }
        };
        mediaQuery.addEventListener('change', handleSystemThemeChange);

        // Touch event variables for pull-to-refresh
        let startY = 0;
        const pullDistance = ref(0);
        
        const handleTouchMove = (e) => {
            if (openedApp.value !== 'hub') return;
            
            const content = e.target.closest('.hub-content');
            if (content && content.scrollTop === 0 && e.touches[0].clientY > startY) {
                pullDistance.value = Math.min(e.touches[0].clientY - startY, 100);
                e.preventDefault();
            }
        };
        
        const handleTouchEnd = (e) => {
            if (openedApp.value === 'hub' && pullDistance.value > 50) {
                hub.refreshPosts();
            }
            pullDistance.value = 0;
        };
        
        const openApp = (appName) => {
            const normalizedName = appName ? appName.toLowerCase() : null;
            openedApp.value = normalizedName;
            console.log(`[System] Opening App: ${normalizedName}`);
            
            if (normalizedName === 'console') {
                loadProfiles();
            } else if (normalizedName === 'soullink') {
                if (!['ch_list', 'msg', 'feed', 'id'].includes(soulLinkTab.value)) {
                    soulLinkTab.value = 'ch_list';
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

        // --- Console App Methods ---
        const addConsoleLog = (message, type = 'info') => {
            const timestamp = new Date().toLocaleTimeString('en-GB');
            consoleLogs.value.unshift({ id: Date.now(), timestamp, message, type });
            if (consoleLogs.value.length > 50) consoleLogs.value.pop();
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
            setInterval(updateTime, 1000);
            loadCharacters();
            loadSoulLinkMessages();
            loadSoulLinkGroups();
            loadSoulLinkPet();
            initDeviceStatus();
            applyTheme(); 
            loadChatMenuSettings();
            loadArchivedChats();
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
        });

        // ==========================================================
        // --- SoulLink App State & Logic ---
        // ==========================================================
        const soulLinkTab = ref('ch_list');
        const soulLinkActiveChat = ref(null);
        const soulLinkActiveChatType = ref('character');
        const soulLinkInput = ref('');
        const soulLinkReplyTarget = ref(null);
        const soulLinkMessages = ref({});
        const novelMode = ref(localStorage.getItem('soulos_novel_mode') === 'true');
        
        watch(novelMode, (val) => localStorage.setItem('soulos_novel_mode', val));

        // Initialize App Hooks with Dependencies
        const hub = reactive(useHub(activeProfile));
        const mate = reactive(useMate(soulLinkMessages, characters, activeProfile));
        const feed = reactive(useFeed(activeProfile, characters));

        const soulLinkGroups = ref([]);
        const soulLinkPet = ref({
            name: 'PIXEL PET',
            emoji: '🐾',
            energy: 80,
            hunger: 20,
            mood: 70,
            lastTick: Date.now()
        });
        const showEmojiPanel = ref(false);
        const showAttachmentPanel = ref(false);
        const showImageSubmenu = ref(false);
        const showLocationPanel = ref(false);
        const showTransferPanel = ref(false);
        const showChatSettings = ref(false);
        const isOfflineMode = ref(false);
        const showGreetingSelect = ref(false);
        const availableGreetings = ref([]);
        const selectedGreeting = ref(null);
        const showVirtualCamera = ref(false);
        const showArchiveDialog = ref(false);
        const showArchivedChats = ref(false);
        const archivedChats = ref([]);
        const archiveName = ref('');
        const archiveDescription = ref('');
        

        
        // 聊天背景设置
        const chatBackgroundStyle = ref('default');
        const gradientStartColor = ref('#f2f2f7');
        const gradientEndColor = ref('#ffffff');
        const solidBackgroundColor = ref('#f2f2f7');
        const chatBackgroundImage = ref('');
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
        const saveSoulLinkMessages = () => {
            try {
                localStorage.setItem('soulos_soullink_messages', JSON.stringify(soulLinkMessages.value));
            } catch (e) {
                console.error('Failed to save SoulLink messages:', e);
            }
        };
        const loadSoulLinkMessages = () => {
            try {
                const saved = localStorage.getItem('soulos_soullink_messages');
                if (saved) {
                    soulLinkMessages.value = JSON.parse(saved);
                }
            } catch (e) {
                console.error('Failed to load SoulLink messages:', e);
                soulLinkMessages.value = {};
            }
        };
        const saveSoulLinkGroups = () => {
            try {
                localStorage.setItem('soulos_soullink_groups', JSON.stringify(soulLinkGroups.value));
            } catch (e) {
                console.error('Failed to save SoulLink groups:', e);
            }
        };
        const loadSoulLinkGroups = () => {
            try {
                const saved = localStorage.getItem('soulos_soullink_groups');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    soulLinkGroups.value = Array.isArray(parsed) ? parsed : [];
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
        const loadSoulLinkPet = () => {
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
            const char = characters.value.find(c => c.id === soulLinkActiveChat.value);
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
                // 不再自动发送开场白，只有在线下模式下才会发送
            }
            // 加载当前角色的聊天设置
            loadChatMenuSettings();
            scrollToBottom();
        };

        const openSoulLinkGroupChat = (groupId) => {
            soulLinkActiveChat.value = groupId;
            soulLinkActiveChatType.value = 'group';
            soulLinkTab.value = 'msg';
            if (activeGroupChat.value && !Array.isArray(activeGroupChat.value.history)) {
                activeGroupChat.value.history = [];
            }
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
            const msgs = soulLinkMessages.value[charId] || [];
            if (!msgs.length) return '';
            const lastMsg = msgs[msgs.length - 1];
            if (lastMsg.messageType === 'image') return '[图片]';
            if (lastMsg.messageType === 'voice') return '[语音]';
            if (lastMsg.messageType === 'transfer') return '[转账]';
            if (lastMsg.messageType === 'location') return '[位置]';
            if (lastMsg.messageType === 'call') return lastMsg.callType === 'video' ? '[视频通话]' : '[语音通话]';
            return lastMsg.text || '';
        };

        const formatLastMsgTime = (charId) => {
            const msgs = soulLinkMessages.value[charId] || [];
            if (!msgs.length) return '';
            const lastMsg = msgs[msgs.length - 1];
            return new Date(lastMsg.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        };

        const closeAllPanels = () => {
            showAttachmentPanel.value = false;
            showImageSubmenu.value = false;
            showLocationPanel.value = false;
            showTransferPanel.value = false;
            showEmojiPanel.value = false;
            showVirtualCamera.value = false;
            showChatSettings.value = false;
            showArchiveDialog.value = false;
            showArchivedChats.value = false;
        };

        // 存档相关函数
        const saveArchivedChats = () => {
            try {
                localStorage.setItem('soulos_archived_chats', JSON.stringify(archivedChats.value));
            } catch (e) {
                console.error('Failed to save archived chats:', e);
            }
        };

        const loadArchivedChats = () => {
            try {
                const saved = localStorage.getItem('soulos_archived_chats');
                if (saved) {
                    archivedChats.value = JSON.parse(saved);
                }
            } catch (e) {
                console.error('Failed to load archived chats:', e);
                archivedChats.value = [];
            }
        };

        const archiveCurrentChat = () => {
            if (!soulLinkActiveChat.value || !archiveName.value.trim()) return;

            const currentMessages = soulLinkMessages.value[soulLinkActiveChat.value] || [];
            if (currentMessages.length === 0) return;

            // 创建存档
            const archive = {
                id: `archive_${Date.now()}`,
                characterId: soulLinkActiveChat.value,
                name: archiveName.value.trim(),
                description: archiveDescription.value.trim(),
                timestamp: Date.now(),
                messages: [...currentMessages],
                preview: currentMessages[currentMessages.length - 1]?.text || '无消息'
            };

            // 添加到存档列表
            archivedChats.value.push(archive);
            saveArchivedChats();

            // 清空当前对话
            soulLinkMessages.value[soulLinkActiveChat.value] = [];
            saveSoulLinkMessages();

            // 关闭存档对话框
            showArchiveDialog.value = false;
            archiveName.value = '';
            archiveDescription.value = '';
        };

        const restoreArchivedChat = (archive) => {
            if (!archive) return;

            // 切换到对应角色的聊天
            soulLinkActiveChat.value = archive.characterId;
            soulLinkActiveChatType.value = 'character';
            soulLinkTab.value = 'msg';

            // 恢复消息
            soulLinkMessages.value[archive.characterId] = [...archive.messages];
            saveSoulLinkMessages();

            // 关闭存档管理界面
            showArchivedChats.value = false;

            // 滚动到底部
            scrollToBottom();
        };

        const deleteArchivedChat = (archiveId) => {
            if (!archiveId) return;

            if (confirm('确定要删除这个存档吗？')) {
                archivedChats.value = archivedChats.value.filter(archive => archive.id !== archiveId);
                saveArchivedChats();
            }
        };
        
        // 格式化时间
        const formatTime = (timestamp) => {
            const date = new Date(timestamp);
            const now = new Date();
            const diff = now - date;
            
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

        const sendSoulLinkMessage = async (triggerApi) => {
            const shouldTriggerApi = triggerApi === true;
            const text = soulLinkInput.value.trim();
            if (!soulLinkActiveChat.value) return;
            if (!text) {
                addSystemMessageToActiveChat('请输入消息');
                return;
            }
            if (editingMessageId.value) {
                const chatMsgs = getActiveChatHistory();
                const editIndex = chatMsgs.findIndex(m => m.id === editingMessageId.value);
                if (editIndex !== -1) {
                    const target = chatMsgs[editIndex];
                    if (target.sender === 'user' && !target.isRecalled) {
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
            const char = isGroupChat ? null : characters.value.find(c => c.id === soulLinkActiveChat.value);

            const newMsg = {
                id: Date.now(),
                sender: 'user',
                text: text,
                timestamp: Date.now(),
                isLogOnly: !shouldTriggerApi,
                isReplied: false
            };

            if (replyContextForPrompt) {
                newMsg.replyTo = replyContextForPrompt;
            }
            if (isGroupChat) {
                newMsg.senderName = '我';
            }
            pushMessageToActiveChat(newMsg);
            
            soulLinkInput.value = '';
            soulLinkReplyTarget.value = null;

            if (shouldTriggerApi) {
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

                const history = isGroupChat ? (activeGroup.history || []) : (soulLinkMessages.value[soulLinkActiveChat.value] || []);
                const pendingUserMessages = getPendingUserMessages(history);

                const messagesPayload = [];

                let systemPrompt = '';
                
                if (isGroupChat) {
                    const groupName = activeGroup && activeGroup.name ? activeGroup.name : '群聊';
                    const members = activeGroup && Array.isArray(activeGroup.members) && activeGroup.members.length > 0 ? activeGroup.members : ['成员A', '成员B', '成员C'];
                    systemPrompt = `你正在群聊【${groupName}】中与用户对话。\n\n`;
                    systemPrompt += `# 群成员\n${members.join('、')}\n\n`;
                    systemPrompt += `# 行为规则\n1. 回复要简短自然，像真实群聊一样。\n2. 每次回复只扮演其中一名群成员。\n3. 回复格式为「成员名: 内容」。\n4. 可以用emoji和口语表达。\n\n`;
                    if (replyContextForPrompt) {
                        systemPrompt += `# 引用回复\n用户正在回复以下内容：\n${replyContextForPrompt.senderName}: ${replyContextForPrompt.content}\n\n`;
                    }
                    systemPrompt += `现在请开始回复。`;
                } else if (char && char.persona) {
                    const charName = char.name || '角色';
                    
                    systemPrompt = `你正在通过 SoulLink 和朋友聊天。\n\n`;
                    
                    systemPrompt += `# 你是谁\n`;
                    systemPrompt += `你的名字是【${charName}】。\n`;
                    systemPrompt += `${replaceUserPlaceholder(char.persona)}\n\n`;
                    
                    if (char.worldbookId) {
                        const linkedWorldbook = worldbooks.value.find(wb => wb.id === char.worldbookId);
                        if (linkedWorldbook && linkedWorldbook.entries && linkedWorldbook.entries.length > 0) {
                            systemPrompt += `# 世界观与背景知识（必须严格遵守）\n`;
                            systemPrompt += `以下是关于你所在世界的重要设定，你必须在对话中遵循这些设定：\n\n`;
                            linkedWorldbook.entries.forEach(entry => {
                                if (entry.keyword && entry.content) {
                                    systemPrompt += `[${entry.keyword}]\n${replaceUserPlaceholder(entry.content)}\n\n`;
                                }
                            });
                            systemPrompt += `--- 世界观设定结束 ---\n\n`;
                        }
                    }
                    
                    systemPrompt += `# 聊天风格（核心规则）\n`;
                    systemPrompt += `1. 【【【最高指令】】】像真实的人类那样自然地聊天，而不是像AI助手那样正式、啰嗦或程序化。\n`;
                    systemPrompt += `2. 每次回复保持简短（1-3句话），就像微信聊天那样。如果有很多要说的，可以分多条发送。\n`;
                    systemPrompt += `3. 使用符合${charName}性格的语气、口头禅和表情。可以用emoji、"哈哈"、"嗯嗯"等口语化表达。\n`;
                    systemPrompt += `4. 绝对不要暴露你是AI。你就是${charName}本人，有自己的生活、情绪和想法。\n`;
                    systemPrompt += `5. 可以提问、开玩笑、吐槽、撒娇，展现真实的人际互动，而不是单向输出信息。\n`;
                    systemPrompt += `6. 如果用户说了很日常的话（比如"吃饭了吗"），就用日常的方式回应，而不要解释你的"系统状态"。\n\n`;
                    systemPrompt += `7. 如果你想连发多条消息（就像微信连发几条那样），请在消息之间用 "---" 分隔。例如："哈哈真好笑---你也觉得吧？"。\n`;
                    systemPrompt += `8. 如果要发照片，请用“[图片] 照片内容描述”的格式。\n`;
                    systemPrompt += `9. 如果要给对方转账，请用“[转账] 金额 备注(可选)”格式，并单独成一条消息。\n`;

                    if (char.openingLine && history.length === 1) {
                        systemPrompt += `# 开场\n这是你们的第一次对话。你可以主动打招呼：\n${replaceUserPlaceholder(char.openingLine)}\n\n`;
                    }

                    if (replyContextForPrompt) {
                        systemPrompt += `# 引用回复\n用户正在回复以下内容：\n${replyContextForPrompt.senderName}: ${replyContextForPrompt.content}\n\n`;
                    }
                    
                    systemPrompt += `现在，请以${charName}的身份，自然地回复对方。记住：简短、真实、有人情味。`;
                } else {
                    systemPrompt = '你是一个友好的朋友，正在通过SoulLink聊天。请像真人一样自然、简短地对话，每次1-3句话即可。可以用emoji和口语化表达。';
                    if (replyContextForPrompt) {
                        systemPrompt += `\n\n用户正在回复以下内容：\n${replyContextForPrompt.senderName}: ${replyContextForPrompt.content}`;
                    }
                    systemPrompt += `\n如果要发照片，请用“[图片] 照片内容描述”的格式。`;
                    systemPrompt += `\n如果要给对方转账，请用“[转账] 金额 备注(可选)”格式，并单独成一条消息。`;
                }

                messagesPayload.push({
                    role: 'system',
                    content: systemPrompt
                });
                
                history.forEach(m => {
                    if (m.isSystem || m.isHidden) return;
                    const ctx = buildSoulLinkReplyContext(m);
                    const raw = ctx.content || (m.text || '');
                    if (m.sender === 'user') {
                        messagesPayload.push({ role: 'user', content: raw });
                    } else if (m.sender === 'ai') {
                        messagesPayload.push({ role: 'assistant', content: raw });
                    }
                });

                messagesPayload.push({ role: 'user', content: isGroupChat ? `我: ${text}` : text });

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
                        reply = '模型已响应，但未返回可显示的内容。';
                    }
                    
                    isAiTyping.value = false; 
                    
                    const separator = '---';
                    const appendAiMessage = (rawText, index = 0) => {
                        const trimmedText = rawText.trim();
                        if (!trimmedText) return;
                        if (isGroupChat) {
                            const parsed = parseGroupReply(trimmedText);
                            if (!parsed.content) return;
                            const imageDesc = extractAiImageDescription(parsed.content);
                            if (imageDesc) {
                                pushMessageToActiveChat({
                                    id: Date.now() + index,
                                    sender: 'ai',
                                    senderName: parsed.senderName,
                                    messageType: 'image',
                                    imageUrl: null,
                                    text: formatAiImageText(imageDesc, 'TA'),
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
                        } else {
                            const imageDesc = extractAiImageDescription(trimmedText);
                            if (imageDesc) {
                                pushMessageToActiveChat({
                                    id: Date.now() + index,
                                    sender: 'ai',
                                    messageType: 'image',
                                    imageUrl: null,
                                    text: formatAiImageText(imageDesc, getActiveChatPronoun()),
                                    timestamp: Date.now()
                                });
                            } else {
                                pushMessageToActiveChat({
                                    id: Date.now() + index,
                                    sender: 'ai',
                                    text: trimmedText,
                                    timestamp: Date.now()
                                });
                            }
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
                    if (pendingUserMessages.length > 0) {
                        markMessagesReplied(history, pendingUserMessages.map(m => m.id));
                    }
                    addConsoleLog('SoulLink 会话：已成功从模型获取回复。', 'success');

                } catch (error) {
                    isAiTyping.value = false;
                    pushMessageToActiveChat({
                        id: Date.now() + 5,
                        sender: 'system',
                        text: `请求模型时出错：${error.message}`,
                        timestamp: Date.now(),
                        isSystem: true
                    });
                    addConsoleLog('SoulLink 会话错误：' + error.message, 'error');
                }
            }
        };
        
        const replaceUserPlaceholder = (text) => {
            if (!text) return '';
            const name = userIdentity.value || '用户';
            return text.replace(/\{\{user\}\}/g, name);
        };

        const triggerSoulLinkAiReply = async () => {
            if (!soulLinkActiveChat.value) return;

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
            if (pendingUserMessages.length === 0) {
                addSystemMessageToActiveChat('没有需要回复的消息');
                return;
            }
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
            let systemPrompt = '';
            if (isGroupChat) {
                const groupName = activeGroup && activeGroup.name ? activeGroup.name : '群聊';
                const members = activeGroup && Array.isArray(activeGroup.members) && activeGroup.members.length > 0 ? activeGroup.members : ['成员A', '成员B', '成员C'];
                systemPrompt = `你正在群聊【${groupName}】中与用户对话。\n\n`;
                systemPrompt += `# 群成员\n${members.join('、')}\n\n`;
                systemPrompt += `# 行为规则\n1. 回复要简短自然，像真实群聊一样。\n2. 每次回复只扮演其中一名群成员。\n3. 回复格式为「成员名: 内容」。\n4. 可以用emoji和口语表达。\n\n`;
                systemPrompt += `现在请开始回复。`;
            } else if (char && char.persona) {
                const charName = char.name || '角色';
                systemPrompt = `你正在通过 SoulLink 和朋友聊天。\n\n`;
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
            } else {
                systemPrompt = '你是一个友好的朋友，正在通过SoulLink聊天。请像真人一样自然、简短地对话，每次1-3句话即可。可以用emoji和口语化表达。';
                systemPrompt += '\n如果要发照片，请用“[图片] 照片内容描述”的格式。';
            }
            messagesPayload.push({
                role: 'system',
                content: systemPrompt
            });
            history.forEach(m => {
                if (m.isSystem || m.isHidden) return;
                const ctx = buildSoulLinkReplyContext(m);
                const raw = ctx.content || (m.text || '');
                if (m.sender === 'user') {
                    messagesPayload.push({ role: 'user', content: raw });
                } else if (m.sender === 'ai') {
                    messagesPayload.push({ role: 'assistant', content: raw });
                }
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
                    reply = '模型已响应，但未返回可显示的内容。';
                }
                isAiTyping.value = false;
                const separator = '---';
                const appendAiMessage = (rawText, index = 0) => {
                    const trimmedText = rawText.trim();
                    if (!trimmedText) return;
                    if (isGroupChat) {
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
                        const imageDesc = extractAiImageDescription(parsed.content);
                        if (imageDesc) {
                            pushMessageToActiveChat({
                                id: Date.now() + index,
                                sender: 'ai',
                                senderName: parsed.senderName,
                                messageType: 'image',
                                imageUrl: null,
                                text: formatAiImageText(imageDesc, 'TA'),
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
                    } else {
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
                        const imageDesc = extractAiImageDescription(trimmedText);
                        if (imageDesc) {
                            pushMessageToActiveChat({
                                id: Date.now() + index,
                                sender: 'ai',
                                messageType: 'image',
                                imageUrl: null,
                                text: formatAiImageText(imageDesc, getActiveChatPronoun()),
                                timestamp: Date.now()
                            });
                        } else {
                            pushMessageToActiveChat({
                                id: Date.now() + index,
                                sender: 'ai',
                                text: trimmedText,
                                timestamp: Date.now()
                            });
                        }
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
                markMessagesReplied(history, pendingUserMessages.map(m => m.id));
                addConsoleLog('SoulLink 会话：已成功从模型获取回复。', 'success');
            } catch (error) {
                isAiTyping.value = false;
                pushMessageToActiveChat({
                    id: Date.now() + 5,
                    sender: 'system',
                    text: `请求模型时出错：${error.message}`,
                    timestamp: Date.now(),
                    isSystem: true
                });
                addConsoleLog('SoulLink 会话错误：' + error.message, 'error');
            }
        };

        const autoAiReplyForAttachment = async (newMsg) => {
            if (!soulLinkActiveChat.value) return;
            if (!activeProfile.value) return;
            const isGroupChat = soulLinkActiveChatType.value === 'group';
            const char = characters.value.find(c => c.id === soulLinkActiveChat.value);
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
            if (!isGroupChat && char && char.persona) {
                const charName = char.name || '角色';
                systemPrompt = `你正在通过 SoulLink 和朋友聊天。\n\n`;
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
                systemPrompt += `1. 像真实的人类那样自然地聊天。\n2. 回复保持简短（1-3句）。\n3. 使用符合角色的语气与口头禅。\n4. 如果要发照片，请用“[图片] 照片内容描述”的格式。\n5. 重要：如果要给对方转账，请用“[转账] 金额 备注(可选)”格式，并单独成一条消息。例如：“[转账] 520 情人节快乐”。\n6. 如果用户让你发朋友圈，请用“[发布朋友圈] 动态内容”的格式。\n7. 请积极主动地与用户互动，包括但不限于发送转账消息、照片和朋友圈动态。`;
            } else if (!isGroupChat) {
                systemPrompt = '你是一个友好的朋友，正在通过SoulLink聊天。请自然、简短地对话。';
            systemPrompt += '\n如果要发照片，请用“[图片] 照片内容描述”的格式。';
            systemPrompt += '\n重要：如果要给对方转账，请用“[转账] 金额 备注(可选)”格式，并单独成一条消息。例如：“[转账] 520 情人节快乐”。';
            systemPrompt += '\n如果要发朋友圈，请用“[发布朋友圈] 动态内容”的格式。';
            systemPrompt += '\n请积极主动地与用户互动，包括但不限于发送转账消息、照片和朋友圈动态。';
            } else {
                const groupName = activeGroup && activeGroup.name ? activeGroup.name : '群聊';
                const members = activeGroup && Array.isArray(activeGroup.members) && activeGroup.members.length > 0 ? activeGroup.members : ['成员A', '成员B', '成员C'];
                systemPrompt = `你正在群聊【${groupName}】中与用户交流附件内容。\n\n`;
                systemPrompt += `群成员\n${members.join('、')}\n\n`;
                systemPrompt += `回复要简短自然。每次回复以其中一名成员口吻，格式为「成员名: 内容」。\n如果要发照片，请用“[图片] 照片内容描述”的格式。`;
            systemPrompt += `\n重要：如果要给对方转账，请用“[转账] 金额 备注(可选)”格式，并单独成一条消息。例如：“[转账] 520 情人节快乐”。`;
            systemPrompt += `\n请积极主动地与用户互动，包括但不限于发送转账消息、照片和朋友圈动态。`;
            }
            messagesPayload.push({ role: 'system', content: systemPrompt });
            history.forEach(m => {
                if (m.isSystem || m.isHidden) return;
                const ctx = buildSoulLinkReplyContext(m);
                const raw = ctx.content || (m.text || '');
                if (m.sender === 'user') {
                    messagesPayload.push({ role: 'user', content: raw });
                } else if (m.sender === 'ai') {
                    messagesPayload.push({ role: 'assistant', content: raw });
                }
            });
            const ctxNew = buildSoulLinkReplyContext(newMsg);
            messagesPayload.push({ role: 'user', content: ctxNew.content || (newMsg.text || '') });
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
            if (/\[发布朋友圈\]|【发布朋友圈】|\(发布朋友圈\)/.test(rawText)) {
                console.log('Found role post command in rawText:', rawText);
                const postMatch = rawText.match(/(?:\[|【|\()发布朋友圈(?:\]|】|\))\s*([\s\S]+?)(?=(\[|【|\(|$))/);
                if (postMatch) {
                    const postContent = postMatch[1].trim();
                    if (postContent) {
                        console.log('Extracted post content:', postContent);
                        const activeChar = characters.value.find(c => c.id === soulLinkActiveChat.value);
                        if (activeChar) {
                            feed.roleAction('post', {
                                author: activeChar.nickname || activeChar.name,
                                avatar: activeChar.avatarUrl,
                                content: postContent,
                                images: [] // TODO: Support images in future
                            });
                        } else {
                            console.warn('No active character found for role post');
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
                        } else {
                            pushMessageToActiveChat({
                                id: Date.now() + index,
                                sender: 'ai',
                                text: trimmedText,
                                timestamp: Date.now()
                            });
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
                        } else {
                            pushMessageToActiveChat({
                                id: Date.now() + index,
                                sender: 'ai',
                                senderName: parsed.senderName,
                                text: parsed.content,
                                timestamp: Date.now()
                            });
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
            contextMenu.value = {
                visible: true,
                x: event.clientX,
                y: event.clientY,
                msg: msg
            };
        };

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
            const senderName = msg.senderName || (msg.sender === 'user' ? '我' : getActiveChatName());
            let content = '';
            if (msg.messageType === 'image') {
                content = msg.text || '[图片]';
            } else if (msg.messageType === 'voice') {
                content = msg.text || '[语音]';
            } else if (msg.messageType === 'transfer') {
                const amount = msg.amount ? `¥${msg.amount}` : '';
                const note = msg.note ? ` ${msg.note}` : '';
                content = `转账 ${amount}${note}`.trim();
            } else if (msg.messageType === 'location') {
                const parts = [];
                if (msg.userLocation) parts.push(`我的位置: ${msg.userLocation}`);
                if (msg.aiLocation) parts.push(`Ta的位置: ${msg.aiLocation}`);
                if (msg.distance) parts.push(`相距: ${msg.distance}`);
                if (Array.isArray(msg.trajectoryPoints) && msg.trajectoryPoints.length > 0) {
                    const names = msg.trajectoryPoints.map(point => point.name || point).filter(Boolean).join(', ');
                    if (names) parts.push(`途经点: ${names}`);
                }
                content = parts.length > 0 ? `定位 ${parts.join(' | ')}` : '定位';
            } else {
                content = msg.text || '';
            }
            return {
                id: msg.id,
                senderName,
                content
            };
        };

        const buildSoulLinkReplyPreview = (msg, context) => {
            if (msg.messageType && msg.messageType !== 'text') {
                return context.content || '';
            }
            const raw = context.content || '';
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
                            ...chatMsgs[index],
                            messageType: 'text',
                            text: '你撤回了一条消息',
                            recalledData: recalledData,
                            isRecalled: true,
                            isSystem: true
                        };
                        
                        delete chatMsgs[index].imageUrl;
                        delete chatMsgs[index].amount;
                        delete chatMsgs[index].note;
                        delete chatMsgs[index].duration;
                        delete chatMsgs[index].userLocation;
                        delete chatMsgs[index].aiLocation;
                        delete chatMsgs[index].distance;
                        delete chatMsgs[index].trajectoryPoints;
                        
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
                    if (msg.sender === 'user' && !msg.isRecalled) {
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
                        const previewText = buildSoulLinkReplyPreview(msg, replyContext);
                        soulLinkInput.value = previewText ? `> ${previewText}\n` : '';
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

        // ==========================================================
        // --- NEW FEATURES (Chat Menu, Calls, Virtual Camera) ---
        // ==========================================================

        // --- Chat Menu Logic ---        
        const userIdentity = ref('');
        const userRelation = ref('');
        const bubbleStyle = ref('default');
        const customBubbleCSS = ref('');
        const showChatMenu = ref(false);
        const showProfile = ref(false);
        const profileChar = ref(null);
        
        // --- Chat Archive Logic ---        
        // showArchiveDialog 已在作用域外声明，这里仅作初始化，避免重复声明
        if (typeof showArchiveDialog === 'undefined') {
            const showArchiveDialog = ref(false);
        } else {
            showArchiveDialog.value = false;
        }
        showArchivedChats.value = false;
        // 已在外部声明，无需重复声明
        // const archiveName = ref('');
        archiveDescription.value = '';
        // archivedChats 已在上方声明，此处无需重复声明

        const setBubbleStyle = (style) => {
            bubbleStyle.value = style;
            applyBubbleStyle();
        };
        const applyCustomCSS = () => {
            if (customBubbleCSS.value) {
                bubbleStyle.value = 'custom';
                applyBubbleStyle();
            }
        };

        const saveAndCloseSettings = () => {
            applyCustomCSS();
            saveChatMenuSettings();
            closeAllPanels();
        };
        const getBubbleStyleClass = () => `bubble-style-${bubbleStyle.value}`;
        const applyCustomBubbleStyle = () => {
            let styleTag = document.getElementById('custom-bubble-style');
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'custom-bubble-style';
                document.head.appendChild(styleTag);
            }
            const css = customBubbleCSS.value.trim();
            styleTag.textContent = css
                ? `#app.bubble-style-custom .message.user .text-bubble { ${css} }`
                : '';
        };
        const applyBubbleStyle = () => {
            const appElement = document.getElementById('app');
            if (appElement) {
                appElement.classList.remove('bubble-style-default', 'bubble-style-blue', 'bubble-style-orange', 'bubble-style-custom', 'bubble-style-round', 'bubble-style-sharp');
                appElement.classList.add(getBubbleStyleClass());
            }
            if (bubbleStyle.value === 'custom') {
                applyCustomBubbleStyle();
            } else {
                const styleTag = document.getElementById('custom-bubble-style');
                if (styleTag) styleTag.textContent = '';
            }
        };
        const saveChatMenuSettings = () => {
            if (!soulLinkActiveChat.value) return;
            
            // 为每个角色保存单独的设置
            const settingsKey = `soulos_chat_menu_${soulLinkActiveChat.value}`;
            saveToStorage(settingsKey, {
                userIdentity: userIdentity.value,
                userRelation: userRelation.value,
                bubbleStyle: bubbleStyle.value,
                customBubbleCSS: customBubbleCSS.value
            });
        };
        const loadChatMenuSettings = () => {
            if (!soulLinkActiveChat.value) return;
            
            // 加载当前角色的设置
            const settingsKey = `soulos_chat_menu_${soulLinkActiveChat.value}`;
            const saved = loadFromStorage(settingsKey);
            if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
                userIdentity.value = saved.userIdentity || '';
                userRelation.value = saved.userRelation || '';
                bubbleStyle.value = saved.bubbleStyle || 'default';
                customBubbleCSS.value = saved.customBubbleCSS || '';
            } else {
                // 如果没有保存的设置，使用默认值
                userIdentity.value = '';
                userRelation.value = '';
                bubbleStyle.value = 'default';
                customBubbleCSS.value = '';
            }
            applyBubbleStyle();
        };
        const confirmChatMenu = () => {
            if (bubbleStyle.value === 'custom' && !customBubbleCSS.value.trim()) {
                bubbleStyle.value = 'default';
            }
            saveChatMenuSettings();
            applyBubbleStyle();
            showChatMenu.value = false;
        };

        // --- Chat Archive Functions ---        



        // --- Call Logic ---
        const callActive = ref(false);
        const callType = ref('voice');
        const callTimer = ref('00:00');
        const callInput = ref('');
        const callMessages = ref([]);
        const isCallAiTyping = ref(false);
        let callInterval = null;

        const currentChatName = computed(() => {
            if (!soulLinkActiveChat.value) return '聊天';
            const char = characters.value.find(c => c.id === soulLinkActiveChat.value);
            return char ? (char.nickname || char.name) : '未知用户';
        });

        const currentChatAvatar = computed(() => {
             if (!soulLinkActiveChat.value) return 'https://placehold.co/100x100?text=No+Avatar';
             const char = characters.value.find(c => c.id === soulLinkActiveChat.value);
             return char ? (char.avatarUrl || 'https://placehold.co/100x100?text=No+Avatar') : 'https://placehold.co/100x100?text=No+Avatar';
        });

        const viewCharacterProfile = () => {
            if (soulLinkActiveChat.value) {
                const char = characters.value.find(c => c.id === soulLinkActiveChat.value);
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

        const endCall = () => {
            callActive.value = false;
            stopCallTimer();
            if (!soulLinkActiveChat.value) return;
            const isVideo = callType.value === 'video';
            pushMessageToActiveChat({
                id: Date.now(),
                sender: 'ai',
                messageType: 'call',
                callType: callType.value,
                isCallMessage: true,
                callIcon: isVideo ? '🎥' : '📞',
                text: `${isVideo ? '视频通话' : '语音通话'}结束 ${callTimer.value || ''}`.trim(),
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
            const char = isGroupChat ? null : characters.value.find(c => c.id === soulLinkActiveChat.value);
            const history = isGroupChat ? (activeGroup.history || []) : (soulLinkMessages.value[soulLinkActiveChat.value] || []);
            const messagesPayload = [];
            let systemPrompt = '';
            if (isGroupChat) {
                const groupName = activeGroup && activeGroup.name ? activeGroup.name : '群聊';
                const members = activeGroup && Array.isArray(activeGroup.members) && activeGroup.members.length > 0 ? activeGroup.members : ['成员A', '成员B', '成员C'];
                systemPrompt = `你正在群聊【${groupName}】中与用户语音/视频通话。\n\n`;
                systemPrompt += `# 群成员\n${members.join('、')}\n\n`;
                systemPrompt += `# 行为规则\n1. 回复要简短自然，像真实通话一样。\n2. 每次回复只扮演其中一名群成员。\n3. 回复格式为「成员名: 内容」。\n4. 可以用口语和表情。\n\n`;
                systemPrompt += `现在请开始回复。`;
            } else if (char && char.persona) {
                const charName = char.name || '角色';
                systemPrompt = `你正在通过 SoulLink 与对方进行语音/视频通话。\n\n`;
                systemPrompt += `你的名字是【${charName}】。\n`;
                systemPrompt += `${char.persona}\n\n`;
                systemPrompt += `1. 像真实的人类那样自然通话。\n2. 每次回复保持简短（1-2句话）。\n3. 使用符合${charName}性格的语气、口头禅和口语表达。\n4. 不要暴露你是AI。\n`;
            } else {
                systemPrompt = '你正在和朋友语音/视频通话。请自然、简短地对话，每次1-2句话。';
            }
            messagesPayload.push({ role: 'system', content: systemPrompt });
            history.forEach(m => {
                if (m.isSystem || m.isHidden) return;
                const ctx = buildSoulLinkReplyContext(m);
                const raw = ctx.content || (m.text || '');
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
            autoAiReplyForAttachment(msg);
        };

        // --- Chat Settings Logic ---
        const toggleChatSettings = () => {
            console.log('toggleChatSettings called, current value:', showChatSettings.value);
            showChatSettings.value = !showChatSettings.value;
            console.log('toggleChatSettings new value:', showChatSettings.value);
            // 不调用closeAllPanels，因为它会关闭聊天设置面板
        };

        // 切换线下模式
        const toggleOfflineMode = () => {
            if (!soulLinkActiveChat.value) return;

            // 自动存档当前对话
            const currentMessages = soulLinkMessages.value[soulLinkActiveChat.value] || [];
            if (currentMessages.length > 0) {
                // 创建自动存档
                const modeText = isOfflineMode.value ? '线下' : '线上';
                const archiveNameText = `自动存档 - ${modeText}模式 - ${new Date().toLocaleString()}`;
                
                const archive = {
                    id: `archive_${Date.now()}`,
                    characterId: soulLinkActiveChat.value,
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
                soulLinkMessages.value[soulLinkActiveChat.value] = [];
                saveSoulLinkMessages();
            }

            if (isOfflineMode.value) {
                // 退出线下模式
                isOfflineMode.value = false;
            } else {
                // 进入线下模式，显示开场白选择
                prepareGreetingsForSelection();
                showGreetingSelect.value = true;
            }
        };

        // 准备开场白选择
        const prepareGreetingsForSelection = () => {
            if (!soulLinkActiveChat.value) return;

            const activeCharacter = characters.value.find(c => c.id === soulLinkActiveChat.value);
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
            isOfflineMode.value = true;
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

            const activeCharacter = characters.value.find(c => c.id === soulLinkActiveChat.value);
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
                chatBackgroundImage.value = e.target.result;
                updateChatBackground();
            };
            reader.readAsDataURL(file);
        };
        
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
            const newMsg = sendLocationMessage();
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
            const char = isGroupChat ? null : characters.value.find(c => c.id === soulLinkActiveChat.value);
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
                const raw = ctx.content || (m.text || '');
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
            const char = isGroupChat ? null : characters.value.find(c => c.id === soulLinkActiveChat.value);
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
                const raw = ctx.content || (m.text || '');
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
            let systemPrompt = '';
            if (isGroupChat) {
                const groupName = activeGroup && activeGroup.name ? activeGroup.name : '群聊';
                const members = activeGroup && Array.isArray(activeGroup.members) && activeGroup.members.length > 0 ? activeGroup.members : ['成员A', '成员B', '成员C'];
                systemPrompt = `你正在群聊【${groupName}】中与用户对话。\n\n`;
                systemPrompt += `# 群成员\n${members.join('、')}\n\n`;
                systemPrompt += `# 行为规则\n1. 回复要简短自然，像真实群聊一样。\n2. 每次回复只扮演其中一名群成员。\n3. 回复格式为「成员名: 内容」。\n4. 可以用emoji和口语表达。\n\n`;
                systemPrompt += `现在请开始回复。`;
            } else if (char && char.persona) {
                const charName = char.name || '角色';
                systemPrompt = `你正在通过 SoulLink 和朋友聊天。\n\n`;
                systemPrompt += `你的名字是【${charName}】。\n`;
                systemPrompt += `${char.persona}\n\n`;
                systemPrompt += `1. 像真实的人类那样自然地聊天。\n2. 每次回复保持简短（1-3句话）。\n3. 使用符合${charName}性格的语气、口头禅和表情。\n4. 绝对不要暴露你是AI。你就是${charName}本人。\n`;
                if (char.openingLine && history.length === 1) {
                    systemPrompt += `这是你们的第一次对话。你可以主动打招呼：\n${char.openingLine}\n\n`;
                }
            } else {
                systemPrompt = '你是一个友好的朋友，正在通过SoulLink聊天。请像真人一样自然、简短地对话，每次1-3句话即可。可以用emoji和口语化表达。';
            }
            return systemPrompt;
        };

        // --- Transfer Panel Logic ---
        const openTransferPanel = () => {
            console.log('openTransferPanel called');
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
                note: transferNote.value.trim(),
                transferStatus: 'pending',
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
                    sender: 'ai',
                    text: '已收款~ 谢谢',
                    timestamp: Date.now()
                });
            } else if (action === 'reject') {
                msg.transferStatus = 'rejected';
                addConsoleLog(`转账已拒绝: ¥${msg.amount}`, 'info');
                pushMessageToActiveChat({
                    id: Date.now(),
                    sender: 'ai',
                    text: '这次不收哦',
                    timestamp: Date.now()
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
        
        const startVoiceInput = () => {
            alert('语音输入功能开发中...');
        };

        const onSendOrCall = () => {
            if (soulLinkInput.value && soulLinkInput.value.trim()) {
                sendSoulLinkMessage('text');
            } else {
                triggerSoulLinkAiReply();
            }
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
                         const msg = {
                             id: Date.now(),
                             sender: 'user',
                             messageType: 'image',
                             imageUrl: e.target.result,
                             text: '图片',
                             timestamp: Date.now(),
                             isReplied: false
                         };
                         if (!soulLinkMessages.value[soulLinkActiveChat.value]) {
                             soulLinkMessages.value[soulLinkActiveChat.value] = [];
                         }
                         soulLinkMessages.value[soulLinkActiveChat.value].push(msg);
                         saveSoulLinkMessages();
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        };

        const insertEmoji = (emoji) => {
            soulLinkInput.value += emoji;
            showEmojiPanel.value = false;
        };

        const pushMessageToActiveChat = (msg) => {
            if (!soulLinkActiveChat.value) return;
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
            scrollToBottom();
        };
        
        watch(openedApp, (newVal) => {
            if (newVal === 'feed') {
                feed.loadPosts();
            }
        });
         console.log('setup end');
         
        
        // 构造返回对象
        const returnObject = {
            // SoulLink
            soulLinkTab, soulLinkActiveChat, soulLinkActiveChatType, soulLinkInput,
            soulLinkMessages, soulLinkGroups, activeChatMessages, currentChatMessages, recentChats,
            formatLastMsgTime, getLastMessage, closeAllPanels,
            emojiList, previewImage, formatTime, onInputChange, onEnterPress,
            contextMenu,
            startSoulLinkChat, openSoulLinkGroupChat, exitSoulLinkChat, sendSoulLinkMessage,
            switchSoulLinkTab, onMessageContextMenu, onMessageTouchStart, onMessageTouchMove, onMessageTouchEnd, handleContextAction, closeContextMenu,
            getCharacterName, getCharacterAvatar, getActiveChatName, getActiveChatAvatar, getActiveChatStatus,
            getLocationLabel,
            soulLinkPet,
            saveSoulLinkMessages,
            showEmojiPanel,
            pixelEmojis,
            insertEmoji,
            isAiTyping,
            isOfflineMode,
            novelMode,
            showGreetingSelect,
            availableGreetings,

            // Core
            currentTime, currentDate, openedApp, currentScreen, deviceBatteryText, deviceSignalText,
            isHomeScreenVisible,
            // New Features (Chat Menu, Call, Virtual Camera, Panels)
            userIdentity, userRelation, bubbleStyle, customBubbleCSS, setBubbleStyle, applyCustomCSS, saveAndCloseSettings, confirmChatMenu, showArchiveDialog, showArchivedChats, archiveName, archiveDescription, archivedChats, archiveCurrentChat, restoreArchivedChat, deleteArchivedChat,
            callActive, callType, callTimer, callInput, callMessages, isCallAiTyping, currentChatName, currentChatAvatar,
            startVoiceCall, startVideoCall, endCall, sendCallMessage,
            showVirtualCamera, virtualImageDesc, openVirtualCamera, sendVirtualImage,
            openLocationPanel, closeLocationPanel, sendLocation,
            openTransferPanel, closeTransferPanel, sendTransfer, transferAmount, transferNote,
            // Chat Settings
            showChatSettings, toggleChatSettings,
            chatBackgroundStyle, gradientStartColor, gradientEndColor, solidBackgroundColor, chatBackgroundImage,
            updateChatBackground, selectBackgroundImage, handleBackgroundImageSelect,
            // Profile & Navigation
            profileChar, viewCharacterProfile, goBackInSoulLink, showProfile, showChatMenu,
            // New Input Logic
            moodValue, bedTiming, showLocationPanel, showTransferPanel, showChatSettings,
            showAttachmentPanel, showImageSubmenu, toggleEmojiPanel, toggleAttachmentPanel, toggleOfflineMode, selectGreeting, addDefaultGreeting, addCustomGreeting,
            startVoiceInput, onSendOrCall, selectFromAlbum,
            // App Launch
            openApp, closeApp, getAppIcon,
            // Console
            profiles, activeProfileId, activeProfile, apiStatus,
            availableModels, fetchingModels, consoleLogs,
            saveProfiles, createNewProfile, deleteActiveProfile, setActiveProfile, deleteProfile,
            onProfileSelect, fetchModels,
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
            themeMode,
            themeWallpaper,
            customWallpaperInput,
            wallpaperPresets,
            setThemeMode,
            setWallpaper,
            applyCustomWallpaper,
            // feed
            feed,
            // hub
            hub,
            // mate
            mate,
            // touch events
            startY, handleTouchMove, handleTouchEnd,
        };

        console.log('final return object:', returnObject);
        return returnObject;

    } catch (error) {
        console.error('setup 同步错误:', error);
        return {};
    }
}