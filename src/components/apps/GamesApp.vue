<template>
        <!-- Games App -->
        <div  class="app-view games-view">
            <div class="app-header">
                <button class="back-btn" @click="closeApp"><i class="fas fa-chevron-left"></i></button>
                <span class="app-title">小游戏</span>
                <div style="width: 40px;"></div>
            </div>
            <div class="app-content games-content">
                <div v-if="!games.currentGame" class="card games-panel">
                    <div class="card-title">游戏大厅</div>
                    <div class="games-lobby-grid">
                        <button
                            v-for="game in games.games"
                            :key="game.id"
                            class="console-btn games-lobby-btn"
                            :disabled="game.status !== 'available'"
                            @click="openGame(game.id)"
                        >
                            <div class="games-lobby-name">{{ game.name }} <span v-if="game.status !== 'available'" class="games-badge-soon">(敬请期待)</span></div>
                            <div class="games-lobby-desc">{{ game.description }}</div>
                        </button>
                    </div>
                </div>

                <div v-else class="games-ingame-stack">
                    <!-- UNO 单独一张卡：绝不经过「规则说明 + 搭子选择」那一套 DOM -->
                    <!-- 内联样式优先级最高，避免被全局 .card 黑边框盖住；不用开开发者工具也能看出是新界面 -->
                    <div
                        v-if="String(games.currentGame?.id || '') === 'uno'"
                        class="card games-panel games-panel-uno-dedicated"
                        style="border:3px solid #16a34a !important;border-radius:18px;background:linear-gradient(165deg,#f8fafc,#ecfdf5,#f8fafc);box-shadow:0 10px 28px rgba(22,163,74,0.2);"
                    >
                        <div class="card-title">UNO</div>
                        <!-- ==================== UNO 优化适配版（不溢出） ==================== -->
                        <div
                            class="games-mode-panel games-mode-panel-uno"
                            style="padding:15px 12px 20px;text-align:center;min-height:min(72vh, 520px);max-height:65vh;background:#f8fafc;overflow-y:auto;overflow-x:hidden;box-sizing:border-box;-webkit-overflow-scrolling:touch;"
                        >

                            <button
                                v-if="!games.gameState?.players?.length || games.gameState.gameOver"
                                @click="startUNOGame"
                                class="console-btn console-btn-primary"
                                style="width:100%;padding:16px;font-size:18px;margin-bottom:20px;border-radius:14px;box-sizing:border-box;">
                                🎮 开始新 UNO 游戏
                            </button>

                            <div v-if="games.gameState && games.gameState.players && games.gameState.players.length > 0 && !games.gameState.gameOver" style="max-width:100%;margin:0 auto;">

                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;font-size:15px;padding:0 8px;gap:8px;flex-wrap:wrap;">
                                    <div style="min-width:0;text-align:left;">
                                        当前颜色：<span :style="{ color: games.getUnoColor ? games.getUnoColor(games.gameState.currentColor) : '#000', fontWeight:'700' }">
                                            {{ games.gameState.currentColor || '无' }}
                                        </span>
                                    </div>
                                    <div style="font-weight:600;white-space:nowrap;">轮到：{{ games.gameState.currentPlayer === 0 ? '你' : '李寻野' }}</div>
                                </div>

                                <div style="margin-bottom:22px;">
                                    <div style="font-size:13px;color:#666;margin-bottom:6px;">牌堆顶部</div>
                                    <div v-if="games.gameState.discardPile && games.gameState.discardPile.length > 0"
                                         :style="{
                                            backgroundColor: games.getUnoColor ? games.getUnoColor(games.gameState.discardPile[games.gameState.discardPile.length-1].color) : '#333',
                                            color: '#fff',
                                            padding: '14px 28px',
                                            borderRadius: '14px',
                                            fontSize: '17px',
                                            display: 'inline-block',
                                            boxShadow: '0 6px 15px rgba(0,0,0,0.25)',
                                            maxWidth: '85%',
                                            boxSizing: 'border-box',
                                            wordBreak: 'break-word'
                                         }">
                                        {{ games.gameState.discardPile[games.gameState.discardPile.length-1].color }}
                                        {{ games.gameState.discardPile[games.gameState.discardPile.length-1].value }}
                                    </div>
                                </div>

                                <div style="margin-bottom:25px;">
                                    <div style="margin-bottom:10px;font-size:14.5px;color:#333;">
                                        你的手牌（{{ games.gameState.players[0]?.hand?.length || 0 }} 张）
                                    </div>
                                    <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:100%;padding:0 8px;box-sizing:border-box;">
                                        <button
                                            v-for="(card, idx) in (games.gameState.players[0] ? games.gameState.players[0].hand : [])"
                                            :key="idx"
                                            @click="playUnoCard(idx)"
                                            :disabled="games.gameState.currentPlayer !== 0 || games.gameState.isThinking"
                                            style="padding:14px 18px;font-size:15.5px;border-radius:12px;min-width:78px;max-width:calc(50% - 8px);box-shadow:0 4px 12px rgba(0,0,0,0.22);border:none;transition:all 0.15s;flex-shrink:0;box-sizing:border-box;"
                                            :style="{
                                                backgroundColor: games.getUnoColor ? games.getUnoColor(card.color) : '#333',
                                                color: '#fff',
                                                opacity: (games.gameState.currentPlayer !== 0 || games.gameState.isThinking) ? 0.6 : 1
                                            }"
                                        >
                                            {{ card.color }}<br><strong>{{ card.value }}</strong>
                                        </button>
                                    </div>
                                </div>

                                <div style="display:flex;gap:12px;margin-bottom:22px;padding:0 8px;box-sizing:border-box;">
                                    <button
                                        class="console-btn console-btn-secondary"
                                        :disabled="games.gameState.currentPlayer !== 0 || games.gameState.isThinking"
                                        @click="drawUnoCardForPlayer"
                                        style="flex:1;min-width:0;padding:14px;font-size:15px;">
                                        抽一张牌
                                    </button>
                                    <button
                                        class="console-btn console-btn-secondary"
                                        @click="sayUNO"
                                        style="flex:1;min-width:0;padding:14px;font-size:15px;">
                                        喊 UNO！
                                    </button>
                                </div>

                                <div v-if="games.gameState.isThinking" style="margin:15px 0;color:#666;font-size:15px;">
                                    ⏳ 李寻野 正在思考...
                                </div>
                            </div>

                            <div v-if="games.gameState && games.gameState.gameOver"
                                 style="margin-top:24px;padding:45px 16px;background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border-radius:20px;text-align:center;box-sizing:border-box;">
                                <div style="font-size:42px;margin-bottom:15px;">🎉</div>
                                <div style="font-size:26px;font-weight:bold;color:#22c55e;">
                                    {{ games.gameState.winnerName }} 获胜！
                                </div>
                                <p style="margin-top:18px;color:#444;font-size:16px;">
                                    {{ games.gameState.winnerName === '你' ? '太棒了！你赢了李寻野！' : '李寻野赢了，下次加油！' }}
                                </p>
                            </div>

                            <button
                                @click="closeGame"
                                class="console-btn console-btn-secondary"
                                style="margin-top:24px;width:100%;padding:15px;font-size:15.5px;border-radius:14px;box-sizing:border-box;">
                                返回游戏大厅
                            </button>
                        </div>
                    </div>

                    <div v-else class="card games-panel">
                    <div class="card-title">{{ games.currentGame.name }}</div>
                        <p class="games-rule">{{ games.currentGame.rules || games.currentGame.description }}</p>
                        <div class="games-meta">
                            人数：{{ games.currentGame.players || '-' }} ｜ 时长：{{ games.currentGame.duration || '-' }}
                        </div>
                        <div class="games-ai-picker">
                            <div class="games-kicker">游戏搭子</div>
                            <select name="sp_field_156" id="sp-field-156" v-model="gameAiCharacterId" class="console-select">
                                <option :value="null">默认 AI 搭子</option>
                                <option v-for="char in characters" :key="char.id" :value="char.id">
                                    {{ char.nickname || char.name || '未命名角色' }}
                                </option>
                            </select>
                            <div class="games-ai-current">当前搭子：{{ getGameAiName() }}</div>
                        </div>

                    <div v-if="games.currentGame.id === 'werewolf'" class="games-mode-panel">
                        <input name="sp_field_157" id="sp-field-157" v-model="playerName" type="text" placeholder="输入玩家名" class="lock-wallpaper-input">
                        <div class="games-actions-row">
                            <button class="console-btn console-btn-secondary" @click="joinGame">加入</button>
                            <button class="console-btn console-btn-primary" @click="startGameSession">开始</button>
                            <button class="console-btn console-btn-secondary" @click="endDay" v-if="games.gameState.phase === 'game'">结束白天</button>
                        </div>
                        <div class="games-status-line">当前阶段：{{ games.gameState.phase }} ｜ 天数：第 {{ games.gameState.day }} 天</div>
                        <div class="games-status-line">
                            <span v-if="games.gameState.players.length === 0">玩家：暂无</span>
                            <span v-else>
                                玩家：
                                <span v-for="(p, idx) in games.gameState.players" :key="p.name + '_' + idx">
                                    {{ p.name }}{{ p.isAlive ? '' : '(出局)' }}<span v-if="idx < games.gameState.players.length - 1">、</span>
                                </span>
                            </span>
                        </div>
                    </div>

                    <div v-else-if="games.currentGame.id === 'rock-paper-scissors'" class="games-rps-panel">
                        <button class="console-btn console-btn-secondary" @click="playRPS('rock')">石头</button>
                        <button class="console-btn console-btn-secondary" @click="playRPS('paper')">布</button>
                        <button class="console-btn console-btn-secondary" @click="playRPS('scissors')">剪刀</button>
                        <div class="games-status-line games-status-wide">
                            结果：{{ games.gameState.rpsResult || '未开始' }} ｜ 比分 {{ games.gameState.rpsScore.player }}:{{ games.gameState.rpsScore.ai }}
                        </div>
                    </div>

                    <div v-else-if="games.currentGame.id === 'truth-or-dare'" class="games-mode-panel">
                        <button class="console-btn console-btn-primary" @click="spinTOD">开始转盘</button>
                        <div class="games-prompt-text">{{ games.gameState.currentTruth || games.gameState.currentDare || '点击开始后生成题目' }}</div>
                    </div>

                    <div v-else-if="games.currentGame.id === 'ludo'" class="games-mode-panel">
                        <button class="console-btn console-btn-primary" @click="startLudoGame">开始飞行棋</button>
                        <button class="console-btn console-btn-secondary" :disabled="games.gameState.ludoCurrentPlayer !== 0" @click="rollDice">掷骰子</button>
                        <div class="games-status-line">
                            回合：{{ games.gameState.ludoCurrentPlayer === 0 ? '你' : 'AI' }} ｜ 点数：{{ games.gameState.currentDice || '-' }}
                        </div>
                        <div class="games-ludo-board">
                            <div
                                v-for="cell in (games.gameState.ludoTrackLength + 1)"
                                :key="'ludo_cell_' + (cell - 1)"
                                class="games-ludo-cell"
                                :style="{ order: getLudoSnakeOrder(cell - 1) }"
                            >
                                <span class="games-ludo-cell-index">{{ cell - 1 }}</span>
                                <span class="games-ludo-cell-effect" v-if="getLudoEffectLabel(cell - 1)">{{ getLudoEffectLabel(cell - 1) }}</span>
                                <div class="games-ludo-tokens">
                                    <span
                                        v-if="(games.gameState.ludoPlayers[0]?.planes || []).includes(cell - 1)"
                                        class="games-ludo-token player flag-token"
                                        title="你的棋子"
                                    >你</span>
                                    <span
                                        v-if="(games.gameState.ludoPlayers[1]?.planes || []).includes(cell - 1)"
                                        class="games-ludo-token ai flag-token"
                                        :title="getGameAiName() + '棋子'"
                                    >{{ getGameAiName().slice(0, 1) }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="games-status-line">起点：0 ｜ 终点：{{ games.gameState.ludoTrackLength }}</div>
                        <div class="games-status-line">
                            终点：{{ games.gameState.ludoTrackLength }} ｜ 你的棋子：{{ (games.gameState.ludoPlayers[0]?.planes || []).join(' / ') }}
                        </div>
                        <div class="games-status-line">
                            AI棋子：{{ (games.gameState.ludoPlayers[1]?.planes || []).join(' / ') }}
                        </div>
                        <div class="games-actions-row">
                            <button
                                v-for="(p, idx) in (games.gameState.ludoPlayers[0]?.planes || [])"
                                :key="'ludo_player_plane_' + idx"
                                class="console-btn console-btn-secondary"
                                :disabled="games.gameState.ludoCurrentPlayer !== 0 || !games.gameState.currentDice"
                                @click="moveLudoPlane(idx)"
                            >
                                移动棋子{{ idx + 1 }}
                            </button>
                        </div>
                        <div class="games-status-line" v-if="games.gameState.ludoWinner">
                            胜者：{{ games.gameState.ludoWinner === 'player' ? '你' : 'AI' }}
                        </div>
                        <div class="games-prompt-text" v-if="ludoQuestionLoading">AI 正在现场生成问题...</div>
                        <div class="games-ludo-question-card" v-if="ludoQuestionCard">
                            <div class="games-kicker">问题格挑战</div>
                            <div class="games-prompt-text">{{ ludoQuestionCard.question }}</div>
                            <div class="games-chat-input-row">
                                <input name="sp_field_158" id="sp-field-158"
                                    v-model="ludoAnswerInput"
                                    @keyup.enter="submitLudoAnswer"
                                    type="text"
                                    class="lock-wallpaper-input"
                                    placeholder="输入你的答案"
                                >
                                <button class="console-btn console-btn-primary" @click="submitLudoAnswer">提交</button>
                            </div>
                        </div>
                    </div>

                    <div class="games-back-wrap">
                        <button class="console-btn console-btn-secondary console-btn-full" @click="closeGame">返回游戏大厅</button>
                    </div>
                    </div>

                    <div class="card games-chat-card">
                        <div class="card-title">和 {{ getGameAiName() }} 聊聊</div>
                        <div class="games-chat-list">
                            <div v-if="chatMessages.length === 0" class="games-chat-empty">还没有对话，先聊一句试试。</div>
                            <div v-if="isGameAiTyping" class="games-chat-msg"> {{ getGameAiName() }}：正在思考中...</div>
                            <div
                                v-for="(msg, idx) in chatMessages"
                                :key="idx"
                                class="games-chat-msg"
                                :class="{ 'from-player': msg.type === 'player', 'from-system': msg.type === 'system' }"
                            >
                                <strong>{{ msg.sender }}：</strong>{{ msg.content }}
                            </div>
                        </div>
                        <div class="games-chat-input-row">
                            <input name="sp_field_159" id="sp-field-159"
                                v-model="playerMessage"
                                @keyup.enter="sendMessage"
                                type="text"
                                class="lock-wallpaper-input"
                                :disabled="isGameAiTyping"
                                placeholder="输入你想对搭子说的话"
                            >
                            <button class="console-btn console-btn-primary games-send-btn" :disabled="isGameAiTyping" @click="sendMessage">发送</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

</template>

<script>
import { inject } from 'vue';

export default {
    name: 'GamesApp',
    setup() {
        return inject('globalState');
    }
}
</script>
