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
    { id: 'diary', name: '日记', icon: 'fa-book' },
    { id: 'bank', name: '银行卡', icon: 'fa-credit-card' },
    { id: 'map', name: '地图', icon: 'fa-map-location-dot' },
    { id: 'messages', name: '消息', icon: 'fa-comments' }
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

const samplePhotos = (seedName) => {
    const q = encodeURIComponent(seedName || 'portrait');
    return [
        `https://source.unsplash.com/300x520/?phone,lockscreen,${q}`,
        `https://source.unsplash.com/300x520/?street,night,${q}`,
        `https://source.unsplash.com/300x520/?coffee,desk,${q}`,
        `https://source.unsplash.com/300x520/?city,window,${q}`
    ];
};

export function usePeek(charactersRef, activeProfileRef) {
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

    const peekWidgetUnreadCount = computed(() => peekMessages.value.filter((m) => m.app !== '系统提醒').length);
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
  "diaryEntries":[{"id":"d1","title":"...","mood":"...","content":"..."}],
  "bankAccount":{"balance":1234,"monthlySpend":456,"records":[{"id":"b1","item":"...","amount":-12,"at":"09:00"}]},
  "mapTracks":[{"id":"m1","place":"...","at":"08:30","note":"..."}]
}
角色: ${JSON.stringify({ id: char.id, name: char.nickname || char.name || 'TA' })}
联动数据: ${JSON.stringify(signals)}`;
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
                                { role: 'user', content: prompt }
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
            peekDiaryEntries.value = Array.isArray(payload.diaryEntries) ? payload.diaryEntries : [];
            peekBankAccount.value = payload.bankAccount || { balance: 0, monthlySpend: 0, records: [] };
            peekMapTracks.value = Array.isArray(payload.mapTracks) ? payload.mapTracks : [];
            peekAiLastGeneratedAt.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        } finally {
            peekAiGenerating.value = false;
        }
    };

    const rebuildCharacterData = (char) => {
        const charName = char?.nickname || char?.name || 'TA';
        peekMessages.value = [
            { id: Date.now() + 1, app: 'SoulLink', text: `今晚见吗？`, at: '22:16' },
            { id: Date.now() + 2, app: '系统提醒', text: `${charName} 设置了面容解锁`, at: '20:03' },
            { id: Date.now() + 3, app: '群聊', text: `${charName}：我马上到`, at: '18:44' }
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
