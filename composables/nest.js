import { ref, computed, watch } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import { callAI } from '../api.js';

const buildCharacterIdentityPrompt = (char) => {
    if (!char) return '';
    const name = char.nickname || char.name || 'TA';
    return `# 你是谁\n你的名字是【${name}】。\n${char.persona || ''}`;
};

const NEST_KEY = 'nest_space_v1';

const readNestState = () => {
    try {
        return JSON.parse(localStorage.getItem(NEST_KEY) || '{}');
    } catch {
        return {};
    }
};

const writeNestState = (state) => {
    try {
        localStorage.setItem(NEST_KEY, JSON.stringify(state));
    } catch {
        // ignore storage failures
    }
};

const toDateInput = (d) => {
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const getMessageText = (msg) => {
    if (!msg || msg.isSystem) return '';
    if (typeof msg.text === 'string' && msg.text.trim()) return msg.text.trim();
    if (msg.messageType === 'image') return '[图片]';
    if (msg.messageType === 'voice') return msg.transcription ? `[语音] ${msg.transcription}` : '[语音]';
    return '';
};

// 反应生成的输出格式要求：日记体，篇幅可以长一些，是角色写给自己看的内心记录，不是发消息给用户
const REACTION_OUTPUT_RULES = `\n# 输出要求\n1. 用日记体的第一人称来写，就像你在自己的日记本里私下记录此刻的心情、想法和联想——不是在和用户聊天，用户不会立刻看到你在"说话"。\n2. 篇幅不用太短，可以有细节描写、心理活动，情感要真实细腻，避免写成敷衍的客套话或口号式的表达。\n3. 不需要称呼用户、不需要用"你"来对话，可以像是写给自己看的内心独白，但内容要紧扣当前场景展开，不要跑题。\n4. 不要输出 [REPLY]、[OS] 等任何格式标签，也不要加引号，直接给出日记正文。\n5. 语气、用词习惯必须符合你的人设，不要OOC。`;

const REACTION_MAX_TOKENS = 600;

const REACTION_TIMEOUT_MS = 20000;

const withTimeout = (promise, ms) =>
    Promise.race([
        promise,
        new Promise((resolve) => setTimeout(() => resolve(''), ms))
    ]);

export function useNest(charactersRef, soulLinkMessagesRef, soulLinkActiveChatRef, activeProfileRef) {
    const saved = readNestState();

    const nestTitle = ref(saved.nestTitle || 'Our Nest');
    const anniversaryDate = ref(saved.anniversaryDate || toDateInput(new Date()));

    // 每日寄语改为双向：用户写 myNote，角色回应 partnerNote，按日期缓存避免重复生成
    const myNote = ref(saved.myNote || '');
    const partnerNote = ref(saved.partnerNote || '');
    const partnerNoteDate = ref(saved.partnerNoteDate || '');
    const partnerNoteLoading = ref(false);

    const memories = ref(Array.isArray(saved.memories) ? saved.memories : []);
    const wishes = ref(Array.isArray(saved.wishes) ? saved.wishes : []);
    const plans = ref(Array.isArray(saved.plans) ? saved.plans : []);

    // 角色的即时反应流（心愿/计划完成时弹出的一句话），保留最近若干条
    const reactions = ref(Array.isArray(saved.reactions) ? saved.reactions : []);
    // 当前正在等待反应的触发源（用于UI显示"对方正在输入…"式的脉冲占位，不阻塞交互）
    const pendingReactionTrigger = ref('');

    const memoryInput = ref('');
    const wishInput = ref('');
    const planInput = ref('');
    const planDateInput = ref(toDateInput(new Date()));

    const activePartner = computed(() => {
        const chars = Array.isArray(charactersRef?.value) ? charactersRef.value : [];
        if (chars.length === 0) return null;
        const activeId = String(soulLinkActiveChatRef?.value || '');
        const hit = chars.find((c) => String(c.id) === activeId);
        return hit || chars[0];
    });

    const partnerName = computed(() => activePartner.value?.nickname || activePartner.value?.name || 'Ta');

    const daysTogether = computed(() => {
        const val = String(anniversaryDate.value || '');
        if (!val) return 0;
        const start = new Date(val);
        if (Number.isNaN(start.getTime())) return 0;
        const now = new Date();
        start.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        return Math.max(1, Math.floor((now - start) / 86400000) + 1);
    });

    // 便签墙：把"今日日记"和"心愿/计划完成时的感想日记"合并成一个列表，按时间倒序排列，给UI渲染用
    const noteWall = computed(() => {
        const list = [];
        if (partnerNote.value) {
            list.push({
                id: 'today',
                title: `${partnerNoteDate.value || toDateInput(new Date())} · 今日日记`,
                text: partnerNote.value,
                timestamp: new Date(partnerNoteDate.value || new Date()).getTime() || Date.now()
            });
        }
        reactions.value.forEach((r) => {
            list.push({
                id: r.id,
                title: new Date(r.timestamp).toLocaleString('zh-CN', {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                text: r.text,
                timestamp: r.timestamp
            });
        });
        return list.sort((a, b) => b.timestamp - a.timestamp);
    });

    const completedWishCount = computed(() => wishes.value.filter((x) => x.done).length);
    const completedPlanCount = computed(() => plans.value.filter((x) => x.done).length);

    // 养成感：loveScore 不再靠手动点，由实际互动行为累计
    const loveScore = computed(() => {
        const base = 20;
        const fromMemories = memories.value.length * 2;
        const fromWishes = completedWishCount.value * 5;
        const fromPlans = completedPlanCount.value * 5;
        const fromDays = Math.min(daysTogether.value, 200); // 陪伴天数封顶避免无限膨胀
        return Math.min(999, base + fromMemories + fromWishes + fromPlans + fromDays);
    });

    const chatHistory = computed(() => {
        const charId = String(activePartner.value?.id || '');
        if (!charId) return [];
        return Array.isArray(soulLinkMessagesRef?.value?.[charId]) ? soulLinkMessagesRef.value[charId] : [];
    });

    const latestChatLine = computed(() => {
        const rows = chatHistory.value;
        for (let i = rows.length - 1; i >= 0; i--) {
            const text = getMessageText(rows[i]);
            if (text) return text.slice(0, 60);
        }
        return '';
    });

    // ---- 角色反应生成核心 ----
    // 未配置API（没填endpoint/key）时，静默跳过，不发请求、不显示任何loading——
    // 否则用户每次点完成都会看到一个必然失败的动画，体验很差
    const canRequestReaction = () => {
        const profile = activeProfileRef?.value;
        return Boolean(activePartner.value?.persona && profile?.key && profile?.endpoint);
    };

    const requestPartnerReaction = async (sceneDescription) => {
        if (!canRequestReaction()) return '';
        const char = activePartner.value;
        const profile = activeProfileRef?.value;

        const identityBlock = buildCharacterIdentityPrompt(char, { history: chatHistory.value });
        const systemPrompt = `${identityBlock}\n# 当前场景\n${sceneDescription}\n${REACTION_OUTPUT_RULES}`;

        try {
            const reply = await withTimeout(
                callAI(
                    profile,
                    [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: '（请写下你此刻真实的日记内容，不要复述场景描述，也不要当成一句话回复来写）' }
                    ],
                    { temperature: char.temperature ?? 0.85, max_tokens: REACTION_MAX_TOKENS }
                ),
                REACTION_TIMEOUT_MS
            );
            return String(reply || '').trim();
        } catch (e) {
            // 失败就悄悄放弃，不打扰用户——这是氛围向的加分项，不是必须完成的操作
            console.warn('[nest] requestPartnerReaction failed:', e);
            return '';
        }
    };

    const pushReaction = (text, trigger) => {
        if (!text) return;
        reactions.value.unshift({
            id: `reaction_${Date.now()}`,
            text,
            trigger,
            timestamp: Date.now()
        });
        reactions.value = reactions.value.slice(0, 20);
    };

    // 每日寄语：一天只生成一次，避免刷接口
    const refreshPartnerNote = async (force = false) => {
        const today = toDateInput(new Date());
        if (!force && partnerNoteDate.value === today && partnerNote.value) return;
        if (!canRequestReaction()) return;
        partnerNoteLoading.value = true;
        try {
            const scene = myNote.value
                ? `用户今天在情侣空间给你留了一句话：「${myNote.value}」。请你把今天写日记，内容围绕这句话展开——你看到这句话时的心情、联想到的事情、想对这段关系说的话。`
                : `今天用户还没有在情侣空间留言。请你照常写今天的日记，记录一下这段时间的心情、在想什么、对用户的感受。`;
            const text = await requestPartnerReaction(scene);
            if (text) {
                partnerNote.value = text;
                partnerNoteDate.value = today;
            }
        } finally {
            partnerNoteLoading.value = false;
        }
    };

    const addMemory = (text) => {
        const t = String(text || '').trim();
        if (!t) return;
        memories.value.unshift({
            id: `mem_${Date.now()}`,
            text: t,
            createdAt: Date.now()
        });
        memoryInput.value = '';
    };

    const addMemoryFromChat = () => {
        const line = latestChatLine.value;
        if (!line) return;
        addMemory(`聊天摘录：${line}`);
    };

    const removeMemory = (id) => {
        memories.value = memories.value.filter((m) => m.id !== id);
    };

    const addWish = () => {
        const t = String(wishInput.value || '').trim();
        if (!t) return;
        wishes.value.unshift({
            id: `wish_${Date.now()}`,
            text: t,
            done: false
        });
        wishInput.value = '';
    };

    const toggleWish = async (id) => {
        const target = wishes.value.find((w) => w.id === id);
        if (!target) return;
        const willBeDone = !target.done;
        wishes.value = wishes.value.map((w) => (w.id === id ? { ...w, done: willBeDone } : w));

        if (willBeDone && canRequestReaction()) {
            const trigger = `wish:${id}`;
            pendingReactionTrigger.value = trigger;
            const text = await requestPartnerReaction(
                `你和用户共同的心愿清单里，「${target.text}」这一项刚刚被用户标记为已完成。`
            );
            if (pendingReactionTrigger.value === trigger) pendingReactionTrigger.value = '';
            pushReaction(text, trigger);
        }
    };

    const addPlan = () => {
        const t = String(planInput.value || '').trim();
        if (!t) return;
        plans.value.unshift({
            id: `plan_${Date.now()}`,
            text: t,
            date: planDateInput.value || toDateInput(new Date()),
            done: false
        });
        planInput.value = '';
    };

    const togglePlan = async (id) => {
        const target = plans.value.find((p) => p.id === id);
        if (!target) return;
        const willBeDone = !target.done;
        plans.value = plans.value.map((p) => (p.id === id ? { ...p, done: willBeDone } : p));

        if (willBeDone && canRequestReaction()) {
            const trigger = `plan:${id}`;
            pendingReactionTrigger.value = trigger;
            const text = await requestPartnerReaction(
                `你们计划里的「${target.text}」（原定 ${target.date}）刚刚被用户标记为已完成。`
            );
            if (pendingReactionTrigger.value === trigger) pendingReactionTrigger.value = '';
            pushReaction(text, trigger);
        }
    };

    watch(
        [nestTitle, anniversaryDate, myNote, partnerNote, partnerNoteDate, memories, wishes, plans, reactions],
        () => {
            writeNestState({
                nestTitle: nestTitle.value,
                anniversaryDate: anniversaryDate.value,
                myNote: myNote.value,
                partnerNote: partnerNote.value,
                partnerNoteDate: partnerNoteDate.value,
                memories: memories.value,
                wishes: wishes.value,
                plans: plans.value,
                reactions: reactions.value
            });
        },
        { deep: true }
    );

    return {
        nestTitle,
        anniversaryDate,
        myNote,
        partnerNote,
        partnerNoteLoading,
        loveScore,
        daysTogether,
        partnerName,
        latestChatLine,
        memories,
        wishes,
        plans,
        reactions,
        noteWall,
        pendingReactionTrigger,
        completedWishCount,
        completedPlanCount,
        memoryInput,
        wishInput,
        planInput,
        planDateInput,
        addMemory,
        addMemoryFromChat,
        removeMemory,
        addWish,
        toggleWish,
        addPlan,
        togglePlan,
        refreshPartnerNote
    };
}
