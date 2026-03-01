// =========================================================================
// == MATE APP SCRIPT
// == 智能陪伴助手
// =========================================================================

import { ref, computed, onMounted, onUnmounted } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

export function useMate(soulLinkMessages, characters, activeProfile) {
    // --- 状态管理 ---
    const currentTime = ref(new Date());
    const currentMode = ref(localStorage.getItem('mate_mode') || 'focus'); // focus, exercise, sleep
    const selectedMateCharacterId = ref(Number(localStorage.getItem('mate_selected_char')) || null);
    const mateAIVoice = ref(null);
    const isGeneratingAIVoice = ref(false);
    
    const focusTime = ref(25 * 60); // 25分钟，单位秒
    const isFocusing = ref(false);
    const isPaused = ref(false);
    const focusStartTime = ref(null);
    const focusHistory = ref(JSON.parse(localStorage.getItem('mate_focus_history') || '[]'));
    
    // 财务状态
    const monthlyBudget = ref(Number(localStorage.getItem('mate_budget')) || 3000);
    const monthlyExpenses = ref(0);
    const expenses = ref(JSON.parse(localStorage.getItem('mate_expenses') || '[]'));
    
    // 日历和待办
    const events = ref(JSON.parse(localStorage.getItem('mate_events') || '[]').map(e => ({
        ...e,
        startTime: new Date(e.startTime),
        endTime: new Date(e.endTime)
    })));
    
    const todos = ref(JSON.parse(localStorage.getItem('mate_todos') || '[]').map(t => ({
        ...t,
        time: new Date(t.time)
    })));

    // 睡眠日记
    const sleepDiaries = ref(JSON.parse(localStorage.getItem('mate_sleep_diaries') || '[]'));
    const isGeneratingSleepDiary = ref(false);
    const showSleepDiaryModal = ref(false);
    const currentSleepDiary = ref(null);

    // 经期追踪
    const lastPeriodDate = ref(localStorage.getItem('mate_last_period') ? new Date(localStorage.getItem('mate_last_period')) : null);
    const cycleLength = ref(Number(localStorage.getItem('mate_cycle_length')) || 28);
    const periodLength = ref(Number(localStorage.getItem('mate_period_days')) || 5);
    const showPeriodSettings = ref(false);

    // 初始化默认数据（如果为空）
    if (expenses.value.length === 0 && !localStorage.getItem('mate_expenses')) {
        expenses.value = [
            { id: 1, amount: 20, category: '餐饮', date: new Date(), description: '午餐' },
            { id: 2, amount: 15, category: '交通', date: new Date(), description: '打车' }
        ];
    }
    if (events.value.length === 0 && !localStorage.getItem('mate_events')) {
        events.value = [
            { id: 1, title: '早会', startTime: new Date(new Date().setHours(9, 0, 0)), endTime: new Date(new Date().setHours(10, 0, 0)), category: 'class' },
            { id: 2, title: '午休', startTime: new Date(new Date().setHours(12, 0, 0)), endTime: new Date(new Date().setHours(13, 30, 0)), category: 'exercise' }
        ];
    }
    if (todos.value.length === 0 && !localStorage.getItem('mate_todos')) {
        todos.value = [
            { id: 1, text: '喝水', completed: false, time: new Date() },
            { id: 2, text: '站立活动', completed: true, time: new Date() }
        ];
    }
    
    // 计算已发生的月度支出
    const calculateMonthlyExpenses = () => {
        const now = new Date();
        monthlyExpenses.value = expenses.value
            .filter(e => new Date(e.date).getMonth() === now.getMonth())
            .reduce((sum, e) => sum + e.amount, 0);
    };
    calculateMonthlyExpenses();
    
    // 运动状态
    const steps = ref(Number(localStorage.getItem('mate_steps')) || 5432);
    const targetSteps = ref(Number(localStorage.getItem('mate_target_steps')) || 10000);
    const heartRate = ref(72);
    const exerciseType = ref(localStorage.getItem('mate_exercise_type') || 'walk'); // walk, run, cycling, fitness
    
    // 运动类型定义
    const exerciseTypes = [
        { id: 'walk', label: '散步', icon: 'fa-walking' },
        { id: 'run', label: '跑步', icon: 'fa-running' },
        { id: 'cycling', label: '骑行', icon: 'fa-biking' },
        { id: 'fitness', label: '健身', icon: 'fa-dumbbell' }
    ];

    // 睡眠状态
    const sleepDuration = ref(Number(localStorage.getItem('mate_sleep_duration')) || 0); // 分钟
    const sleepQuality = ref('good');
    const sleepStartTime = ref(null);
    
    // UI 状态
    const showAddExpenseModal = ref(false);
    const showAddTodoModal = ref(false);
    const showAddEventModal = ref(false);
    const newExpense = ref({ amount: '', category: '餐饮', description: '', selectedCharacterId: null });
    const isGeneratingComment = ref(false);
    const newTodo = ref({ text: '', time: '' });
    const newEvent = ref({ title: '', startTime: '', endTime: '', category: 'class' });

    // 持久化方法
    const saveToLocal = () => {
        localStorage.setItem('mate_mode', currentMode.value);
        localStorage.setItem('mate_selected_char', selectedMateCharacterId.value);
        localStorage.setItem('mate_exercise_type', exerciseType.value);
        localStorage.setItem('mate_focus_history', JSON.stringify(focusHistory.value));
        localStorage.setItem('mate_budget', monthlyBudget.value.toString());
        localStorage.setItem('mate_expenses', JSON.stringify(expenses.value));
        localStorage.setItem('mate_events', JSON.stringify(events.value));
        localStorage.setItem('mate_todos', JSON.stringify(todos.value));
        localStorage.setItem('mate_steps', steps.value.toString());
        localStorage.setItem('mate_target_steps', targetSteps.value.toString());
        localStorage.setItem('mate_sleep_duration', sleepDuration.value.toString());
        localStorage.setItem('mate_sleep_diaries', JSON.stringify(sleepDiaries.value));
        if (lastPeriodDate.value) localStorage.setItem('mate_last_period', lastPeriodDate.value.toISOString());
        localStorage.setItem('mate_cycle_length', cycleLength.value.toString());
        localStorage.setItem('mate_period_days', periodLength.value.toString());
    };

    // --- 计算属性 ---
    const clockHands = computed(() => {
        const now = currentTime.value;
        const seconds = now.getSeconds();
        const minutes = now.getMinutes();
        const hours = now.getHours() % 12;

        return {
            second: seconds * 6, // 360 / 60
            minute: minutes * 6 + seconds * 0.1, // 360 / 60 + 6 / 60
            hour: hours * 30 + minutes * 0.5 // 360 / 12 + 30 / 60
        };
    });

    const currentExerciseIcon = computed(() => {
        const type = exerciseTypes.find(t => t.id === exerciseType.value);
        return type ? type.icon : 'fa-running';
    });

    const isPeriodToday = computed(() => {
        if (!lastPeriodDate.value) return false;
        const now = new Date();
        const diff = Math.floor((now - lastPeriodDate.value) / (1000 * 60 * 60 * 24));
        const daysSinceCycleStart = diff % cycleLength.value;
        return daysSinceCycleStart >= 0 && daysSinceCycleStart < periodLength.value;
    });

    const predictedNextPeriod = computed(() => {
        if (!lastPeriodDate.value) return null;
        const next = new Date(lastPeriodDate.value);
        next.setDate(next.getDate() + cycleLength.value);
        return next;
    });

    const daysUntilNextPeriod = computed(() => {
        if (!predictedNextPeriod.value) return null;
        const now = new Date();
        return Math.ceil((predictedNextPeriod.value - now) / (1000 * 60 * 60 * 24));
    });

    const periodStatusText = computed(() => {
        if (isPeriodToday.value) return '当前处于经期';
        if (daysUntilNextPeriod.value !== null) {
            if (daysUntilNextPeriod.value <= 3) return `经期即将在 ${daysUntilNextPeriod.value} 天后到来`;
            return `距离下次经期还有 ${daysUntilNextPeriod.value} 天`;
        }
        return '暂无经期记录';
    });

    const periodDialogMessage = computed(() => {
        if (!selectedCharacter.value) return null;
        if (isPeriodToday.value) {
            return `记得喝热水，不要贪凉哦。需要我为你做点什么吗？`;
        }
        if (daysUntilNextPeriod.value !== null && daysUntilNextPeriod.value <= 3) {
            return `最近是不是感觉有点累？过几天就是那个日子了，多休息下。`;
        }
        return null;
    });

    const currentHour = computed(() => currentTime.value.getHours());
    const currentMinute = computed(() => currentTime.value.getMinutes());
    const currentSecond = computed(() => currentTime.value.getSeconds());
    
    const focusTimeFormatted = computed(() => {
        const minutes = Math.floor(focusTime.value / 60);
        const seconds = focusTime.value % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    });
    
    const monthlyBalance = computed(() => monthlyBudget.value - monthlyExpenses.value);
    
    const containerClass = computed(() => {
        const hour = currentHour.value;
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 18 && hour < 22) return 'evening';
        if (hour >= 22 || hour < 6) return 'night';
        return '';
    });
    
    const currentEvent = computed(() => {
        const now = new Date();
        return events.value.find(event => {
            return new Date(event.startTime) <= now && new Date(event.endTime) >= now;
        });
    });

    const selectedCharacter = computed(() => {
        if (!selectedMateCharacterId.value || !characters.value) return null;
        return characters.value.find(c => c.id === selectedMateCharacterId.value);
    });
    
    // --- 方法 ---
    const updateTime = () => {
        currentTime.value = new Date();
        // 模拟步数增加
        if (currentMode.value === 'exercise' && Math.random() > 0.8) {
            steps.value += Math.floor(Math.random() * 5) + 1;
            saveToLocal();
        }
        // 模拟心率波动
        if (Math.random() > 0.8) {
            if (currentMode.value === 'exercise') {
                heartRate.value = 110 + Math.floor(Math.random() * 30);
            } else if (currentMode.value === 'sleep') {
                heartRate.value = 55 + Math.floor(Math.random() * 10);
            } else {
                heartRate.value = 70 + Math.floor(Math.random() * 10);
            }
        }

        // 周期性 AI 提醒 (每隔大约 3-5 分钟)
        if ((currentMode.value === 'focus' || currentMode.value === 'exercise') && selectedMateCharacterId.value && activeProfile.value) {
            // 这里简单模拟，实际可以使用计数器
            if (Math.random() > 0.998) { // 极低概率触发，模拟长间隔
                generatePeriodicAIComment();
            }
        }
    };

    const generatePeriodicAIComment = async () => {
        if (!selectedCharacter.value || !activeProfile.value || isGeneratingAIVoice.value) return;
        
        isGeneratingAIVoice.value = true;
        try {
            const modeName = currentMode.value === 'focus' ? '专注学习/工作' : '运动锻炼';
            let periodContext = "";
            if (isPeriodToday.value) {
                periodContext = "。注意：你的朋友现在正处于生理期（经期），身体可能比较虚弱或情绪波动。";
            } else if (daysUntilNextPeriod.value !== null && daysUntilNextPeriod.value <= 3) {
                periodContext = `。注意：你的朋友的生理期即将在 ${daysUntilNextPeriod.value} 天后到来，可能处于经前综合征（PMS）期间。`;
            }

            const prompt = `你现在要扮演角色：${selectedCharacter.value.name}。
角色人设：${selectedCharacter.value.persona || selectedCharacter.value.summary}
你的朋友正在进行：${modeName}${periodContext}。
请根据你的性格，给ta说一句鼓励、吐槽、关心或者陪伴的话（不超过25字）。
直接返回话语内容。`;

            const response = await fetch(`${activeProfile.value.endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${activeProfile.value.key}`
                },
                body: JSON.stringify({
                    model: activeProfile.value.model,
                    messages: [
                        { role: 'system', content: `你正在扮演角色：${selectedCharacter.value.name}。` },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.9
                })
            });

            const data = await response.json();
            if (data.choices && data.choices[0]) {
                mateAIVoice.value = data.choices[0].message.content.trim();
                // 5秒后消失
                setTimeout(() => {
                    mateAIVoice.value = null;
                }, 8000);
            }
        } catch (error) {
            console.error('周期性 AI 留言失败:', error);
        } finally {
            isGeneratingAIVoice.value = false;
        }
    };
    
    let focusInterval;
    const startFocus = () => {
        isFocusing.value = true;
        isPaused.value = false;
        focusStartTime.value = new Date();
        
        focusInterval = setInterval(() => {
            if (!isPaused.value && isFocusing.value) {
                if (focusTime.value > 0) {
                    focusTime.value--;
                } else {
                    clearInterval(focusInterval);
                    completeFocus();
                }
            }
        }, 1000);
    };
    
    const pauseFocus = () => {
        isPaused.value = !isPaused.value;
    };
    
    const cancelFocus = () => {
        if (focusInterval) clearInterval(focusInterval);
        isFocusing.value = false;
        isPaused.value = false;
        focusTime.value = 25 * 60;
        focusStartTime.value = null;
    };
    
    const completeFocus = () => {
        isFocusing.value = false;
        focusHistory.value.push({
            startTime: focusStartTime.value,
            endTime: new Date(),
            duration: 25 // 分钟
        });
        focusTime.value = 25 * 60;
        focusStartTime.value = null;
        saveToLocal();
    };
    
    const setPeriodStartDate = (dateStr) => {
        if (!dateStr) return;
        lastPeriodDate.value = new Date(dateStr);
        saveToLocal();
    };

    const submitExpense = async (allCharacters, activeProfileObj) => {
        if (!newExpense.value.amount) return;
        
        const expenseId = Date.now();
        const expense = {
            id: expenseId,
            amount: Number(newExpense.value.amount),
            category: newExpense.value.category,
            date: new Date(),
            description: newExpense.value.description,
            comment: null
        };

        // 如果选择了角色，则生成评论
        if (newExpense.value.selectedCharacterId && activeProfileObj && allCharacters && allCharacters.length > 0) {
            const character = allCharacters.find(c => c.id === newExpense.value.selectedCharacterId);
            if (character) {
                isGeneratingComment.value = true;
                try {
                    const commentText = await generateAiComment(expense, character, activeProfileObj);
                    expense.comment = {
                        characterId: character.id,
                        characterName: character.nickname || character.name,
                        avatarUrl: character.avatarUrl,
                        text: commentText
                    };
                } catch (error) {
                    console.error('生成角色留言失败:', error);
                } finally {
                    isGeneratingComment.value = false;
                }
            }
        }

        expenses.value.push(expense);
        calculateMonthlyExpenses();
        saveToLocal();
        showAddExpenseModal.value = false;
        newExpense.value = { amount: '', category: '餐饮', description: '', selectedCharacterId: null };
    };

    const toggleTodo = (todoId) => {
        const todo = todos.value.find(t => t.id === todoId);
        if (todo) {
            todo.completed = !todo.completed;
            saveToLocal();
        }
    };

    const submitTodo = () => {
        if (!newTodo.value.text) return;
        todos.value.push({
            id: Date.now(),
            text: newTodo.value.text,
            completed: false,
            time: newTodo.value.time ? new Date(newTodo.value.time) : new Date()
        });
        saveToLocal();
        showAddTodoModal.value = false;
        newTodo.value = { text: '', time: '' };
    };

    const submitEvent = () => {
        if (!newEvent.value.title || !newEvent.value.startTime) return;
        events.value.push({
            id: Date.now(),
            title: newEvent.value.title,
            startTime: new Date(newEvent.value.startTime),
            endTime: new Date(newEvent.value.endTime || newEvent.value.startTime),
            category: newEvent.value.category
        });
        saveToLocal();
        showAddEventModal.value = false;
        newEvent.value = { title: '', startTime: '', endTime: '', category: 'class' };
    };

    const deleteTodo = (id) => {
        todos.value = todos.value.filter(t => t.id !== id);
        saveToLocal();
    };

    const deleteEvent = (id) => {
        events.value = events.value.filter(e => e.id !== id);
        saveToLocal();
    };

    const deleteExpense = (id) => {
        expenses.value = expenses.value.filter(e => e.id !== id);
        calculateMonthlyExpenses();
        saveToLocal();
    };

    const updateBudget = (newAmount) => {
        if (newAmount === null || isNaN(newAmount) || newAmount <= 0) return;
        monthlyBudget.value = Number(newAmount);
        saveToLocal();
    };

    const promptUpdateBudget = () => {
        const b = window.prompt('请输入本月新预算：', monthlyBudget.value);
        if (b) updateBudget(b);
    };

    const promptAiBookkeep = (activeProfileObj) => {
        const text = window.prompt('请输入你的支出描述 (例如：今天中午吃拉面花了30元)');
        if (text) aiBookkeep(text, activeProfileObj);
    };

    const generateAiComment = async (expense, character, activeProfileObj) => {
        const prompt = `你现在要扮演角色：${character.name}。
角色人设：${character.persona || character.summary}
你的朋友刚刚记了一笔账：
金额：${expense.amount}元
类别：${expense.category}
描述：${expense.description}

请根据你的性格，对这笔消费发表一个简短的、有灵魂的吐槽或评价（不超过30字）。
直接返回评论内容，不要包含任何多余的文字。`;

        try {
            const response = await fetch(`${activeProfileObj.endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${activeProfileObj.key}`
                },
                body: JSON.stringify({
                    model: activeProfileObj.model,
                    messages: [
                        { role: 'system', content: `你正在扮演角色：${character.name}。请保持人设。` },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.8
                })
            });

            const data = await response.json();
            if (data.choices && data.choices[0]) {
                return data.choices[0].message.content.trim();
            }
            return '（似乎在想别的事情...）';
        } catch (error) {
            console.error('AI 留言 API 调用失败:', error);
            throw error;
        }
    };

    const aiBookkeep = async (text, activeProfileObj) => {
        if (!text || !activeProfileObj) return;
        
        try {
            const prompt = `你是一个财务助手。请从以下文本中提取支出信息，并以 JSON 格式返回：{"amount": 数字, "category": "餐饮/交通/购物/娱乐/其他", "description": "简短描述"}。
文本内容："${text}"`;

            const response = await fetch(`${activeProfileObj.endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${activeProfileObj.key}`
                },
                body: JSON.stringify({
                    model: activeProfileObj.model,
                    messages: [
                        { role: 'system', content: '你只返回 JSON。' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3
                })
            });

            const data = await response.json();
            const content = data.choices[0].message.content;
            const match = content.match(/\{.*\}/s);
            if (match) {
                const result = JSON.parse(match[0]);
                newExpense.value = {
                    amount: result.amount,
                    category: result.category || '其他',
                    description: result.description || text,
                    selectedCharacterId: null
                };
                showAddExpenseModal.value = true;
            }
        } catch (error) {
            console.error('AI 记账失败:', error);
            alert('AI 记账暂时不可用，请手动输入');
        }
    };

    const generateSleepDiary = async () => {
        if (!selectedCharacter.value || !activeProfile.value) return;
        
        isGeneratingSleepDiary.value = true;
        try {
            // 获取相关角色的聊天记录
            const charId = selectedCharacter.value.id;
            const chatHistory = soulLinkMessages.value[charId] || [];
            const recentMessages = chatHistory.slice(-20).map(m => `${m.sender === 'user' ? '用户' : selectedCharacter.value.name}: ${m.text}`).join('\n');

            const duration = Math.floor((new Date() - (sleepStartTime.value || new Date())) / (1000 * 60));
            // 模拟一些睡眠指标
            const sleepQualityScore = Math.floor(Math.random() * 40) + 60; // 60-100
            const qualityLabel = sleepQualityScore > 90 ? '极佳' : (sleepQualityScore > 80 ? '良好' : '一般');

            const prompt = `你现在要扮演角色：${selectedCharacter.value.name}。
角色人设：${selectedCharacter.value.persona || selectedCharacter.value.summary}
你和你的朋友最近的聊天记录：
${recentMessages || '最近没有聊天。'}

你的朋友刚刚结束了一段睡眠（时长：${duration}分钟）。
请根据你的性格以及你们的聊天内容，写一份“共同睡眠观察日记”。
日记必须以 JSON 格式返回，包含以下字段：
1. "dream": 描述一个你们共同经历的梦境或关于ta的梦（浪漫、怪诞或温馨，结合人设）。
2. "events": 一个数组，记录睡眠期间的动态（如：{"time": "02:15", "action": "翻身并嘟囔了你的名字"}, {"time": "04:30", "action": "说了句梦话：'别抢我的...'" }）。
3. "quality": 对ta这次睡眠质量的评价（从你的角色视角）。
4. "message": 一句醒来后的贴心话。

直接返回 JSON 对象，不要有任何多余文字。`;

            const response = await fetch(`${activeProfile.value.endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${activeProfile.value.key}`
                },
                body: JSON.stringify({
                    model: activeProfile.value.model,
                    messages: [
                        { role: 'system', content: `你正在扮演角色：${selectedCharacter.value.name}。你只返回 JSON 数据。` },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.8
                })
            });

            const data = await response.json();
            if (data.choices && data.choices[0]) {
                const content = data.choices[0].message.content.trim();
                const match = content.match(/\{.*\}/s);
                if (match) {
                    const result = JSON.parse(match[0]);
                    const diary = {
                        id: Date.now(),
                        date: new Date(),
                        duration: duration,
                        characterName: selectedCharacter.value.name,
                        avatarUrl: selectedCharacter.value.avatarUrl,
                        dream: result.dream,
                        events: result.events || [],
                        quality: result.quality || qualityLabel,
                        message: result.message,
                        score: sleepQualityScore
                    };
                    sleepDiaries.value.unshift(diary);
                    currentSleepDiary.value = diary;
                    showSleepDiaryModal.value = true;
                    saveToLocal();
                }
            }
        } catch (error) {
            console.error('生成睡眠日记失败:', error);
            alert('生成睡眠日记失败，可能是 API 忙碌。');
        } finally {
            isGeneratingSleepDiary.value = false;
        }
    };
    
    const getGreeting = () => {
        const hour = currentHour.value;
        if (hour < 6) return '夜深了，早点休息吧';
        if (hour < 12) return '早上好，新的一天开始了';
        if (hour < 18) return '下午好，保持专注';
        return '晚上好，今天过得怎么样';
    };
    
    const getCurrentStatus = () => {
        if (isFocusing.value) {
            if (isPaused.value) {
                return '专注已暂停，休息一下吧';
            }
            const elapsedMinutes = Math.floor((new Date() - focusStartTime.value) / (1000 * 60));
            return `嘿，现在是专注时间，你已经坚持了 ${elapsedMinutes} 分钟`;
        }
        
        if (currentMode.value === 'exercise') {
            const progress = Math.round((steps.value / targetSteps.value) * 100);
            return `运动中，已完成 ${progress}% 的目标`;
        }
        
        if (currentMode.value === 'sleep') {
            return '已进入深睡诱导，晚安';
        }
        
        return getGreeting();
    };

    const setMode = async (mode) => {
        if (currentMode.value === 'sleep' && mode !== 'sleep') {
            // 停止睡眠模式，生成日记
            const duration = Math.floor((new Date() - (sleepStartTime.value || new Date())) / (1000 * 60));
            sleepDuration.value = duration;
            if (selectedMateCharacterId.value && activeProfile.value) {
                await generateSleepDiary();
            }
        }
        
        if (mode === 'sleep') {
            sleepStartTime.value = new Date();
        }

        currentMode.value = mode;
        saveToLocal();
    };
    
    // 生命周期
    let timeInterval;
    
    onMounted(() => {
        timeInterval = setInterval(updateTime, 1000);
    });
    
    onUnmounted(() => {
        if (timeInterval) {
            clearInterval(timeInterval);
        }
        if (focusInterval) {
            clearInterval(focusInterval);
        }
    });
    
    return {
        // 状态
        currentTime,
        currentMode,
        selectedMateCharacterId,
        selectedCharacter,
        mateAIVoice,
        isGeneratingAIVoice,
        focusTime,
        isFocusing,
        isPaused,
        isGeneratingComment,
        focusTimeFormatted,
        monthlyBudget,
        monthlyExpenses,
        monthlyBalance,
        expenses,
        events,
        todos,
        steps,
        targetSteps,
        heartRate,
        exerciseType,
        exerciseTypes,
        clockHands,
        currentExerciseIcon,
        sleepDuration,
        sleepQuality,
        sleepDiaries,
        isGeneratingSleepDiary,
        showSleepDiaryModal,
        currentSleepDiary,
        currentEvent,
        containerClass,
        showAddExpenseModal,
        showAddTodoModal,
        showAddEventModal,
        showPeriodSettings,
        lastPeriodDate,
        cycleLength,
        periodLength,
        isPeriodToday,
        predictedNextPeriod,
        daysUntilNextPeriod,
        periodStatusText,
        periodDialogMessage,
        newExpense,
        newTodo,
        newEvent,
        
        // 方法
        startFocus,
        pauseFocus,
        cancelFocus,
        submitExpense,
        submitTodo,
        submitEvent,
        deleteTodo,
        deleteEvent,
        deleteExpense,
        toggleTodo,
        updateBudget,
        promptUpdateBudget,
        promptAiBookkeep,
        setPeriodStartDate,
        getCurrentStatus,
        getGreeting,
        setMode,
        aiBookkeep,
        generatePeriodicAIComment,
        generateSleepDiary
    };
}
