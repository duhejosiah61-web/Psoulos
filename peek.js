import { ref, computed, watch, onMounted, onUnmounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

const STORAGE_KEY = 'peek_app_state_v1';

const APP_DEFS = [
    { id: 'messages', name: '消息', icon: 'fa-comments' },
    { id: 'calls', name: '通话', icon: 'fa-phone' },
    { id: 'album', name: '相册', icon: 'fa-image' },
    { id: 'notes', name: '备忘', icon: 'fa-note-sticky' },
    { id: 'browser', name: '浏览器', icon: 'fa-globe' },
    { id: 'files', name: '文件', icon: 'fa-folder' },
    { id: 'diary', name: '日记', icon: 'fa-book' },
    { id: 'bank', name: '银行卡', icon: 'fa-credit-card' },
    { id: 'map', name: '地图', icon: 'fa-map-location-dot' }
];

const DOCK_APPS = [
    { id: 'calls', name: '通话', icon: 'fa-phone' },
    { id: 'messages', name: '消息', icon: 'fa-comments' },
    { id: 'browser', name: '浏览器', icon: 'fa-globe' },
    { id: 'album', name: '相册', icon: 'fa-image' }
];

const readState = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
};

const saveState = (state) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // ignore storage failures
    }
};

const getPeekCharDataKey = (charId) => `peek_char_data_v1_${String(charId || '')}`;
const readPeekCharData = (charId) => {
    if (!charId) return null;
    try {
        const raw = localStorage.getItem(getPeekCharDataKey(charId));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};
const savePeekCharData = (charId, data) => {
    if (!charId) return;
    try {
        localStorage.setItem(getPeekCharDataKey(charId), JSON.stringify(data || {}));
    } catch {
        // ignore storage failures
    }
};

const hashToHue = (s) => {
    const str = String(s || '');
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h % 360;
};

const makeMockPhoto = (seed, idx) => {
    const base = seed || 'portrait';
    const hue = hashToHue(`${base}_${idx}`);
    const bgColor = `hsl(${hue}, 55%, 78%)`;
    const bgColor2 = `hsl(${(hue + 40) % 360}, 55%, 70%)`;
    const description = `${base}·${['夜景', '咖啡桌', '城市窗', '街灯'][idx % 4]}`;
    return {
        id: `mock_${hashToHue(description)}_${idx}`,
        description,
        bgColor,
        bgColor2
    };
};

const samplePhotos = (seedName) => [0, 1, 2, 3].map((i) => makeMockPhoto(seedName, i));

export function usePeek(charactersRef, activeProfileRef, soulLinkMessagesRef, soulLinkGroupsRef) {
    const saved = readState();

    const peekSelectedCharacterId = ref(saved.peekSelectedCharacterId || '');
    const peekInnerApp = ref('home');
    const peekSearch = ref('');
    const peekDark = ref(saved.peekDark !== false);

    const peekSelectedCharacter = computed(() => {
        const chars = Array.isArray(charactersRef?.value) ? charactersRef.value : [];
        return chars.find((c) => String(c.id) === String(peekSelectedCharacterId.value)) || null;
    });

    const peekStatusTime = ref('');
    const peekLocked = ref(true);
    let statusTick;
    const tickStatus = () => {
        const now = new Date();
        peekStatusTime.value = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
    };
    onMounted(() => {
        tickStatus();
        statusTick = setInterval(tickStatus, 1000);
    });
    onUnmounted(() => {
        if (statusTick) clearInterval(statusTick);
    });

    const peekPhoneTitle = computed(() => {
        const name = peekSelectedCharacter.value?.nickname || peekSelectedCharacter.value?.name || '未选择角色';
        return `${name} 的手机`;
    });

    const peekWidgetGreeting = computed(() => {
        const h = new Date().getHours();
        if (h >= 5 && h < 12) return '早安';
        if (h >= 12 && h < 18) return '下午好';
        if (h >= 18 && h < 22) return '晚上好';
        return '夜深了';
    });
    const peekWidgetDate = computed(() => {
        peekStatusTime.value;
        return new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
    });
    const peekWidgetWeather = computed(() => {
        peekStatusTime.value;
        const temps = ['18°', '22°', '24°', '26°', '20°', '19°'];
        const idx = (new Date().getDate() + new Date().getHours()) % temps.length;
        const conds = ['晴', '多云', '阴', '晴'];
        const c = conds[idx % conds.length];
        return `${c} ${temps[idx]}`;
    });
    const peekDiaryEntries = ref([]);
    const peekBankAccount = ref({ balance: 0, monthlySpend: 0, records: [] });
    const peekMapTracks = ref([]);
    const peekAiLastGeneratedAt = ref('');
    const peekAiGenerating = ref(false);
    const PEAK_DIARY_CURSOR_KEY_PREFIX = 'peek_diary_cursor_ts_v1_';

    const getDiaryCursorTs = (charId) => {
        try {
            const raw = localStorage.getItem(`${PEAK_DIARY_CURSOR_KEY_PREFIX}${String(charId)}`);
            const n = Number(raw);
            return Number.isFinite(n) ? n : 0;
        } catch {
            return 0;
        }
    };

    const setDiaryCursorTs = (charId, ts) => {
        try {
            localStorage.setItem(`${PEAK_DIARY_CURSOR_KEY_PREFIX}${String(charId)}`, String(ts || 0));
        } catch {
            // ignore
        }
    };

    const formatTs = (ts) => {
        try {
            if (!ts) return '';
            const d = new Date(Number(ts) || 0);
            return d.toLocaleString('zh-CN', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

    const getCharDisplayName = (char) => char?.nickname || char?.name || 'TA';

    const formatMessageForDiary = (m, char) => {
        if (!m) return null;
        if (m.isSystem || m.sender === 'system' || m.isHidden) return null;
        if (m.sender !== 'user' && m.sender !== 'ai') return null;

        const roleName = getCharDisplayName(char);
        const speaker = m.sender === 'user'
            ? (m.senderName || '用户')
            : (m.senderName || roleName);

        let content = '';
        if (typeof m.text === 'string' && m.text.trim()) {
            content = m.text.trim();
        } else if (m.messageType === 'transfer') {
            content = `[转账] ${m.amount ?? ''} ${m.note ? `（${m.note}）` : ''}`.trim();
        } else if (m.messageType === 'helpBuy') {
            content = `[帮买请求] ${m.item ?? ''} 价格${m.price ?? ''}`.trim();
        } else if (m.messageType === 'order') {
            content = `[订单] ${m.item ?? ''} 价格${m.price ?? ''}`.trim();
        } else if (m.messageType === 'image') {
            // 图片统一用“文字假装图”的形式进入日记上下文
            content = m.text && m.text.trim() && m.text !== '图片'
                ? `[图片] ${m.text.trim()}`
                : `[图片]（聊天图片）`;
        } else if (m.messageType === 'voice') {
            const t = m.transcription || m.text || '';
            content = t ? `[语音] ${String(t).trim()}` : '[语音]';
        } else if (m.messageType === 'textImage') {
            content = `[文字图] ${m.textImageText || m.text || ''}`.trim();
        } else {
            content = '[消息]';
        }

        const tsNum = Number(m.timestamp ?? 0) || 0;
        const ts = formatTs(tsNum);
        const prefix = ts ? `${ts}` : '（时间未知）';
        return { ts: tsNum, line: `${prefix} ${speaker}: ${content}` };
    };

    const collectChatSinceDiary = (char, startTs, endTs) => {
        const roleName = getCharDisplayName(char);
        const msgsObj = soulLinkMessagesRef?.value || {};
        const direct = Array.isArray(msgsObj?.[String(char?.id)]) ? msgsObj[String(char.id)] : (Array.isArray(msgsObj?.[char?.id]) ? msgsObj[char.id] : []);

        const fromDirect = direct
            .filter((m) => (m?.timestamp ?? 0) >= startTs && (m?.timestamp ?? 0) <= endTs)
            .map((m) => formatMessageForDiary(m, char))
            .filter(Boolean)
            .map((x) => x);

        const groups = Array.isArray(soulLinkGroupsRef?.value) ? soulLinkGroupsRef.value : [];
        const fromGroups = [];
        for (const g of groups) {
            const history = Array.isArray(g?.history) ? g.history : [];
            for (const m of history) {
                const ts = Number(m?.timestamp ?? 0);
                if (ts < startTs || ts > endTs) continue;
                const speakerOk = m?.sender === 'user' || m?.sender === 'ai';
                if (!speakerOk) continue;
                // 只保留“用户 + 选中角色”相关消息
                if (m?.sender === 'ai') {
                    const sn = m?.senderName || '';
                    if (!sn || (sn !== roleName && sn !== char?.name && sn !== char?.nickname)) continue;
                }
                const line = formatMessageForDiary(m, char);
                if (line) fromGroups.push(line);
            }
        }

        // 合并并按时间排序（line 本身已经包含时间字符串，但我们用 timestamp 排序需要原对象）
        // 这里用一个简化策略：直接按直聊/群聊顺序追加，然后做一次时间字符串排序
        const all = [...fromDirect, ...fromGroups].filter(Boolean);
        all.sort((a, b) => (a.ts || 0) - (b.ts || 0));
        return all.map((x) => x.line);
    };

    const peekWidgetUnreadCount = computed(() => Math.min(peekMixedChatMessages.value.length, 99));
    const peekWidgetFirstNote = computed(() => peekNotes.value[0] || null);
    const peekWidgetPhotos = computed(() => peekPhotos.value.slice(0, 3));

    const peekApps = computed(() => APP_DEFS);
    const peekHomeApps = computed(() => {
        const dockIds = new Set(DOCK_APPS.map((a) => a.id));
        return peekApps.value.filter((a) => !dockIds.has(a.id));
    });
    const filteredPeekApps = computed(() => {
        const k = String(peekSearch.value || '').trim().toLowerCase();
        if (!k) return peekHomeApps.value;
        return peekHomeApps.value.filter((a) => a.name.toLowerCase().includes(k) || a.id.includes(k));
    });

    const peekMessages = ref([]);
    const peekCalls = ref([]);
    const peekNotes = ref([]);
    const peekPhotos = ref([]);
    const peekFiles = ref([]);
    const peekBrowserHistory = ref([]);
    const formatPeekMessageText = (m) => {
        if (typeof m?.text === 'string' && m.text.trim()) return m.text.trim();
        switch (m?.messageType) {
            case 'image': return '[图片]';
            case 'voice': return m?.transcription ? `[语音] ${m.transcription}` : '[语音]';
            case 'transfer': return `[转账] ${m?.amount ?? ''}`.trim();
            case 'order': return `[订单] ${m?.item ?? ''}`.trim();
            case 'helpBuy': return `[帮买] ${m?.item ?? ''}`.trim();
            case 'location': return '[位置]';
            default: return '[消息]';
        }
    };
    const formatPeekAt = (ts) => {
        const n = Number(ts || 0);
        if (!n) return '';
        try {
            return new Date(n).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
        } catch {
            return '';
        }
    };
    const peekSoulChatMessages = computed(() => {
        const charId = String(peekSelectedCharacterId.value || '');
        if (!charId) return [];
        const source = soulLinkMessagesRef?.value || {};
        const rows = Array.isArray(source[charId]) ? source[charId] : [];
        return rows
            .filter((m) => m && !m.isSystem && !m.isHidden && (m.sender === 'user' || m.sender === 'ai'))
            .map((m, idx) => ({
                id: m.id || m.timestamp || `peek_msg_${idx}`,
                sender: m.sender,
                text: formatPeekMessageText(m),
                at: formatPeekAt(m.timestamp),
                ts: Number(m.timestamp || 0) || 0
            }))
            .slice(-80);
    });
    const peekExternalChatMessages = computed(() => {
        const rows = Array.isArray(peekMessages.value) ? peekMessages.value : [];
        return rows
            .filter((m) => m && String(m.app || '') !== '系统提醒')
            .map((m, idx) => {
                const rawAt = String(m.at || '');
                const parsedTs = Number(m.ts || 0) || 0;
                return {
                    id: m.id || `peek_external_${idx}`,
                    sender: m.sender === 'user' ? 'user' : 'ai',
                    text: m.text ? `${m.app ? `【${m.app}】` : ''} ${m.text}`.trim() : (m.app || '[消息]'),
                    at: rawAt,
                    ts: parsedTs
                };
            })
            .slice(-50);
    });
    const peekMixedChatMessages = computed(() => {
        const all = [...peekSoulChatMessages.value, ...peekExternalChatMessages.value];
        all.sort((a, b) => {
            const ta = Number(a.ts || 0);
            const tb = Number(b.ts || 0);
            if (ta && tb) return ta - tb;
            if (ta && !tb) return -1;
            if (!ta && tb) return 1;
            return 0;
        });
        return all.slice(-120);
    });

    const collectLinkedSignals = (char) => {
        const charName = char?.nickname || char?.name || 'TA';
        const keys = [];
        for (let i = 0; i < localStorage.length; i += 1) {
            const k = localStorage.key(i) || '';
            if (/soul|chat|mate|feed|post|schedule|track|bill|bank/i.test(k)) keys.push(k);
        }
        const snippets = keys.slice(0, 8).map((k) => {
            const raw = String(localStorage.getItem(k) || '');
            return { key: k, text: raw.slice(0, 180) };
        });
        return {
            charName,
            snippets,
            messages: peekMessages.value.slice(0, 6),
            notes: peekNotes.value.slice(0, 4),
            history: peekBrowserHistory.value.slice(0, 4)
        };
    };

    const generatePeekLinkedData = async () => {
        const char = peekSelectedCharacter.value;
        if (!char || peekAiGenerating.value) return;
        const profile = activeProfileRef?.value || null;
        if (!profile) {
            alert('未检测到可用 API 配置，请先在 Console 选择/填写激活配置。');
            return;
        }
        const endpoint = String(profile.endpoint || '').trim();
        const key = String(profile.key || '').trim();
        if (!endpoint || !key) {
            alert('API 配置不完整：请在 Console 填写 endpoint 和 key。');
            return;
        }

        peekAiGenerating.value = true;
        try {
            const signals = collectLinkedSignals(char);
            const charId = char?.id;
            const nowTs = Date.now();
            const lastCursorTs = getDiaryCursorTs(charId);
            const chatLines = collectChatSinceDiary(char, lastCursorTs, nowTs);
            const chatTranscript = (chatLines || []).join('\n');
            const chatTranscriptForPrompt = chatTranscript.length > 12000
                ? chatTranscript.slice(chatTranscript.length - 12000)
                : chatTranscript;

            const mergeById = (existingArr, incomingArr) => {
                const ex = Array.isArray(existingArr) ? existingArr : [];
                const inc = Array.isArray(incomingArr) ? incomingArr : [];
                const exIdSet = new Set(ex.map((e) => String(e?.id)));
                const exById = new Map(ex.map((e) => [String(e?.id), e]));
                const newOnes = [];
                for (const item of inc) {
                    const id = String(item?.id);
                    if (!id || id === 'undefined' || id === 'null') continue;
                    if (exIdSet.has(id)) {
                        exById.set(id, item);
                    } else {
                        newOnes.push(item);
                        exIdSet.add(id);
                        exById.set(id, item);
                    }
                }
                const updatedExisting = ex.map((e) => exById.get(String(e?.id)) || e);
                return [...newOnes, ...updatedExisting];
            };

            let payload = null;
            try {
                const base = endpoint.replace(/\/+$/, '');
                const model = profile.model || profile.openai_model || profile.claude_model || profile.openrouter_model || 'gpt-4o-mini';
                const triedUrls = [];
                const candidateUrls = (() => {
                    if (/\/chat\/completions$/i.test(base)) return [base];
                    if (/\/v1$/i.test(base)) return [`${base}/chat/completions`];
                    return [`${base}/v1/chat/completions`, `${base}/chat/completions`];
                })();
                const prompt = `你是角色手机数据生成器。请仅返回 JSON，不要 markdown。
输出结构:
{
  "socialMessages":[{"id":"m1","app":"联系人或群名","text":"对话摘要","at":"HH:mm","ts":1710000000000}],
  "diaryEntries":[{"id":"d1","title":"...","mood":"...","content":"..."}],
  "bankAccount":{"balance":1234,"monthlySpend":456,"records":[{"id":"b1","item":"...","amount":-12,"at":"09:00"}]},
  "mapTracks":[{"id":"m1","place":"...","at":"08:30","note":"..."}]
}
角色: ${JSON.stringify({ id: char.id, name: char.nickname || char.name || 'TA' })}
联动数据: ${JSON.stringify(signals)}`;
                const diaryPromptBlock = `
上次日记生成时间戳（毫秒）: ${String(lastCursorTs)}
本次生成时间戳（毫秒）: ${String(nowTs)}
聊天增量记录（从上次到本次，包含“用户 + 选中角色”）： 
${chatTranscriptForPrompt || '（无增量聊天内容）'}
要求：
1) diaryEntries 只输出“新增日记条目”，不要输出旧条目的重复 id（保证可追加，不要覆盖旧日记）。
2) 如需提到图片，一律使用文字假装图格式，例如：[图片] 看到了一张夜景。
3) 日记内容必须基于上面的聊天增量记录生成。
`;
                const finalPrompt = prompt + diaryPromptBlock;
                let completion = null;
                let lastNon404 = null;
                for (const url of candidateUrls) {
                    triedUrls.push(url);
                    const resp = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${key}`
                        },
                        body: JSON.stringify({
                            model,
                            temperature: 0.7,
                            messages: [
                                { role: 'system', content: '只输出合法 JSON。' },
                                { role: 'user', content: finalPrompt }
                            ]
                        })
                    });
                    if (resp.ok) {
                        completion = await resp.json();
                        break;
                    }
                    if (resp.status !== 404) {
                        lastNon404 = `${resp.status} ${resp.statusText}`;
                        break;
                    }
                }
                if (!completion) {
                    if (lastNon404) {
                        alert(`生成失败：API 返回 ${lastNon404}`);
                    } else {
                        alert(`生成失败：接口 404。\n请检查 Console 的 endpoint。\n已尝试：\n${triedUrls.join('\n')}`);
                    }
                    return;
                }
                const content = completion?.choices?.[0]?.message?.content;
                if (!content) {
                    alert('生成失败：API 返回内容为空。');
                    return;
                }
                const jsonText = String(content).replace(/```json|```/g, '').trim();
                payload = JSON.parse(jsonText);
            } catch (error) {
                alert(`生成失败：${error?.message || '网络错误'}`);
                return;
            }
            if (!payload || typeof payload !== 'object') {
                alert('生成失败：返回数据格式不正确。');
                return;
            }

                // 追加/合并：不覆盖旧内容，生成后“在基础上变多”
                const incomingSocial = Array.isArray(payload.socialMessages) ? payload.socialMessages : [];
                if (incomingSocial.length > 0) {
                    peekMessages.value = mergeById(peekMessages.value, incomingSocial);
                }
                const incomingDiary = Array.isArray(payload.diaryEntries) ? payload.diaryEntries : [];
                peekDiaryEntries.value = mergeById(peekDiaryEntries.value, incomingDiary);

                const incomingBank = payload.bankAccount || { balance: null, monthlySpend: null, records: [] };
                const prevBank = peekBankAccount.value || { balance: 0, monthlySpend: 0, records: [] };
                const prevRecords = Array.isArray(prevBank.records) ? prevBank.records : [];
                const incomingRecords = Array.isArray(incomingBank.records) ? incomingBank.records : [];
                const mergedRecords = mergeById(prevRecords, incomingRecords);
                peekBankAccount.value = {
                    balance: typeof incomingBank.balance === 'number' ? incomingBank.balance : prevBank.balance,
                    monthlySpend: typeof incomingBank.monthlySpend === 'number' ? incomingBank.monthlySpend : prevBank.monthlySpend,
                    records: mergedRecords
                };

                peekMapTracks.value = mergeById(peekMapTracks.value, Array.isArray(payload.mapTracks) ? payload.mapTracks : []);

                peekAiLastGeneratedAt.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
                setDiaryCursorTs(charId, nowTs);
        } finally {
            peekAiGenerating.value = false;
        }
    };

    const rebuildCharacterData = (char) => {
        const charId = String(char?.id || '');
        const cached = readPeekCharData(charId);
        if (cached && typeof cached === 'object') {
            peekMessages.value = Array.isArray(cached.peekMessages) ? cached.peekMessages : [];
            peekCalls.value = Array.isArray(cached.peekCalls) ? cached.peekCalls : [];
            peekNotes.value = Array.isArray(cached.peekNotes) ? cached.peekNotes : [];
            peekPhotos.value = Array.isArray(cached.peekPhotos) ? cached.peekPhotos : [];
            peekFiles.value = Array.isArray(cached.peekFiles) ? cached.peekFiles : [];
            peekBrowserHistory.value = Array.isArray(cached.peekBrowserHistory) ? cached.peekBrowserHistory : [];
            peekDiaryEntries.value = Array.isArray(cached.peekDiaryEntries) ? cached.peekDiaryEntries : [];
            peekBankAccount.value = cached.peekBankAccount && typeof cached.peekBankAccount === 'object'
                ? cached.peekBankAccount
                : { balance: 0, monthlySpend: 0, records: [] };
            peekMapTracks.value = Array.isArray(cached.peekMapTracks) ? cached.peekMapTracks : [];
            peekAiLastGeneratedAt.value = String(cached.peekAiLastGeneratedAt || '');
            return;
        }

        const charName = char?.nickname || char?.name || 'TA';
        peekMessages.value = [
            { id: Date.now() + 1, app: '林然', text: '今晚电影还去吗', at: '22:16' },
            { id: Date.now() + 2, app: '设计组', text: `${charName}：我把初稿发群里了`, at: '20:03' },
            { id: Date.now() + 3, app: '快递员', text: '放在驿站了，记得取件', at: '18:44' }
        ];
        peekCalls.value = [
            { id: Date.now() + 4, who: '未知号码', type: 'missed', at: '今天 21:30' },
            { id: Date.now() + 5, who: '我', type: 'outgoing', at: '今天 10:12' }
        ];
        peekNotes.value = [
            { id: Date.now() + 6, title: '待办', content: '买咖啡豆\n回消息\n整理照片' },
            { id: Date.now() + 7, title: '灵感', content: '下次见面要聊旅行计划。' }
        ];
        peekPhotos.value = samplePhotos(charName);
        peekFiles.value = [
            { id: Date.now() + 8, name: 'chat_export.txt', size: '18 KB' },
            { id: Date.now() + 9, name: 'plan.md', size: '4 KB' },
            { id: Date.now() + 10, name: 'trip.png', size: '2.1 MB' }
        ];
        peekBrowserHistory.value = [
            { id: Date.now() + 11, title: '如何快速入睡', url: 'example.com/sleep' },
            { id: Date.now() + 12, title: '附近咖啡店', url: 'example.com/coffee' }
        ];
        peekDiaryEntries.value = [];
        peekBankAccount.value = { balance: 0, monthlySpend: 0, records: [] };
        peekMapTracks.value = [];
        peekAiLastGeneratedAt.value = '';
    };

    const selectPeekCharacter = (id) => {
        peekSelectedCharacterId.value = String(id || '');
        peekLocked.value = true;
        peekInnerApp.value = 'home';
    };

    const openPeekInnerApp = (appId) => {
        peekInnerApp.value = appId || 'home';
    };

    const closePeekInnerApp = () => {
        peekInnerApp.value = 'home';
    };

    const getPeekAppName = (appId) => {
        const hit = APP_DEFS.find((a) => a.id === appId);
        return hit ? hit.name : '应用';
    };

    const unlockPeek = () => {
        peekLocked.value = false;
    };
    const lockPeek = () => {
        peekLocked.value = true;
    };
    const peekFormatAmount = (amount) => `${amount >= 0 ? '+' : ''}${amount}`;

    watch(peekSelectedCharacter, (char) => {
        if (char) rebuildCharacterData(char);
    }, { immediate: true });

    watch(
        [
            peekSelectedCharacterId,
            peekMessages,
            peekCalls,
            peekNotes,
            peekPhotos,
            peekFiles,
            peekBrowserHistory,
            peekDiaryEntries,
            peekBankAccount,
            peekMapTracks,
            peekAiLastGeneratedAt
        ],
        () => {
            const charId = String(peekSelectedCharacterId.value || '');
            if (!charId) return;
            savePeekCharData(charId, {
                peekMessages: peekMessages.value,
                peekCalls: peekCalls.value,
                peekNotes: peekNotes.value,
                peekPhotos: peekPhotos.value,
                peekFiles: peekFiles.value,
                peekBrowserHistory: peekBrowserHistory.value,
                peekDiaryEntries: peekDiaryEntries.value,
                peekBankAccount: peekBankAccount.value,
                peekMapTracks: peekMapTracks.value,
                peekAiLastGeneratedAt: peekAiLastGeneratedAt.value
            });
        },
        { deep: true }
    );

    watch([peekSelectedCharacterId, peekDark], () => {
        saveState({
            peekSelectedCharacterId: peekSelectedCharacterId.value,
            peekDark: peekDark.value
        });
    });

    return {
        peekSelectedCharacterId,
        peekSelectedCharacter,
        peekPhoneTitle,
        peekInnerApp,
        peekSearch,
        peekDark,
        peekLocked,
        peekStatusTime,
        peekWidgetGreeting,
        peekWidgetDate,
        peekWidgetWeather,
        peekWidgetUnreadCount,
        peekWidgetFirstNote,
        peekWidgetPhotos,
        peekDiaryEntries,
        peekBankAccount,
        peekMapTracks,
        peekAiLastGeneratedAt,
        peekAiGenerating,
        peekApps,
        peekHomeApps,
        filteredPeekApps,
        DOCK_APPS,
        peekMessages,
        peekSoulChatMessages,
        peekExternalChatMessages,
        peekMixedChatMessages,
        peekCalls,
        peekNotes,
        peekPhotos,
        peekFiles,
        peekBrowserHistory,
        selectPeekCharacter,
        openPeekInnerApp,
        closePeekInnerApp,
        getPeekAppName,
        peekFormatAmount,
        generatePeekLinkedData,
        unlockPeek,
        lockPeek
    };
}
