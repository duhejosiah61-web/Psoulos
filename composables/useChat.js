// composables/useChat.js
import { ref, computed, watch, nextTick } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import { callAI } from '../api.js';

export function useChat(
    characters,
    worldbooks,
    presets,
    activeProfile,
    availableModels,
    feed,           // feed 对象（用于角色动态/评论）
    chatSettings,   // useChatSettings 返回的对象
    userAvatar,     // ref
    isGuest,        // ref
    // 可选依赖（用于外部交互）
    externalTrigger = {}
) {
    // ==================== 核心状态 ====================
    const soulLinkTab = ref('msg');
    const soulLinkActiveChat = ref(null);
    const soulLinkActiveChatType = ref('character');
    const soulLinkInput = ref('');
    const soulLinkReplyTarget = ref(null);
    const soulLinkMessages = ref({});
    const soulLinkGroups = ref([]);
    const isAiTyping = ref(false);
    const focusedOsMessageId = ref(null);
    const editingMessageId = ref(null);
    const novelMode = ref(localStorage.getItem('soulos_novel_mode') === 'true');
    watch(novelMode, (val) => {
        try {
            localStorage.setItem('soulos_novel_mode', val ? 'true' : 'false');
        } catch (e) {
            /* ignore */
        }
    });
    const chatOfflineModes = ref({});
    const showChatSettings = ref(false);
    const showGreetingSelect = ref(false);
    const availableGreetings = ref([]);
    const selectedGreeting = ref(null);
    const archivedChats = ref([]);
    const showCreateGroupDialog = ref(false);
    const activeVote = ref(null);
    const newGroupName = ref('');
    const newGroupMembers = ref('');
    const newGroupAvatar = ref('');
    const selectedGroupMembers = ref([]);
    const groupAvatarInput = ref(null);
    const showAddMemberDialog = ref(false);
    const selectedAddMembers = ref([]);
    const addMemberMode = ref('existing');
    const customMemberAvatar = ref('');
    const customMemberName = ref('');
    const customMemberPersona = ref('');
    const customMemberWorldbookIds = ref([]);
    const customMemberPresetId = ref(null);
    const customMemberTimeZone = ref('Asia/Shanghai');
    const customMemberAvatarInput = ref(null);
    const showMemberEditor = ref(false);
    const editingMember = ref(null);
    const newGroupNameInput = ref('');
    const tempGroupAvatar = ref('');
    const renameGroupAvatarInput = ref(null);
    const showRenameGroupDialog = ref(false);
    const stickerPacks = ref(JSON.parse(localStorage.getItem('stickerPacks') || '[]'));
    const favoriteStickers = ref(JSON.parse(localStorage.getItem('favoriteStickers') || '[]'));
    const activeStickerTab = ref('favorite');
    const showStickerImportPanel = ref(false);
    const stickerImportText = ref('');
    const newPackName = ref('');
    const emojiList = ref([
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
        '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹'
    ]);

    // 通话相关
    const CALL_DIARY_STORAGE_KEY = 'soulos_call_diary_records_v1';
    const CALL_DIARY_COUNTER_KEY = 'soulos_call_diary_counter_v1';
    const callActive = ref(false);
    const callType = ref('voice');
    const callTimer = ref('00:00');
    const callMessagesContainer = ref(null);
    const videoCallMessagesContainer = ref(null);

    const scrollCallToBottom = () => {
        nextTick(() => {
            if (callType.value === 'video' && videoCallMessagesContainer.value) {
                videoCallMessagesContainer.value.scrollTop = videoCallMessagesContainer.value.scrollHeight;
            } else if (callMessagesContainer.value) {
                callMessagesContainer.value.scrollTop = callMessagesContainer.value.scrollHeight;
            }
        });
    };
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
    const videoSelfPosition = ref({ x: window.innerWidth - 90, y: 100 });
    const isVideoAvatarSwapped = ref(false);
    let callInterval = null;
    let isDraggingVideoSelf = false;
    let dragStartPos = { x: 0, y: 0 };
    let dragStartMouse = { x: 0, y: 0 };
    let hasDragged = false;

    // 上下文菜单
    const RECALL_TIME_LIMIT_MS = 2 * 60 * 1000;
    const longPressTimer = ref(null);
    const longPressStart = ref({ x: 0, y: 0 });
    const contextMenu = ref({ visible: false, x: 0, y: 0, msg: null });

    // 辅助变量（来自外部）
    let db = null; // 会在外部注入

    // ==================== 辅助函数 ====================
    const getMemberWorldbookSummary = (member, history = []) => {
        if (!member || typeof member === 'string') return '';
        
        const targetWbs = new Map();
        if (Array.isArray(worldbooks.value)) {
            worldbooks.value.forEach(wb => {
                if (wb.category === 'global' && wb.globalEnabled) {
                    targetWbs.set(wb.id, wb);
                }
            });
        }
        
        const ids = member.worldbookIds;
        if (Array.isArray(ids) && Array.isArray(worldbooks.value)) {
            ids.forEach(id => {
                const wb = worldbooks.value.find(w => String(w.id) === String(id));
                if (wb) targetWbs.set(wb.id, wb);
            });
        }
        
        if (targetWbs.size === 0) return '';
        
        const parts = [];
        let budget = 12000; // 足够大的预算，确保所有背景知识都能注入
        
        for (const wb of targetWbs.values()) {
            if (!Array.isArray(wb.entries)) continue;
            for (const entry of wb.entries) {
                if (budget <= 0) break;
                const kwStr = String(entry.keyword || entry.keywords || entry.key || '').trim();
                const content = String(entry.content || '').trim();
                if (!content) continue;
                
                // 无论是否常驻，无论是否命中关键词，全部作为背景知识强制注入
                const block = kwStr ? `[背景设定: ${kwStr}]\n${content}` : `[背景设定]\n${content}`;
                const slice = block.length > budget ? `${block.slice(0, budget)}…` : block;
                parts.push(slice);
                budget -= slice.length;
            }
        }
        return parts.length ? `\n# 附加背景知识（世界书设定）\n${parts.join('\n\n')}\n` : '';
    };

    const getMemberPresetSummary = (member) => {
        if (!member || typeof member === 'string' || member.selectedPresetId == null || member.selectedPresetId === '') return '';
        const preset = presets.value.find(p => String(p.id) === String(member.selectedPresetId));
        if (!preset) return '';
        
        const raw = preset.content || preset.systemPrompt || preset.text || '';
        const segmentsText = Array.isArray(preset.segments) 
            ? preset.segments.filter(s => s && s.enabled !== false).map(s => `${s.title ? `【${s.title}】\n` : ''}${s.content || ''}`).join('\n\n')
            : '';
            
        const fullContent = [raw, segmentsText].filter(Boolean).join('\n\n').trim();
        if (!fullContent) return '';
        
        const safeContent = fullContent.length > 4000 ? fullContent.slice(0, 4000) + '...' : fullContent;
        return `\n# 附加预设规则（《${preset.name || '预设'}》）\n${safeContent}\n`;
    };

    const formatMemberLocalTime = (member) => {
        const tz = (member && typeof member !== 'string' && member.timeZone)
            ? String(member.timeZone).trim()
            : 'Asia/Shanghai';
        try {
            const formatter = new Intl.DateTimeFormat('zh-CN', {
                timeZone: tz,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
            return formatter.format(new Date());
        } catch {
            return '--:--';
        }
    };

    const getActiveChatHistory = () => {
        if (!soulLinkActiveChat.value) return [];
        if (soulLinkActiveChatType.value === 'group') {
            const group = soulLinkGroups.value.find(g => String(g.id) === String(soulLinkActiveChat.value));
            return group && Array.isArray(group.history) ? group.history : [];
        }
        return soulLinkMessages.value[soulLinkActiveChat.value] || [];
    };

    const attachGroupAiSenderIdIfNeeded = (group, msg) => {
        if (!msg || msg.sender !== 'ai' || !group || !Array.isArray(group.members)) return;
        if (msg.senderId != null && msg.senderId !== '') return;
        const name = msg.senderName;
        if (!name) return;
        const member = group.members.find((m) => m && m.name === name);
        if (member && member.id != null) msg.senderId = member.id;
    };

    const getPendingUserMessages = (history) => {
        return history.filter(m => m && m.sender === 'user' && !m.isReplied && !m.isSystem && !m.isHidden);
    };

    const syncActiveChatState = () => {
        if (soulLinkActiveChatType.value === 'group') {
            soulLinkGroups.value = [...soulLinkGroups.value];
        } else {
            soulLinkMessages.value = { ...soulLinkMessages.value };
        }
    };

    const persistActiveChat = () => {
        if (soulLinkActiveChatType.value === 'group') {
            // 保存群聊到 IndexedDB 由外部实现
            if (externalTrigger.saveSoulLinkGroups) externalTrigger.saveSoulLinkGroups();
        } else {
            if (externalTrigger.saveSoulLinkMessages) externalTrigger.saveSoulLinkMessages();
        }
    };

    const translateText = async (text, targetLangCode) => {
        const raw = String(text || '').trim();
        if (!raw || raw === '\u200b') return null;
        const profile = activeProfile.value;
        if (!profile || !profile.endpoint || !profile.key) return null;
        const label = typeof chatSettings.getTargetLangLabel === 'function'
            ? chatSettings.getTargetLangLabel(targetLangCode)
            : String(targetLangCode || '');
        if (!label) return null;
        const systemPrompt = `你是一个精准的翻译器。请将用户提供的文本翻译成${label}。只输出译文，不要添加任何解释、格式或发言人前缀；尽量保留原文的标点与换行。若原文已是目标语言，可直接返回原文。`;
        try {
            const out = await callAI(profile, [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: raw.slice(0, 12000) }
            ], { temperature: 0.3 });
            const t = String(out || '').replace(/```[\s\S]*?```/g, '').trim();
            return t || null;
        } catch (err) {
            console.warn('translateText failed:', err);
            return null;
        }
    };

    const maybeAutoTranslateSoulLinkAiMessage = async (msg, chatId, chatType) => {
        if (!chatSettings.soulLinkForeignTranslationEnabled) return;
        if (!msg || msg.sender !== 'ai' || msg.isSystem) return;
        const primary = String(chatSettings.soulLinkForeignPrimaryLang || '').trim();
        const secondary = String(chatSettings.soulLinkForeignSecondaryLang || '').trim();
        if (!secondary || primary === secondary) return;

        let proxyMsg = msg;
        if (chatId) {
            if (chatType === 'group') {
                const group = soulLinkGroups.value.find(g => String(g.id) === String(chatId));
                if (group && group.history) {
                    const found = group.history.find(m => m.id === msg.id);
                    if (found) proxyMsg = found;
                }
            } else {
                const list = soulLinkMessages.value[chatId];
                if (list) {
                    const found = list.find(m => m.id === msg.id);
                    if (found) proxyMsg = found;
                }
            }
        }

        const targetLang = secondary;
        const isVoice = proxyMsg.messageType === 'voice';
        if (isVoice && !proxyMsg.voiceTranslation) {
            const original = proxyMsg.transcription || proxyMsg.voiceText || proxyMsg.text;
            if (original) {
                const translated = await translateText(original, targetLang);
                if (translated) proxyMsg.voiceTranslation = translated;
            }
        } else if (!isVoice && !proxyMsg.replyTranslation && proxyMsg.text) {
            const translated = await translateText(proxyMsg.text, targetLang);
            if (translated) proxyMsg.replyTranslation = translated;
        }
        const os = String(proxyMsg.osContent || '').trim();
        if (os && !proxyMsg.osTranslation) {
            const ot = await translateText(os, targetLang);
            if (ot) proxyMsg.osTranslation = ot;
        }
        try {
            if (externalTrigger.saveSoulLinkMessages) await externalTrigger.saveSoulLinkMessages();
        } catch { /* ignore */ }
        try {
            if (externalTrigger.saveSoulLinkGroups) await externalTrigger.saveSoulLinkGroups();
        } catch { /* ignore */ }
    };

    const pushMessageToActiveChat = (msg) => {
        if (!soulLinkActiveChat.value) return;
        if (msg && msg.sender === 'user') {
            chatSettings.clearActiveMessageTimer();
        }
        if (msg && msg.sender === 'ai' && msg.isSystem !== true && typeof msg.isReadByUser === 'undefined') {
            const isViewingThisChatNow = externalTrigger.openedApp?.value === 'chat' && !!soulLinkActiveChat.value;
            msg.isReadByUser = !!isViewingThisChatNow;
        }
        if (soulLinkActiveChatType.value === 'group') {
            const group = soulLinkGroups.value.find(g => String(g.id) === String(soulLinkActiveChat.value));
            if (!group) return;
            attachGroupAiSenderIdIfNeeded(group, msg);
            if (!Array.isArray(group.history)) group.history = [];
            group.history.push(msg);
            group.lastMessage = msg.text || '';
            group.lastTime = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            if (!soulLinkMessages.value[soulLinkActiveChat.value]) {
                soulLinkMessages.value[soulLinkActiveChat.value] = [];
            }
            soulLinkMessages.value[soulLinkActiveChat.value].push(msg);
        }
        persistActiveChat();
        scrollToBottom();
        if (msg && msg.sender === 'ai' && !msg.isSystem) {
            void maybeAutoTranslateSoulLinkAiMessage(msg, soulLinkActiveChat.value, soulLinkActiveChatType.value);
        }
    };

    let groupActiveMessageCallback = null;
    const setGroupActiveMessageCallback = (fn) => {
        groupActiveMessageCallback = typeof fn === 'function' ? fn : null;
    };

    const scheduleRoleActiveMessageChain = () => {
        if (!chatSettings.scheduleRoleActiveMessage) return;
        const reschedule = () => {
            if (chatSettings.activeMessageEnabled) scheduleRoleActiveMessageChain();
        };
        if (soulLinkActiveChatType.value === 'group') {
            chatSettings.scheduleRoleActiveMessage(async () => {
                if (!soulLinkActiveChat.value) return;
                if (typeof groupActiveMessageCallback === 'function') {
                    void Promise.resolve(groupActiveMessageCallback()).finally(reschedule);
                    return;
                }
                await triggerSoulLinkAiReply({ isProactive: true });
                reschedule();
            });
            return;
        }
        chatSettings.scheduleRoleActiveMessage(async () => {
            if (!soulLinkActiveChat.value || chatSettings.userBlockedRole) return;
            await triggerSoulLinkAiReply({ isProactive: true });
            reschedule();
        });
    };

    const pushMessageToTargetChat = (chatId, chatType, msg) => {
        if (!chatId) return;
        if (msg && msg.sender === 'ai' && msg.isSystem !== true && typeof msg.isReadByUser === 'undefined') {
            const isViewingThisChat = externalTrigger.openedApp?.value === 'chat' && String(soulLinkActiveChat.value) === String(chatId) && soulLinkActiveChatType.value === chatType;
            msg.isReadByUser = !!isViewingThisChat;
        }
        if (chatType === 'group') {
            const group = soulLinkGroups.value.find(g => String(g.id) === String(chatId));
            if (!group) return;
            attachGroupAiSenderIdIfNeeded(group, msg);
            if (!Array.isArray(group.history)) group.history = [];
            group.history.push(msg);
            group.lastMessage = msg.text || '';
            group.lastTime = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            if (externalTrigger.saveSoulLinkGroups) externalTrigger.saveSoulLinkGroups();
        } else {
            if (!soulLinkMessages.value[chatId]) soulLinkMessages.value[chatId] = [];
            soulLinkMessages.value[chatId].push(msg);
            if (externalTrigger.saveSoulLinkMessages) externalTrigger.saveSoulLinkMessages();
        }
        if (externalTrigger.openedApp?.value === 'chat' && String(soulLinkActiveChat.value) === String(chatId) && soulLinkActiveChatType.value === chatType) {
            scrollToBottom();
        }
        if (msg && msg.sender === 'ai' && !msg.isSystem) {
            void maybeAutoTranslateSoulLinkAiMessage(msg, chatId, chatType);
        }
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

    const scrollToBottom = () => {
        setTimeout(() => {
            const el = document.querySelector('.wechat-messages');
            if (el) el.scrollTop = el.scrollHeight;
        }, 100);
    };

    // ==================== 消息解析工具 ====================
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
        const looseOsBlockRe = new RegExp(`\\[\\s*(?:OS|INNER_LOG|INNERLOG)\\s*\\][\\s\\S]*?(?=\\[\\s*REPLY\\s*\\]|\\[\\s*(?:OS|INNER_LOG|INNERLOG)\\s*\\]|\\[\\s*\\/\\s*(?:OS|INNER_LOG|INNERLOG)\\s*\\]|$)`, 'gi');
        content = content.replace(looseOsBlockRe, ' ');
        content = removeStandaloneTags(content, [...replyTags, ...osTags]);
        content = content.replace(/\s+/g, ' ').trim();
        if (!content) {
            content = raw.replace(/\[[^\]]+\]/g, ' ').replace(/\s+/g, ' ').trim();
        }
        let osContent = taggedOs && taggedOs.trim() ? taggedOs.trim() : null;
        if (osContent) {
            osContent = osContent.replace(/\[\s*AI_ACTION\s*\][\s\S]*?\[\s*\/\s*AI_ACTION\s*\]/gi, '').trim();
            if (!osContent) osContent = null;
        }
        return { content, osContent };
    };

    const parseGroupReply = (raw) => {
        // Obsolete: logic moved directly into appendAiMessage for proper parsing order
        return { senderName: '成员', content: raw.trim() };
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

    const extractAiVote = (rawText) => {
        const text = (rawText || '').trim();
        if (!text) return null;
        const match = text.match(/\[AI_VOTE\]\s*(\d+)\s*\[\/AI_VOTE\]/i);
        if (match) {
            const index = parseInt(match[1], 10) - 1;
            const cleaned = text.replace(/\[AI_VOTE\]\s*\d+\s*\[\/AI_VOTE\]/ig, '').trim();
            return { voteIndex: index, cleaned };
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
                return { amount: amount.toFixed(2), note: (match[3] || '').trim() };
            }
        }
        return null;
    };

    const splitAiImageSegments = (rawText) => {
        const text = (rawText || '').trim();
        if (!text) return null;
        
        const tagPattern = /\[\s*图片\s*[:：]\s*([^\]]+)\]|【\s*图片\s*[:：]\s*([^】]+)】|\[\s*图片\s*\]|【\s*图片\s*】|图片[:：]|照片[:：]/i;
        const match = text.match(tagPattern);
        if (!match || match.index == null) return null;
        
        const before = text.slice(0, match.index).trim();
        let after = text.slice(match.index + match[0].length).trim();
        let imageDesc = '';
        
        if (match[1]) {
            imageDesc = match[1].trim();
        } else if (match[2]) {
            imageDesc = match[2].trim();
        } else {
            const lineBreakIndex = after.indexOf('\n');
            if (lineBreakIndex >= 0) {
                imageDesc = after.slice(0, lineBreakIndex).trim();
                after = after.slice(lineBreakIndex + 1).trim();
            } else {
                imageDesc = after;
                after = '';
            }
        }
        
        const segments = [];
        if (before) segments.push({ type: 'text', content: before });
        if (imageDesc) segments.push({ type: 'image', content: imageDesc });
        if (after) segments.push({ type: 'text', content: after });
        
        return segments.length ? segments : null;
    };

    const extractAiImageDescription = (rawText) => {
        const text = (rawText || '').trim();
        if (!text) return '';
        const patterns = [
            /^\[\s*图片\s*[:：]\s*(.*?)\]/i,
            /^【\s*图片\s*[:：]\s*(.*?)】/i,
            /^\[\s*图片\s*\]\s*(.*)/i,
            /^【\s*图片\s*】\s*(.*)/i,
            /^图片[:：]\s*(.*)/i,
            /^照片[:：]\s*(.*)/i,
            /^(?:他|她|TA)?发来了一?张照片[:：]?\s*(.*)/i
        ];
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1].trim() || '一张照片';
            }
        }
        return '';
    };

    const formatAiImageText = (rawText, subject) => {
        const actor = subject || 'TA';
        let text = (rawText || '').trim();
        if (!text) return '一张照片';
        text = text.replace(/^[「『"“”'《》]+|[」』"“”'《》]+$/g, '').trim();
        text = text.replace(/^(他|她|TA)?(发来|发给你)(了)?一张照片[，。,：:]*/i, '').trim();
        text = text.replace(/^(照片上|照片里|照片中)[，。,：:]*/i, '').trim();
        if (!text) return '一张照片';
        if (/^在/.test(text)) return `${actor}${text}`;
        return text;
    };

    const extractAiShoppingCard = (rawText) => {
        const text = (rawText || '').trim();
        if (!text) return null;
        const buyPattern = /\[\s*购买\s*[:：]\s*([^:：\]]+?)\s*[:：]\s*(?:[¥￥])?\s*([\d]+(?:\.[\d]+)?)\s*\]/;
        const helpBuyPattern = /\[\s*帮买请求\s*[:：]\s*([^:：\]]+?)\s*[:：]\s*(?:[¥￥])?\s*([\d]+(?:\.[\d]+)?)\s*\]/;
        const buyMatch = text.match(buyPattern);
        if (buyMatch) {
            return { type: 'buy', item: buyMatch[1].trim(), price: parseFloat(buyMatch[2]) };
        }
        const helpBuyMatch = text.match(helpBuyPattern);
        if (helpBuyMatch) {
            return { type: 'helpBuy', item: helpBuyMatch[1].trim(), price: parseFloat(helpBuyMatch[2]) };
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
        const normalizedAfter = after.replace(/^[：:]\s*/, '').trim();
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
                return { transcription: match[1].trim() };
            }
        }
        return null;
    };

    const extractStickersFromText = (rawText) => {
        const text = (rawText || '').trim();
        if (!text) return null;
        let availableStickers = [];
        stickerPacks.value.forEach(pack => {
            pack.stickers.forEach(s => availableStickers.push(s));
        });
        if (availableStickers.length === 0) return null;
        const stickerPattern = /[\[\uFF3B\u3010](?:\s*表情\s*[:：]\s*)?([^\]\uFF3D\u3011]+)[\]\uFF3D\u3011]/g;
        const matches = [...text.matchAll(stickerPattern)];
        const validMatches = matches.filter(match => {
            const content = match[1].trim();
            return availableStickers.some(s => s.name === content || s.name.includes(content) || content.includes(s.name));
        });
        if (validMatches.length === 0) return null;
        const segments = [];
        let lastIndex = 0;
        validMatches.forEach(match => {
            const beforeText = text.slice(lastIndex, match.index).trim();
            if (beforeText) segments.push({ type: 'text', content: beforeText });
            const stickerName = match[1].trim();
            const foundSticker = availableStickers.find(s => s.name === stickerName || s.name.includes(stickerName) || stickerName.includes(s.name));
            if (foundSticker) segments.push({ type: 'sticker', sticker: foundSticker });
            lastIndex = match.index + match[0].length;
        });
        const remainingText = text.slice(lastIndex).trim();
        if (remainingText) segments.push({ type: 'text', content: remainingText });
        return segments.length ? segments : null;
    };

    const buildSoulLinkReplyContext = (msg) => {
        let text = '';
        if (msg.messageType === 'image') {
            text = msg.text || '[图片]';
        } else if (msg.messageType === 'voice') {
            text = msg.transcription ? `[语音消息] "${msg.transcription}"` : (msg.text ? `[语音消息] "${msg.text}"` : '[语音消息]');
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
            text = parts.length > 0 ? `定位 ${parts.join(' | ')}` : '定位';
        } else if (msg.messageType === 'helpBuy') {
            text = `[帮买请求:${msg.item}:${msg.price}]`;
        } else if (msg.messageType === 'order') {
            text = `[购买:${msg.item}:${msg.price}]`;
        } else if (msg.messageType === 'share') {
            text = `[分享] 来源: ${msg.source}, 内容: ${msg.content}`;
        } else if (msg.messageType === 'vote') {
            const opts = msg.options && Array.isArray(msg.options)
                ? msg.options.map((o, i) => `${i + 1}. ${o.text}`).join(' | ')
                : '';
            text = `[发起投票] 问题：${msg.question} (选项: ${opts})。如果你想参与投票，请在你的回复中输出 [AI_VOTE]选项序号[/AI_VOTE]，例如 [AI_VOTE]1[/AI_VOTE]。`;
        } else {
            text = msg.text || '';
        }
        return { id: msg.id, sender: msg.sender, text };
    };

    // ==================== 核心聊天发送 ====================
    const sendSoulLinkMessage = async () => {
        const text = soulLinkInput.value.trim();
        if (!soulLinkActiveChat.value) return;
        // Block check removed

        if (text) {
            if (editingMessageId.value) {
                const chatMsgs = getActiveChatHistory();
                const editIndex = chatMsgs.findIndex(m => m.id === editingMessageId.value);
                if (editIndex !== -1) {
                    const target = chatMsgs[editIndex];
                    if (!target.isRecalled) {
                        chatMsgs[editIndex] = { ...target, text, editedAt: Date.now() };
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
            const activeGroup = isGroupChat ? soulLinkGroups.value.find(g => String(g.id) === String(soulLinkActiveChat.value)) : null;
            if (isGroupChat && !activeGroup) return;

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
                        text: text,
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
                        text: text,
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
            if (replyContextForPrompt) newMsg.replyTo = replyContextForPrompt;
            if (isGroupChat) {
                newMsg.senderName = '我';
                newMsg.senderAvatar = userAvatar.value;
            }
            pushMessageToActiveChat(newMsg);
            if (newMsg.sender === 'user' && soulLinkActiveChatType.value === 'character') {
                chatSettings.lastUserActiveAt = Date.now();
                chatSettings.clearActiveMessageTimer();
                if (chatSettings.activeMessageEnabled) scheduleRoleActiveMessageChain();
            }

            soulLinkInput.value = '';
            soulLinkReplyTarget.value = null;
        }
    };

    // ==================== AI 回复 ====================
    const triggerSoulLinkAiReply = async (options = {}) => {
        const skipBusySimulation = !!options.skipBusySimulation;
        const busyLaterDepth = Number(options.busyLaterDepth) || 0;
        const enableAiBusyDecision = !!options.enableAiBusyDecision;
        if (!soulLinkActiveChat.value) return;
        const isGroupChat = soulLinkActiveChatType.value === 'group';
        const char = isGroupChat ? null : characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
        const activeGroup = isGroupChat ? soulLinkGroups.value.find(g => String(g.id) === String(soulLinkActiveChat.value)) : null;
        if (isGroupChat && !activeGroup) return;

        const history = getActiveChatHistory();
        const pendingUserMessages = getPendingUserMessages(history);
        const profile = activeProfile.value;
        if (!profile || !profile.endpoint || !profile.key) {
            pushMessageToActiveChat({
                id: Date.now() + 1,
                sender: 'system',
                text: '未检测到任何 API 配置，请先在 Console 中创建并选择一个配置。',
                timestamp: Date.now(),
                isSystem: true
            });
            return;
        }

        const endpoint = (profile.endpoint || '').trim();
        const key = (profile.key || '').trim();
        let modelId = profile.model;
        if (!modelId && availableModels.value.length > 0) {
            modelId = availableModels.value[0].id;
            profile.model = modelId;
        }

        // 构建 system prompt（简化版，实际需调用 chatSettings 中的方法）
        const getUserPronounInstruction = () => typeof chatSettings.getUserPronounInstruction === 'function' ? chatSettings.getUserPronounInstruction() : '';
        const getForeignBilingualConstraintPrompt = () => typeof chatSettings.getForeignBilingualConstraintPrompt === 'function' ? chatSettings.getForeignBilingualConstraintPrompt() : '';
        const buildTimeZonePromptBlock = () => chatSettings.buildTimeZonePromptBlock();
        const buildAiBusyDecisionPromptBlock = () => chatSettings.buildAiBusyDecisionPromptBlock();
        const buildSummaryPromptBlock = () => {
            const summaryText = typeof chatSettings.getLatestSummaryText === 'function'
                ? chatSettings.getLatestSummaryText()
                : '';
            return summaryText ? `\n\n# 对话摘要（用于节省token，请严格参考）\n${summaryText}\n` : '';
        };
        const buildOfflineNovelPromptBlock = () => {
            const chatId = soulLinkActiveChat.value;
            const chatType = soulLinkActiveChatType.value;
            const activePresetId = chatType === 'group'
                ? null
                : characters.value.find(c => String(c.id) === String(chatId))?.selectedPresetId ?? null;
            const activePreset = activePresetId != null
                ? presets.value.find(p => String(p.id) === String(activePresetId))
                : null;
            const presetText = activePreset
                ? [activePreset.content, ...(Array.isArray(activePreset.segments) ? activePreset.segments.filter(seg => seg && seg.enabled !== false).map(seg => `${seg.title ? `【${seg.title}】` : ''}${seg.content || ''}`) : [])]
                    .filter(Boolean)
                    .join('\n\n')
                : '';
            const presetName = activePreset?.name || '未绑定预设';
            const baseInstruction = chatType === 'group'
                ? '你正在进行线下群聊的小说写作。此模式不是聊天记录，而是连续正文。'
                : '你正在进行线下单聊的小说写作。此模式不是聊天记录，而是连续正文。';
            return `\n# 线下模式（最高优先级）\n${baseInstruction}\n\n${presetText ? `# 用户自定义预设《${presetName}》\n${presetText}\n\n` : ''}# 必须遵守\n1. 只输出小说正文，不要输出消息气泡感、列表感、解释、标签、Markdown 标题、[REPLY]、[OS]、“我：”“TA：”这种聊天格式。\n2. 用长段落写作，至少 3 段；每段要有动作、神态、语言、环境或心理中的至少两项。\n3. 单聊时采用第一人称或贴近视角的小说叙述；群聊时采用场景叙事，要让不同角色自然说话，不要像群消息刷屏。\n4. 对话必须嵌进叙事里，使用引号直接写出来，并配合动作、停顿、目光、情绪变化。\n5. 不要写“回复如下”“以下内容”“作为AI”“我来为你写”等提示语。\n6. 如果预设要求某种文风、视角、句长、禁忌、节奏，优先严格执行。\n7. 输出应当像真正的小说章节片段，而不是聊天记录改写。\n`;
        };

        let systemPrompt = '';
        if (isGroupChat) {
            const groupName = activeGroup.name || '群聊';
            const members = activeGroup.members || [];
            systemPrompt = `你正在群聊【${groupName}】中与用户对话。\n\n`;
            systemPrompt += getForeignBilingualConstraintPrompt();
            systemPrompt += buildSummaryPromptBlock();
            systemPrompt += buildTimeZonePromptBlock();
            if (enableAiBusyDecision) systemPrompt += buildAiBusyDecisionPromptBlock();
            systemPrompt += `# 群成员（你需要在他们之间切换口吻）\n`;
            if (members.length) {
                members.forEach((member, idx) => {
                    const memberName = typeof member === 'string' ? member : (member.name || '成员');
                    const localTime = typeof member !== 'string' ? formatMemberLocalTime(member) : '--:--';
                    const memberPersona = typeof member !== 'string' && member.persona ? member.persona : '';
                    const memberRelation = typeof member !== 'string' && member.relation ? member.relation : '';
                    const wbSummary = typeof member !== 'string' ? getMemberWorldbookSummary(member, history) : '';
                    const presetSummary = typeof member !== 'string' ? getMemberPresetSummary(member) : '';
                    systemPrompt += `${idx + 1}. ${memberName} (本地时间: ${localTime})`;
                    if (memberPersona) systemPrompt += `\n   性格：${memberPersona}`;
                    if (memberRelation) systemPrompt += `\n   与用户关系：${memberRelation}`;
                    if (wbSummary) systemPrompt += `\n   ${wbSummary}`;
                    if (presetSummary) systemPrompt += `\n   ${presetSummary}`;
                    systemPrompt += `\n`;
                });
            } else {
                systemPrompt += `成员A、成员B、成员C\n`;
            }
            const blockedMemberNames = (members || [])
                .filter((mem) => typeof mem !== 'string' && mem && mem.id != null && !String(mem.id).startsWith('custom_'))
                .map((mem) => {
                    const ch = characters.value.find((c) => String(c.id) === String(mem.id));
                    return ch && ch.blockedByUser ? (ch.nickname || ch.name || mem.name) : null;
                })
                .filter(Boolean);
            if (blockedMemberNames.length) {
                systemPrompt += `\n\n注意：用户已拉黑以下成员：${blockedMemberNames.join('、')}。除非用户直接问起，否则你不要主动提及他们，也不要替他们说话。`;
            }
            systemPrompt += `\n# 群聊规则\n1. 回复简短口语化。\n2. 根据语境，你可以让一名或多名成员回复，甚至让他们互相抢话或争论。\n3. 必须在多名成员的回复之间严格使用 \`---\` 分隔。\n4. 格式：成员名: [REPLY]正式内容[/REPLY] [OS]内心独白[/OS]\n5. 附件语法（可随时使用）：\n   - 发送语音：[语音] 内容\n   - 发送图片：[图片] 画面描述\n   - 发送转账：[转账] 金额 附言\n   - 为用户下单外卖/购物：[购买: 物品名: 价格]\n   - 请求用户帮你买单：[帮买请求: 物品名: 价格]\n`;
            systemPrompt += `\n现在开始回复。`;
        } else if (char && char.persona) {
            const charName = char.name || '角色';
            systemPrompt = `你正在通过 SoulLink 和朋友聊天。\n\n`;
            systemPrompt += `# 用户人称与称呼规则\n${getUserPronounInstruction()}\n\n`;
            systemPrompt += getForeignBilingualConstraintPrompt();
            systemPrompt += buildSummaryPromptBlock();
            systemPrompt += buildTimeZonePromptBlock();
            if (enableAiBusyDecision) systemPrompt += buildAiBusyDecisionPromptBlock();
            const wbSummary = getMemberWorldbookSummary(char, history);
            if (wbSummary) systemPrompt += `${wbSummary}\n`;
            
            const presetSummary = getMemberPresetSummary(char);
            if (presetSummary) systemPrompt += `${presetSummary}\n`;

            systemPrompt += `# 你是谁\n你的名字是【${charName}】。\n${char.persona}\n\n`;

            let availableStickers = [];
            if (stickerPacks.value) {
                stickerPacks.value.forEach(pack => {
                    if (pack.stickers) {
                        pack.stickers.forEach(s => availableStickers.push(s));
                    }
                });
            }
            const stickerPrompt = availableStickers.length > 0
                ? `\n你可以发送表情包！格式：[表情:表情名]。可用表情包有：${availableStickers.map(s => s.name).join('、')}。`
                : '';

            // 密码规则（略）
            systemPrompt += `# 聊天风格\n1. 像真人聊天，简短（1-3句）。\n2. 不要暴露AI。\n3. 可用emoji。\n4. 如需连发多条用 "---" 分隔。\n\n# 附件语法（你可以随时使用以下功能）：\n- 发送语音：[语音: 内容]\n- 发送图片：[图片: 画面描述]\n- 发送转账：[转账] 金额 附言\n- 为对方下单外卖/购物：[购买: 物品名: 价格]\n- 请求对方帮你代付/购买：[帮买请求: 物品名: 价格]${stickerPrompt}\n`;
            systemPrompt += `\n# 回复格式\n[REPLY]正式回复[/REPLY] [OS]内心独白[/OS]\n`;
            systemPrompt += `\n现在请以${charName}的身份回复。`;
        } else {
            systemPrompt = '你是一个友好的朋友，正在通过SoulLink聊天。请像真人一样自然、简短地对话，每次1-3句话即可。';
            systemPrompt += '\n回复格式：[REPLY]正式内容[/REPLY] [OS]内心独白[/OS]。';
        }

        const messagesPayload = [{ role: 'system', content: systemPrompt }];
        const modelHistory = getModelHistorySlice(history);
        modelHistory.forEach(m => {
            const ctx = buildSoulLinkReplyContext(m);
            const raw = ctx.text || (m.text || '');
            if (m.sender === 'user') messagesPayload.push({ role: 'user', content: raw });
            else if (m.sender === 'ai') messagesPayload.push({ role: 'assistant', content: raw });
        });

        if (options.isProactive) {
            messagesPayload.push({
                role: 'user',
                content: '（系统提示：用户已经有一段时间没说话了。请你主动寻找新话题或分享日常，直接给用户发一条消息。要求符合人设，自然且口语化。千万不要复述系统提示本身，也不要显得突兀。）'
            });
        }

        isAiTyping.value = true;
        scrollToBottom();
        const currentChatId = soulLinkActiveChat.value;
        const currentChatType = soulLinkActiveChatType.value;

        try {
            const response = await fetch(endpoint.replace(/\/+$/, '') + '/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
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
            const extractContent = (obj) => {
                if (!obj) return '';
                const raw = obj.choices?.[0]?.message || obj.choices?.[0]?.delta;
                if (raw?.content != null) {
                    if (typeof raw.content === 'string') return raw.content;
                    if (Array.isArray(raw.content)) return raw.content.map(c => (typeof c === 'string' ? c : (c?.text ?? c?.content ?? ''))).join('');
                }
                if (obj.message?.content != null) return typeof obj.message.content === 'string' ? obj.message.content : '';
                const parts = obj.candidates?.[0]?.content?.parts;
                if (Array.isArray(parts) && parts.length) return parts.map(p => p?.text ?? '').join('');
                if (typeof obj.output_text === 'string') return obj.output_text;
                if (typeof obj.result === 'string') return obj.result;
                if (typeof obj.text === 'string') return obj.text;
                return '';
            };
            reply = extractContent(data) || extractContent(data?.data || data?.result) || '';
            reply = String(reply || '').trim();
            if (!reply) reply = '模型已响应，但未返回可显示的内容。';

            // 处理帮买标记
            const helpBuyMatch = reply.match(/\[帮买:([^\]]+)\]/);
            if (helpBuyMatch) {
                const productName = helpBuyMatch[1].trim();
                const curHistory = getActiveChatHistory();
                for (let i = curHistory.length - 1; i >= 0; i--) {
                    const msg = curHistory[i];
                    if (msg.messageType === 'helpBuy' && !msg.isPurchased && (msg.item.includes(productName) || productName.includes(msg.item))) {
                        msg.isPurchased = true;
                        if (externalTrigger.saveSoulLinkMessages) externalTrigger.saveSoulLinkMessages();
                        break;
                    }
                }
                reply = reply.replace(/\[帮买:[^\]]+\]/g, '').trim();
            }

            // 处理朋友圈/评论
            if (/\[发布朋友圈\]|【发布朋友圈】/.test(reply)) {
                const postMatch = reply.match(/(?:\[|【|\()发布朋友圈(?:\]|】|\))\s*([\s\S]+?)(?=(\[|【|\(|\[REPLY\]|\[OS\]|$))/);
                if (postMatch && postMatch[1].trim() && feed && feed.roleAction) {
                    const charObj = currentChatType === 'character' ? characters.value.find(c => String(c.id) === String(currentChatId)) : null;
                    if (charObj) {
                        feed.roleAction('post', {
                            author: charObj.nickname || charObj.name,
                            avatar: charObj.avatarUrl,
                            content: postMatch[1].trim(),
                            images: []
                        });
                    }
                }
                reply = reply.replace(/(?:\[|【|\()发布朋友圈(?:\]|】|\))\s*[\s\S]*?(?=\[|【|\(|$)/gi, '').trim();
            }
            if (/\[评论我的动态\]|【评论我的动态】/.test(reply)) {
                const commentMatch = reply.match(/(?:\[|【|\()评论我的动态(?:\]|】|\))\s*([\s\S]+?)(?=(\[|【|\(|\[REPLY\]|\[OS\]|$))/);
                if (commentMatch && commentMatch[1].trim() && feed && feed.roleAction && feed.posts) {
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
                reply = reply.replace(/(?:\[|【|\()评论我的动态(?:\]|】|\))\s*[\s\S]*?(?=\[|【|\(|$)/gi, '').trim();
            }

            // 拆分多段
            const separator = '---';
            const appendAiMessage = (rawText, index = 0) => {
                let senderName = 'AI';
                let senderAvatar = '';
                let contentToParse = rawText;
                
                if (isGroupChat) {
                    const match = rawText.match(/^\s*[*\[【]*([^:：*\]】]+)[*\]】]*[:：]\s*([\s\S]+)$/);
                    if (match) {
                        senderName = match[1].trim();
                        contentToParse = match[2].trim();
                    } else {
                        const group = soulLinkGroups.value.find(g => String(g.id) === String(currentChatId));
                        const members = group && Array.isArray(group.members) ? group.members : [];
                        if (members.length > 0) {
                            const randomMember = members[Math.floor(Math.random() * members.length)];
                            senderName = typeof randomMember === 'string' ? randomMember : (randomMember.name || '成员');
                        } else {
                            senderName = '成员';
                        }
                    }
                    
                    const activeGroupChat = soulLinkGroups.value.find(g => String(g.id) === String(currentChatId));
                    if (activeGroupChat && Array.isArray(activeGroupChat.members)) {
                        const member = activeGroupChat.members.find(m => m.name === senderName);
                        if (member && member.avatarUrl) senderAvatar = member.avatarUrl;
                    }
                }

                let { content: parsedContent, osContent } = parseReplyAndOs(contentToParse);
                let voteMatch = extractAiVote(parsedContent);
                if (voteMatch) {
                    parsedContent = voteMatch.cleaned;
                } else if (osContent) {
                    voteMatch = extractAiVote(osContent);
                    if (voteMatch) {
                        osContent = voteMatch.cleaned;
                    }
                }
                
                if (voteMatch && voteMatch.voteIndex >= 0) {
                    const chatHistory = isGroupChat
                        ? (soulLinkGroups.value.find(g => String(g.id) === String(currentChatId))?.history || [])
                        : (soulLinkMessages.value[currentChatId] || []);
                    const lastVoteMsg = chatHistory.slice().reverse().find(m => m.messageType === 'vote');
                    if (lastVoteMsg && lastVoteMsg.options && voteMatch.voteIndex < lastVoteMsg.options.length) {
                        lastVoteMsg.options[voteMatch.voteIndex].votes++;
                        lastVoteMsg.totalVotes++;
                        if (externalTrigger.saveSoulLinkMessages) externalTrigger.saveSoulLinkMessages();
                    }
                }

                const trimmedText = parsedContent.trim();
                if (!trimmedText && !osContent) return;
                
                if (isGroupChat) {
                    const parsed = { senderName, content: trimmedText };
                    if (!parsed.content && !osContent) return;
                    const transferSegments = splitAiTransferSegments(parsed.content);
                    if (transferSegments) {
                        transferSegments.forEach((segment, offset) => {
                            if (segment.type === 'transfer') {
                                pushMessageToTargetChat(currentChatId, currentChatType, {
                                    id: Date.now() + index + offset,
                                    sender: 'ai',
                                    senderName: parsed.senderName,
                                    senderAvatar,
                                    messageType: 'transfer',
                                    amount: segment.amount,
                                    note: segment.note,
                                    transferStatus: 'received',
                                    timestamp: Date.now()
                                });
                            } else {
                                pushMessageToTargetChat(currentChatId, currentChatType, {
                                    id: Date.now() + index + offset,
                                    sender: 'ai',
                                    senderName: parsed.senderName,
                                    senderAvatar,
                                    text: segment.content,
                                    timestamp: Date.now()
                                });
                            }
                        });
                        return;
                    }
                    const transfer = extractAiTransfer(parsed.content);
                    if (transfer) {
                        pushMessageToTargetChat(currentChatId, currentChatType, {
                            id: Date.now() + index,
                            sender: 'ai',
                            senderName: parsed.senderName,
                            senderAvatar,
                            messageType: 'transfer',
                            amount: transfer.amount,
                            note: transfer.note,
                            transferStatus: 'received',
                            timestamp: Date.now()
                        });
                        return;
                    }
                    const segments = splitAiImageSegments(parsed.content);
                    if (segments) {
                        segments.forEach((segment, offset) => {
                            if (segment.type === 'image') {
                                pushMessageToTargetChat(currentChatId, currentChatType, {
                                    id: Date.now() + index + offset,
                                    sender: 'ai',
                                    senderName: parsed.senderName,
                                    senderAvatar,
                                    messageType: 'image',
                                    imageUrl: null,
                                    text: formatAiImageText(segment.content, 'TA'),
                                    timestamp: Date.now()
                                });
                            } else {
                                pushMessageToTargetChat(currentChatId, currentChatType, {
                                    id: Date.now() + index + offset,
                                    sender: 'ai',
                                    senderName: parsed.senderName,
                                    senderAvatar,
                                    text: segment.content,
                                    timestamp: Date.now()
                                });
                            }
                        });
                        return;
                    }
                    const imageDesc = extractAiImageDescription(parsed.content);
                    if (imageDesc) {
                        pushMessageToTargetChat(currentChatId, currentChatType, {
                            id: Date.now() + index,
                            sender: 'ai',
                            senderName: parsed.senderName,
                            senderAvatar,
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
                                pushMessageToTargetChat(currentChatId, currentChatType, {
                                    id: Date.now() + index + offset,
                                    sender: 'ai',
                                    senderName: parsed.senderName,
                                    senderAvatar,
                                    messageType: 'sticker',
                                    stickerUrl: segment.sticker.url,
                                    stickerName: segment.sticker.name,
                                    text: `[${segment.sticker.name}]`,
                                    timestamp: Date.now()
                                });
                            } else {
                                pushMessageToTargetChat(currentChatId, currentChatType, {
                                    id: Date.now() + index + offset,
                                    sender: 'ai',
                                    senderName: parsed.senderName,
                                    senderAvatar,
                                    text: segment.content,
                                    timestamp: Date.now()
                                });
                            }
                        });
                        return;
                    }
                    pushMessageToTargetChat(currentChatId, currentChatType, {
                        id: Date.now() + index,
                        sender: 'ai',
                        senderName: parsed.senderName,
                        senderAvatar,
                        text: parsed.content,
                        osContent: osContent || undefined,
                        timestamp: Date.now()
                    });
                } else {
                    // 单聊
                    const transferSegments = splitAiTransferSegments(trimmedText);
                    if (transferSegments) {
                        transferSegments.forEach((segment, offset) => {
                            if (segment.type === 'transfer') {
                                pushMessageToTargetChat(currentChatId, currentChatType, {
                                    id: Date.now() + index + offset,
                                    sender: 'ai',
                                    messageType: 'transfer',
                                    amount: segment.amount,
                                    note: segment.note,
                                    transferStatus: 'received',
                                    timestamp: Date.now()
                                });
                            } else {
                                pushMessageToTargetChat(currentChatId, currentChatType, {
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
                        pushMessageToTargetChat(currentChatId, currentChatType, {
                            id: Date.now() + index,
                            sender: 'ai',
                            messageType: 'transfer',
                            amount: transfer.amount,
                            note: transfer.note,
                            transferStatus: 'received',
                            timestamp: Date.now()
                        });
                        return;
                    }
                    const segments = splitAiImageSegments(trimmedText);
                    if (segments) {
                        segments.forEach((segment, offset) => {
                            if (segment.type === 'image') {
                                pushMessageToTargetChat(currentChatId, currentChatType, {
                                    id: Date.now() + index + offset,
                                    sender: 'ai',
                                    messageType: 'image',
                                    imageUrl: null,
                                    text: formatAiImageText(segment.content, chatSettings.getActiveChatPronoun ? chatSettings.getActiveChatPronoun() : 'TA'),
                                    timestamp: Date.now()
                                });
                            } else {
                                pushMessageToTargetChat(currentChatId, currentChatType, {
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
                        pushMessageToTargetChat(currentChatId, currentChatType, {
                            id: Date.now() + index,
                            sender: 'ai',
                            messageType: 'image',
                            imageUrl: null,
                            text: formatAiImageText(imageDesc, chatSettings.getActiveChatPronoun ? chatSettings.getActiveChatPronoun() : 'TA'),
                            osContent: osContent || undefined,
                            timestamp: Date.now()
                        });
                        return;
                    }
                    const shoppingCard = extractAiShoppingCard(trimmedText);
                    if (shoppingCard) {
                        if (shoppingCard.type === 'buy') {
                            pushMessageToTargetChat(currentChatId, currentChatType, {
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
                            pushMessageToTargetChat(currentChatId, currentChatType, {
                                id: Date.now() + index,
                                sender: 'ai',
                                messageType: 'helpBuy',
                                item: shoppingCard.item,
                                price: shoppingCard.price,
                                isPurchased: false,
                                timestamp: Date.now()
                            });
                        }
                        const remainingText = trimmedText.replace(/\[\s*(?:购买|帮买请求)\s*[:：]\s*[^:：\]]+\s*[:：]\s*(?:[¥￥])?\s*[\d.]+\s*\]/g, '').trim();
                        if (remainingText) {
                            pushMessageToTargetChat(currentChatId, currentChatType, {
                                id: Date.now() + index + 1,
                                sender: 'ai',
                                text: remainingText,
                                osContent: osContent || undefined,
                                timestamp: Date.now()
                            });
                        } else if (osContent) {
                            pushMessageToTargetChat(currentChatId, currentChatType, {
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
                                pushMessageToTargetChat(currentChatId, currentChatType, {
                                    id: Date.now() + index + offset,
                                    sender: 'ai',
                                    messageType: 'sticker',
                                    stickerUrl: segment.sticker.url,
                                    stickerName: segment.sticker.name,
                                    text: `[${segment.sticker.name}]`,
                                    timestamp: Date.now()
                                });
                            } else {
                                pushMessageToTargetChat(currentChatId, currentChatType, {
                                    id: Date.now() + index + offset,
                                    sender: 'ai',
                                    text: segment.content,
                                    timestamp: Date.now()
                                });
                            }
                        });
                        return;
                    }
                    const voiceSegments = splitAiVoiceSegments(trimmedText);
                    if (voiceSegments) {
                        voiceSegments.forEach((segment, offset) => {
                            if (segment.type === 'voice') {
                                const voiceDuration = Math.max(1, Math.ceil(segment.transcription.length / 4));
                                pushMessageToTargetChat(currentChatId, currentChatType, {
                                    id: Date.now() + index + offset,
                                    sender: 'ai',
                                    messageType: 'voice',
                                    transcription: segment.transcription,
                                    text: segment.transcription,
                                    voiceDuration: voiceDuration,
                                    timestamp: Date.now()
                                });
                            } else {
                                pushMessageToTargetChat(currentChatId, currentChatType, {
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
                        pushMessageToTargetChat(currentChatId, currentChatType, {
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
                    pushMessageToTargetChat(currentChatId, currentChatType, {
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
                parts.forEach((part, idx) => {
                    if (part.trim()) {
                        setTimeout(() => appendAiMessage(part, idx), idx * 800);
                    }
                });
            } else {
                appendAiMessage(reply, 0);
            }

            isAiTyping.value = false; // Add this line to reset typing indicator

            // 标记已回复
            if (pendingUserMessages.length > 0) {
                const targetHistory = getActiveChatHistory();
                markMessagesReplied(targetHistory, pendingUserMessages.map(m => m.id));
            }
            // 重新安排主动消息
            if (chatSettings.activeMessageEnabled) {
                scheduleRoleActiveMessageChain();
            } else {
                chatSettings.clearActiveMessageTimer();
            }
        } catch (error) {
            isAiTyping.value = false;
            pushMessageToTargetChat(currentChatId, currentChatType, {
                id: Date.now() + 5,
                sender: 'system',
                text: `请求模型时出错：${error.message}`,
                timestamp: Date.now(),
                isSystem: true
            });
        }
    };

    const getModelHistorySlice = (history) => {
        const arr = Array.isArray(history) ? history : [];
        const filtered = arr.filter(m => m && !m.isSystem && !m.isHidden);
        const rawCursor = typeof chatSettings.getChatSummaryCursor === 'function'
            ? chatSettings.getChatSummaryCursor()
            : 0;
        const cursor = Math.max(0, Number(rawCursor) || 0);
        if (cursor <= 0) return filtered;
        if (cursor >= filtered.length) return [];
        return filtered.slice(cursor);
    };

    // ==================== 上下文菜单 ====================
    const onMessageContextMenu = (event, msg) => {
        event.preventDefault();
        let x = event.clientX;
        let y = event.clientY;
        const menuWidth = 180;
        const menuHeight = 200;
        if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
        if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;
        contextMenu.value = { visible: true, x: Math.max(10, x), y: Math.max(10, y), msg };
    };

    const closeContextMenu = () => {
        contextMenu.value.visible = false;
    };

    const clearLongPress = () => {
        if (longPressTimer.value) clearTimeout(longPressTimer.value);
        longPressTimer.value = null;
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
        if (Math.hypot(dx, dy) > 10) clearLongPress();
    };

    const onMessageTouchEnd = () => {
        clearLongPress();
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
                if (now - (msg.timestamp || msg.id) > RECALL_TIME_LIMIT_MS) {
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
                        recalledData
                    };
                    chatMsgs.push({
                        id: Date.now() + 1,
                        sender: 'system',
                        text: '[系统提示：用户撤回了一条消息。你不知道具体内容，只需知道这个事件。]',
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

    // ==================== 离线模式 ====================
    const setChatOfflineMode = (chatId, isOffline) => {
        chatOfflineModes.value[chatId] = isOffline;
        saveChatOfflineModes();
    };

    const saveChatOfflineModes = () => {
        try {
            localStorage.setItem('soulos_chat_offline_modes', JSON.stringify(chatOfflineModes.value));
        } catch (e) {}
    };

    const loadChatOfflineModes = () => {
        try {
            const saved = localStorage.getItem('soulos_chat_offline_modes');
            if (saved) chatOfflineModes.value = JSON.parse(saved);
        } catch (e) {
            chatOfflineModes.value = {};
        }
    };
    loadChatOfflineModes();

    const isOfflineMode = computed(() => {
        if (!soulLinkActiveChat.value) return false;
        return chatOfflineModes.value[soulLinkActiveChat.value] || false;
    });

    const toggleOfflineMode = () => {
        if (!soulLinkActiveChat.value) return;
        // 自动存档
        let currentMessages = getActiveChatHistory();
        if (currentMessages.length > 0) {
            const chatId = soulLinkActiveChat.value;
            const chatType = soulLinkActiveChatType.value;
            let chatName = '';
            if (chatType === 'group') {
                const group = soulLinkGroups.value.find(g => String(g.id) === String(chatId));
                chatName = group ? group.name : '群聊';
            } else {
                const char = characters.value.find(c => String(c.id) === String(chatId));
                chatName = char ? (char.nickname || char.name) : '未知';
            }
            const archive = {
                id: `archive_${Date.now()}`,
                chatType,
                chatId,
                chatName,
                name: `自动存档 - ${isOfflineMode.value ? '线下' : '线上'}模式 - ${new Date().toLocaleString()}`,
                description: `从${isOfflineMode.value ? '线下' : '线上'}模式切换时自动创建的存档`,
                timestamp: Date.now(),
                messages: [...currentMessages],
                preview: currentMessages[currentMessages.length - 1]?.text || '无消息'
            };
            archivedChats.value.push(archive);
            if (externalTrigger.saveArchivedChats) externalTrigger.saveArchivedChats();
            // 清空当前聊天记录
            if (chatType === 'group') {
                const group = soulLinkGroups.value.find(g => String(g.id) === String(chatId));
                if (group) group.history = [];
                if (externalTrigger.saveSoulLinkGroups) externalTrigger.saveSoulLinkGroups();
            } else {
                soulLinkMessages.value[chatId] = [];
                if (externalTrigger.saveSoulLinkMessages) externalTrigger.saveSoulLinkMessages();
            }
        }
        if (isOfflineMode.value) {
            setChatOfflineMode(soulLinkActiveChat.value, false);
            sendOnlineModeGreeting();
        } else {
            setChatOfflineMode(soulLinkActiveChat.value, true);
            prepareGreetingsForSelection();
            showGreetingSelect.value = true;
        }
    };

    const sendOnlineModeGreeting = () => {
        if (!soulLinkActiveChat.value) return;
        const activeCharacter = characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
        if (activeCharacter) {
            let greetings = [];
            if (activeCharacter.openingLines && activeCharacter.openingLines.length) {
                greetings = activeCharacter.openingLines;
            } else if (activeCharacter.openingLine) {
                greetings = activeCharacter.openingLine.split('\n\n').filter(g => g.trim());
            }
            if (greetings.length) {
                const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
                pushMessageToActiveChat({
                    id: Date.now(),
                    sender: 'ai',
                    text: randomGreeting,
                    timestamp: Date.now()
                });
            }
        }
    };

    const prepareGreetingsForSelection = () => {
        if (!soulLinkActiveChat.value) return;
        const activeCharacter = characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
        if (activeCharacter) {
            if (activeCharacter.openingLine && (!activeCharacter.openingLines || activeCharacter.openingLines.length === 0)) {
                activeCharacter.openingLines = activeCharacter.openingLine.split('\n\n').filter(l => l.trim());
            }
            if (activeCharacter.openingLines && activeCharacter.openingLines.length) {
                availableGreetings.value = activeCharacter.openingLines.map((greeting, index) => ({
                    title: greeting.length < 50 ? greeting : `开场白 ${index + 1}`,
                    content: greeting
                }));
            } else {
                availableGreetings.value = [];
            }
        } else {
            availableGreetings.value = [];
        }
    };

    const selectGreeting = (greeting) => {
        if (!greeting) return;
        setChatOfflineMode(soulLinkActiveChat.value, true);
        pushMessageToActiveChat({
            id: Date.now(),
            sender: 'ai',
            text: greeting.content,
            timestamp: Date.now(),
            isOfflineMode: true
        });
        showGreetingSelect.value = false;
    };

    // ==================== 群聊 ====================
    const activeGroupChat = computed(() => {
        return soulLinkGroups.value.find(g => String(g.id) === String(soulLinkActiveChat.value)) || null;
    });

    const createNewGroup = () => {
        if (!newGroupName.value.trim()) return;
        const members = [];
        selectedGroupMembers.value.forEach(charId => {
            const char = characters.value.find(c => String(c.id) === String(charId));
            if (char) {
                members.push({
                    id: char.id,
                    name: char.nickname || char.name,
                    avatarUrl: char.avatarUrl,
                    relation: '',
                    persona: char.persona || '',
                    worldbookIds: Array.isArray(char.worldbookIds) ? [...char.worldbookIds] : [],
                    selectedPresetId: char.selectedPresetId != null ? char.selectedPresetId : null,
                    timeZone: 'Asia/Shanghai'
                });
            }
        });
        if (members.length === 0) {
            members.push(
                { id: 'default1', name: '成员A', avatarUrl: '', relation: '', persona: '', worldbookIds: [], selectedPresetId: null, timeZone: 'Asia/Shanghai' },
                { id: 'default2', name: '成员B', avatarUrl: '', relation: '', persona: '', worldbookIds: [], selectedPresetId: null, timeZone: 'Asia/Shanghai' },
                { id: 'default3', name: '成员C', avatarUrl: '', relation: '', persona: '', worldbookIds: [], selectedPresetId: null, timeZone: 'Asia/Shanghai' }
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
        if (externalTrigger.saveSoulLinkGroups) externalTrigger.saveSoulLinkGroups();
        showCreateGroupDialog.value = false;
        newGroupName.value = '';
        newGroupMembers.value = '';
        newGroupAvatar.value = '';
        selectedGroupMembers.value = [];
    };

    const toggleGroupMember = (charId) => {
        const idx = selectedGroupMembers.value.indexOf(charId);
        if (idx > -1) selectedGroupMembers.value.splice(idx, 1);
        else selectedGroupMembers.value.push(charId);
    };

    const getAvailableCharactersForAdd = computed(() => {
        if (!activeGroupChat.value || !Array.isArray(activeGroupChat.value.members)) return characters.value;
        const existingMemberIds = activeGroupChat.value.members.map(m => m.id);
        return characters.value.filter(c => !existingMemberIds.includes(c.id));
    });

    const toggleAddMember = (charId) => {
        const idx = selectedAddMembers.value.indexOf(charId);
        if (idx > -1) selectedAddMembers.value.splice(idx, 1);
        else selectedAddMembers.value.push(charId);
    };

    const addMembersToGroup = () => {
        if (!activeGroupChat.value || selectedAddMembers.value.length === 0) return;
        selectedAddMembers.value.forEach(charId => {
            const char = characters.value.find(c => String(c.id) === String(charId));
            if (char) {
                activeGroupChat.value.members.push({
                    id: char.id,
                    name: char.nickname || char.name,
                    avatarUrl: char.avatarUrl,
                    relation: '',
                    persona: char.persona || '',
                    worldbookIds: Array.isArray(char.worldbookIds) ? [...char.worldbookIds] : [],
                    selectedPresetId: char.selectedPresetId != null ? char.selectedPresetId : null,
                    timeZone: 'Asia/Shanghai'
                });
            }
        });
        if (externalTrigger.saveSoulLinkGroups) externalTrigger.saveSoulLinkGroups();
        showAddMemberDialog.value = false;
        selectedAddMembers.value = [];
    };

    const removeGroupMember = (index) => {
        if (!activeGroupChat.value) return;
        if (activeGroupChat.value.members.length <= 1) {
            alert('群聊至少需要1个成员！');
            return;
        }
        if (confirm('确定要删除这个成员吗？')) {
            activeGroupChat.value.members.splice(index, 1);
            if (externalTrigger.saveSoulLinkGroups) externalTrigger.saveSoulLinkGroups();
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
            worldbookIds: Array.isArray(customMemberWorldbookIds.value) ? [...customMemberWorldbookIds.value] : [],
            selectedPresetId: customMemberPresetId.value != null ? customMemberPresetId.value : null,
            timeZone: String(customMemberTimeZone.value || 'Asia/Shanghai').trim() || 'Asia/Shanghai',
            isCustom: true
        };
        activeGroupChat.value.members.push(newMember);
        if (externalTrigger.saveSoulLinkGroups) externalTrigger.saveSoulLinkGroups();
        showAddMemberDialog.value = false;
        addMemberMode.value = 'existing';
        customMemberAvatar.value = '';
        customMemberName.value = '';
        customMemberPersona.value = '';
        customMemberWorldbookIds.value = [];
        customMemberPresetId.value = null;
        customMemberTimeZone.value = 'Asia/Shanghai';
    };

    const openMemberEditor = (member) => {
        if (!member || typeof member !== 'object') return;
        const clone = JSON.parse(JSON.stringify(member));
        if (!Array.isArray(clone.worldbookIds)) clone.worldbookIds = [];
        if (clone.selectedPresetId === undefined) clone.selectedPresetId = null;
        if (clone.persona === undefined) clone.persona = '';
        if (clone.relation === undefined) clone.relation = '';
        if (!clone.timeZone) clone.timeZone = 'Asia/Shanghai';
        editingMember.value = clone;
        showMemberEditor.value = true;
    };

    const closeMemberEditor = () => {
        showMemberEditor.value = false;
        editingMember.value = null;
    };

    const saveMemberEditor = () => {
        if (!editingMember.value || !activeGroupChat.value) return;
        const group = soulLinkGroups.value.find(g => String(g.id) === String(activeGroupChat.value.id));
        if (!group || !Array.isArray(group.members)) return;
        let index = group.members.findIndex(m => m && String(m.id) === String(editingMember.value.id));
        if (index === -1) {
            index = group.members.findIndex(m => m && m.name === editingMember.value.name);
        }
        if (index === -1) return;
        group.members[index] = { ...editingMember.value };
        soulLinkGroups.value = [...soulLinkGroups.value];
        if (externalTrigger.saveSoulLinkGroups) externalTrigger.saveSoulLinkGroups();
        closeMemberEditor();
    };

    const renameGroup = () => {
        if (!activeGroupChat.value || !newGroupNameInput.value.trim()) return;
        activeGroupChat.value.name = newGroupNameInput.value.trim();
        if (tempGroupAvatar.value) activeGroupChat.value.avatarUrl = tempGroupAvatar.value;
        if (externalTrigger.saveSoulLinkGroups) externalTrigger.saveSoulLinkGroups();
        showRenameGroupDialog.value = false;
        newGroupNameInput.value = '';
        tempGroupAvatar.value = '';
    };

    const shakeCharacter = () => {
        if (!soulLinkActiveChat.value) return;
        const char = characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
        if (!char) return;
        const msg = {
            id: `msg_${Date.now()}`,
            sender: 'system',
            text: `[拍一拍] 你拍了拍${char.nickname || char.name}`,
            timestamp: Date.now(),
            isSystem: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        if (soulLinkActiveChatType.value === 'group' && activeGroupChat.value) {
            if (!Array.isArray(activeGroupChat.value.history)) activeGroupChat.value.history = [];
            activeGroupChat.value.history.push(msg);
        } else {
            if (!soulLinkMessages.value[soulLinkActiveChat.value]) soulLinkMessages.value[soulLinkActiveChat.value] = [];
            soulLinkMessages.value[soulLinkActiveChat.value].push(msg);
        }
        if (externalTrigger.saveSoulLinkMessages) externalTrigger.saveSoulLinkMessages();
        if (externalTrigger.saveSoulLinkGroups) externalTrigger.saveSoulLinkGroups();
        scrollToBottom();
    };

    const shakeGroupMember = (member) => {
        if (!activeGroupChat.value) return;
        const msg = {
            id: `msg_${Date.now()}`,
            sender: 'system',
            text: `[拍一拍] 你拍了拍${member.name}`,
            timestamp: Date.now(),
            isSystem: true,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        if (!Array.isArray(activeGroupChat.value.history)) activeGroupChat.value.history = [];
        activeGroupChat.value.history.push(msg);
        if (externalTrigger.saveSoulLinkGroups) externalTrigger.saveSoulLinkGroups();
        scrollToBottom();
    };

    // ==================== 通话功能 ====================
    const loadCallDiaryRecords = () => {
        try {
            callDiaryRecords.value = JSON.parse(localStorage.getItem(CALL_DIARY_STORAGE_KEY) || '{}') || {};
        } catch { callDiaryRecords.value = {}; }
    };
    const loadCallDiaryCounters = () => {
        try {
            callDiaryCounters.value = JSON.parse(localStorage.getItem(CALL_DIARY_COUNTER_KEY) || '{}') || {};
        } catch { callDiaryCounters.value = {}; }
    };
    loadCallDiaryRecords();
    loadCallDiaryCounters();

    const getCallDiaryKey = () => {
        if (!soulLinkActiveChat.value) return '';
        return soulLinkActiveChatType.value === 'group'
            ? `group:${String(soulLinkActiveChat.value)}`
            : `char:${String(soulLinkActiveChat.value)}`;
    };

    const generateCallDiaryByModel = async ({ charName, duration, type, charPersona, recentChatMessages, sessionMessages, groupMembers }) => {
        const profile = activeProfile.value;
        if (!profile) return null;
        const endpoint = (profile.endpoint || '').trim();
        const key = (profile.key || '').trim();
        if (!endpoint || !key) return null;
        const model = profile.model || 'gpt-4o-mini';
        const talkType = type === 'video' ? '视频' : '语音';
        const recentChat = (recentChatMessages || []).slice(-18).map(m => ({
            sender: m.sender,
            text: (m.text || '').slice(0, 120),
            time: m.timestamp || m.time || ''
        }));
        const callChat = (sessionMessages || []).slice(-16).map(m => ({
            sender: m.sender,
            text: (m.text || '').slice(0, 120),
            time: m.time || ''
        }));
        const isGroup = !!groupMembers;
        const styleGuide = isGroup ? `你要为群聊中的**每一位参与过对话的成员（除了用户以外）**，分别以他们的第一人称视角（“我”）写一篇私密日记。
- 必须要用多段结构，格式如下：
【XXX 的日记】
（该成员的第一人称日记内容）

【YYY 的日记】
（另一位成员的第一人称日记内容）
- 必须基于各自的性格、关系和通话中的表现来写，不要写得千篇一律
- 展现他们各自的情绪和内心戏
- 用户代词严格使用：${chatSettings.userPronoun === 'female' ? '她' : (chatSettings.userPronoun === 'male' ? '他' : '你')}` : `你要以“白描、温润、克制”的中文散文风格写作：
- 角色第一人称（必须用“我”）
- 不要照抄聊天原句，不要逐条复述
- 通过细节、动作、感官去呈现情绪
- 不要写成报告/总结/提纲
- 用户代词严格使用：${chatSettings.userPronoun === 'female' ? '她' : (chatSettings.userPronoun === 'male' ? '他' : '你')}`;
        const prompt = `
请写一篇“通话后角色日记”。
【角色】姓名：${charName} 人设：${(charPersona || '').slice(0, 600)}
${isGroup ? `【参与成员】${JSON.stringify(groupMembers)}` : ''}
【通话信息】类型：${talkType} 时长：${duration}
【用户设定】${JSON.stringify({ pronoun: chatSettings.userPronoun, identity: chatSettings.userIdentity, relation: chatSettings.userRelation })}
【当前聊天上下文】${JSON.stringify(recentChat)}
【本次通话内容摘要素材】${JSON.stringify(callChat)}
【写作要求】${styleGuide}
只输出正文，不要标题、不要解释、不要代码块。`;
        const base = endpoint.replace(/\/+$/, '');
        const candidateUrls = /\/chat\/completions$/i.test(base) ? [base] : /\/v1$/i.test(base) ? [`${base}/chat/completions`] : [`${base}/v1/chat/completions`, `${base}/chat/completions`];
        for (const url of candidateUrls) {
            try {
                const resp = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
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
                const text = data?.choices?.[0]?.message?.content || data?.message?.content || '';
                if (text) return text.replace(/```[\s\S]*?```/g, '').trim();
            } catch {}
        }
        return null;
    };

    const createCallDiaryEntry = async () => {
        const key = getCallDiaryKey();
        if (!key) return null;
        const char = soulLinkActiveChatType.value === 'group' ? null : characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
        const isGroup = soulLinkActiveChatType.value === 'group';
        const activeGroup = isGroup ? soulLinkGroups.value.find(g => String(g.id) === String(soulLinkActiveChat.value)) : null;
        const charName = isGroup ? (activeGroup?.name || '群聊') : (char?.nickname || char?.name || 'TA');
        const titleName = isGroup ? '群聊' : charName;
        const chatHistory = getActiveChatHistory().slice(-20);
        const now = new Date();
        const counterKey = `${key}:${callType.value}`;
        const nextNo = (Number(callDiaryCounters.value[counterKey]) || 0) + 1;
        callDiaryCounters.value[counterKey] = nextNo;
        localStorage.setItem(CALL_DIARY_COUNTER_KEY, JSON.stringify(callDiaryCounters.value));
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
            title: `${titleName} · ${callType.value === 'video' ? '视频' : '语音'}通话档案`,
            body: '正在总结...',
            status: 'pending'
        };
        if (!Array.isArray(callDiaryRecords.value[key])) callDiaryRecords.value[key] = [];
        callDiaryRecords.value[key].unshift(entry);
        localStorage.setItem(CALL_DIARY_STORAGE_KEY, JSON.stringify(callDiaryRecords.value));
        // 后台生成
        (async () => {
            try {
                const diaryText = await generateCallDiaryByModel({
                    charName,
                    duration: entry.duration,
                    type: entry.callType,
                    charPersona: char?.persona || '',
                    recentChatMessages: chatHistory,
                    sessionMessages: callMessages.value || [],
                    groupMembers: isGroup ? (activeGroup?.members || []) : null
                });
                const finalDiaryText = diaryText || `这次${entry.callType === 'video' ? '视频' : '语音'}通话结束后，我还在回味刚才的节奏。\n我们聊了大约${entry.duration || '00:00'}，有些话并不长，却很有温度。`;
                entry.body = finalDiaryText + `\n\n—— ${new Date(entry.createdAt).toLocaleDateString('zh-CN')} · ${charName}`;
                entry.status = 'ready';
                localStorage.setItem(CALL_DIARY_STORAGE_KEY, JSON.stringify(callDiaryRecords.value));
            } catch {
                entry.status = 'failed';
                entry.body = '总结失败（可稍后再试）。';
                localStorage.setItem(CALL_DIARY_STORAGE_KEY, JSON.stringify(callDiaryRecords.value));
            }
        })();
        return entry;
    };

    const openCallDiary = (msg) => {
        if (!msg?.callDiaryId) return;
        const key = getCallDiaryKey();
        const list = Array.isArray(callDiaryRecords.value[key]) ? callDiaryRecords.value[key] : [];
        const found = list.find(x => String(x.id) === String(msg.callDiaryId));
        if (!found) return;
        selectedCallDiary.value = found;
        callDiaryTitle.value = found.title || '通话档案';
        showCallDiaryModal.value = true;
    };

    const closeCallDiaryModal = () => {
        showCallDiaryModal.value = false;
        selectedCallDiary.value = null;
    };

    const startCallTimer = () => {
        let seconds = 0;
        if (callInterval) clearInterval(callInterval);
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

    const toggleMute = () => { isMuted.value = !isMuted.value; };
    const toggleSpeaker = () => { isSpeakerOn.value = !isSpeakerOn.value; };
    const toggleCamera = () => { isCameraOn.value = !isCameraOn.value; };
    const toggleCallInput = () => { showCallInput.value = !showCallInput.value; };
    const sendCallText = async () => {
        const text = callInputText.value.trim();
        if (!text) return;

        // 1. 用户的输入立即上屏
        callMessages.value.push({
            sender: 'user',
            text: text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        scrollCallToBottom();
        callInputText.value = '';
        isCallAiTyping.value = true;

        // 2. 检查大模型 API 配置
        const profile = activeProfile.value;
        if (!profile || !profile.endpoint || !profile.key) {
            isCallAiTyping.value = false;
            callMessages.value.push({
                sender: 'system',
                text: '（通话中断：未检测到 API 配置）',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            scrollCallToBottom();
            return;
        }

        // 3. 获取当前聊天对象信息 & 构建 Prompt
        let charName = 'TA';
        let charPersona = '';
        let systemPrompt = '';
        const callModeStr = callType.value === 'video' ? '视频' : '语音';

        if (soulLinkActiveChatType.value === 'character') {
            const char = characters.value.find(c => String(c.id) === String(soulLinkActiveChat.value));
            if (char) {
                charName = char.nickname || char.name;
                charPersona = char.persona || '';
            }
            systemPrompt = `你现在正在和用户进行${callModeStr}通话。
你的名字/身份是：${charName}。
${charPersona ? `你的设定：${charPersona}\n` : ''}
【通话要求（最高优先级）】：
1. 必须像真人打电话一样，使用极度口语化、生活化、简短的句子。
2. 每次回复限制在1-3句话以内。
3. 绝对不要输出任何动作描写、表情符号、心理描写（严禁出现 [OS]、[图片]、*微笑* 等），只能输出嘴里说出来的话。
4. 根据下方的通话上下文自然回应。`;
        } else if (soulLinkActiveChatType.value === 'group') {
            const group = soulLinkGroups.value.find(g => String(g.id) === String(soulLinkActiveChat.value));
            if (group) charName = group.name;
            const members = group && Array.isArray(group.members) ? group.members.map(m => typeof m === 'string' ? m : m.name).join('、') : '多名成员';
            systemPrompt = `你现在正在群聊【${charName}】的${callModeStr}通话中。
群成员有：${members}。
【通话要求（最高优先级）】：
1. 必须像真人打电话一样，使用极度口语化、生活化、简短的句子。
2. 每次只扮演一名群成员回复，回复限制在1-3句话以内。
3. 绝对不要输出动作描写、心理描写等，只能输出嘴里说出来的话。
4. 必须在回复开头明确写出你是哪位成员，格式为：成员名: 正式回复内容`;
        }

        const messagesPayload = [{ role: 'system', content: systemPrompt }];

        // 5. 拼装本次通话的历史记录 (取最近的12条避免Token过长)
        const recentMessages = callMessages.value.slice(-12);
        recentMessages.forEach(m => {
            if (m.sender === 'user') {
                messagesPayload.push({ role: 'user', content: m.text });
            } else if (m.sender === 'ai') {
                messagesPayload.push({ role: 'assistant', content: m.text });
            }
        });

        // 6. 调用 API 获取回复
        try {
            const replyRaw = await callAI(profile, messagesPayload, {
                temperature: 0.75, // 稍微高一点让对话更自然
                max_tokens: 150
            });

            let replyText = String(replyRaw || '').trim();
            if (!replyText) replyText = '（沉默了...）';

            // 强制清理可能被模型误生成的格式化标签
            replyText = replyText.replace(/\[.*?\]/g, '').replace(/\*.*?\*/g, '').trim();

            let senderName = charName;
            if (soulLinkActiveChatType.value === 'group') {
                const match = replyText.match(/^\s*[*【\[]?([^:：**】\]]+)[*】\]]?[:：]\s*([\s\S]+)$/);
                if (match) {
                    senderName = match[1].trim();
                    replyText = match[2].trim();
                } else {
                    const group = soulLinkGroups.value.find(g => String(g.id) === String(soulLinkActiveChat.value));
                    const members = group && Array.isArray(group.members) ? group.members : [];
                    if (members.length > 0) {
                        const randomMember = members[Math.floor(Math.random() * members.length)];
                        senderName = typeof randomMember === 'string' ? randomMember : (randomMember.name || '成员');
                    } else {
                        senderName = '成员';
                    }
                }
            }

            callMessages.value.push({
                sender: 'ai',
                senderName: senderName,
                text: replyText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            scrollCallToBottom();
        } catch (error) {
            console.error('Call AI Error:', error);
            callMessages.value.push({
                sender: 'system',
                text: `（信号不佳：${error.message}）`,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            scrollCallToBottom();
        } finally {
            isCallAiTyping.value = false;
        }
    };

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

    // ==================== 其他 UI 辅助 ====================
    const currentChatName = computed(() => {
        if (!soulLinkActiveChat.value) return '聊天';
        if (soulLinkActiveChatType.value === 'group' && activeGroupChat.value) return activeGroupChat.value.name;
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

    const getLastMessage = (charId) => {
        let msgs = soulLinkMessages.value[charId] || [];
        const group = soulLinkGroups.value.find(g => String(g.id) === String(charId));
        if (group && Array.isArray(group.history)) msgs = group.history;
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
        if (group && Array.isArray(group.history)) msgs = group.history;
        if (!msgs.length) return '';
        const lastMsg = msgs[msgs.length - 1];
        return new Date(lastMsg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getUnrepliedCountForChar = (charId) => {
        if (soulLinkActiveChatType.value === 'character' && String(soulLinkActiveChat.value) === String(charId)) return 0;
        const msgs = soulLinkMessages.value[charId] || [];
        return msgs.filter(m => m && m.sender === 'ai' && m.isReadByUser === false && !m.isSystem && !m.isHidden).length;
    };

    const getUnrepliedCountForGroup = (groupId) => {
        if (soulLinkActiveChatType.value === 'group' && String(soulLinkActiveChat.value) === String(groupId)) return 0;
        const group = soulLinkGroups.value.find(g => String(g.id) === String(groupId));
        const msgs = group && Array.isArray(group.history) ? group.history : [];
        return msgs.filter(m => m && m.sender === 'ai' && m.isReadByUser === false && !m.isSystem && !m.isHidden).length;
    };

    const activeChatTag = ref('');
    
    const chatTags = computed(() => {
        const tagSet = new Set();
        (characters.value || []).forEach(char => {
            if (char && char.tags && Array.isArray(char.tags)) {
                char.tags.forEach(t => tagSet.add(t));
            }
        });
        return Array.from(tagSet);
    });

    const getLastMsgTimestamp = (id, isGroup) => {
        let msgs = [];
        if (isGroup) {
            const group = soulLinkGroups.value.find(g => String(g.id) === String(id));
            if (group && Array.isArray(group.history)) msgs = group.history;
        } else {
            msgs = soulLinkMessages.value[id] || [];
        }
        if (!msgs.length) {
            if (isGroup) {
                const group = soulLinkGroups.value.find(g => String(g.id) === String(id));
                return group ? Number(group.id) : 0;
            } else {
                const char = characters.value.find(c => String(c.id) === String(id));
                return char && char.timestamp ? char.timestamp : (char ? Number(char.id) || 0 : 0);
            }
        }
        return msgs[msgs.length - 1].timestamp || 0;
    };

    const togglePin = (id, isGroup) => {
        if (isGroup) {
            const group = soulLinkGroups.value.find(g => String(g.id) === String(id));
            if (group) {
                group.isPinned = !group.isPinned;
                if (externalTrigger.saveSoulLinkGroups) externalTrigger.saveSoulLinkGroups();
            }
        } else {
            const char = characters.value.find(c => String(c.id) === String(id));
            if (char) {
                char.isPinned = !char.isPinned;
                // script.js deeply watches characters and auto-saves
            }
        }
    };

    const displayChatCharacters = computed(() => {
        let list = (characters.value || []).filter(Boolean);
        if (activeChatTag.value) {
            list = list.filter(c => c.tags && c.tags.includes(activeChatTag.value));
        }
        return list.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            const timeA = getLastMsgTimestamp(a.id, false);
            const timeB = getLastMsgTimestamp(b.id, false);
            if (timeB !== timeA) return timeB - timeA;
            return Number(b.id || 0) - Number(a.id || 0);
        });
    });

    const displayChatGroups = computed(() => {
        let list = (soulLinkGroups.value || []).filter(Boolean);
        return list.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            const timeA = getLastMsgTimestamp(a.id, true);
            const timeB = getLastMsgTimestamp(b.id, true);
            if (timeB !== timeA) return timeB - timeA;
            return Number(b.id || 0) - Number(a.id || 0);
        });
    });

    const totalUnrepliedCount = computed(() => {
        let total = 0;
        characters.value.forEach(c => { total += getUnrepliedCountForChar(c.id); });
        soulLinkGroups.value.forEach(g => { total += getUnrepliedCountForGroup(g.id); });
        return total;
    });

    const formatUnreadCount = (count) => {
        const n = Number(count) || 0;
        return n > 99 ? '99+' : String(n);
    };

    const formatMessageDate = (timestamp) => {
        const date = new Date(timestamp || Date.now());
        return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' +
            date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatTime = (timestamp, nowTs = Date.now()) => {
        const date = new Date(timestamp);
        const now = new Date(nowTs);
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        return date.toLocaleDateString('zh-CN');
    };

    const shouldShowTimeDivider = (index) => {
        const msgs = getActiveChatHistory();
        if (!Array.isArray(msgs) || index == null) return false;
        const cur = msgs[index];
        if (!cur || !cur.timestamp) return false;
        if (index === 0) return true;
        const prev = msgs[index - 1];
        if (!prev || !prev.timestamp) return true;
        const curTs = Number(cur.timestamp) || 0;
        const prevTs = Number(prev.timestamp) || 0;
        const diff = Math.abs(curTs - prevTs);
        if (diff >= 5 * 60 * 1000) return true;
        const d1 = new Date(curTs);
        const d2 = new Date(prevTs);
        return d1.toDateString() !== d2.toDateString();
    };

    const cleanupCallTimer = () => {
        if (callInterval) clearInterval(callInterval);
        callInterval = null;
    };

    const cleanup = () => {
        cleanupCallTimer();
        if (longPressTimer.value) {
            clearTimeout(longPressTimer.value);
            longPressTimer.value = null;
        }
        if (typeof chatSettings.clearActiveMessageTimer === 'function') {
            chatSettings.clearActiveMessageTimer();
        }
    };

    // ==================== 导出 ====================
    return {
        // 状态
        soulLinkTab, soulLinkActiveChat, soulLinkActiveChatType, soulLinkInput, soulLinkReplyTarget,
        soulLinkMessages, soulLinkGroups, isAiTyping, focusedOsMessageId, editingMessageId, novelMode,
        showChatSettings, showGreetingSelect, availableGreetings,
        selectedGreeting, archivedChats, showCreateGroupDialog,
        activeVote, newGroupName, newGroupMembers,
        newGroupAvatar, selectedGroupMembers, groupAvatarInput, showAddMemberDialog,
        selectedAddMembers, addMemberMode, customMemberAvatar, customMemberName, customMemberPersona,
        customMemberWorldbookIds, customMemberPresetId, customMemberTimeZone,
        customMemberAvatarInput, newGroupNameInput, tempGroupAvatar, renameGroupAvatarInput,
        showMemberEditor, editingMember,
        showRenameGroupDialog, stickerPacks, favoriteStickers, activeStickerTab,
        showStickerImportPanel, stickerImportText, newPackName, emojiList,
        callActive, callType, callTimer, callMessages, isCallAiTyping, showCallInput, callInputText,
        isMuted, isSpeakerOn, isCameraOn, callDiaryRecords, callDiaryCounters, showCallDiaryModal,
        selectedCallDiary, callDiaryTitle, videoSelfPosition, isVideoAvatarSwapped,
        contextMenu, longPressTimer, longPressStart,

        // 计算属性
        activeGroupChat, isOfflineMode, currentChatName, currentChatAvatar,
        totalUnrepliedCount, activeChatTag, chatTags, displayChatCharacters, displayChatGroups,

        // 方法
        sendSoulLinkMessage, triggerSoulLinkAiReply, pushMessageToActiveChat, pushMessageToTargetChat,
        getActiveChatHistory, getPendingUserMessages,
        markMessagesReplied, syncActiveChatState, persistActiveChat, scrollToBottom,
        onMessageContextMenu, onMessageTouchStart, onMessageTouchMove, onMessageTouchEnd,
        handleContextAction, closeContextMenu, toggleOfflineMode, selectGreeting,
        createNewGroup, toggleGroupMember, getAvailableCharactersForAdd, toggleAddMember,
        addMembersToGroup, removeGroupMember, addCustomMember, renameGroup, shakeCharacter, shakeGroupMember,
        openMemberEditor, closeMemberEditor, saveMemberEditor,
        isCallActive: callActive, isCallAiTyping, callType, callTimer,
        callMessagesContainer, videoCallMessagesContainer,
        setGroupActiveMessageCallback, scheduleRoleActiveMessageChain,
        startVoiceCall, startVideoCall, endCall, toggleMute, toggleSpeaker, toggleCamera,
        toggleCallInput, sendCallText, openCallDiary, closeCallDiaryModal, swapVideoAvatars,
        startDragVideoSelf, getLastMessage, formatLastMsgTime, getUnrepliedCountForChar,
        getUnrepliedCountForGroup, formatUnreadCount, formatMessageDate, formatTime, shouldShowTimeDivider,
        getLastMsgTimestamp, togglePin,
        // 辅助（外部可能需要）
        setChatOfflineMode, saveChatOfflineModes, loadChatOfflineModes,
        sendOnlineModeGreeting, prepareGreetingsForSelection,
        // 内部函数暴露给外部（如翻译）
        parseReplyAndOs, buildSoulLinkReplyContext, extractAiTransfer, extractAiImageDescription,
        splitAiTransferSegments, splitAiImageSegments, splitAiVoiceSegments, extractAiVoice,
        extractStickersFromText, formatAiImageText, extractAiShoppingCard,
        cleanup,
        // 存档相关（saveArchivedChats 由 script 注入 externalTrigger 时覆盖/或使用 persist）
        saveArchivedChats: () => {},
    };
}