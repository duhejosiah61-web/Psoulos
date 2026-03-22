// =========================================================================
// == LIVE APP
// =========================================================================
import { ref, computed, onMounted, onUnmounted, watch } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

export function useLive(characters, activeProfile, profiles, availableModels) {
    // --- 状态管理 ---
    const liveWaveBars = ref([10, 16, 12, 18, 11, 15]);
    const liveOnlineCount = ref(1178);
    const activeLiveRoomId = ref('');
    const liveMicMuted = ref(false);
    const liveElapsedSeconds = ref(102);
    const liveInput = ref('');
    const liveMessages = ref({});
    const liveHostSpeechByRoom = ref({});
    /** 各房间主播台词历史（时间正序存储，展示时倒序） */
    const liveHostSpeechHistoryByRoom = ref({});
    const liveHostHistoryOpen = ref(false);
    const liveDanmakuByRoom = ref({});
    const liveHostSpeechLoading = ref(false);
    const liveBgmPlaying = ref(false);
    const liveBgmAudioRef = ref(null);
    const LIVE_BGM_URL = 'https://files.catbox.moe/4bugg1.mp3';
    let livePlaybackTimerIds = [];
    let liveNextBatchTimerId = null;
    let liveNpcBusy = false;

    // --- 计算属性 ---
    const liveRooms = computed(() => {
        const list = (characters.value || [])
            .filter(c => c && (c.name || c.nickname))
            .map((c, idx) => ({
                id: String(c.id),
                hostId: c.id,
                name: `${c.nickname || c.name}语音厅`,
                subtitle: idx % 2 === 0 ? '暖场陪聊' : '自由连麦'
            }));
        if (list.length === 0) {
            return [{ id: 'default-live-room', hostId: null, name: '默认语音厅', subtitle: '请先在Workshop创建角色' }];
        }
        return list;
    });

    const activeLiveRoom = computed(() => {
        return liveRooms.value.find(r => r.id === activeLiveRoomId.value) || liveRooms.value[0];
    });

    const activeLiveHost = computed(() => {
        const room = activeLiveRoom.value;
        if (!room || room.hostId == null) return null;
        return (characters.value || []).find(c => String(c.id) === String(room.hostId)) || null;
    });

    const activeLiveMessages = computed(() => {
        const room = activeLiveRoom.value;
        if (!room) return [];
        if (!liveMessages.value[room.id]) {
            liveMessages.value[room.id] = [
                { id: `sys_${Date.now()}`, user: '系统', text: `欢迎来到${room.name}，请文明交流。`, system: true }
            ];
        }
        return liveMessages.value[room.id];
    });

    const liveElapsedText = computed(() => {
        const m = Math.floor(liveElapsedSeconds.value / 60);
        const s = liveElapsedSeconds.value % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    });

    const activeLiveHostSpeech = computed(() => {
        const id = activeLiveRoomId.value || activeLiveRoom.value?.id;
        if (!id) return '';
        return liveHostSpeechByRoom.value[id] || '';
    });

    const activeLiveHostSpeechHistory = computed(() => {
        const id = activeLiveRoomId.value || activeLiveRoom.value?.id;
        if (!id) return [];
        const list = liveHostSpeechHistoryByRoom.value[id];
        if (!Array.isArray(list) || list.length === 0) return [];
        return [...list].reverse();
    });

    const pushHostSpeechHistory = (roomId, line) => {
        if (!roomId || !line || !String(line).trim()) return;
        const text = String(line).trim();
        const prev = liveHostSpeechHistoryByRoom.value[roomId];
        if (Array.isArray(prev) && prev.length && prev[prev.length - 1].text === text) return;
        const id = `h_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const next = [...(Array.isArray(prev) ? prev : []), { id, text, at: Date.now() }];
        const max = 100;
        if (next.length > max) next.splice(0, next.length - max);
        liveHostSpeechHistoryByRoom.value[roomId] = next;
        liveHostSpeechHistoryByRoom.value = { ...liveHostSpeechHistoryByRoom.value };
    };

    const toggleLiveHostHistory = () => {
        liveHostHistoryOpen.value = !liveHostHistoryOpen.value;
    };

    const closeLiveHostHistory = () => {
        liveHostHistoryOpen.value = false;
    };

    const formatLiveHostHistoryTime = (ts) => {
        if (!ts) return '';
        try {
            return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch {
            return '';
        }
    };

    // --- 辅助函数 ---
    const extractJsonObject = (raw) => {
        if (!raw || typeof raw !== 'string') return null;
        const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
        const tryParse = (s) => {
            try {
                return JSON.parse(s);
            } catch {
                return null;
            }
        };
        if (fence) {
            const j = tryParse(fence[1].trim());
            if (j) return j;
        }
        const m = raw.match(/\{[\s\S]*\}/);
        if (m) {
            const j = tryParse(m[0]);
            if (j) return j;
        }
        return null;
    };

    const normalizeChatApiReplyBody = (data) => {
        if (!data || typeof data !== 'object') return '';
        if (data.error && (data.error.message || data.error.code)) {
            console.warn('[LIVE] API error:', data.error.message || data.error.code || data.error);
        }
        const ch = data.choices?.[0];
        if (ch) {
            const msg = ch.message || ch.delta;
            if (msg?.content != null) {
                if (typeof msg.content === 'string') return msg.content;
                if (Array.isArray(msg.content)) {
                    return msg.content
                        .map((c) => (typeof c === 'string' ? c : (c && (c.text || c.content)) || ''))
                        .join('');
                }
            }
        }
        if (data.message?.content && typeof data.message.content === 'string') {
            return data.message.content;
        }
        const parts = data.candidates?.[0]?.content?.parts;
        if (Array.isArray(parts) && parts.length) {
            return parts.map((p) => (p && p.text) || '').join('');
        }
        if (typeof data.output_text === 'string') return data.output_text;
        if (data.data && typeof data.data === 'object') {
            const nested = normalizeChatApiReplyBody(data.data);
            if (nested) return nested;
        }
        return '';
    };

    const callLiveChatApi = async (messages) => {
        const profile = activeProfile.value;
        if (!profile || !profile.endpoint || !profile.key) return null;
        let modelId = profile.model;
        if (!modelId && availableModels.value.length > 0) {
            modelId = availableModels.value[0].id;
            profile.model = modelId;
        }
        const endpoint = String(profile.endpoint).replace(/\/+$/, '');
        try {
            const response = await fetch(`${endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${profile.key}`
                },
                body: JSON.stringify({
                    model: modelId || '',
                    messages,
                    temperature: profile.temperature ?? 0.85,
                    stream: false
                })
            });
            const rawText = await response.text();
            let data = null;
            try {
                data = rawText ? JSON.parse(rawText) : null;
            } catch {
                if (!response.ok) {
                    console.warn('[LIVE] HTTP', response.status, rawText.slice(0, 400));
                }
                return null;
            }
            if (!response.ok) {
                const hint = data?.error?.message || rawText.slice(0, 400);
                console.warn('[LIVE] HTTP', response.status, hint);
                return null;
            }
            const reply = normalizeChatApiReplyBody(data).trim();
            if (!reply) {
                console.warn('[LIVE] 无法从响应中解析正文，请确认反代为 OpenAI 兼容 /chat/completions。响应键:', data ? Object.keys(data).join(',') : '(空)');
            }
            return reply || null;
        } catch (e) {
            console.warn('[LIVE] fetch 失败（若从浏览器打开本地文件，可能是 CORS；请用本地 http 服务访问）', e);
            return null;
        }
    };

    const pushLiveFloatingDanmaku = (roomId, { user, text, kind = 'chat' }) => {
        if (!roomId || !text) return;
        const id = `dm_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const track = Math.floor(Math.random() * 4);
        if (!liveDanmakuByRoom.value[roomId]) {
            liveDanmakuByRoom.value[roomId] = [];
        }
        liveDanmakuByRoom.value[roomId].push({ id, user: user || '路人', text, track, kind });
        liveDanmakuByRoom.value = { ...liveDanmakuByRoom.value };
        setTimeout(() => {
            const arr = liveDanmakuByRoom.value[roomId] || [];
            liveDanmakuByRoom.value[roomId] = arr.filter((x) => x.id !== id);
            liveDanmakuByRoom.value = { ...liveDanmakuByRoom.value };
        }, 12000);
    };

    const removeLiveDanmakuById = (roomId, dmId) => {
        const arr = liveDanmakuByRoom.value[roomId] || [];
        liveDanmakuByRoom.value[roomId] = arr.filter((x) => x.id !== dmId);
        liveDanmakuByRoom.value = { ...liveDanmakuByRoom.value };
    };

    const randomNpcFallback = () => {
        const nicks = ['夜航船', '海盐汽水', '小岛来信', '晚风投递员', '月亮供电所', '瞌睡星云'];
        const msgs = ['哈哈这个好听', '主持今天声音好苏', '蹲一个连麦', '前排', '今天氛围好暖', '我来了'];
        return {
            nick: nicks[Math.floor(Math.random() * nicks.length)],
            msg: msgs[Math.floor(Math.random() * msgs.length)],
            gift: Math.random() < 0.12 ? ['荧光棒', '小心心', '礼花'][Math.floor(Math.random() * 3)] : null
        };
    };

    const buildLiveFeedDigest = () => {
        const roomId = activeLiveRoomId.value || activeLiveRoom.value?.id;
        if (!roomId) return '';
        const lines = (liveMessages.value[roomId] || []).slice(-14);
        return lines.map((m) => `${m.user}：${m.text}`).join('\n');
    };

    const generateFallbackTimeline = () => {
        const hostBits = ['看到弹幕啦，嘿嘿', '感谢各位在场', '今天氛围不错呀', '欢迎新来的朋友'];
        const out = [];
        for (let i = 0; i < 10; i++) {
            const t = Math.min(30, Math.round((i / 10) * 28 + Math.random() * 2.5));
            if (Math.random() < 0.22) {
                out.push({ t, type: 'host', line: hostBits[Math.floor(Math.random() * hostBits.length)] });
            } else {
                const one = randomNpcFallback();
                if (one.gift) {
                    out.push({ t, type: 'npc', nick: one.nick, msg: '一点心意～', gift: one.gift });
                } else {
                    out.push({ t, type: 'npc', nick: one.nick, msg: one.msg, gift: null });
                }
            }
        }
        return out.sort((a, b) => a.t - b.t);
    };

    const executeLiveTimelineEvent = (roomId, ev) => {
        const cur = activeLiveRoomId.value || activeLiveRoom.value?.id;
        if (String(cur) !== String(roomId)) return;
        const typ = String(ev.type || 'npc').toLowerCase();
        if (typ === 'host') {
            const line = String(ev.line || '').replace(/\[REPLY\][\s\S]*?\[\/REPLY\]/gi, '').replace(/\[OS\][\s\S]*/gi, '').trim().slice(0, 200);
            if (line) {
                liveHostSpeechByRoom.value[roomId] = line;
                liveHostSpeechByRoom.value = { ...liveHostSpeechByRoom.value };
                pushHostSpeechHistory(roomId, line);
            }
            return;
        }
        const nick = String(ev.nick || '观众').slice(0, 12);
        const gift = ev.gift != null && String(ev.gift).trim() !== '' ? String(ev.gift).slice(0, 16) : '';
        if (gift) {
            if (!liveMessages.value[roomId]) liveMessages.value[roomId] = [];
            liveMessages.value[roomId].push({
                id: `gift_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                user: nick,
                text: `送出了 ${gift}`,
                kind: 'gift',
                giftName: gift
            });
            pushLiveFloatingDanmaku(roomId, { user: nick, text: `送出了 ${gift}`, kind: 'gift' });
        } else {
            const msg = String(ev.msg || '666').slice(0, 80);
            if (!liveMessages.value[roomId]) liveMessages.value[roomId] = [];
            liveMessages.value[roomId].push({
                id: `npc_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                user: nick,
                text: msg,
                kind: 'npc'
            });
            pushLiveFloatingDanmaku(roomId, { user: nick, text: msg, kind: 'npc' });
        }
    };

    const scheduleLiveTimeline = (roomId, timeline) => {
        clearLivePlaybackAndBatch();
        const sorted = [...timeline].sort((a, b) => (Number(a.t) || 0) - (Number(b.t) || 0));
        let maxSec = 8;
        for (const ev of sorted) {
            const sec = Math.max(0, Math.min(32, Number(ev.t) || 0));
            if (sec > maxSec) maxSec = sec;
            const delayMs = sec * 1000;
            const id = setTimeout(() => {
                executeLiveTimelineEvent(roomId, ev);
                livePlaybackTimerIds = livePlaybackTimerIds.filter((x) => x !== id);
            }, delayMs);
            livePlaybackTimerIds.push(id);
        }
        liveNextBatchTimerId = setTimeout(() => {
            liveNextBatchTimerId = null;
            runLiveBatchFetch();
        }, maxSec * 1000 + 2800);
    };

    const runLiveBatchFetch = async () => {
        if (liveNpcBusy) return;
        const roomId = activeLiveRoomId.value || activeLiveRoom.value?.id;
        if (!roomId) return;
        const room = activeLiveRoom.value;
        const digest = buildLiveFeedDigest();
        const host = activeLiveHost.value;
        const hostName = host ? (host.nickname || host.name || '主播') : '主播';
        liveNpcBusy = true;
        liveHostSpeechLoading.value = true;
        let raw = null;
        try {
            const sys = `你是语音厅直播间脚本生成器。只输出一个 JSON 对象，不要 markdown，不要解释。
格式示例：
{"timeline":[{"t":3,"type":"npc","nick":"昵称","msg":"弹幕内容","gift":null},{"t":9,"type":"host","line":"主播说一句话"},{"t":15,"type":"npc","nick":"昵称2","msg":"谢谢","gift":"礼物名"}]}
字段说明：
- timeline：8～14 条，按 t 从小到大；t 为从本段脚本开始的秒数，范围 0～30，彼此拉开间隔，模仿直播延迟。
- type 为 "npc"：必有 nick、msg；gift 为礼物名或 null（有礼物时 msg 可短）。
- type 为 "host"：必有 line，是主播「${hostName}」的口头台词，每条不超过 60 字，口语化。
- npc 与 host 穿插，内容多样，不要重复雷同。`;
            const userP = `房间：${room?.name || '语音厅'}\n近期动态参考：\n${digest || '（暂无）'}`;
            raw = await callLiveChatApi([
                { role: 'system', content: sys },
                { role: 'user', content: userP }
            ]);
        } finally {
            liveNpcBusy = false;
            liveHostSpeechLoading.value = false;
        }
        const stillId = activeLiveRoomId.value || activeLiveRoom.value?.id;
        if (String(stillId) !== String(roomId)) return;
        const parsed = raw ? extractJsonObject(raw) : null;
        const timeline = parsed && Array.isArray(parsed.timeline) ? parsed.timeline : null;
        if (timeline && timeline.length) {
            scheduleLiveTimeline(roomId, timeline);
        } else {
            scheduleLiveTimeline(roomId, generateFallbackTimeline());
        }
    };

    const clearLivePlaybackAndBatch = () => {
        livePlaybackTimerIds.forEach((id) => clearTimeout(id));
        livePlaybackTimerIds = [];
        if (liveNextBatchTimerId) {
            clearTimeout(liveNextBatchTimerId);
            liveNextBatchTimerId = null;
        }
        liveNpcBusy = false;
    };

    const switchLiveRoom = (roomId) => {
        if (!roomId || roomId === activeLiveRoomId.value) return;
        clearLivePlaybackAndBatch();
        liveHostHistoryOpen.value = false;
        activeLiveRoomId.value = roomId;
        liveElapsedSeconds.value = 0;
        setTimeout(() => runLiveBatchFetch(), 350);
    };

    const toggleLiveMic = () => {
        liveMicMuted.value = !liveMicMuted.value;
    };

    const sendLiveGift = () => {
        const roomId = activeLiveRoomId.value || activeLiveRoom.value?.id;
        if (!roomId) return;
        if (!liveMessages.value[roomId]) {
            liveMessages.value[roomId] = [];
        }
        const gifts = ['小心心', '荧光棒', '棒棒糖', '小气球'];
        const g = gifts[Math.floor(Math.random() * gifts.length)];
        liveMessages.value[roomId].push({
            id: `gift_${Date.now()}`,
            user: '我',
            text: `送出了 ${g}`,
            kind: 'gift'
        });
        liveMessages.value = { ...liveMessages.value };
    };

    const sendLiveMessage = () => {
        const text = (liveInput.value || '').trim();
        if (!text) return;
        const roomId = activeLiveRoomId.value || activeLiveRoom.value?.id;
        if (!roomId) return;
        if (!liveMessages.value[roomId]) {
            liveMessages.value[roomId] = [];
        }
        liveMessages.value[roomId].push({
            id: Date.now(),
            user: '我',
            text,
            kind: 'chat'
        });
        pushLiveFloatingDanmaku(roomId, { user: '我', text, kind: 'chat' });
        liveInput.value = '';
    };

    const toggleLiveBgm = () => {
        const el = liveBgmAudioRef.value;
        if (!el) return;
        if (liveBgmPlaying.value) {
            el.pause();
            liveBgmPlaying.value = false;
        } else {
            el.play().then(() => {
                liveBgmPlaying.value = true;
            }).catch(() => {
                liveBgmPlaying.value = false;
            });
        }
    };

    const onLiveBgmPlay = () => { liveBgmPlaying.value = true; };
    const onLiveBgmPause = () => { liveBgmPlaying.value = false; };

    // --- 定时器与生命周期 ---
    let waveInterval, onlineCountInterval, elapsedInterval;

    onMounted(() => {
        // 波形律动
        waveInterval = setInterval(() => {
            liveWaveBars.value = liveWaveBars.value.map(() => 8 + Math.floor(Math.random() * 14));
        }, 900);
        // 在线人数模拟
        onlineCountInterval = setInterval(() => {
            const change = Math.floor(Math.random() * 21) - 10;
            liveOnlineCount.value = Math.max(1000, liveOnlineCount.value + change);
        }, 900);
        // 计时器
        elapsedInterval = setInterval(() => {
            liveElapsedSeconds.value += 1;
        }, 1000);
    });

    onUnmounted(() => {
        clearInterval(waveInterval);
        clearInterval(onlineCountInterval);
        clearInterval(elapsedInterval);
        clearLivePlaybackAndBatch();
    });

    // 当房间列表变化时，如果当前房间不在列表中，则切换到第一个
    watch(liveRooms, (rooms) => {
        if (!Array.isArray(rooms) || rooms.length === 0) return;
        const exists = rooms.some(r => r.id === activeLiveRoomId.value);
        if (!exists) activeLiveRoomId.value = rooms[0].id;
    }, { immediate: true });

    // 暴露给外部的启动批量获取的方法（由外部在进入live时调用）
    const startBatchFetch = () => {
        runLiveBatchFetch();
    };

    return {
        // 状态
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
        // 计算属性
        liveRooms,
        activeLiveRoom,
        activeLiveHost,
        activeLiveMessages,
        liveElapsedText,
        activeLiveHostSpeech,
        activeLiveHostSpeechHistory,
        liveHostHistoryOpen,
        // 方法
        switchLiveRoom,
        toggleLiveMic,
        sendLiveGift,
        sendLiveMessage,
        toggleLiveBgm,
        onLiveBgmPlay,
        onLiveBgmPause,
        startBatchFetch,
        clearLivePlaybackAndBatch,
        toggleLiveHostHistory,
        closeLiveHostHistory,
        formatLiveHostHistoryTime,
    };
}