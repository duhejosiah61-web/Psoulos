<template>
        <!-- Mate App - AI Companion -->
        <div class="app-view mate-app mate-v2">
            <div class="mate-v2-topbar">
                <button class="mate-v2-icon-btn" @click="goBack"><i class="fas fa-chevron-left"></i></button>
                <button class="mate-v2-title-wrap mate-v2-title-toggle" @click="mate.showTodayPanel = !mate.showTodayPanel">
                    <h1 class="mate-v2-title">MATE</h1>
                    <p class="mate-v2-sub">陪伴场景</p>
                </button>
                <button class="mate-v2-icon-btn" @click="mate.showAddEventModal = true"><i class="fas fa-plus"></i></button>
            </div>

            <div v-if="mate.showTodayPanel" class="mate-v2-today-panel">
                <div class="mate-today-header">
                    <div>
                        <p class="mate-today-kicker">TODAY</p>
                        <h2>{{ mate.todayPanel.title }}</h2>
                    </div>
                    <button class="mate-today-refresh" @click="mate.triggerSceneEncouragement"><i class="fas fa-wand-magic-sparkles"></i></button>
                </div>
                <p class="mate-today-sub">{{ mate.todayPanel.subtitle }}</p>
                <p class="mate-today-summary">{{ mate.todayPanel.summary }}</p>
                <div class="mate-today-grid">
                    <div><span>财务</span><strong>{{ mate.todayPanel.balanceText }}</strong></div>
                    <div><span>待办</span><strong>{{ mate.todayPanel.todoText }}</strong></div>
                    <div><span>日程</span><strong>{{ mate.todayPanel.nextEventText }}</strong></div>
                </div>
                <div class="mate-today-actions">
                    <button class="scene-btn ghost" @click="mate.generateCompanionNudge">主动陪伴</button>
                </div>
            </div>

            <div class="mate-v2-stage">
                <section v-show="mate.currentMode === 'focus'" class="mate-v2-scene focus">
                    <div class="scene-watermark">{{ mate.currentSceneMeta.watermark }}</div>
                    <div class="scene-editorial-top"><span>Edition 06</span><span>{{ mate.currentSceneMeta.editor }}</span></div>
                    <div class="scene-badge">{{ mate.currentSceneMeta.badge }}</div>
                    <div class="scene-card scene-core-card slim motion-card">
                        <div class="scene-core-label">主状态</div>
                        <div class="scene-core-value motion-line handwritten-line">{{ mate.focusTimeFormatted }}</div>
                        <div class="scene-core-sub">{{ mate.isFocusing ? (mate.isPaused ? '已暂停' : '专注中') : '准备开始' }}</div>
                    </div>
                    <div class="scene-motion-hint scene-exercise-encouragement" v-if="mate.focusEncouragement || mate.isGeneratingFocusEncouragement">
                        {{ mate.isGeneratingFocusEncouragement ? '生成中...' : mate.focusEncouragement }}
                    </div>
                    <div class="scene-action-row exercise-encouragement-row">
                        <button class="scene-btn primary" @click="mate.generateFocusEncouragement" :disabled="mate.isGeneratingFocusEncouragement">
                            {{ mate.isGeneratingFocusEncouragement ? '生成中...' : '给我鼓励' }}
                        </button>
                    </div>
                    <div class="scene-inline-stats">
                        <span>今日专注 {{ mate.focusHistory.length }} 次</span>
                        <span>累计 {{ mate.focusHistory.reduce((s, h) => s + (h.duration || 0), 0) }} 分钟</span>
                    </div>
                    <div class="scene-action-row exercise-control-row">
                        <button v-if="!mate.isFocusing" class="scene-btn primary" @click="mate.startFocus">开始</button>
                        <button v-else-if="mate.isPaused" class="scene-btn primary" @click="mate.pauseFocus">继续</button>
                        <button v-else class="scene-btn primary" @click="mate.pauseFocus">暂停</button>
                        <button v-if="mate.isFocusing" class="scene-btn ghost" @click="mate.cancelFocus">结束</button>
                    </div>
                </section>

                <section v-show="mate.currentMode === 'exercise'" class="mate-v2-scene exercise">
                    <div class="scene-watermark">{{ mate.currentSceneMeta.watermark }}</div>
                    <div class="scene-editorial-top"><span>Edition 06</span><span>{{ mate.currentSceneMeta.editor }}</span></div>
                    <div class="scene-badge">{{ mate.currentSceneMeta.badge }}</div>
                    <div class="scene-chip-row scrollable">
                        <button v-for="type in mate.exerciseTypes" :key="type.id" class="scene-chip"
                            :class="{ active: mate.exerciseType === type.id }"
                            @click="mate.setExerciseType(type.id)">
                            <i :class="`fas ${type.icon}`"></i> {{ type.label }}
                        </button>
                    </div>
                    <div class="scene-motion-panel">
                        <div class="scene-card scene-core-card slim motion-card">
                            <div class="scene-core-label">主状态</div>
                            <div class="scene-core-value motion-line handwritten-line" :class="{ transitioning: mate.isMotionLineTransitioning }">{{ mate.currentMotionLine || '我在这里，陪你慢慢动起来。' }}</div>
                            <div class="scene-core-sub">{{ mate.motionStateSummary }} · {{ mate.motionStateStageText }}</div>
                        </div>
                        <div class="scene-motion-badges">
                            <div class="metric"><span>活力</span><strong>{{ mate.roleMotionState.vitality }}</strong></div>
                            <div class="metric"><span>节律</span><strong>{{ mate.roleMotionState.rhythm }}</strong></div>
                            <div class="metric"><span>陪伴进度</span><strong>{{ mate.roleMotionState.progress }}%</strong></div>
                        </div>
                        <div class="scene-exercise-timer" @click="mate.openExerciseRecords">
                            <div class="scene-exercise-timer-label">正计时</div>
                            <div class="scene-exercise-timer-value">{{ mate.exerciseElapsedText }}</div>
                            <div class="scene-exercise-timer-sub">点击查看历史运动记录与运动日记</div>
                        </div>
                        <div class="scene-progress"><span :style="{ width: mate.roleMotionState.progress + '%' }"></span></div>
                    </div>
                    <div class="scene-motion-hint scene-exercise-encouragement" v-if="mate.exerciseEncouragement || mate.isGeneratingEncouragement">
                        {{ mate.isGeneratingEncouragement ? '生成中...' : mate.exerciseEncouragement }}
                    </div>
                    <div class="scene-action-row exercise-encouragement-row">
                        <button class="scene-btn primary" @click="mate.generateExerciseEncouragement" :disabled="mate.isGeneratingEncouragement">
                            {{ mate.isGeneratingEncouragement ? '生成中...' : '给我鼓励' }}
                        </button>
                    </div>
                    <div class="scene-action-row exercise-control-row">
                        <button class="scene-btn primary" @click="mate.startExerciseSession" :disabled="mate.exerciseStarted">开始</button>
                        <button class="scene-btn ghost" @click="mate.toggleExercisePause" :disabled="!mate.exerciseStarted">{{ mate.exercisePaused ? '继续' : '暂停' }}</button>
                        <button class="scene-btn primary" @click="mate.finishExerciseSession" :disabled="!mate.exerciseStarted || mate.exerciseDiaryGenerating">结束</button>
                    </div>

                    <div v-if="mate.showExerciseRecords" class="exercise-records-modal" @click.self="mate.showExerciseRecords = false">
                        <div class="exercise-records-sheet">
                            <div class="exercise-records-hero">
                                <div class="exercise-records-hero-label">运动记录</div>
                                <div class="exercise-records-hero-title">{{ mate.selectedCharacter?.name || '当前角色' }}</div>
                                <div class="exercise-records-hero-sub">历史记录与角色日记仅展示当前角色</div>
                                <button class="exercise-records-close" @click="mate.showExerciseRecords = false" aria-label="关闭记录面板">
                                    <span class="exercise-records-close-icon">×</span>
                                </button>
                            </div>
                            <div class="exercise-records-tabs">
                                <div class="exercise-records-tab" :class="{ active: mate.exerciseRecordView === 'history' }" @click="mate.exerciseRecordView = 'history'">
                                    <span>历史运动</span>
                                    <strong>{{ mate.exerciseRecords.length }}</strong>
                                </div>
                                <div class="exercise-records-tab" :class="{ active: mate.exerciseRecordView === 'diary' }" @click="mate.exerciseRecordView = 'diary'">
                                    <span>运动日记</span>
                                    <strong>{{ mate.exerciseDiaries.length }}</strong>
                                </div>
                            </div>
                            <div v-if="mate.exerciseRecordView === 'history'">
                                <div class="exercise-records-section-head">
                                    <span>历史运动记录</span>
                                </div>
                                <div v-if="mate.exerciseRecords.length === 0" class="life-empty">暂无记录</div>
                                <div v-for="record in mate.exerciseRecords.slice(0, 8)" :key="record.id" class="exercise-record-card">
                                    <div class="exercise-record-topline">
                                        <div class="exercise-record-type">{{ record.typeLabel }}</div>
                                        <div class="exercise-record-duration">{{ record.durationText }}</div>
                                    </div>
                                    <div class="exercise-record-subline">
                                        <span>{{ new Date(record.startTime).toLocaleString() }}</span>
                                        <span>{{ record.endReason === 'finish' ? '结束' : '重置' }}</span>
                                    </div>
                                    <div class="exercise-record-summary">{{ record.summary || '没有留下台词摘要' }}</div>
                                </div>
                            </div>
                            <div v-else>
                                <div class="exercise-records-section-head" style="margin-top: 14px;">
                                    <span>角色运动日记</span>
                                </div>
                                <div v-if="mate.exerciseDiaries.length === 0" class="life-empty">暂无角色运动日记</div>
                                <div v-for="diary in mate.exerciseDiaries.slice(0, 5)" :key="diary.id" class="exercise-diary-card">
                                    <div class="exercise-diary-head">
                                        <span>{{ diary.characterName || '角色日记' }}</span>
                                        <small>{{ new Date(diary.createdAt).toLocaleString() }}</small>
                                    </div>
                                    <div class="exercise-diary-meta">{{ diary.typeLabel }} · {{ diary.durationText }}</div>
                                    <div class="exercise-diary-text">{{ diary.text || '暂无内容' }}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section v-show="mate.currentMode === 'sleep'" class="mate-v2-scene sleep">
                    <div class="scene-watermark">{{ mate.currentSceneMeta.watermark }}</div>
                    <div class="scene-editorial-top"><span>Edition 06</span><span>{{ mate.currentSceneMeta.editor }}</span></div>
                    <div class="scene-badge">{{ mate.currentSceneMeta.badge }}</div>
                    <div class="scene-card scene-core-card sleep-core-card">
                        <div class="scene-core-label">主状态</div>
                        <div class="scene-core-value">{{ mate.isSleeping ? '睡眠中' : '准备入睡' }}</div>
                        <div class="scene-core-sub">{{ mate.targetSleepDuration }} 小时 · {{ mate.sleepDiaries.length }} 条日记</div>
                    </div>
                    <div class="scene-sleep-core">
                        <button v-if="!mate.isSleeping" class="scene-sleep-btn" @click="mate.startSleeping">开始入睡</button>
                        <button v-else class="scene-sleep-btn active" @click="mate.wakeUp">深睡中… 点击醒来</button>
                    </div>
                    <div class="scene-chip-row">
                        <button v-for="duration in [6, 7, 8, 9]" :key="'s'+duration" class="scene-chip"
                            :class="{ active: mate.targetSleepDuration === duration }"
                            @click="mate.setTargetSleepDuration(duration)">{{ duration }}h</button>
                    </div>
                    <div class="scene-inline-stats">
                        <span>目标睡眠 {{ mate.targetSleepDuration }} 小时</span>
                        <span>日记 {{ mate.sleepDiaries.length }} 条</span>
                    </div>
                </section>

                <section v-show="mate.currentMode === 'life'" class="mate-v2-scene life">
                    <div class="scene-watermark">{{ mate.currentSceneMeta.watermark }}</div>
                    <div class="scene-editorial-top"><span>Edition 06</span><span>{{ mate.currentSceneMeta.editor }}</span></div>
                    <div class="scene-badge">{{ mate.currentSceneMeta.badge }}</div>
                    <div class="scene-card scene-core-card slim">
                        <div class="scene-core-label">主状态</div>
                        <div class="scene-core-value">¥{{ Math.max(0, mate.monthlyBudget - mate.monthlyExpenses) }}</div>
                        <div class="scene-core-sub">本月支出 ¥{{ mate.monthlyExpenses }}</div>
                    </div>
                    <div class="life-todo-list">
                        <div class="life-section-head">
                            <span>待办</span>
                            <button class="scene-mini-btn" @click="mate.showAddTodoModal = true">+</button>
                        </div>
                        <div v-if="mate.pendingTodos.length === 0" class="life-empty">暂无待办</div>
                        <div v-for="todo in mate.pendingTodos.slice(0,3)" :key="todo.id" class="life-item">
                            <span>{{ todo.text }}</span>
                            <button @click="mate.toggleTodo(todo.id)"><i class="fas fa-check"></i></button>
                        </div>
                    </div>
                    <div class="life-events-mini">
                        <div class="life-section-head"><span>今日事件</span></div>
                        <div v-if="mate.recentEvents.length === 0" class="life-empty">暂无事件</div>
                        <div v-for="event in mate.recentEvents" :key="event.id" class="life-item">
                            <span>{{ event.title }}</span>
                            <small>{{ new Date(event.startTime).toLocaleString() }}</small>
                        </div>
                    </div>
                    <div class="life-action-row">
                        <button class="scene-float-action" @click="mate.showAddExpenseModal = true">记账</button>
                        <button class="scene-moon-action" @click="mate.showPeriodSettings = true"><i class="fas fa-moon"></i></button>
                    </div>
                </section>
            </div>

            <div class="mate-v2-dots">
                <button v-for="mode in mate.sceneModes" :key="mode" class="mate-dot"
                    :class="{ active: mate.currentMode === mode }"
                    @click="mate.jumpToScene(mode)"></button>
            </div>

            <div class="mate-avatar-bg" :style="mate.currentAvatarUrl ? { backgroundImage: `url(${mate.currentAvatarUrl})` } : {}"></div>
            <button class="mate-avatar-switch" @click="mate.showCharacterPicker = !mate.showCharacterPicker"><i class="fas fa-people-group"></i></button>
            <div v-if="mate.showCharacterPicker" class="mate-character-picker">
                <div class="mate-character-picker-header">
                    <div class="mate-character-picker-title">更换陪伴人</div>
                    <div class="mate-character-picker-sub">点击选择一个新的陪伴角色</div>
                </div>
                <button v-for="character in mate.characters" :key="character.id" class="mate-character-picker-item" @click="mate.selectedMateCharacterId = character.id; mate.showCharacterPicker = false">
                    <img class="mate-character-picker-avatar" :src="character.avatarUrl || 'https://placehold.co/72x72?text=Avatar'" :alt="character.nickname || character.name" />
                    <div class="mate-character-picker-copy">
                        <span class="mate-character-picker-name">{{ character.nickname || character.name }}</span>
                        <small class="mate-character-picker-desc">{{ character.persona || character.summary || '没有简介' }}</small>
                    </div>
                </button>
            </div>
            <div v-if="mate.mateAIVoice" class="mate-floating-bubble">{{ mate.mateAIVoice }}</div>

            <div v-if="mate.showQuickSceneMenu" class="mate-quick-scene-menu">
                <button @click="mate.jumpToScene('focus')">专注</button>
                <button @click="mate.jumpToScene('exercise')">运动</button>
                <button @click="mate.jumpToScene('sleep')">睡眠</button>
                <button @click="mate.jumpToScene('life')">生活</button>
            </div>

            <div v-if="mate.showMateChatPanel" class="mate-chat-pop">
                <div class="mate-chat-pop-head">
                    <span>伙伴快捷对话</span>
                    <button @click="mate.showMateChatPanel = false"><i class="fas fa-times"></i></button>
                </div>
                <div class="mate-chat-pop-actions">
                    <button @click="mate.triggerSceneEncouragement">来一句</button>
                    <button @click="mate.cycleCharacter">换角色</button>
                </div>
            </div>
            
            <!-- Category Detail Modal -->
            <div v-if="mate.showCategoryDetailModal" class="modal-overlay" @click.self="mate.showCategoryDetailModal = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <span>{{ mate.selectedCategoryDetail }} - 账单详情</span>
                        <button class="close-btn" @click="mate.showCategoryDetailModal = false"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <div v-for="item in mate.categoryDetails" :key="item.id" class="detail-item">
                            <div class="detail-info">
                                <span class="detail-desc">{{ item.description || '无描述' }}</span>
                                <span class="detail-date">{{ new Date(item.date).toLocaleDateString() }}</span>
                            </div>
                            <span class="detail-amount">¥{{ item.amount }}</span>
                            <button class="delete-mini-btn" @click="mate.deleteExpense(item.id)"><i class="fas fa-trash"></i></button>
                        </div>
                        <div v-if="mate.categoryDetails.length === 0" class="no-data">暂无记录</div>
                    </div>
                </div>
            </div>
            
            <!-- Period Settings Modal -->
            <div v-if="mate.showPeriodSettings" class="modal-overlay" @click.self="mate.showPeriodSettings = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <span>经期设置</span>
                        <button class="close-btn" @click="mate.showPeriodSettings = false"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <label>上次经期开始日期</label>
                        <input name="sp_field_61" id="sp-field-61" type="date" :value="mate.lastPeriodDate?.toISOString().split('T')[0]" @input="mate.setPeriodStartDate($event.target.value)">
                        <label class="mt-2">平均周期 (天)</label>
                        <input name="sp_field_62" id="sp-field-62" type="number" v-model="mate.cycleLength">
                        <label class="mt-2">平均持续天数 (天)</label>
                        <input name="sp_field_63" id="sp-field-63" type="number" v-model="mate.periodLength">
                        <button class="journal-btn primary mt-2 w-100" @click="mate.showPeriodSettings = false">保存设置</button>
                    </div>
                </div>
            </div>
            
            <!-- Add Expense Modal -->
            <div v-if="mate.showAddExpenseModal" class="modal-overlay" @click.self="mate.showAddExpenseModal = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <span>添加支出</span>
                        <button class="close-btn" @click="mate.showAddExpenseModal = false"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <label>金额 (¥)</label>
                        <input name="sp_field_64" id="sp-field-64" type="number" v-model="mate.newExpense.amount" placeholder="0.00">
                        <label class="mt-2">类别</label>
                        <select name="sp_field_65" id="sp-field-65" v-model="mate.newExpense.category">
                            <option value="餐饮">餐饮</option>
                            <option value="交通">交通</option>
                            <option value="购物">购物</option>
                            <option value="娱乐">娱乐</option>
                            <option value="生活">生活</option>
                            <option value="其他">其他</option>
                        </select>
                        <label class="mt-2">描述</label>
                        <input name="sp_field_66" id="sp-field-66" type="text" v-model="mate.newExpense.description" placeholder="去哪儿花了？">
                        <label class="mt-2">日期</label>
                        <input name="sp_field_67" id="sp-field-67" type="date" v-model="mate.newExpense.date">
                        <label class="mt-2">选择留言角色</label>
                        <select name="sp_field_68" id="sp-field-68" v-model="mate.newExpense.selectedCharacterId">
                            <option :value="null">不留言</option>
                            <option v-for="char in characters" :key="char.id" :value="char.id">
                                {{ char.nickname || char.name }}
                            </option>
                        </select>
                        <button class="journal-btn primary mt-2 w-100" @click="mate.submitExpense(characters, activeProfile)" :disabled="mate.isGeneratingComment">
                            <i v-if="mate.isGeneratingComment" class="fas fa-spinner fa-spin"></i>
                            {{ mate.isGeneratingComment ? '生成中...' : '确认添加' }}
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Add Income Modal -->
            <div v-if="mate.showAddIncomeModal" class="modal-overlay" @click.self="mate.showAddIncomeModal = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <span>添加收入</span>
                        <button class="close-btn" @click="mate.showAddIncomeModal = false"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <label>金额 (¥)</label>
                        <input name="sp_field_69" id="sp-field-69" type="number" v-model="mate.newIncome.amount" placeholder="0.00">
                        <label class="mt-2">类别</label>
                        <select name="sp_field_70" id="sp-field-70" v-model="mate.newIncome.category">
                            <option value="工资">工资</option>
                            <option value="奖金">奖金</option>
                            <option value="投资">投资</option>
                            <option value="其他">其他</option>
                        </select>
                        <label class="mt-2">描述</label>
                        <input name="sp_field_71" id="sp-field-71" type="text" v-model="mate.newIncome.description" placeholder="收入来源？">
                        <label class="mt-2">日期</label>
                        <input name="sp_field_72" id="sp-field-72" type="date" v-model="mate.newIncome.date">
                        <button class="journal-btn primary mt-2 w-100" @click="mate.submitIncome">
                            确认添加
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Income Category Detail Modal -->
            <div v-if="mate.showIncomeCategoryDetailModal" class="modal-overlay" @click.self="mate.showIncomeCategoryDetailModal = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <span>{{ mate.selectedCategoryDetail }} - 收入详情</span>
                        <button class="close-btn" @click="mate.showIncomeCategoryDetailModal = false"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <div v-for="item in mate.incomeCategoryDetails" :key="item.id" class="detail-item">
                            <div class="detail-info">
                                <span class="detail-desc">{{ item.description || '无描述' }}</span>
                                <span class="detail-date">{{ new Date(item.date).toLocaleDateString() }}</span>
                            </div>
                            <span class="detail-amount income-amount">¥{{ item.amount }}</span>
                            <button class="delete-mini-btn income-delete-btn" @click="mate.deleteIncome(item.id)"><i class="fas fa-trash"></i></button>
                        </div>
                        <div v-if="mate.incomeCategoryDetails.length === 0" class="no-data">暂无记录</div>
                    </div>
                </div>
            </div>
            
            <!-- Add Todo Modal -->
            <div v-if="mate.showAddTodoModal" class="modal-overlay" @click.self="mate.showAddTodoModal = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <span>新建待办</span>
                        <button class="close-btn" @click="mate.showAddTodoModal = false"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <label>待办内容</label>
                        <input name="sp_field_73" id="sp-field-73" type="text" v-model="mate.newTodo.text" placeholder="要做什么？">
                        <label class="mt-2">提醒时间</label>
                        <input name="sp_field_74" id="sp-field-74" type="datetime-local" v-model="mate.newTodo.time">
                        <button class="journal-btn primary mt-2 w-100" @click="mate.submitTodo">确认新建</button>
                    </div>
                </div>
            </div>
            
            <!-- Add Event Modal -->
            <div v-if="mate.showAddEventModal" class="modal-overlay" @click.self="mate.showAddEventModal = false">
                <div class="modal-content">
                    <div class="modal-header">
                        <span>新建日程</span>
                        <button class="close-btn" @click="mate.showAddEventModal = false"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <label>日程标题</label>
                        <input name="sp_field_75" id="sp-field-75" type="text" v-model="mate.newEvent.title" placeholder="要做什么日程？">
                        <label class="mt-2">开始时间</label>
                        <input name="sp_field_76" id="sp-field-76" type="datetime-local" v-model="mate.newEvent.startTime">
                        <label class="mt-2">结束时间</label>
                        <input name="sp_field_77" id="sp-field-77" type="datetime-local" v-model="mate.newEvent.endTime">
                        <label class="mt-2">类别</label>
                        <select name="sp_field_78" id="sp-field-78" v-model="mate.newEvent.category">
                            <option value="class">学习/工作</option>
                            <option value="exercise">运动/健康</option>
                            <option value="other">其他</option>
                        </select>
                        <button class="journal-btn primary mt-2 w-100" @click="mate.submitEvent">确认新建</button>
                    </div>
                </div>
            </div>
            
            <!-- Sleep Diary Modal -->
            <div v-if="mate.showSleepDiaryModal" class="modal-overlay" @click.self="mate.showSleepDiaryModal = false">
                <div class="modal-content sleep-diary-modal">
                    <div class="modal-header">
                        <span>睡眠日记</span>
                        <button class="close-btn" @click="mate.showSleepDiaryModal = false"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body" v-if="mate.currentSleepDiary">
                        <div class="diary-header-summary">
                            <div class="diary-char-info">
                                <img :src="mate.currentSleepDiary.avatarUrl" class="diary-char-avatar">
                                <span class="diary-char-name">{{ mate.currentSleepDiary.characterName }}</span>
                            </div>
                            <div class="sleep-score-badge" :class="'score-' + Math.floor(mate.currentSleepDiary.score / 20)">
                                {{ mate.currentSleepDiary.score }}分
                            </div>
                        </div>
                        <div class="diary-meta-row">
                            <span><i class="far fa-clock"></i> {{ mate.currentSleepDiary.duration }}分钟</span>
                            <span><i class="fas fa-sparkles"></i> 质量：{{ mate.currentSleepDiary.quality }}</span>
                        </div>
                        <div class="diary-section">
                            <h5 class="section-label">梦境记录</h5>
                            <div class="diary-content-full">{{ mate.currentSleepDiary.dream || mate.currentSleepDiary.content }}</div>
                        </div>
                        <div class="diary-section mt-3" v-if="mate.currentSleepDiary.events && mate.currentSleepDiary.events.length > 0">
                            <h5 class="section-label">陪伴观察</h5>
                            <div class="diary-events-list">
                                <div v-for="(evt, idx) in mate.currentSleepDiary.events" :key="idx" class="diary-event-item">
                                    <span class="evt-time">{{ evt.time }}</span>
                                    <span class="evt-action">{{ evt.action }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="diary-section mt-3">
                            <h5 class="section-label">醒后密语</h5>
                            <div class="diary-message-box">{{ mate.currentSleepDiary.message }}</div>
                        </div>
                        <button class="journal-btn primary mt-3 w-100" @click="mate.showSleepDiaryModal = false">收起日记</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 附件面板 -->
        <div v-if="showAttachmentPanel" class="attachment-panel-overlay" @click.self="showAttachmentPanel = false">
            <div class="attachment-panel">
                <div class="attachment-grid">
                    <!-- 第一行：重新生成、表情、相册 -->
                    <div class="attachment-item" @click="handleRetry" title="重新生成">
                        <i class="fas fa-rotate-right"></i>
                    </div>
                    <div class="attachment-item" @click="showEmojiPanel = true; showAttachmentPanel = false" title="表情">
                        <i class="fas fa-face-smile"></i>
                    </div>
                    <div class="attachment-item" @click="showPhotoSelectPanel = true; showAttachmentPanel = false" title="相册">
                        <i class="fas fa-image"></i>
                    </div>
                    
                    <!-- 第二行：语音输入、定位、转账 -->
                    <div class="attachment-item" @click="startVoiceInput" title="语音输入">
                        <i class="fas fa-microphone"></i>
                    </div>
                    <div class="attachment-item" @click="openLocationPanel" title="定位">
                        <i class="fas fa-location-dot"></i>
                    </div>
                    <div class="attachment-item" @click="openTransferPanel" title="转账">
                        <i class="fas fa-yen-sign"></i>
                    </div>
                    
                    <!-- 第三行：订单、投票、分享 -->
                    <div class="attachment-item" @click="openTaobaoPanel" title="购物">
                        <i class="fas fa-shopping-bag"></i>
                    </div>
                    <div class="attachment-item" @click="handleVote" title="投票">
                        <i class="fas fa-square-poll-vertical"></i>
                    </div>
                    <div class="attachment-item" @click="handleShare" title="分享">
                        <i class="fas fa-share-nodes"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- 文字图 -->
        <div v-if="showPureTextImagePanel" class="text-image-overlay" @click.self="showPureTextImagePanel = false">
            <div class="text-image-panel">
                <div class="text-image-header">
                    <button class="back-btn-small" @click="showPureTextImagePanel = false; showPhotoSelectPanel = true"><i class="fas fa-arrow-left"></i></button>
                    <h3>文字图</h3>
                    <div style="width: 40px;"></div>
                </div>
                <div class="text-image-content" style="padding: 20px;">
                    <div class="text-image-controls" style="width: 100%;">
                        <textarea v-model="pureTextImageText" placeholder="输入要生成的文字内容..." class="text-image-input" style="height: 120px; font-size: 15px; color: #000; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; padding: 12px; background: rgba(0,0,0,0.02); color: #000;"></textarea>
                    </div>
                </div>
                <button class="send-text-image-btn" @click="sendPureTextImage" :disabled="!pureTextImageText.trim() || isGeneratingChatImage">
                    <i class="fas" :class="isGeneratingChatImage ? 'fa-spinner fa-spin' : 'fa-font'"></i>
                    {{ isGeneratingChatImage ? '生成中...' : '生成发送' }}
                </button>
            </div>
        </div>

        <!-- 购物面板 -->
        <div v-if="showTaobaoPanel" class="modal-overlay" @click.self="showTaobaoPanel = false">
            <div class="taobao-modal">
                <div class="taobao-header">
                    <div class="taobao-search">
                        <i class="fas fa-search"></i>
                        <input name="sp_field_79" id="sp-field-79" type="text" v-model="taobaoSearchTerm" placeholder="搜索商品..." @keypress.enter="searchTaobaoProducts">
                        <button class="taobao-search-btn" @click="searchTaobaoProducts">搜索</button>
                    </div>
                    <button class="close-btn" @click="showTaobaoPanel = false"><i class="fas fa-times"></i></button>
                </div>
                <div class="taobao-content">
                    <div v-if="taobaoLoading" class="taobao-loading">
                        <div class="loading-spinner"></div>
                        <p>AI正在生成商品...</p>
                    </div>
                    <div v-else-if="taobaoProducts.length === 0" class="taobao-empty">
                        <i class="fas fa-shopping-bag"></i>
                        <p>搜索商品，发现好物</p>
                    </div>
                    <div v-else class="taobao-grid">
                        <div v-for="(product, index) in taobaoProducts" :key="index" class="taobao-product-card">
                            <div class="taobao-product-image">
                                <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name">
                                <div v-else class="taobao-image-loading">
                                    <div class="loading-spinner"></div>
                                </div>
                            </div>
                            <div class="taobao-product-info">
                                <div class="taobao-product-name">{{ product.name }}</div>
                                <div class="taobao-product-price">¥{{ product.price.toFixed(2) }}</div>
                                <div class="taobao-product-category">{{ product.category }}</div>
                            </div>
                            <div class="taobao-action-btns">
                                <button class="taobao-buy-btn" @click="buyTaobaoProduct(product)">购买</button>
                                <button class="taobao-help-buy-btn" @click="helpBuyTaobaoProduct(product)">帮买</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 分享面板 -->
        <div v-if="showSharePanel" class="modal-overlay" @click.self="showSharePanel = false">
            <div class="share-modal">
                <div class="modal-header">
                    <h3>分享内容</h3>
                    <button class="close-btn" @click="showSharePanel = false"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-content">
                    <div class="share-input-group">
                        <label>来源</label>
                        <div class="share-source-grid">
                            <div v-for="source in shareSources" :key="source" 
                                 class="share-source-item" 
                                 :class="{ active: shareSource === source }" 
                                 @click="shareSource = source">
                                {{ source }}
                            </div>
                        </div>
                    </div>
                    <div class="share-input-group">
                        <label>分享内容概述</label>
                        <textarea name="sp_field_80" id="sp-field-80" v-model="shareContent" placeholder="描述你想分享的内容..." rows="4"></textarea>
                    </div>
                    <button class="share-send-btn" @click="sendShareCard" :disabled="!shareSource || !shareContent.trim()">发送</button>
                </div>
            </div>
        </div>

        <!-- 投票面板 -->
        <div v-if="showVotePanel" class="modal-overlay" @click.self="showVotePanel = false">
            <div class="vote-modal">
                <div class="modal-header">
                    <h3>创建投票</h3>
                    <button class="close-btn" @click="showVotePanel = false"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-content">
                    <div class="vote-input-group">
                        <label>投票问题</label>
                        <input name="sp_field_81" id="sp-field-81" type="text" v-model="voteQuestion" placeholder="输入投票问题...">
                    </div>
                    <div class="vote-options-group">
                        <label>选项</label>
                        <div v-for="(option, index) in voteOptions" :key="index" class="vote-option-input">
                            <input name="sp_field_82" id="sp-field-82" type="text" v-model="voteOptions[index]" :placeholder="'选项 ' + (index + 1)">
                            <button v-if="voteOptions.length > 2" class="remove-option-btn" @click="removeVoteOption(index)">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <button v-if="voteOptions.length < 6" class="add-option-btn" @click="addVoteOption">
                            <i class="fas fa-plus"></i> 添加选项
                        </button>
                    </div>
                    <button class="create-vote-btn" @click="createVote" :disabled="!voteQuestion.trim()">创建投票</button>
                </div>
            </div>
        </div>

        <!-- 照片选择面板 -->
        <div v-if="showPhotoSelectPanel" class="photo-select-overlay" @click.self="showPhotoSelectPanel = false">
            <div class="photo-select-panel">
                <div class="photo-select-header">
                    <h3>选择照片</h3>
                    <button class="close-btn" @click="showPhotoSelectPanel = false"><i class="fas fa-times"></i></button>
                </div>
                <div class="photo-select-options">
                    <div class="photo-option" @click="selectFromAlbum">
                        <div class="option-icon">
                            <i class="fas fa-folder-open"></i>
                        </div>
                        <span class="option-label">本地相册</span>
                        <span class="option-desc">选择手机相册中的图片</span>
                    </div>
                    <div class="photo-option" @click="showTextImagePanel = true; showPhotoSelectPanel = false">
                        <div class="option-icon">
                            <i class="fas fa-magic"></i>
                        </div>
                        <span class="option-label">文生图</span>
                        <span class="option-desc">AI 生成图片</span>
                    </div>
                    <div class="photo-option" @click="showPureTextImagePanel = true; showPhotoSelectPanel = false">
                        <div class="option-icon">
                            <i class="fas fa-font"></i>
                        </div>
                        <span class="option-label">文字图</span>
                        <span class="option-desc">纯文字生成图片</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- 文生图创建面板 -->
        <div v-if="showTextImagePanel" class="text-image-overlay" @click.self="showTextImagePanel = false">
            <div class="text-image-panel">
                <div class="text-image-header">
                    <button class="back-btn-small" @click="showTextImagePanel = false; showPhotoSelectPanel = true"><i class="fas fa-arrow-left"></i></button>
                    <h3>AI 文生图</h3>
                    <div style="width: 40px;"></div>
                </div>
                <div class="text-image-content" style="padding: 20px;">
                    <div class="text-image-controls" style="width: 100%;">
                        <textarea name="sp_field_83" id="sp-field-83" v-model="textImageText" placeholder="输入画面描述 (Prompt)..." class="text-image-input" style="height: 120px; font-size: 15px; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; padding: 12px; background: rgba(0,0,0,0.02); color: #000;"></textarea>
                    </div>
                </div>
                <button class="send-text-image-btn" @click="sendTextImage" :disabled="!textImageText.trim() || isGeneratingChatImage">
                    <i class="fas" :class="isGeneratingChatImage ? 'fa-spinner fa-spin' : 'fa-magic'"></i>
                    {{ isGeneratingChatImage ? '生成中...' : '生成并发送' }}
                </button>
            </div>
        </div>

        <!-- 语音输入面板 -->
        <div v-if="showVoiceInputPanel" class="voice-input-overlay" @click.self="closeVoiceInputPanel">
            <div class="voice-input-panel">
                <div class="voice-input-header">
                    <button class="back-btn-small" @click="closeVoiceInputPanel"><i class="fas fa-arrow-left"></i></button>
                    <h3>语音输入</h3>
                    <div style="width: 40px;"></div>
                </div>
                <div class="voice-input-content">
                    <div class="voice-input-hint">
                        <i class="fas fa-microphone"></i>
                        <span>输入文字，将转换为语音消息</span>
                    </div>
                    <textarea name="sp_field_84" id="sp-field-84" v-model="voiceInputText" placeholder="输入要转换为语音的文字..." class="voice-textarea" maxlength="200"></textarea>
                    <div class="voice-preview" v-if="voiceInputText.trim()">
                        <div class="voice-bubble-preview">
                            <div class="voice-wave">
                                <span></span><span></span><span></span><span></span><span></span>
                            </div>
                            <span class="voice-duration">{{ Math.max(1, Math.ceil(voiceInputText.length / 3)) }}"</span>
                        </div>
                    </div>
                </div>
                <button class="send-voice-btn" @click="sendVoiceMessage" :disabled="!voiceInputText.trim()">
                    <i class="fas fa-paper-plane"></i> 发送语音
                </button>
            </div>
        </div>

        <!-- 位置页面 - 旅行明信片风格 -->
        <div v-if="showLocationPanel" class="location-modal-overlay" @click.self="closeLocationPanel">
            <div class="location-modal" @click.stop>
                <div class="location-header-bar">
                    <button class="back-btn-small" @click="closeLocationPanel"><i class="fas fa-arrow-left"></i></button>
                    <span>发送位置</span>
                </div>
                
                <!-- 地图容器 -->
                <div class="location-map-container">
                    <div class="location-map">
                        <div class="map-placeholder">
                            <div class="map-marker user-marker">
                                <div class="marker-dot"></div>
                                <div class="marker-label">我</div>
                            </div>
                            <div class="map-marker ai-marker">
                                <div class="marker-dot"></div>
                                <div class="marker-label">TA</div>
                            </div>
                        </div>
                    </div>
                    <!-- 邮戳装饰 -->
                    <div class="postmark-decor">
                        <span>📍</span>
                    </div>
                </div>
                
                <!-- 地址信息 -->
            <div class="location-address-card">
                <div class="location-place-name">位置信息</div>
                <div class="location-input-section">
                    <label class="location-label">我的位置</label>
                    <input name="sp_field_85" id="sp-field-85" type="text" v-model="userAddress" class="location-input" placeholder="输入你的位置...">
                </div>
                <div class="location-input-section">
                    <label class="location-label">TA的位置</label>
                    <input name="sp_field_86" id="sp-field-86" type="text" v-model="aiAddress" class="location-input" placeholder="输入TA的位置...">
                </div>
                <div class="location-input-section">
                    <label class="location-label">相距距离</label>
                    <input name="sp_field_87" id="sp-field-87" type="text" v-model="calculatedDistance" class="location-input" placeholder="输入距离...">
                </div>
            </div>
            
            <!-- 操作按钮 -->
            <button class="send-location-btn" @click="sendLocation" :disabled="!userAddress?.trim()">发送位置</button>
            </div>
        </div>

        <!-- 转账页面 - 艺术支票风格 -->
        <div v-if="showTransferPanel" class="transfer-modal-overlay" @click.self="closeTransferPanel">
            <div class="transfer-modal" @click.stop>
                <div class="transfer-header-bar">
                    <button class="back-btn-small" @click="closeTransferPanel"><i class="fas fa-arrow-left"></i></button>
                    <span>转账</span>
                </div>
                
                <!-- 装饰元素 -->
                <div class="transfer-decorations">
                    <span class="deco-star">✦</span>
                    <span class="deco-star">✦</span>
                    <span class="deco-coin">🪙</span>
                </div>
                
                <!-- 头像和流向 -->
                <div class="transfer-flow">
                    <div class="transfer-avatar user-avatar">
                        <div class="avatar-circle">我</div>
                    </div>
                    <div class="transfer-arrow">→</div>
                    <div class="transfer-avatar ai-avatar">
                        <img :src="currentChatAvatar" alt="avatar">
                    </div>
                </div>
                
                <!-- 金额输入 -->
            <div class="transfer-amount-section">
                <span class="currency-symbol">¥</span>
                <div class="amount-display">
                    <input name="sp_field_88" id="sp-field-88" type="number" v-model.number="transferAmount" placeholder="0.00" step="0.01" class="amount-input">
                </div>
                <div class="amount-underline"></div>
            </div>
            
            <!-- 备注 -->
            <div class="transfer-memo-section">
                <textarea name="sp_field_89" id="sp-field-89" v-model="transferNote" placeholder="添加备注..." class="memo-input" maxlength="20"></textarea>
            </div>
            
            <!-- 确认按钮 -->
            <button class="transfer-confirm-btn" @click="sendTransfer" :disabled="!transferAmount">确认转账</button>
            </div>
        </div>



</template>

<script>
import { inject } from 'vue';

export default {
    name: 'MateApp',
    setup() {
        return inject('globalState');
    }
}
</script>
