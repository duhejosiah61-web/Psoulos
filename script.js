// =========================================================================
// == SOUL OS SCRIPT INDEX
// =========================================================================
//
// 1. VUE APPLICATION ROOT (Vue应用根实例)
//    - createApp({ setup })
//
// 2. CORE STATE & UI (核心状态与UI)
//    - currentTime: Ref<String> - 当前时间 (HH:mm:ss)
//    - currentDate: Ref<String> - 当前日期
//    - aiStatus: Ref<String> - 主屏幕AI状态 (IDLE, THINKING...)
//    - activePage: Ref<Number> - 主屏幕当前页面 (1-BAY, 2-DECK, 3-RACK)
//    - openedApp: Ref<String|null> - 当前打开的全屏App名称 (e.g., 'Console')
//    - isHomeScreenVisible: Computed<Boolean> - 计算主屏幕是否可见
//    - faderLeft: Computed<Number> - 主屏幕页面切换推子的位置
//    - startDrag(), onDrag(), stopDrag(): 主屏幕页面切换推子的拖动逻辑
//    - openApp(appName): 打开指定的App
//    - closeApp(): 关闭当前打开的App
//
// 3. PERSISTENCE (数据持久化)
//    - saveToStorage(key, data): 将数据保存到localStorage
//    - loadFromStorage(key): 从localStorage加载数据
//
// 4. WORKSHOP APP (工作室App)
//    - activeWorkshopTab: Ref<String> - 当前激活的标签页 (characters, worldbooks, presets)
//
//    -- 4.1. Characters (角色管理)
//       - characters: Ref<Array> - 所有角色对象的列表
//       - editingCharacter: Ref<Object|null> - 当前正在编辑的角色
//       - saveCharacters(): 保存角色列表到localStorage
//       - loadCharacters(): 从localStorage加载角色列表
//       - addNewCharacter(): 创建一个新角色并添加到列表
//       - editCharacter(char): 打开角色编辑器
//       - saveCharacterChanges(): 保存对当前编辑角色的修改
//       - deleteCharacter(charId): 删除一个角色
//       - addKvPairToCharacter(), removeKvPairFromCharacter(): 编辑角色的KV数据
//
//    -- 4.2. Worldbooks (世界书管理)
//       - worldbooks: Ref<Array> - 所有世界书对象的列表
//       - editingWorldbook: Ref<Object|null> - 当前正在编辑的世界书
//       - saveWorldbooks(), loadWorldbooks(): 保存和加载世界书
//       - addNewWorldbook(): 创建一个新的世界书
//       - editWorldbook(wb), saveWorldbookChanges(), deleteWorldbook(wbId): 世界书的增删改
//       - addNewWorldbookEntry(wb), deleteWorldbookEntry(wb, entryId): 世界书条目的增删
//
//    -- 4.3. Presets (预设管理)
//       - presets: Ref<Array> - 所有AI预设对象的列表
//       - editingPreset: Ref<Object|null> - 当前正在编辑的预设
//       - savePresets(), loadPresets(): 保存和加载预设
//       - addNewPreset(): 创建一个新预设
//       - editPreset(p), savePresetChanges(), deletePreset(presetId): 预设的增删改
//
// 5. CONSOLE APP & AI COMMUNICATION (控制台App与AI通信核心)
//    - consoleLogs: Ref<Array> - 控制台日志记录
//    - profiles: Ref<Array> - 所有AI服务商的配置文件列表
//    - activeProfileId: Ref<String|null> - 当前激活的配置文件ID
//    - availableModels: Ref<Array> - 可用的模型列表
//    - fetchingModels: Ref<Boolean> - 是否正在获取模型列表的状态
//    - showApiKey: Ref<Boolean> - 是否显示API Key
//    - activeProfile: Computed<Object|null> - 计算得出的当前激活的配置文件
//    - saveProfiles(), loadProfiles(): 保存和加载AI配置文件
//    - addNewProfile(): 创建一个新的AI配置文件
//    - deleteProfile(profileId): 删除一个AI配置文件
//    - setActiveProfile(profileId): 设置当前激活的配置文件
//    - fetchModels(): 根据当前配置文件的URL获取可用的AI模型
//    - sendTestMessage(): 发送一条测试消息来验证API配置
//    - createChatCompletion(payload, onChunk, onDone, onError): [核心] 创建聊天请求，支持流式和非流式
//    - logToConsole(message, type): 向控制台App界面输出日志
//
// 6. LIFECYCLE & INITIALIZATION (生命周期与初始化)
//    - onMounted(): Vue组件挂载后执行的初始化函数
//      - 加载所有持久化数据 (角色, 世界书, 预设, AI配置)
//      - 设置定时器更新时间和日期
//
// =========================================================================



const { createApp, ref, computed, onMounted, watch } = Vue;

createApp({
    setup() {
        // --- DATA (State) ---
        const currentTime = ref('');
        const currentDate = ref('');
        const aiStatus = ref('IDLE');
        const activePage = ref(2);
        const openedApp = ref(null);
        const chatTargetId = ref(null); 
        const chatHistory = ref([]); 
        const userInput = ref(''); 
        const faderContainer = ref(null);
        const isDragging = ref(false);
        const dragPercent = ref(50);
        const isAiTyping = ref(false);
        const isVideoCalling = ref(false); // 用于控制视频通话覆盖层的显示状态
        const rabbitView = ref('list');
        const rabbitChats = ref([]);
        const rabbitActiveChatId = ref(null);
        const rabbitInput = ref('');
        const rabbitIsTyping = ref(false);
        const rabbitShowEmojiPanel = ref(false);
        const rabbitContextMenu = ref({ visible: false, x: 0, y: 0, msg: null });
        const rabbitReplyTarget = ref(null);
        const rabbitChatHistoryRef = ref(null);
        
        // 新的消息类型渲染逻辑
        const renderSpecialMessage = (content) => {
            // 这个函数未来可以扩展，用于解析AI返回的特殊格式文本
            // 例如：AI返回 "[POLL] Question? | Option A | Option B"
            // 这里暂时简化处理，直接返回对象
            return content;
        };
        
        // 核心：触发特殊聊天动作的函数
        const triggerChatAction = (type) => {
            const time = currentTime.value.substring(0, 5); // 格式化时间为 HH:mm
        
            let specialContent = {};
        
            switch(type) {
                case 'transfer':
                    const amount = prompt("输入转账金额 (CREDITS):", "100");
                    if (!amount || isNaN(parseFloat(amount))) return;
                    specialContent = { 
                        type: 'transfer', 
                        data: { amount: parseFloat(amount).toFixed(2), status: 'SENT' } 
                    };
                    // 模拟对方接收
                    setTimeout(() => { 
                        const targetMsg = chatHistory.value.find(m => m.content.data === specialContent.data);
                        if (targetMsg) targetMsg.content.data.status = 'CONFIRMED';
                    }, 2500);
                    break;
        
                case 'waimai':
                    specialContent = { 
                        type: 'waimai', 
                        data: { order: "合成营养膏 x2", store: "「夜之城」补给站", status: "订单已发送" }
                    };
                    // 模拟状态更新
                    setTimeout(() => {
                        const targetMsg = chatHistory.value.find(m => m.content.data === specialContent.data);
                        if (targetMsg) targetMsg.content.data.status = "正在备货...";
                    }, 3000);
                    break;
        
                case 'location':
                    specialContent = { 
                        type: 'location', 
                        data: { name: "A-51区 信号塔", coords: "37.2350° N, 115.8111° W" } 
                    };
                    break;
        
                case 'poll':
                    const question = prompt("输入投票问题:", "选择下一个任务目标？");
                    if (!question) return;
                    const opt1 = prompt("选项 1:", "摧毁核心");
                    const opt2 = prompt("选项 2:", "窃取数据");
                    if (!opt1 || !opt2) return;
                    specialContent = {
                        type: 'poll',
                        data: { question, options: [{text: opt1, votes:0}, {text: opt2, votes:0}] }
                    };
                    break;
        
                case 'share':
                    const url = prompt("输入分享链接:", "https://my.soul.os/internal/doc-001");
                    if (!url) return;
                    const title = prompt("输入链接标题:", "机密档案：创世纪计划");
                    specialContent = { 
                        type: 'share', 
                        data: { url, title } 
                    };
                    break;
        
                case 'video':
                    isVideoCalling.value = true;
                    return; // 视频通话不产生聊天记录
                    
                default:
                    return; // 未知类型则不处理
            }
            
            // 将特殊消息添加到聊天记录
            chatHistory.value.push({ 
                role: 'user', 
                content: specialContent,
                time 
            });
        };
        
        // 投票功能
        const castVote = (message, optionIndex) => {
            // 确保是投票类型的消息
            if(message.content.type === 'poll'){
                message.content.data.options[optionIndex].votes++;
            }
        };
        
        // ▲▲▲ SOULLINK APP 功能注入结束 ▲▲▲
        
        // Console App State
        const consoleLogs = ref([]);
        const profiles = ref([]);
        const activeProfileId = ref(null);
        const availableModels = ref([]);
        const fetchingModels = ref(false);
        const showApiKey = ref(false);

        // ==========================================================
        // --- Workshop App State (CORRECTED STRUCTURE) ---
        // ==========================================================
        const activeWorkshopTab = ref('characters');
        
        // --- Characters Data ---
        const characters = ref([]); 
        const editingCharacter = ref(null); 
        
        // --- Worldbooks Data ---
        const worldbooks = ref([]);
        const editingWorldbook = ref(null);
        const activeWorldbookEntryId = ref(null);
        const swipedWorldbookId = ref(null); // Track swiped state
        const expandedEntryIds = ref(new Set());

        // --- Presets Data ---
        const presets = ref([]);
        const editingPreset = ref(null);
        const swipedPresetId = ref(null); // Track swiped state
        const presetImportInput = ref(null);

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

        const formatRabbitTime = (timestamp) => {
            return new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        };

        const activeRabbitChat = computed(() => {
            return rabbitChats.value.find(c => c.id === rabbitActiveChatId.value) || null;
        });

        const activeRabbitMessages = computed(() => {
            return activeRabbitChat.value && Array.isArray(activeRabbitChat.value.history) ? activeRabbitChat.value.history : [];
        });

        const saveRabbitChats = () => {
            saveToStorage('soulos_rabbit_chats', rabbitChats.value);
        };

        const loadRabbitChats = () => {
            const loaded = loadFromStorage('soulos_rabbit_chats');
            if (Array.isArray(loaded)) {
                rabbitChats.value = loaded.map(chat => ({
                    ...chat,
                    history: Array.isArray(chat.history) ? chat.history : []
                }));
            }
            if (rabbitChats.value.length === 0) {
                const now = Date.now();
                rabbitChats.value = [{
                    id: now,
                    name: '兔K助手',
                    avatar: '',
                    history: [{
                        id: now + 1,
                        sender: 'ai',
                        text: '你好，我在这里。',
                        timestamp: now + 1
                    }],
                    lastMessage: '你好，我在这里。',
                    lastTime: formatRabbitTime(now + 1)
                }];
            }
        };

        const scrollRabbitToBottom = () => {
            setTimeout(() => {
                const el = rabbitChatHistoryRef.value || document.querySelector('.rabbit-chat-history');
                if (el) el.scrollTop = el.scrollHeight;
            }, 100);
        };

        const openRabbitChat = (id) => {
            rabbitActiveChatId.value = id;
            rabbitView.value = 'chat';
            scrollRabbitToBottom();
        };

        const backToRabbitList = () => {
            rabbitActiveChatId.value = null;
            rabbitView.value = 'list';
        };

        const createRabbitChat = () => {
            const name = prompt('输入聊天对象名称:', '新聊天');
            if (!name) return;
            const avatar = prompt('输入头像URL(可空):', '') || '';
            const now = Date.now();
            const newChat = {
                id: now,
                name: name.trim(),
                avatar,
                history: [],
                lastMessage: '',
                lastTime: ''
            };
            rabbitChats.value.unshift(newChat);
            rabbitActiveChatId.value = newChat.id;
            rabbitView.value = 'chat';
        };

        const insertRabbitEmoji = (emoji) => {
            rabbitInput.value += emoji;
            rabbitShowEmojiPanel.value = false;
        };

        const openRabbitContextMenu = (event, msg) => {
            rabbitContextMenu.value = {
                visible: true,
                x: event.clientX,
                y: event.clientY,
                msg
            };
        };

        const closeRabbitContextMenu = () => {
            rabbitContextMenu.value.visible = false;
        };

        const handleRabbitContextAction = (action) => {
            const msg = rabbitContextMenu.value.msg;
            if (!msg || !activeRabbitChat.value) return;
            const chat = activeRabbitChat.value;
            if (action === 'copy') {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(msg.text || '');
                }
            }
            if (action === 'reply') {
                rabbitReplyTarget.value = msg;
            }
            if (action === 'edit') {
                if (msg.sender === 'user' && !msg.isSystem) {
                    const next = prompt('编辑消息:', msg.text || '');
                    if (next !== null && next.trim()) msg.text = next.trim();
                }
            }
            if (action === 'delete') {
                const index = chat.history.findIndex(m => m.id === msg.id);
                if (index !== -1) chat.history.splice(index, 1);
            }
            closeRabbitContextMenu();
        };

        const sendRabbitMessage = async (triggerApi) => {
            const text = rabbitInput.value.trim();
            if (!text || !activeRabbitChat.value) return;
            const chat = activeRabbitChat.value;
            const now = Date.now();
            const newMsg = {
                id: now,
                sender: 'user',
                text,
                timestamp: now
            };
            if (rabbitReplyTarget.value) {
                newMsg.replyTo = {
                    id: rabbitReplyTarget.value.id,
                    text: rabbitReplyTarget.value.text,
                    sender: rabbitReplyTarget.value.sender
                };
            }
            chat.history.push(newMsg);
            chat.lastMessage = text;
            chat.lastTime = formatRabbitTime(now);
            rabbitInput.value = '';
            rabbitReplyTarget.value = null;
            scrollRabbitToBottom();
            if (!triggerApi) return;

            if (!activeProfile.value) {
                chat.history.push({
                    id: now + 2,
                    sender: 'ai',
                    text: '未检测到任何 API 配置，请先在 Console 中创建并选择一个配置。',
                    timestamp: now + 2,
                    isSystem: true
                });
                scrollRabbitToBottom();
                return;
            }

            const profile = activeProfile.value;
            const endpoint = (profile.endpoint || '').trim();
            const key = (profile.key || '').trim();

            if (!endpoint || !key) {
                chat.history.push({
                    id: now + 3,
                    sender: 'ai',
                    text: '当前配置缺少 API 地址或密钥，请在 Console 中补全后重试。',
                    timestamp: now + 3,
                    isSystem: true
                });
                scrollRabbitToBottom();
                return;
            }

            let modelId = profile.model;
            if (!modelId && availableModels.value.length > 0) {
                modelId = availableModels.value[0].id;
                profile.model = modelId;
            }

            const messagesPayload = [];
            const systemPrompt = `你正在通过兔K聊天和用户对话。请像真人一样自然、简短地回复，每次1-3句话即可。可以用emoji和口语化表达。`;
            messagesPayload.push({ role: 'system', content: systemPrompt });
            chat.history.forEach(m => {
                if (m.isSystem) return;
                if (m.sender === 'user') {
                    messagesPayload.push({ role: 'user', content: m.text });
                } else if (m.sender === 'ai') {
                    messagesPayload.push({ role: 'assistant', content: m.text });
                }
            });

            rabbitIsTyping.value = true;
            scrollRabbitToBottom();

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

                rabbitIsTyping.value = false;
                const separator = '---';
                if (reply.includes(separator)) {
                    const parts = reply.split(separator);
                    parts.forEach((part, index) => {
                        const trimmedText = part.trim();
                        if (trimmedText) {
                            setTimeout(() => {
                                chat.history.push({
                                    id: Date.now() + index,
                                    sender: 'ai',
                                    text: trimmedText,
                                    timestamp: Date.now()
                                });
                                chat.lastMessage = trimmedText;
                                chat.lastTime = formatRabbitTime(Date.now());
                                scrollRabbitToBottom();
                            }, index * 800);
                        }
                    });
                } else {
                    chat.history.push({
                        id: Date.now() + 4,
                        sender: 'ai',
                        text: reply,
                        timestamp: Date.now()
                    });
                    chat.lastMessage = reply;
                    chat.lastTime = formatRabbitTime(Date.now());
                    scrollRabbitToBottom();
                }
            } catch (error) {
                rabbitIsTyping.value = false;
                chat.history.push({
                    id: now + 5,
                    sender: 'ai',
                    text: `请求模型时出错：${error.message}`,
                    timestamp: now + 5,
                    isSystem: true
                });
                scrollRabbitToBottom();
            }
        };

        // --- Character Actions ---
        const saveCharacters = () => saveToStorage('soulos_workshop_characters', characters.value);
        const loadCharacters = () => { 
            const loaded = loadFromStorage('soulos_workshop_characters'); 
            // Filter out nulls or invalid entries to prevent crashes
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
                openingLine: '',
                userPersona: '',
                worldbookId: '' // Link to Worldbook
            };
            characters.value.unshift(newCharacter); 
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
                if (!Array.isArray(worldbooks.value)) {
                    worldbooks.value = [];
                }
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
            // Auto-open editor
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
            
            // 【新增】自动展开新创建的条目
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
            // Close swipe if open
            if (swipedWorldbookId.value === wb.id) return; 
            swipedWorldbookId.value = null;

            // Deep copy for editing
            editingWorldbook.value = JSON.parse(JSON.stringify(wb));
            if (!editingWorldbook.value.entries) editingWorldbook.value.entries = [];
            // Select first entry if exists
            if (editingWorldbook.value.entries.length > 0) {
                activeWorldbookEntryId.value = editingWorldbook.value.entries[0].id;
            } else {
                activeWorldbookEntryId.value = null;
            }
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
            // 触发响应式更新
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

        // Computed for active entry in editor
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
             // Close swipe if open
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
                // 尝试按分隔符拆分
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
            const list = Array.isArray(data) ? data 
                : Array.isArray(data?.presets) ? data.presets 
                : (data?.preset ? [data.preset] : [data]);
            list.forEach(item => {
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
        
        // --- Character Dossier Logic & Helpers ---
        const newTagInput = ref('');
        const fileInput = ref(null);
        const characterImportInput = ref(null);

        const addTag = () => {
            if (newTagInput.value.trim() && editingCharacter.value) {
                if (!editingCharacter.value.tags) editingCharacter.value.tags = [];
                // Avoid duplicates
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

        const triggerAvatarUpload = () => {
            if (fileInput.value) {
                fileInput.value.click();
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
            // Secondary confirmation
            if (confirm('警告：确定要彻底删除该角色吗？\n此操作不可恢复，所有相关记忆将被清除。')) {
                 const index = characters.value.findIndex(c => c.id === editingCharacter.value.id);
                 if (index !== -1) {
                     characters.value.splice(index, 1);
                     editingCharacter.value = null; // Close dossier
                 }
            }
        };

        // 1. 打开档案编辑界面的函数
        const openDossier = (character) => {
            // 关键：创建一个角色的“深拷贝”副本进行编辑。
            const copy = JSON.parse(JSON.stringify(character));
            
            // 数据迁移/初始化：确保旧数据也有新字段
            if (!copy.tags) copy.tags = [];
            if (!copy.kvData) copy.kvData = [];
            if (!copy.internalName) copy.internalName = copy.name || `Char_${copy.id}`;
            if (!copy.nickname) copy.nickname = copy.name || '未命名';
            if (!copy.openingLine) copy.openingLine = '';
            if (!copy.userPersona) copy.userPersona = '';
            
            editingCharacter.value = copy;
        };

        // 2. 保存修改的函数
        const saveDossier = () => {
            if (!editingCharacter.value) return;
            editingCharacter.value.name = editingCharacter.value.nickname || editingCharacter.value.internalName || '未命名角色';

            // 在原始 characters 数组中找到要更新的角色
            const index = characters.value.findIndex(c => c.id === editingCharacter.value.id);
            if (index !== -1) {
                // 用编辑后的对象替换掉原始对象
                characters.value[index] = editingCharacter.value;
            }
            
            // 关闭编辑界面
            editingCharacter.value = null;
            // 注意：我们不需要在这里手动调用 saveCharacters()，
            // 因为您已经设置了 watch(characters, ..., { deep: true })，
            // 它会自动侦测到变化并保存到 localStorage，非常棒！
        };

        // 3. 取消编辑的函数
        const cancelDossier = () => {
            // 直接关闭编辑界面，不做任何事
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

        // ==========================================================
        // --- END OF WORKSHOP STATE ---
        // ==========================================================


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

        const faderLeft = computed(() => {
            if (isDragging.value) return dragPercent.value;
            return snapToPage(activePage.value, false);
        });

        // --- METHODS ---
        const updateTime = () => {
            const now = new Date();
            currentTime.value = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            currentDate.value = now.toLocaleDateString('en-CA');
        };

        const openApp = (appName) => {
            openedApp.value = appName;
            console.log(`[System] Opening App: ${appName}`);
            
            if (appName === 'Console') {
                loadProfiles();
            } else if (appName === 'SoulLink') {
                // Ensure tab is reset and characters are loaded
                if (!['ch_list', 'msg', 'feed', 'id'].includes(soulLinkTab.value)) {
                    soulLinkTab.value = 'ch_list';
                }
                console.log(`[SoulLink] Tab: ${soulLinkTab.value}, Characters: ${characters.value.length}`);
                // Force check characters
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

        // --- Drag Handlers with Safety Checks ---
        const startDrag = (e) => {
            if (!faderContainer.value) return;
            isDragging.value = true;
            handleDrag(e);
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchmove', handleDrag, { passive: false });
            document.addEventListener('touchend', stopDrag);
        };

        const handleDrag = (e) => {
            if (!isDragging.value || !faderContainer.value) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const rect = faderContainer.value.getBoundingClientRect();
            const padding = 20;
            const trackWidth = rect.width - (padding * 2);
            let relativeX = clientX - rect.left - padding;
            if (relativeX < 0) relativeX = 0;
            if (relativeX > trackWidth) relativeX = trackWidth;
            const pct = (relativeX / trackWidth) * 100;
            dragPercent.value = pct;

            if (pct < 33) activePage.value = 1;
            else if (pct > 66) activePage.value = 3;
            else activePage.value = 2;
        };

        const stopDrag = () => {
            if (!isDragging.value) return;
            isDragging.value = false;
            snapToPage(activePage.value);
            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', handleDrag);
            document.removeEventListener('touchend', stopDrag);
        };
        
        const snapToPage = (page, isAction = true) => {
            let pct = 50;
            if (page === 1) pct = 15;
            else if (page === 3) pct = 85;
            if (isAction && faderContainer.value) {
                dragPercent.value = pct;
            }
            return pct;
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
                saveProfiles(); // Save deletion
                if (profiles.value.length > 0) {
                    activeProfileId.value = profiles.value[0].id;
                } else {
                    activeProfileId.value = null;
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
            updateTime();
            setInterval(updateTime, 1000);
            if (faderContainer.value) {
                snapToPage(activePage.value);
            }
            setInterval(() => {
                const statuses = ['HAPPY', 'CHILL', 'FOCUS', 'VIBING'];
                aiStatus.value = statuses[Math.floor(Math.random() * statuses.length)];
            }, 5000);
            loadCharacters();
            loadSoulLinkMessages();
            loadSoulLinkGroups();
            loadSoulLinkPet();
            loadRabbitChats();
            loadFeedPosts();
            loadUserProfile();
            setInterval(() => {
                tickPetStats();
            }, 60000);
            // 启动防护：确保默认进入手机主界面，并关闭任何残留的编辑状态
            openedApp.value = null;
            editingCharacter.value = null;
        });
        
        // CORRECT PLACEMENT for watch: Inside setup(), before return
        watch(characters, saveCharacters, { deep: true });
        // 防护：只有在 Workshop 打开时才允许显示角色档案编辑页
        
        watch(openedApp, (val, prev) => {
            if (prev === 'Console') {
                saveProfiles(true);
            }
            if (val !== 'Workshop') {
                editingCharacter.value = null;
            }
        });

        // ==========================================================
        // --- SoulLink App State & Logic ---
        // ==========================================================
        const soulLinkTab = ref('ch_list'); // ch_list, msg, feed, id
        const soulLinkActiveChat = ref(null);
        const soulLinkActiveChatType = ref('character');
        const soulLinkInput = ref('');
        const soulLinkReplyTarget = ref(null);
        const showAttachmentsMenu = ref(false);
        const soulLinkMessages = ref({}); // { charId: [ {sender: 'user'|'ai', text: '...'} ] }
        const soulLinkGroups = ref([]);
        const showGroupDialog = ref(false);
        const groupDialogMode = ref('create');
        const groupDialogName = ref('');
        const groupDialogSelectedMembers = ref([]);
        const groupDialogTargetId = ref(null);
        const showPetDialog = ref(false);
        const showLocationDialog = ref(false);
        const locationUser = ref('');
        const locationTarget = ref('');
        const locationDistance = ref('');
        const locationTrajectoryPoints = ref([]);
        const soulLinkPet = ref({
            name: 'PIXEL PET',
            emoji: '🐾',
            energy: 80,
            hunger: 20,
            mood: 70,
            lastTick: Date.now()
        });
        const saveSoulLinkMessages = () => {
            try {
                localStorage.setItem('soulos_soullink_messages', JSON.stringify(soulLinkMessages.value));
            } catch (e) {
                console.error('Failed to save SoulLink messages:', e);
            }
        };
        
        // ✅ 新增：从 localStorage 加载聊天记录
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
        const showImageDialog = ref(false);
        const showVoiceDialog = ref(false);
        const showTransferDialog = ref(false);
        const showOfflineModeDialog = ref(false);
        const showEmojiPanel = ref(false);
        const imageMode = ref('file'); // 'file' or 'text'
        const selectedImage = ref(null);
        const imageTextDescription = ref('');
        const voiceTextInput = ref('');
        const transferAmount = ref(0);
        const transferNote = ref('');
        const selectedPresets = ref([]);
        const isOfflineMode = ref(false);
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
        const openImageDialog = () => {
            showAttachmentsMenu.value = false;
            showImageDialog.value = true;
            imageMode.value = 'file';
            selectedImage.value = null;
            imageTextDescription.value = '';
        };
        const openVoiceDialog = () => {
            showAttachmentsMenu.value = false;
            showVoiceDialog.value = true;
            voiceTextInput.value = '';
        };
        const aiVoiceProbGeneral = ref(0.2);
        const aiImageProbGeneral = ref(0.15);
        const aiVoiceProbAttachment = ref(0.3);
        const aiImageProbAttachment = ref(0.2);
        const voiceDurationFactor = ref(3);
        const openTransferDialog = () => {
            showAttachmentsMenu.value = false;
            showTransferDialog.value = true;
            transferAmount.value = 0;
            transferNote.value = '';
        };
        const openOfflineModeDialog = () => {
            showAttachmentsMenu.value = false;
            showOfflineModeDialog.value = true;
            selectedPresets.value = [];
        };
        const handleImageUpload = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    selectedImage.value = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
        const sendImageMessage = () => {
            if (!soulLinkActiveChat.value) return;

            const newMsg = {
                id: Date.now(),
                sender: 'user',
                messageType: 'image',
                timestamp: Date.now()
            };
            if (soulLinkActiveChatType.value === 'group') {
                newMsg.senderName = '我';
            }
            
            if (imageMode.value === 'file' && selectedImage.value) {
                newMsg.imageUrl = selectedImage.value;
                newMsg.text = '[图片]';
            } else if (imageMode.value === 'text' && imageTextDescription.value.trim()) {
                newMsg.text = imageTextDescription.value.trim();
                newMsg.imageUrl = null;
            } else {
                return;
            }

            pushMessageToActiveChat(newMsg);
            showImageDialog.value = false;
            autoAiReplyForAttachment(newMsg);
            const charForAutoImg = soulLinkActiveChatType.value === 'character' ? characters.value.find(c => c.id === soulLinkActiveChat.value) : null;
            if (charForAutoImg) setTimeout(() => { maybeAutonomousFeedActivity(charForAutoImg.id); }, 600);
        };
        const sendVoiceMessage = () => {
            if (!soulLinkActiveChat.value || !voiceTextInput.value.trim()) return;

            const textLength = voiceTextInput.value.length;
            const duration = `0:${String(Math.min(Math.max(Math.floor(textLength / voiceDurationFactor.value), 1), 60)).padStart(2, '0')}`;

            const newMsg = {
                id: Date.now(),
                sender: 'user',
                messageType: 'voice',
                text: voiceTextInput.value.trim(),
                duration: duration,
                expanded: false,
                timestamp: Date.now()
            };
            if (soulLinkActiveChatType.value === 'group') {
                newMsg.senderName = '我';
            }
            pushMessageToActiveChat(newMsg);
            showVoiceDialog.value = false;
            autoAiReplyForAttachment(newMsg);
            const charForAuto = soulLinkActiveChatType.value === 'character' ? characters.value.find(c => c.id === soulLinkActiveChat.value) : null;
            if (charForAuto) setTimeout(() => { maybeAutonomousFeedActivity(charForAuto.id); }, 600);
        };
        const toggleVoiceExpand = (msg) => {
            msg.expanded = !msg.expanded;
        };
        const sendTransferMessage = () => {
            if (!soulLinkActiveChat.value || transferAmount.value <= 0) return;

            const newMsg = {
                id: Date.now(),
                sender: 'user',
                messageType: 'transfer',
                amount: transferAmount.value,
                note: transferNote.value.trim(),
                transferStatus: 'pending', // 'pending', 'accepted', 'rejected'
                timestamp: Date.now()
            };
            if (soulLinkActiveChatType.value === 'group') {
                newMsg.senderName = '我';
            }
            pushMessageToActiveChat(newMsg);
            showTransferDialog.value = false;
            setTimeout(() => {
                const accept = Math.random() < 0.75;
                newMsg.transferStatus = accept ? 'accepted' : 'rejected';
                const replyTextPoolAccept = ['收到了~ 谢谢', 'OK，已签收', '已收到，谢谢你'];
                const replyTextPoolReject = ['抱歉这次不收款', '暂时不方便收款', '这次先算了哈'];
                const replyText = accept 
                    ? replyTextPoolAccept[Math.floor(Math.random() * replyTextPoolAccept.length)]
                    : replyTextPoolReject[Math.floor(Math.random() * replyTextPoolReject.length)];
                pushMessageToActiveChat({
                    id: Date.now() + 1,
                    sender: 'ai',
                    text: replyText,
                    timestamp: Date.now()
                });
                syncActiveChatState();
                persistActiveChat();
            }, 2000);
        };
        const handleTransferAction = (msg, action) => {
            if (action === 'accept') {
                msg.transferStatus = 'accepted';
                // 这里可以调用 Wallet 接口进行实际的余额变动
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
        const togglePresetSelection = (presetId) => {
            const index = selectedPresets.value.indexOf(presetId);
            if (index > -1) {
                selectedPresets.value.splice(index, 1);
            } else {
                selectedPresets.value.push(presetId);
            }
        };
        const activateOfflineMode = () => {
            if (selectedPresets.value.length === 0) {
                addConsoleLog('请至少选择一个预设', 'warning');
                return;
            }
            
            isOfflineMode.value = true;
            
            // 构建预设内容
            const presetContents = selectedPresets.value.map(id => {
                const preset = presets.value.find(p => p.id === id);
                if (!preset) return '';
                if (Array.isArray(preset.segments) && preset.segments.length > 0) {
                    return preset.segments.filter(s => s.enabled && s.content).map(s => s.content).join('\n\n');
                }
                return preset.content || '';
            }).filter(c => c).join('\n\n');
            offlinePresetText.value = presetContents;
            
            // 发送系统消息
            if (soulLinkActiveChat.value) {
                pushMessageToActiveChat({
                    id: Date.now(),
                    sender: 'system',
                    text: `[线下模式已激活] 预设场景已加载`,
                    timestamp: Date.now(),
                    isSystem: true,
                    isSpecial: true
                });
                
                setTimeout(() => { generateOfflineNarrative(); }, 400);
            }
            
            showOfflineModeDialog.value = false;
            addConsoleLog('线下模式已激活', 'success');
        };
        
        const generateOfflineNarrative = async () => {
            if (!activeProfile.value) return;
            if (!soulLinkActiveChat.value) return;
            const isGroupChat = soulLinkActiveChatType.value === 'group';
            const char = isGroupChat ? null : characters.value.find(c => c.id === soulLinkActiveChat.value);
            const profile = activeProfile.value;
            const endpoint = (profile.endpoint || '').trim();
            const key = (profile.key || '').trim();
            if (!endpoint || !key) return;
            let modelId = profile.model;
            if (!modelId && availableModels.value.length > 0) {
                modelId = availableModels.value[0].id;
                profile.model = modelId;
            }
            const history = isGroupChat ? (activeGroupChat.value?.history || []) : (soulLinkMessages.value[soulLinkActiveChat.value] || []);
            const messagesPayload = [];
            let systemPrompt = '';
            if (isGroupChat) {
                systemPrompt = `离线模式已开启。根据预设生成带描写的长文本，采用小说式叙述，细节丰富、氛围浓厚、连贯自然，不要使用列表或标题。\n预设：\n${offlinePresetText.value || ''}`;
            } else if (char && char.persona) {
                const charName = char.name || '角色';
                systemPrompt = `离线模式已开启。你是【${charName}】。\n${char.persona}\n根据以下预设生成带描写的长文本，采用小说式叙述，细节丰富、氛围浓厚、连贯自然，不要使用列表或标题：\n${offlinePresetText.value || ''}`;
                if (char.worldbookId) {
                    const wb = worldbooks.value.find(w => w.id === char.worldbookId);
                    if (wb && wb.entries && wb.entries.length > 0) {
                        wb.entries.forEach(e => {
                            if (e.keyword && e.content) {
                                systemPrompt += `\n[${e.keyword}]\n${e.content}`;
                            }
                        });
                    }
                }
            } else {
                systemPrompt = `离线模式已开启。根据预设生成带描写的长文本，采用小说式叙述，细节丰富、氛围浓厚、连贯自然，不要使用列表或标题。\n预设：\n${offlinePresetText.value || ''}`;
            }
            messagesPayload.push({ role: 'system', content: systemPrompt });
            history.forEach(m => {
                if (m.isSystem || m.isHidden) return;
                const senderLabel = m.senderName || (m.sender === 'user' ? '我' : '成员');
                const ctx = buildSoulLinkReplyContext(m);
                const raw = ctx.content || (m.text || '');
                const content = senderLabel ? `${senderLabel}: ${raw}` : raw;
                if (m.sender === 'user') messagesPayload.push({ role: 'user', content });
                else if (m.sender === 'ai') messagesPayload.push({ role: 'assistant', content });
            });
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
                if (!reply && data && data.message && data.message.content) reply = data.message.content;
                if (!reply) reply = '...';
                pushMessageToActiveChat({
                    id: Date.now(),
                    sender: 'ai',
                    text: reply.trim(),
                    timestamp: Date.now()
                });
            } catch (error) {
                addConsoleLog('离线叙事生成失败：' + error.message, 'error');
            }
        };
        const insertEmoji = (emoji) => {
            soulLinkInput.value += emoji;
            showEmojiPanel.value = false;
        };
        const openLocationDialog = () => {
            showAttachmentsMenu.value = false;
            showLocationDialog.value = true;
            locationUser.value = '';
            locationTarget.value = '';
            locationDistance.value = '';
            locationTrajectoryPoints.value = [];
        };

        const addTrajectoryPoint = () => {
            if (locationTrajectoryPoints.value.length >= 3) return;
            locationTrajectoryPoints.value.push('');
        };

        const removeTrajectoryPoint = (index) => {
            locationTrajectoryPoints.value.splice(index, 1);
        };

        const sendLocationMessage = () => {
            if (!soulLinkActiveChat.value) return;
            const userLocation = locationUser.value.trim();
            const aiLocation = locationTarget.value.trim();
            const distance = locationDistance.value.trim();
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
                distance,
                trajectoryPoints,
                text: contentString,
                timestamp: Date.now()
            };
            if (soulLinkActiveChatType.value === 'group') {
                newMsg.senderName = '我';
            }
            pushMessageToActiveChat(newMsg);
            showLocationDialog.value = false;
            autoAiReplyForAttachment(newMsg);
            const charForAutoLoc = soulLinkActiveChatType.value === 'character' ? characters.value.find(c => c.id === soulLinkActiveChat.value) : null;
            if (charForAutoLoc) setTimeout(() => { maybeAutonomousFeedActivity(charForAutoLoc.id); }, 600);
        };

        

        const feedPosts = ref([]);
        const showFeedPostDialog = ref(false);
        const feedPostDialogMode = ref('create');
        const editingFeedPostId = ref(null);
        const feedPostForm = ref({
            authorId: 'user',
            type: 'shuoshuo',
            aiSource: 'daily',
            content: '',
            publicText: '',
            imageUrl: '',
            imageUrlsText: '',
            hiddenContent: '',
            areCommentsVisible: true
        });
        const isFeedPostSubmitting = ref(false);
        const feedCommentText = ref({});
        const feedCommentReplyTo = ref({});
        const feedRevealedTextImages = ref({});
        const showFeedNpcDialog = ref(false);
        const feedNpcChoice = ref('all');
        const feedNpcTargetPostId = ref(null);
        
        // ID State
        const userProfile = ref({
            name: 'Commander',
            id: 'USR-7734-X',
            avatar: 'https://via.placeholder.com/100/333/0f0?text=USR',
            bio: 'Signal Operator / Class A',
            joined: '2026-01-01'
        });
        const userAvatarInput = ref(null);

        // Context Menu State
        const contextMenu = ref({ visible: false, x: 0, y: 0, msgId: null });
        const RECALL_TIME_LIMIT_MS = 2 * 60 * 1000;

        // --- Helpers ---
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

        const feedAuthorOptions = computed(() => {
            const list = [{ id: 'user', name: userProfile.value.name }];
            characters.value.forEach(char => {
                if (!char) return;
                list.push({ id: char.id, name: char.nickname || char.name || `角色${char.id}` });
            });
            return list;
        });

        const feedNpcOptions = computed(() => {
            return feedAuthorOptions.value.filter(option => option && option.id !== 'user');
        });

        const feedStats = computed(() => {
            let drys = 0;
            let signs = 0;
            feedPosts.value.forEach(post => {
                if (post.authorId !== 'user') return;
                if (post.type === 'shuoshuo') {
                    drys += 1;
                } else {
                    signs += 1;
                }
            });
            return { drys, signs };
        });

        const activeGroupChat = computed(() => {
            return soulLinkGroups.value.find(g => g.id === soulLinkActiveChat.value) || null;
        });

        const groupMemberOptions = computed(() => {
            return characters.value.map(char => {
                const name = char.nickname || char.name || `角色${char.id}`;
                return { id: char.id, name };
            });
        });

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

        const getLocationTrajectoryPoints = (msg) => {
            const points = Array.isArray(msg.trajectoryPoints) ? msg.trajectoryPoints : [];
            if (points.length === 0) return [];
            const start = { x: 20, y: 45 };
            const end = { x: 210, y: 45 };
            const control = { x: 115, y: 10 };
            const getBezierPoint = (t) => {
                const x = (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t ** 2 * end.x;
                const y = (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t ** 2 * end.y;
                return { x, y };
            };
            return points.map((point, index) => {
                const name = typeof point === 'string' ? point : point.name;
                if (!name) return null;
                const progress = (index + 1) / (points.length + 1);
                const base = getBezierPoint(progress);
                const yOffset = index % 2 === 0 ? 18 : -10;
                const footprintY = base.y + yOffset;
                const labelY = footprintY + (yOffset > 0 ? 12 : -12);
                return {
                    name,
                    x: base.x,
                    y: footprintY,
                    labelY
                };
            }).filter(Boolean);
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

        const formatFeedTimestamp = (timestamp) => {
            if (!timestamp) return '';
            const now = new Date();
            const date = new Date(timestamp);
            const diffSeconds = Math.floor((now - date) / 1000);
            const diffMinutes = Math.floor(diffSeconds / 60);
            const diffHours = Math.floor(diffMinutes / 60);
            if (diffMinutes < 1) return '刚刚';
            if (diffMinutes < 60) return `${diffMinutes}分钟前`;
            if (diffHours < 24) return `${diffHours}小时前`;
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            if (now.getFullYear() === year) {
                return `${month}-${day} ${hours}:${minutes}`;
            }
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        };

        const getFeedAuthorName = (post) => {
            if (post.authorId === 'user') return userProfile.value.name;
            return getCharacterName(post.authorId);
        };

        const getFeedAuthorAvatar = (post) => {
            if (post.authorId === 'user') return userProfile.value.avatar;
            return getCharacterAvatar(post.authorId);
        };

        const normalizeFeedPost = (post) => {
            const likes = Array.isArray(post.likes) ? post.likes : [];
            const comments = Array.isArray(post.comments) ? post.comments : [];
            return {
                id: post.id || Date.now(),
                authorId: post.authorId ?? 'user',
                type: post.type || 'shuoshuo',
                content: post.content || '',
                publicText: post.publicText || '',
                hiddenContent: post.hiddenContent || '',
                imageUrl: post.imageUrl || '',
                imageUrls: Array.isArray(post.imageUrls) ? post.imageUrls : [],
                areCommentsVisible: post.areCommentsVisible !== false,
                likes,
                comments,
                createdAt: post.createdAt || post.timestamp || Date.now()
            };
        };

        const saveFeedPosts = () => saveToStorage('soulos_soullink_feed_posts', feedPosts.value);

        const loadFeedPosts = () => {
            const loaded = loadFromStorage('soulos_soullink_feed_posts');
            if (Array.isArray(loaded) && loaded.length > 0) {
                feedPosts.value = loaded.map(normalizeFeedPost);
                return;
            }
            const now = Date.now();
            feedPosts.value = [
                normalizeFeedPost({
                    id: now - 1,
                    authorId: characters.value[0]?.id || 'user',
                    type: 'shuoshuo',
                    content: 'Neural link established. Scanning frequencies...',
                    createdAt: now - 3600000
                }),
                normalizeFeedPost({
                    id: now,
                    authorId: 'user',
                    type: 'shuoshuo',
                    content: 'System initialization complete.',
                    createdAt: now - 300000
                })
            ];
            saveFeedPosts();
        };

        const saveUserProfile = () => saveToStorage('soulos_user_profile', userProfile.value);

        const loadUserProfile = () => {
            const loaded = loadFromStorage('soulos_user_profile');
            if (loaded) {
                userProfile.value = { ...userProfile.value, ...loaded };
            }
        };

        const triggerUserAvatarUpload = () => {
            if (userAvatarInput.value) {
                userAvatarInput.value.click();
            }
        };

        const handleUserAvatarUpload = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                userProfile.value.avatar = e.target.result;
                saveUserProfile();
            };
            reader.readAsDataURL(file);
            event.target.value = '';
        };

        const openFeedPostDialog = (mode = 'create', post = null) => {
            feedPostDialogMode.value = mode;
            editingFeedPostId.value = post ? post.id : null;
            feedPostForm.value = {
                authorId: post ? post.authorId : 'user',
                type: post ? post.type : 'shuoshuo',
                aiSource: post ? (post.aiSource || 'daily') : 'daily',
                content: post ? (post.content || '') : '',
                publicText: post ? (post.publicText || '') : '',
                imageUrl: post ? (post.imageUrl || '') : '',
                imageUrlsText: post && Array.isArray(post.imageUrls) ? post.imageUrls.join('\n') : '',
                hiddenContent: post ? (post.hiddenContent || '') : '',
                areCommentsVisible: post ? post.areCommentsVisible !== false : true
            };
            showFeedPostDialog.value = true;
        };

        const closeFeedPostDialog = () => {
            showFeedPostDialog.value = false;
        };

        const parseFeedImageUrls = (raw) => {
            if (!raw) return [];
            return raw
                .split(/[\n,]/)
                .map(u => u.trim())
                .filter(Boolean);
        };

        const buildFeedChatContext = (authorId) => {
            const key = String(authorId);
            const history = soulLinkMessages.value[key] || [];
            const tail = history.slice(-8);
            return tail.map(msg => {
                const role = msg.sender === 'user' ? '用户' : '角色';
                return `${role}: ${msg.text || ''}`.trim();
            }).filter(Boolean).join('\n');
        };

        const generateFeedPostForChar = async (authorId, mode) => {
            if (!activeProfile.value) {
                addConsoleLog('动态生成失败：未检测到 API 配置', 'error');
                return null;
            }
            const profile = activeProfile.value;
            const endpoint = (profile.endpoint || '').trim();
            const key = (profile.key || '').trim();
            if (!endpoint || !key) {
                addConsoleLog('动态生成失败：API 配置缺失', 'error');
                return null;
            }
            let modelId = profile.model;
            if (!modelId && availableModels.value.length > 0) {
                modelId = availableModels.value[0].id;
                profile.model = modelId;
            }
            const character = characters.value.find(c => String(c.id) === String(authorId));
            const charName = character ? (character.nickname || character.name || '角色') : '角色';
            const persona = character ? (character.persona || character.summary || '') : '';
            const chatContext = buildFeedChatContext(authorId);
            const useChat = mode === 'chat' && chatContext;
            const systemPrompt = [
                `你是角色「${charName}」。`,
                persona ? `人设: ${persona}` : '',
                useChat ? '请基于下方聊天记录内容，生成一条与你聊天风格一致的动态。' : '请生成一条自然的日常动态。',
                useChat ? `聊天记录:\n${chatContext}` : '',
                '要求: 1-3句，口语自然，避免引用符号，不要加标题或标签。'
            ].filter(Boolean).join('\n');
            try {
                const response = await fetch(endpoint.replace(/\/+$/, '') + '/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key}`
                    },
                    body: JSON.stringify({
                        model: modelId || '',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: '生成动态内容。' }
                        ],
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
                return reply ? reply.trim() : null;
            } catch (error) {
                addConsoleLog(`动态生成失败：${error.message}`, 'error');
                return null;
            }
        };

        const submitFeedPost = async () => {
            const form = feedPostForm.value;
            if (form.authorId !== 'user') {
                if (isFeedPostSubmitting.value) return;
                isFeedPostSubmitting.value = true;
                const content = await generateFeedPostForChar(form.authorId, form.aiSource);
                if (!content) {
                    isFeedPostSubmitting.value = false;
                    return;
                }
                const post = normalizeFeedPost({
                    id: Date.now(),
                    authorId: form.authorId,
                    type: 'shuoshuo',
                    content,
                    areCommentsVisible: form.areCommentsVisible,
                    createdAt: Date.now()
                });
                feedPosts.value.unshift(post);
                saveFeedPosts();
                showFeedPostDialog.value = false;
                isFeedPostSubmitting.value = false;
                return;
            }
            const imageUrls = parseFeedImageUrls(form.imageUrlsText);
            const nextType = form.type;
            if (nextType === 'shuoshuo' && !form.content.trim()) return;
            if (nextType === 'image_post' && !form.imageUrl.trim() && imageUrls.length === 0) return;
            if (nextType === 'text_image' && !form.hiddenContent.trim()) return;
            if (feedPostDialogMode.value === 'edit' && editingFeedPostId.value) {
                const index = feedPosts.value.findIndex(p => p.id === editingFeedPostId.value);
                if (index !== -1) {
                    const original = feedPosts.value[index];
                    feedPosts.value[index] = normalizeFeedPost({
                        ...original,
                        authorId: form.authorId,
                        type: nextType,
                        content: form.content.trim(),
                        publicText: form.publicText.trim(),
                        imageUrl: form.imageUrl.trim() || (imageUrls[0] || ''),
                        imageUrls: imageUrls,
                        hiddenContent: form.hiddenContent.trim(),
                        areCommentsVisible: form.areCommentsVisible
                    });
                }
            } else {
                const post = normalizeFeedPost({
                    id: Date.now(),
                    authorId: form.authorId,
                    type: nextType,
                    content: form.content.trim(),
                    publicText: form.publicText.trim(),
                    imageUrl: form.imageUrl.trim() || (imageUrls[0] || ''),
                    imageUrls: imageUrls,
                    hiddenContent: form.hiddenContent.trim(),
                    areCommentsVisible: form.areCommentsVisible,
                    createdAt: Date.now()
                });
                feedPosts.value.unshift(post);
            }
            saveFeedPosts();
            showFeedPostDialog.value = false;
        };

        const deleteFeedPost = (postId) => {
            const index = feedPosts.value.findIndex(p => p.id === postId);
            if (index !== -1) {
                feedPosts.value.splice(index, 1);
                saveFeedPosts();
            }
        };

        const copyFeedPost = async (post) => {
            const textParts = [];
            if (post.publicText) textParts.push(post.publicText);
            if (post.content) textParts.push(post.content);
            if (post.hiddenContent) textParts.push(post.hiddenContent);
            const payload = textParts.join('\n').trim();
            if (!payload) return;
            try {
                await navigator.clipboard.writeText(payload);
            } catch (e) {
                addConsoleLog(`Copy failed: ${e.message}`, 'error');
            }
        };

        const toggleFeedLike = (post) => {
            const name = userProfile.value.name;
            if (!post.likes) post.likes = [];
            const index = post.likes.indexOf(name);
            if (index > -1) {
                post.likes.splice(index, 1);
            } else {
                post.likes.push(name);
            }
            saveFeedPosts();
        };

        const toggleFeedFavorite = (post) => {
            post.isFavorited = !post.isFavorited;
            saveFeedPosts();
        };

        const getFeedVisibleComments = (post) => {
            const comments = Array.isArray(post.comments) ? post.comments : [];
            if (post.areCommentsVisible === false) {
                const allowNames = new Set([userProfile.value.name]);
                characters.value.forEach(char => allowNames.add(char.nickname || char.name || `角色${char.id}`));
                return comments.filter(comment => allowNames.has(comment.commenterName));
            }
            return comments;
        };

        const startFeedReply = (postId, commenterName) => {
            if (commenterName === userProfile.value.name) return;
            feedCommentReplyTo.value[postId] = commenterName;
        };

        const clearFeedReply = (postId) => {
            delete feedCommentReplyTo.value[postId];
        };

        const sendFeedComment = (post) => {
            const postId = post.id;
            const text = (feedCommentText.value[postId] || '').trim();
            if (!text) return;
            if (!post.comments) post.comments = [];
            const replyTo = feedCommentReplyTo.value[postId];
            const newComment = {
                commenterName: userProfile.value.name,
                text,
                timestamp: Date.now()
            };
            if (replyTo) newComment.replyTo = replyTo;
            post.comments.push(newComment);
            feedCommentText.value[postId] = '';
            clearFeedReply(postId);
            saveFeedPosts();
        };

        const deleteFeedComment = (post, index) => {
            if (!post.comments || !post.comments[index]) return;
            post.comments.splice(index, 1);
            saveFeedPosts();
        };

        const toggleFeedHiddenText = (postId) => {
            feedRevealedTextImages.value[postId] = !feedRevealedTextImages.value[postId];
        };

        const openFeedNpcDialog = (postId) => {
            feedNpcTargetPostId.value = postId;
            feedNpcChoice.value = 'all';
            showFeedNpcDialog.value = true;
        };

        const closeFeedNpcDialog = () => {
            showFeedNpcDialog.value = false;
        };

        const getFeedNpcCandidates = (choice) => {
            if (choice === 'all') return characters.value;
            const selected = characters.value.find(c => String(c.id) === String(choice));
            return selected ? [selected] : [];
        };

        const generateFeedNpcComments = async (post, candidates, ownerChar = null) => {
            if (!activeProfile.value) {
                addConsoleLog('NPC 评论失败：未检测到 API 配置', 'error');
                return;
            }
            if (!candidates || candidates.length === 0) return;
            const profile = activeProfile.value;
            const endpoint = (profile.endpoint || '').trim();
            const key = (profile.key || '').trim();
            if (!endpoint || !key) {
                addConsoleLog('NPC 评论失败：API 配置缺失', 'error');
                return;
            }
            const postSummary = (post.content || post.publicText || post.hiddenContent || '').slice(0, 150);
            const recentComments = (post.comments || []).slice(-3).map(c => `${c.commenterName}: ${c.text}`).join('\n');
            const npcList = candidates.slice(0, 5).map(npc => `- ${npc.nickname || npc.name || 'NPC'} (人设: ${npc.persona || '未知'})`).join('\n');
            const authorName = getFeedAuthorName(post);
            const ownerContext = ownerChar ? `这些NPC与${ownerChar.nickname || ownerChar.name || '角色'}有关联，主人设定：${ownerChar.persona || '未知'}` : '';
            const systemPrompt = [
                '你是一个多角色扮演AI，需要为一条动态生成NPC评论。',
                ownerContext ? `关系背景: ${ownerContext}` : '',
                `作者: ${authorName}`,
                `内容摘要: ${postSummary || '(图片动态)'}`,
                `最近评论:\n${recentComments || '(暂无评论)'}`,
                `NPC列表:\n${npcList}`,
                '规则：只从NPC列表中选择1-3人，每人回复1-2句，每句不超过20字，口语自然，输出严格JSON数组，格式: [{"commenterName":"NPC名字","commentText":"评论内容","replyTo":"可选"}]'
            ].filter(Boolean).join('\n');
            try {
                const response = await fetch(endpoint.replace(/\/+$/, '') + '/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key}`
                    },
                    body: JSON.stringify({
                        model: profile.model || '',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: '请生成评论。' }
                        ],
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
                if (!reply) return;
                let parsed = null;
                try {
                    parsed = JSON.parse(reply);
                } catch (e) {
                    const match = reply.match(/\[[\s\S]*\]/);
                    if (match) {
                        parsed = JSON.parse(match[0]);
                    }
                }
                if (!Array.isArray(parsed)) return;
                if (!post.comments) post.comments = [];
                parsed.forEach(item => {
                    if (!item || !item.commenterName || !item.commentText) return;
                    const comment = {
                        commenterName: item.commenterName,
                        text: item.commentText,
                        timestamp: Date.now()
                    };
                    if (item.replyTo) comment.replyTo = item.replyTo;
                    post.comments.push(comment);
                });
                saveFeedPosts();
            } catch (error) {
                addConsoleLog(`NPC 评论失败：${error.message}`, 'error');
            }
        };

        const maybeAutonomousFeedActivity = async (charId) => {
            if (!charId || !activeProfile.value) return;
            const character = characters.value.find(c => String(c.id) === String(charId));
            if (!character) return;
            const roll = Math.random();
            try {
                if (roll < 0.35) {
                    const content = await generateFeedPostForChar(charId, 'chat');
                    if (content) {
                        const post = normalizeFeedPost({
                            id: Date.now(),
                            authorId: charId,
                            type: 'shuoshuo',
                            content,
                            createdAt: Date.now()
                        });
                        feedPosts.value.unshift(post);
                        saveFeedPosts();
                    }
                    return;
                }
                if (roll < 0.75) {
                    const targets = feedPosts.value
                        .filter(p => p.authorId !== charId)
                        .slice(0, 3);
                    if (targets.length > 0) {
                        // 仅由该角色进行评论
                        await generateFeedNpcComments(targets[0], [character], character);
                    }
                }
            } catch (e) {
                addConsoleLog(`自主动态/评论失败：${e.message}`, 'error');
            }
        };

        const confirmFeedNpcSummon = async () => {
            const postId = feedNpcTargetPostId.value;
            const post = feedPosts.value.find(p => p.id === postId);
            if (!post) {
                closeFeedNpcDialog();
                return;
            }
            const candidates = getFeedNpcCandidates(feedNpcChoice.value);
            const ownerChar = feedNpcChoice.value === 'all' ? null : characters.value.find(c => String(c.id) === String(feedNpcChoice.value)) || null;
            closeFeedNpcDialog();
            await generateFeedNpcComments(post, candidates, ownerChar);
        };

        const pickGroupMember = () => {
            const pool = getGroupMemberPool();
            return pool[Math.floor(Math.random() * pool.length)];
        };

        const parseGroupReply = (raw) => {
            const match = raw.match(/^\s*([^:：]{1,12})[:：]\s*([\s\S]+)$/);
            if (match) {
                return { senderName: match[1].trim(), content: match[2].trim() };
            }
            return { senderName: pickGroupMember(), content: raw.trim() };
        };

        const findGroupByIdOrName = (raw) => {
            if (!raw) return null;
            const trimmed = raw.trim();
            const asId = Number(trimmed);
            if (!Number.isNaN(asId)) {
                const byId = soulLinkGroups.value.find(g => g.id === asId);
                if (byId) return byId;
            }
            const lowered = trimmed.toLowerCase();
            return soulLinkGroups.value.find(g => (g.name || '').toLowerCase() === lowered) || null;
        };

        const handleGroupCommand = (commandText) => {
            const raw = commandText.trim();
            const rest = raw.replace(/^\/group\s*/i, '');
            const action = rest.split(/\s+/)[0] || '';
            const payload = rest.slice(action.length).trim();
            if (action === 'list') {
                if (soulLinkGroups.value.length === 0) {
                    addSystemMessageToActiveChat('暂无群聊记录。');
                    return;
                }
                const summary = soulLinkGroups.value.map(g => `${g.name || '未命名'} (#${g.id})`).join('、');
                addSystemMessageToActiveChat(`群聊列表：${summary}`);
                return;
            }
            if (action === 'create') {
                const parts = payload.split('|');
                const name = (parts[0] || '').trim();
                if (!name) {
                    addSystemMessageToActiveChat('创建群聊失败：请提供群聊名称。');
                    return;
                }
                const members = parts[1]
                    ? parts[1].split(',').map(m => m.trim()).filter(Boolean)
                    : [];
                const group = {
                    id: Date.now(),
                    name,
                    avatar: '',
                    members,
                    history: [],
                    lastMessage: '',
                    lastTime: ''
                };
                soulLinkGroups.value.unshift(group);
                saveSoulLinkGroups();
                openSoulLinkGroupChat(group.id);
                addSystemMessageToActiveChat(`群聊已创建：${name}`);
                return;
            }
            if (action === 'open') {
                const target = findGroupByIdOrName(payload);
                if (!target) {
                    addSystemMessageToActiveChat('未找到对应群聊。');
                    return;
                }
                openSoulLinkGroupChat(target.id);
                addSystemMessageToActiveChat(`已进入群聊：${target.name || '未命名'}`);
                return;
            }
            if (action === 'delete') {
                const target = findGroupByIdOrName(payload);
                if (!target) {
                    addSystemMessageToActiveChat('未找到对应群聊。');
                    return;
                }
                deleteGroup(target.id);
                addSystemMessageToActiveChat(`群聊已删除：${target.name || '未命名'}`);
                return;
            }
            if (action === 'rename') {
                if (soulLinkActiveChatType.value !== 'group' || !activeGroupChat.value) {
                    addSystemMessageToActiveChat('请先进入需要改名的群聊。');
                    return;
                }
                const nextName = payload.trim();
                if (!nextName) {
                    addSystemMessageToActiveChat('群聊名称不能为空。');
                    return;
                }
                activeGroupChat.value.name = nextName;
                saveSoulLinkGroups();
                addSystemMessageToActiveChat(`群聊已改名为：${nextName}`);
                return;
            }
            if (action === 'members') {
                if (soulLinkActiveChatType.value !== 'group' || !activeGroupChat.value) {
                    addSystemMessageToActiveChat('请先进入需要修改成员的群聊。');
                    return;
                }
                const members = payload.split(',').map(m => m.trim()).filter(Boolean);
                activeGroupChat.value.members = members;
                saveSoulLinkGroups();
                addSystemMessageToActiveChat(`群成员已更新：${members.join('、') || '暂无'}`);
                return;
            }
            addSystemMessageToActiveChat('群聊指令无效。可用：/group list, /group create 名称|成员1,成员2, /group open 名称, /group rename 新名称, /group members 成员1,成员2, /group delete 名称');
        };

        const handlePetCommand = (commandText) => {
            const raw = commandText.trim();
            const rest = raw.replace(/^\/pet\s*/i, '');
            const action = rest.split(/\s+/)[0] || '';
            const payload = rest.slice(action.length).trim();
            if (action === 'status') {
                tickPetStats();
                addSystemMessageToActiveChat(`宠物状态：${soulLinkPet.value.name} ${soulLinkPet.value.emoji} | 能量 ${Math.round(soulLinkPet.value.energy)} | 饥饿 ${Math.round(soulLinkPet.value.hunger)} | 心情 ${Math.round(soulLinkPet.value.mood)} (${getPetMoodLabel()})`);
                return;
            }
            if (action === 'feed' || action === 'play' || action === 'rest') {
                handlePetAction(action);
                return;
            }
            if (action === 'name') {
                const nextName = payload.trim();
                if (!nextName) {
                    addSystemMessageToActiveChat('宠物名字不能为空。');
                    return;
                }
                soulLinkPet.value.name = nextName;
                saveSoulLinkPet();
                addSystemMessageToActiveChat(`宠物已更名：${nextName}`);
                return;
            }
            if (action === 'emoji') {
                const nextEmoji = payload.trim();
                if (!nextEmoji) {
                    addSystemMessageToActiveChat('宠物表情不能为空。');
                    return;
                }
                soulLinkPet.value.emoji = nextEmoji;
                saveSoulLinkPet();
                addSystemMessageToActiveChat(`宠物表情已更新：${nextEmoji}`);
                return;
            }
            addSystemMessageToActiveChat('宠物指令无效。可用：/pet status, /pet feed, /pet play, /pet rest, /pet name 新名字, /pet emoji 😀');
        };

        // --- Chat Actions ---
        const startSoulLinkChat = (charId) => {
            soulLinkActiveChat.value = charId;
            soulLinkActiveChatType.value = 'character';
            soulLinkTab.value = 'msg';
            // Initialize history if needed
            if (!soulLinkMessages.value[charId]) {
                soulLinkMessages.value[charId] = [];
                // Add opening line if exists
                const char = characters.value.find(c => c.id === charId);
                if (char && char.openingLine) {
                    soulLinkMessages.value[charId].push({
                        id: Date.now(),
                        sender: 'ai',
                        text: char.openingLine,
                        timestamp: Date.now()
                    });
                }
            }
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

        const openGroupDialog = (mode, groupId = null) => {
            groupDialogMode.value = mode;
            groupDialogTargetId.value = groupId;
            if (mode === 'manage' && groupId) {
                const target = soulLinkGroups.value.find(g => g.id === groupId);
                if (target) {
                    groupDialogName.value = target.name || '';
                    groupDialogSelectedMembers.value = Array.isArray(target.members) ? [...target.members] : [];
                }
            } else {
                groupDialogName.value = '';
                groupDialogSelectedMembers.value = [];
            }
            showGroupDialog.value = true;
        };

        const closeGroupDialog = () => {
            showGroupDialog.value = false;
        };

        const saveGroupDialog = () => {
            const name = groupDialogName.value.trim();
            if (!name) return;
            const members = [...groupDialogSelectedMembers.value];
            if (groupDialogMode.value === 'manage' && groupDialogTargetId.value) {
                const target = soulLinkGroups.value.find(g => g.id === groupDialogTargetId.value);
                if (target) {
                    target.name = name;
                    target.members = members;
                }
            } else {
                soulLinkGroups.value.unshift({
                    id: Date.now(),
                    name,
                    avatar: '',
                    members,
                    history: [],
                    lastMessage: '',
                    lastTime: ''
                });
            }
            saveSoulLinkGroups();
            showGroupDialog.value = false;
        };

        const deleteGroup = (groupId) => {
            const index = soulLinkGroups.value.findIndex(g => g.id === groupId);
            if (index !== -1) {
                soulLinkGroups.value.splice(index, 1);
                saveSoulLinkGroups();
                if (soulLinkActiveChatType.value === 'group' && soulLinkActiveChat.value === groupId) {
                    soulLinkActiveChat.value = null;
                }
            }
        };

        const openPetDialog = () => {
            showPetDialog.value = true;
        };

        const closePetDialog = () => {
            showPetDialog.value = false;
        };

        const clampPetStat = (value) => Math.max(0, Math.min(100, value));

        const tickPetStats = () => {
            const now = Date.now();
            const elapsedMinutes = (now - soulLinkPet.value.lastTick) / 60000;
            if (elapsedMinutes <= 0) return;
            soulLinkPet.value.hunger = clampPetStat(soulLinkPet.value.hunger + elapsedMinutes * 1.5);
            soulLinkPet.value.energy = clampPetStat(soulLinkPet.value.energy - elapsedMinutes * 1.2);
            soulLinkPet.value.mood = clampPetStat(soulLinkPet.value.mood - elapsedMinutes * 0.8);
            soulLinkPet.value.lastTick = now;
            saveSoulLinkPet();
        };

        const getPetMoodLabel = () => {
            if (soulLinkPet.value.mood >= 70) return 'HAPPY';
            if (soulLinkPet.value.mood >= 40) return 'NEUTRAL';
            return 'LOW';
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

        const handlePetAction = (action) => {
            tickPetStats();
            if (action === 'feed') {
                soulLinkPet.value.hunger = clampPetStat(soulLinkPet.value.hunger - 30);
                soulLinkPet.value.mood = clampPetStat(soulLinkPet.value.mood + 10);
            }
            if (action === 'play') {
                soulLinkPet.value.energy = clampPetStat(soulLinkPet.value.energy - 15);
                soulLinkPet.value.mood = clampPetStat(soulLinkPet.value.mood + 20);
                soulLinkPet.value.hunger = clampPetStat(soulLinkPet.value.hunger + 5);
            }
            if (action === 'rest') {
                soulLinkPet.value.energy = clampPetStat(soulLinkPet.value.energy + 25);
                soulLinkPet.value.mood = clampPetStat(soulLinkPet.value.mood + 5);
            }
            saveSoulLinkPet();
            if (soulLinkActiveChat.value) {
                const petMsg = {
                    id: Date.now(),
                    sender: 'ai',
                    senderName: soulLinkPet.value.name,
                    messageType: 'pet',
                    text: action === 'feed' ? '咔嚓咔嚓...能量补充完毕。' : action === 'play' ? '喵呜！再来一局！' : 'Zzz...系统待机。',
                    timestamp: Date.now()
                };
                pushMessageToActiveChat(petMsg);
            }
        };

        const handleHeaderAvatarDblClick = () => {
            if (soulLinkActiveChatType.value === 'character') {
                handlePaiYiPai(soulLinkActiveChat.value);
            }
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

        const soulLinkChatHistory = ref(null);
        const scrollToBottom = () => {
            setTimeout(() => {
                const el = document.querySelector('.chat-history');
                if (el) el.scrollTop = el.scrollHeight;
            }, 100);
        };

        const recentChats = computed(() => {
            // Convert messages map to list of recent chats
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
        
       
    
       
        const sendSoulLinkMessage = async (triggerApi) => {
            const shouldTriggerApi = triggerApi === true;
            const text = soulLinkInput.value.trim();
            if (!soulLinkActiveChat.value) return;
            if (!text) {
                addSystemMessageToActiveChat('请输入消息');
                return;
            }

            if (/^\/group\b/i.test(text)) {
                soulLinkInput.value = '';
                soulLinkReplyTarget.value = null;
                handleGroupCommand(text);
                return;
            }
            if (/^\/pet\b/i.test(text)) {
                soulLinkInput.value = '';
                soulLinkReplyTarget.value = null;
                handlePetCommand(text);
                return;
            }

            const replyContextForPrompt = soulLinkReplyTarget.value ? { ...soulLinkReplyTarget.value } : null;
            const isGroupChat = soulLinkActiveChatType.value === 'group';
            const activeGroup = isGroupChat ? activeGroupChat.value : null;
            if (isGroupChat && !activeGroup) return;
            const char = isGroupChat ? null : characters.value.find(c => c.id === soulLinkActiveChat.value);

            // 1. Add User Message
            const newMsg = {
                id: Date.now(),
                sender: 'user',
                text: text,
                timestamp: Date.now(),
                isLogOnly: !shouldTriggerApi
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
            if (!isGroupChat && char) {
                setTimeout(() => { maybeAutonomousFeedActivity(char.id); }, 600);
            }

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

                const messagesPayload = [];

                // 【核心改造 V2】构建"像人一样聊天"的系统指令
                let systemPrompt = '';
                
                if (isOfflineMode.value) {
                    if (isGroupChat) {
                        systemPrompt = `离线模式。根据预设生成带描写的长文本，采用小说式叙述，细节丰富、氛围浓厚、连贯自然，不要使用列表或标题。\n预设：\n${offlinePresetText.value || ''}`;
                    } else if (char && char.persona) {
                        const charName = char.name || '角色';
                        systemPrompt = `离线模式。你是【${charName}】。\n${char.persona}\n根据以下预设生成带描写的长文本，采用小说式叙述，细节丰富、氛围浓厚、连贯自然，不要使用列表或标题：\n${offlinePresetText.value || ''}`;
                        if (char.worldbookId) {
                            const linkedWorldbook = worldbooks.value.find(wb => wb.id === char.worldbookId);
                            if (linkedWorldbook && linkedWorldbook.entries && linkedWorldbook.entries.length > 0) {
                                linkedWorldbook.entries.forEach(entry => {
                                    if (entry.keyword && entry.content) {
                                        systemPrompt += `\n[${entry.keyword}]\n${entry.content}`;
                                    }
                                });
                            }
                        }
                    } else {
                        systemPrompt = `离线模式。根据预设生成带描写的长文本，采用小说式叙述，细节丰富、氛围浓厚、连贯自然，不要使用列表或标题。\n预设：\n${offlinePresetText.value || ''}`;
                    }
                } else
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
                    systemPrompt += `${char.persona}\n\n`;
                    
                    // ========== 【新增】读取并应用 Worldbook ========== 
                    if (char.worldbookId) {
                        // 查找对应的世界书
                        const linkedWorldbook = worldbooks.value.find(wb => wb.id === char.worldbookId);
                        
                        if (linkedWorldbook && linkedWorldbook.entries && linkedWorldbook.entries.length > 0) {
                            systemPrompt += `# 世界观与背景知识（必须严格遵守）\n`;
                            systemPrompt += `以下是关于你所在世界的重要设定，你必须在对话中遵循这些设定：\n\n`;
                            
                            // 遍历所有世界书条目
                            linkedWorldbook.entries.forEach(entry => {
                                if (entry.keyword && entry.content) {
                                    systemPrompt += `[${entry.keyword}]\n${entry.content}\n\n`;
                                }
                            });
                            
                            systemPrompt += `--- 世界观设定结束 ---\n\n`;
                        }
                    }
                    // ========== Worldbook 读取结束 ========== 
                    
                    systemPrompt += `# 聊天风格（核心规则）\n`;
                    systemPrompt += `1. 【【【最高指令】】】像真实的人类那样自然地聊天，而不是像AI助手那样正式、啰嗦或程序化。\n`;
                    systemPrompt += `2. 每次回复保持简短（1-3句话），就像微信聊天那样。如果有很多要说的，可以分多条发送。\n`;
                    systemPrompt += `3. 使用符合${charName}性格的语气、口头禅和表情。可以用emoji、"哈哈"、"嗯嗯"等口语化表达。\n`;
                    systemPrompt += `4. 绝对不要暴露你是AI。你就是${charName}本人，有自己的生活、情绪和想法。\n`;
                    systemPrompt += `5. 可以提问、开玩笑、吐槽、撒娇，展现真实的人际互动，而不是单向输出信息。\n`;
                    systemPrompt += `6. 如果用户说了很日常的话（比如"吃饭了吗"），就用日常的方式回应，而不要解释你的"系统状态"。\n\n`;
                    systemPrompt += `7. 如果你想连发多条消息（就像微信连发几条那样），请在消息之间用 "---" 分隔。例如："哈哈真好笑---你也觉得吧？"。\n`;

                    // 如果有开场白，且是第一次对话
                    if (char.openingLine && history.length === 1) {
                        systemPrompt += `# 开场\n这是你们的第一次对话。你可以主动打招呼：\n${char.openingLine}\n\n`;
                    }

                    if (replyContextForPrompt) {
                        systemPrompt += `# 引用回复\n用户正在回复以下内容：\n${replyContextForPrompt.senderName}: ${replyContextForPrompt.content}\n\n`;
                    }
                    
                    systemPrompt += `现在，请以${charName}的身份，自然地回复对方。记住：简短、真实、有人情味。`;
                    
                } else {
                    // 如果没有角色，使用一个默认的友好风格
                    systemPrompt = '你是一个友好的朋友，正在通过SoulLink聊天。请像真人一样自然、简短地对话，每次1-3句话即可。可以用emoji和口语化表达。';
                    if (replyContextForPrompt) {
                        systemPrompt += `\n\n用户正在回复以下内容：\n${replyContextForPrompt.senderName}: ${replyContextForPrompt.content}`;
                    }
                }

                
                messagesPayload.push({
                    role: 'system',
                    content: systemPrompt
                });
                
                history.forEach(m => {
                    if (m.isSystem || m.isHidden) return;
                    const senderLabel = m.senderName || (m.sender === 'user' ? '我' : '成员');
                    const ctx = buildSoulLinkReplyContext(m);
                    const raw = ctx.content || (m.text || '');
                    const content = senderLabel ? `${senderLabel}: ${raw}` : raw;
                    if (m.sender === 'user') {
                        messagesPayload.push({ role: 'user', content });
                    } else if (m.sender === 'ai') {
                        messagesPayload.push({ role: 'assistant', content });
                    }
                });

                messagesPayload.push({ role: 'user', content: isGroupChat ? `我: ${text}` : text });

                isAiTyping.value = true; // 开启"正在输入..."状态
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
                            pushMessageToActiveChat({
                                id: Date.now() + index,
                                sender: 'ai',
                                senderName: parsed.senderName,
                                text: parsed.content,
                                timestamp: Date.now()
                            });
                        } else {
                            const roll = Math.random();
                            if (roll < aiVoiceProbGeneral.value) {
                                const len = Math.max(1, Math.min(60, Math.floor(trimmedText.length / 3)));
                                pushMessageToActiveChat({
                                    id: Date.now() + index,
                                    sender: 'ai',
                                    messageType: 'voice',
                                    text: trimmedText,
                                    duration: `0:${String(len).padStart(2, '0')}`,
                                    expanded: false,
                                    timestamp: Date.now()
                                });
                            } else if (roll < aiVoiceProbGeneral.value + aiImageProbGeneral.value) {
                                pushMessageToActiveChat({
                                    id: Date.now() + index,
                                    sender: 'ai',
                                    messageType: 'image',
                                    imageUrl: null,
                                    text: trimmedText,
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
                systemPrompt += `1. 像真实的人类那样自然地聊天。\n2. 回复保持简短（1-3句）。\n3. 使用符合角色的语气与口头禅。`;
            } else if (!isGroupChat) {
                systemPrompt = '你是一个友好的朋友，正在通过SoulLink聊天。请自然、简短地对话。';
            } else {
                const groupName = activeGroup && activeGroup.name ? activeGroup.name : '群聊';
                const members = activeGroup && Array.isArray(activeGroup.members) && activeGroup.members.length > 0 ? activeGroup.members : ['成员A', '成员B', '成员C'];
                systemPrompt = `你正在群聊【${groupName}】中与用户交流附件内容。\n\n`;
                systemPrompt += `群成员\n${members.join('、')}\n\n`;
                systemPrompt += `回复要简短自然。每次回复以其中一名成员口吻，格式为「成员名: 内容」。`;
            }
            messagesPayload.push({ role: 'system', content: systemPrompt });
            history.forEach(m => {
                if (m.isSystem || m.isHidden) return;
                const senderLabel = m.senderName || (m.sender === 'user' ? '我' : '成员');
                const ctx = buildSoulLinkReplyContext(m);
                const raw = ctx.content || (m.text || '');
                const content = senderLabel ? `${senderLabel}: ${raw}` : raw;
                if (m.sender === 'user') {
                    messagesPayload.push({ role: 'user', content });
                } else if (m.sender === 'ai') {
                    messagesPayload.push({ role: 'assistant', content });
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
                const separator = '---';
                const appendAi = (rawText, index = 0) => {
                    const trimmedText = rawText.trim();
                    if (!trimmedText) return;
                    const roll = Math.random();
                    const voiceCut = aiVoiceProbAttachment.value;
                    const imageCut = aiVoiceProbAttachment.value + aiImageProbAttachment.value;
                    if (!isGroupChat) {
                        if (roll < voiceCut) {
                            const len = Math.max(1, Math.min(60, Math.floor(trimmedText.length / voiceDurationFactor.value)));
                            pushMessageToActiveChat({
                                id: Date.now() + index,
                                sender: 'ai',
                                messageType: 'voice',
                                text: trimmedText,
                                duration: `0:${String(len).padStart(2, '0')}`,
                                expanded: false,
                                timestamp: Date.now()
                            });
                        } else if (roll < imageCut) {
                            pushMessageToActiveChat({
                                id: Date.now() + index,
                                sender: 'ai',
                                messageType: 'image',
                                imageUrl: null,
                                text: trimmedText,
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
                    } else {
                        const parsed = parseGroupReply(trimmedText);
                        if (roll < voiceCut) {
                            const len = Math.max(1, Math.min(60, Math.floor(trimmedText.length / voiceDurationFactor.value)));
                            pushMessageToActiveChat({
                                id: Date.now() + index,
                                sender: 'ai',
                                senderName: parsed.senderName,
                                messageType: 'voice',
                                text: parsed.content,
                                duration: `0:${String(len).padStart(2, '0')}`,
                                expanded: false,
                                timestamp: Date.now()
                            });
                        } else if (roll < imageCut) {
                            pushMessageToActiveChat({
                                id: Date.now() + index,
                                sender: 'ai',
                                senderName: parsed.senderName,
                                messageType: 'image',
                                imageUrl: null,
                                text: parsed.content,
                                timestamp: Date.now()
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
        
        const offlinePresetText = ref('');

        const switchSoulLinkTab = (tab) => {
            soulLinkTab.value = tab;
        };

        // --- Advanced Interactions ---
        const handlePaiYiPai = (charId) => {
            const isGroup = soulLinkActiveChatType.value === 'group' && soulLinkActiveChat.value === charId;
            if (isGroup) {
                pushMessageToActiveChat({
                    id: Date.now(),
                    sender: 'system',
                    text: `You patted ${getCharacterName(charId)}'s head.`,
                    timestamp: Date.now(),
                    isSystem: true
                });
                return;
            }
            if (!soulLinkMessages.value[charId]) soulLinkMessages.value[charId] = [];
            soulLinkMessages.value[charId].push({
                id: Date.now(),
                sender: 'system',
                text: `You patted ${getCharacterName(charId)}'s head.`,
                timestamp: Date.now(),
                isSystem: true
            });
            scrollToBottom();
            console.log("Pai Yi Pai Sound");
        };

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
                    // ✅ 增强：检查时间限制
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
                    
                    // 执行撤回
                    if (index !== -1) {
                        // 保存原始数据
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
                        
                        // 修改消息为"已撤回"状态
                        chatMsgs[index] = {
                            ...chatMsgs[index],
                            messageType: 'text',
                            text: '你撤回了一条消息',
                            recalledData: recalledData,
                            isRecalled: true,
                            isSystem: true
                        };
                        
                        // 清理不再需要的属性
                        delete chatMsgs[index].imageUrl;
                        delete chatMsgs[index].amount;
                        delete chatMsgs[index].note;
                        delete chatMsgs[index].duration;
                        delete chatMsgs[index].userLocation;
                        delete chatMsgs[index].aiLocation;
                        delete chatMsgs[index].distance;
                        delete chatMsgs[index].trajectoryPoints;
                        
                        // ✅ 给AI发送隐藏系统提示
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

        const showStarDialog = ref(false);
        const openStarDialog = () => { showStarDialog.value = true; };
        const starList = computed(() => {
            const list = [];
            for (const [cid, msgs] of Object.entries(soulLinkMessages.value)) {
                const name = getCharacterName(Number(cid));
                msgs.filter(m => m.isStarred).forEach(m => {
                    list.push({
                        key: `c-${cid}-${m.id}`,
                        chatId: Number(cid),
                        chatType: 'character',
                        chatName: name,
                        msgId: m.id,
                        text: m.text || '',
                        time: new Date(m.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                    });
                });
            }
            soulLinkGroups.value.forEach(g => {
                const name = g.name || 'GROUP SIGNAL';
                (g.history || []).filter(m => m.isStarred).forEach(m => {
                    list.push({
                        key: `g-${g.id}-${m.id}`,
                        chatId: g.id,
                        chatType: 'group',
                        chatName: name,
                        msgId: m.id,
                        text: m.text || '',
                        time: new Date(m.timestamp || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                    });
                });
            });
            return list;
        });
        const deleteStarItem = (item) => {
            if (item.chatType === 'group') {
                const g = soulLinkGroups.value.find(x => x.id === item.chatId);
                if (!g || !Array.isArray(g.history)) return;
                const idx = g.history.findIndex(m => m.id === item.msgId);
                if (idx !== -1) {
                    g.history[idx].isStarred = false;
                    syncActiveChatState();
                    persistActiveChat();
                }
                return;
            }
            const msgs = soulLinkMessages.value[item.chatId] || [];
            const idx = msgs.findIndex(m => m.id === item.msgId);
            if (idx !== -1) {
                msgs[idx].isStarred = false;
                syncActiveChatState();
                persistActiveChat();
            }
        };

        // --- Feed Actions ---
        const requestFeedUpdate = () => {
            addConsoleLog("Requesting Feed Update...", "info");
            
            let charId = 0;
            let charName = 'System';
            if (characters.value.length > 0) {
                const randomChar = characters.value[Math.floor(Math.random() * characters.value.length)];
                charId = randomChar.id;
                charName = randomChar.nickname || randomChar.name || 'System';
            }

            setTimeout(() => {
                const post = normalizeFeedPost({
                    id: Date.now(),
                    authorId: charId || 'user',
                    type: 'shuoshuo',
                    content: `Status update from ${charName}: All systems nominal. Ready for interaction.`,
                    createdAt: Date.now()
                });
                feedPosts.value.unshift(post);
                saveFeedPosts();
            }, 1500);
        };

        // ✅ Watch for auto-save (must be after all ref declarations)
        watch(soulLinkMessages, saveSoulLinkMessages, { deep: true });
        watch(soulLinkGroups, saveSoulLinkGroups, { deep: true });
        watch(soulLinkPet, saveSoulLinkPet, { deep: true });
        watch(feedPosts, saveFeedPosts, { deep: true });
        watch(userProfile, saveUserProfile, { deep: true });
        watch(() => feedPostForm.value.authorId, (next) => {
            if (next !== 'user') {
                feedPostForm.value.type = 'shuoshuo';
                feedPostForm.value.content = '';
                feedPostForm.value.publicText = '';
                feedPostForm.value.imageUrl = '';
                feedPostForm.value.imageUrlsText = '';
                feedPostForm.value.hiddenContent = '';
                feedPostForm.value.aiSource = 'daily';
            }
        });

        // --- Expose to Template ---
        return {
            // SoulLink
            soulLinkTab, soulLinkActiveChat, soulLinkActiveChatType, soulLinkInput, showAttachmentsMenu,
            soulLinkMessages, soulLinkGroups, activeChatMessages, recentChats,
            feedPosts, userProfile, contextMenu,
            startSoulLinkChat, openSoulLinkGroupChat, exitSoulLinkChat, sendSoulLinkMessage,
            switchSoulLinkTab, handlePaiYiPai, onMessageContextMenu, handleContextAction, closeContextMenu, requestFeedUpdate,
            showStarDialog, openStarDialog, starList, deleteStarItem,
            getCharacterName, getCharacterAvatar, getActiveChatName, getActiveChatAvatar, getActiveChatStatus,
            groupMemberOptions, getLocationLabel, getLocationTrajectoryPoints,
            handleHeaderAvatarDblClick,
            showFeedPostDialog, feedPostDialogMode, feedPostForm, feedAuthorOptions,
            feedNpcOptions, feedStats, isFeedPostSubmitting,
            openFeedPostDialog, closeFeedPostDialog, submitFeedPost, deleteFeedPost, copyFeedPost,
            toggleFeedLike, toggleFeedFavorite, getFeedAuthorName, getFeedAuthorAvatar, formatFeedTimestamp,
            getFeedVisibleComments, sendFeedComment, feedCommentText, feedCommentReplyTo, startFeedReply, clearFeedReply, deleteFeedComment,
            feedRevealedTextImages, toggleFeedHiddenText,
            showFeedNpcDialog, feedNpcChoice, openFeedNpcDialog, closeFeedNpcDialog, confirmFeedNpcSummon,
            userAvatarInput, triggerUserAvatarUpload, handleUserAvatarUpload,
            showGroupDialog, groupDialogMode, groupDialogName, groupDialogSelectedMembers, openGroupDialog, closeGroupDialog, saveGroupDialog, deleteGroup,
            showPetDialog, openPetDialog, closePetDialog, soulLinkPet, getPetMoodLabel, handlePetAction,
            saveSoulLinkMessages,
            showImageDialog, showVoiceDialog, showTransferDialog, showLocationDialog,
            showOfflineModeDialog, showEmojiPanel,
            imageMode, selectedImage, imageTextDescription,
            voiceTextInput,
            transferAmount, transferNote,
            locationUser, locationTarget, locationDistance, locationTrajectoryPoints,
            selectedPresets, isOfflineMode,
            pixelEmojis,
            openImageDialog, openVoiceDialog, openTransferDialog, openLocationDialog,
            openOfflineModeDialog,
            handleImageUpload, sendImageMessage,
            sendVoiceMessage, toggleVoiceExpand,
            sendTransferMessage, handleTransferAction,
            addTrajectoryPoint, removeTrajectoryPoint, sendLocationMessage,
            togglePresetSelection, activateOfflineMode,
            insertEmoji,
            isAiTyping, 

            // Core
            currentTime, currentDate, aiStatus, activePage, openedApp,
            isHomeScreenVisible,
            // Fader
            faderContainer, faderLeft, startDrag,
            // App Launch
            openApp, closeApp, getAppIcon,
            // Console
            profiles, activeProfileId, activeProfile, apiStatus,
            availableModels, fetchingModels, showApiKey, consoleLogs,
            saveProfiles, createNewProfile, deleteActiveProfile,
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
            // Worldbook & Presets
            worldbooks, editingWorldbook, activeWorldbookEntryId, activeWorldbookEntry,
            addNewWorldbook, deleteWorldbook, deleteCurrentWorldbook, openWorldbookEditor, saveWorldbookEditor, cancelWorldbookEditor,
            addWorldbookEntry, deleteWorldbookEntry,
            swipedWorldbookId, toggleSwipeWorldbook,
            presets, editingPreset,
            addNewPreset, deletePreset, deleteCurrentPreset, openPresetEditor, savePresetEditor, cancelPresetEditor,
            swipedPresetId, toggleSwipePreset,
            expandedEntryIds, toggleEntryExpand, isEntryExpanded,
            isVideoCalling,
            renderSpecialMessage,
            triggerChatAction,
            castVote,
                
    }
    }
}).mount('#app');
