// =========================================================================
// == GAMES APP
// =========================================================================
import { ref, reactive } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

export function useGames() {
    const games = [
        {
            id: 'werewolf',
            name: '狼人杀',
            description: '多人参与的推理游戏，玩家需要通过发言和投票找出狼人',
            icon: 'fas fa-user-secret',
            status: 'available',
            players: '4-18人',
            duration: '15-30分钟',
            rules: '狼人杀是一款多人参与的推理游戏，玩家分为狼人、平民和神民三个阵营。游戏分为夜晚和白天两个阶段，夜晚狼人可以杀人，神民可以使用技能，白天所有玩家通过发言和投票找出狼人并放逐。',
            roles: [
                { name: '狼人', description: '夜晚可以选择一名玩家杀害', count: 2 },
                { name: '平民', description: '没有特殊技能，通过推理找出狼人', count: 2 },
                { name: '预言家', description: '夜晚可以查验一名玩家的身份', count: 1 },
                { name: '女巫', description: '拥有一瓶解药和一瓶毒药，可以救人或杀人', count: 1 },
                { name: '猎人', description: '被狼人杀害或被放逐时可以开枪带走一名玩家', count: 1 }
            ]
        },
        {
            id: 'undercover',
            name: '谁是卧底',
            description: '多人参与的文字推理游戏，通过描述找出卧底',
            icon: 'fas fa-user-ninja',
            status: 'available',
            players: '4-10人',
            duration: '10-20分钟',
            rules: '谁是卧底是一款文字推理游戏，玩家会收到一个词语，其中大部分玩家收到的是相同的词语，只有一名玩家收到的是不同的词语（卧底）。玩家轮流描述自己的词语，然后投票找出卧底。',
            wordPairs: [
                { normal: '苹果', undercover: '梨' },
                { normal: '电脑', undercover: '手机' },
                { normal: '猫', undercover: '狗' },
                { normal: '篮球', undercover: '足球' },
                { normal: '牛奶', undercover: '豆浆' }
            ]
        },
        {
            id: 'script',
            name: '剧本杀',
            description: '基于剧本的角色扮演推理游戏，通过线索找出凶手',
            icon: 'fas fa-book',
            status: 'available',
            players: '5-8人',
            duration: '60-120分钟',
            rules: '剧本杀是一款基于剧本的角色扮演推理游戏，玩家扮演剧本中的角色，通过阅读剧本、收集线索、讨论推理，找出真凶。每个角色都有自己的背景故事和秘密。',
            scripts: [
                {
                    id: 'script1',
                    name: '豪门夜宴',
                    description: '一场豪门盛宴，主人离奇死亡，谁是凶手？',
                    characters: [
                        { name: '大少爷', description: '家族继承人，性格傲慢' },
                        { name: '二小姐', description: '家族千金，聪明伶俐' },
                        { name: '管家', description: '服务家族多年，忠诚可靠' },
                        { name: '厨师', description: '新来的厨师，手艺精湛' },
                        { name: '女佣', description: '年轻漂亮，举止可疑' }
                    ]
                },
                {
                    id: 'script2',
                    name: '校园谜案',
                    description: '校园里发生了一起神秘事件，真相究竟是什么？',
                    characters: [
                        { name: '班长', description: '成绩优异，深受老师喜爱' },
                        { name: '转学生', description: '神秘的新同学，来历不明' },
                        { name: '体育委员', description: '阳光开朗，运动健将' },
                        { name: '学习委员', description: '沉默寡言，专注学习' },
                        { name: '老师', description: '年轻有为，教学有方' }
                    ]
                }
            ]
        },
        {
            id: 'uno',
            name: 'UNO',
            description: '经典卡牌游戏，通过策略出完手中的牌',
            icon: 'fas fa-cards',
            status: 'available',
            players: '2-10人',
            duration: '10-30分钟',
            rules: 'UNO是一款经典的卡牌游戏，玩家需要将手中的牌按照颜色或数字与出牌堆上的牌匹配。当玩家只剩一张牌时，必须喊"UNO"。先出完所有牌的玩家获胜。'
        },
        {
            id: 'rock-paper-scissors',
            name: '石头剪刀布',
            description: '经典的手势对战游戏，简单易上手',
            icon: 'fas fa-hand-rock',
            status: 'available',
            players: '2人',
            duration: '1-5分钟',
            rules: '石头剪刀布是一种简单的手势游戏，玩家同时出示手势：石头（握紧拳头）、剪刀（伸出食指和中指）或布（张开手掌）。石头胜剪刀，剪刀胜布，布胜石头。'
        },
        {
            id: 'truth-or-dare',
            name: '真心话大冒险',
            description: '通过转盘选择真心话或大冒险',
            icon: 'fas fa-spinner',
            status: 'available',
            players: '2-10人',
            duration: '10-30分钟',
            rules: '真心话大冒险是一种社交游戏，玩家通过转盘选择真心话或大冒险。选择真心话的玩家必须诚实回答问题，选择大冒险的玩家必须完成指定的挑战。',
            truths: [
                '说出你最尴尬的一件事',
                '你最喜欢的人是谁？',
                '你做过最疯狂的事是什么？',
                '你有什么秘密一直没告诉别人？',
                '你最害怕什么？'
            ],
            dares: [
                '学动物叫',
                '唱一首歌',
                '给好朋友打电话',
                '做10个俯卧撑',
                '模仿一个名人'
            ]
        },
        {
            id: 'ludo',
            name: '飞行棋',
            description: '经典的骰子移动游戏，先将所有飞机飞到终点',
            icon: 'fas fa-plane',
            status: 'available',
            players: '2-4人',
            duration: '15-30分钟',
            rules: '飞行棋是一种经典的骰子移动游戏，玩家通过掷骰子移动飞机。当掷出6时，可以起飞一架飞机。飞机需要绕棋盘一周后进入终点。先将所有飞机飞到终点的玩家获胜。'
        },
        {
            id: 'mahjong',
            name: '麻将',
            description: '经典中国麻将游戏，通过组合牌型获胜',
            icon: 'fas fa-tiles',
            status: 'coming_soon',
            players: '4人',
            duration: '30-60分钟'
        },
        {
            id: 'poker',
            name: '扑克',
            description: '多种扑克游戏玩法，包括德州扑克、斗地主等',
            icon: 'fas fa-playing-card',
            status: 'coming_soon',
            players: '2-10人',
            duration: '10-60分钟'
        }
    ];

    const currentGame = ref(null);
    const gameState = reactive({
        phase: 'lobby', // lobby, game, end
        players: [],
        currentPlayer: 0,
        day: 1,
        votes: {},
        deadPlayers: [],
        // 石头剪刀布
        rpsPlayerChoice: null,
        rpsAIChoice: null,
        rpsResult: null,
        rpsScore: { player: 0, ai: 0 },
        // 真心话大冒险
        truthOrDare: null, // truth, dare
        currentTruth: null,
        currentDare: null,
        // UNO
        unoDeck: [],
        discardPile: [],
        playerHand: [],
        aiHands: [],
        currentColor: null,
        // 飞行棋
        ludoBoard: [],
        ludoPlayers: [],
        currentDice: 0
    });

    const startGame = (gameId) => {
        const game = games.find(g => g.id === gameId);
        if (game && game.status === 'available') {
            currentGame.value = game;
            Object.assign(gameState, {
                phase: 'lobby',
                players: [],
                currentPlayer: 0,
                day: 1,
                votes: {},
                deadPlayers: [],
                // 石头剪刀布
                rpsPlayerChoice: null,
                rpsAIChoice: null,
                rpsResult: null,
                rpsScore: { player: 0, ai: 0 },
                // 真心话大冒险
                truthOrDare: null,
                currentTruth: null,
                currentDare: null,
                // UNO
                unoDeck: [],
                discardPile: [],
                playerHand: [],
                aiHands: [],
                currentColor: null,
                // 飞行棋
                ludoBoard: [],
                ludoPlayers: [],
                currentDice: 0
            });
            return game;
        }
        return null;
    };

    const joinGame = (playerName) => {
        if (currentGame.value && gameState.phase === 'lobby') {
            gameState.players.push({
                name: playerName,
                role: null,
                isAlive: true,
                vote: null
            });
            return true;
        }
        return false;
    };

    const startGameSession = () => {
        if (currentGame.value && gameState.phase === 'lobby' && gameState.players.length >= 4) {
            gameState.phase = 'game';
            assignRoles();
            return true;
        }
        return false;
    };

    const assignRoles = () => {
        if (currentGame.value && currentGame.value.id === 'werewolf') {
            // 简单的角色分配逻辑
            const roles = [];
            const roleConfig = currentGame.value.roles;
            
            roleConfig.forEach(role => {
                for (let i = 0; i < role.count; i++) {
                    roles.push(role.name);
                }
            });
            
            // 随机分配角色
            roles.sort(() => Math.random() - 0.5);
            
            gameState.players.forEach((player, index) => {
                player.role = roles[index] || '平民';
            });
        }
    };

    const castVote = (voterName, targetName) => {
        if (currentGame.value && gameState.phase === 'game') {
            const voter = gameState.players.find(p => p.name === voterName);
            if (voter && voter.isAlive) {
                voter.vote = targetName;
                gameState.votes[voterName] = targetName;
                return true;
            }
        }
        return false;
    };

    const getVoteResults = () => {
        const voteCounts = {};
        Object.values(gameState.votes).forEach(vote => {
            voteCounts[vote] = (voteCounts[vote] || 0) + 1;
        });
        
        let maxVotes = 0;
        let mostVoted = null;
        
        Object.entries(voteCounts).forEach(([player, count]) => {
            if (count > maxVotes) {
                maxVotes = count;
                mostVoted = player;
            }
        });
        
        return { mostVoted, maxVotes, voteCounts };
    };

    const endDay = () => {
        if (currentGame.value && gameState.phase === 'game') {
            const results = getVoteResults();
            if (results.mostVoted) {
                const player = gameState.players.find(p => p.name === results.mostVoted);
                if (player) {
                    player.isAlive = false;
                    gameState.deadPlayers.push(player);
                }
            }
            
            gameState.day++;
            gameState.votes = {};
            gameState.players.forEach(player => {
                player.vote = null;
            });
            
            // 检查游戏是否结束
            checkGameEnd();
        }
    };

    const checkGameEnd = () => {
        if (currentGame.value && currentGame.value.id === 'werewolf') {
            const werewolves = gameState.players.filter(p => p.isAlive && p.role === '狼人').length;
            const nonWerewolves = gameState.players.filter(p => p.isAlive && p.role !== '狼人').length;
            
            if (werewolves === 0) {
                gameState.phase = 'end';
                return { winner: '平民和神民' };
            } else if (werewolves >= nonWerewolves) {
                gameState.phase = 'end';
                return { winner: '狼人' };
            }
        }
        return null;
    };

    // 石头剪刀布游戏逻辑
    const playRPS = (playerChoice) => {
        const choices = ['rock', 'paper', 'scissors'];
        const aiChoice = choices[Math.floor(Math.random() * choices.length)];
        
        gameState.rpsPlayerChoice = playerChoice;
        gameState.rpsAIChoice = aiChoice;
        
        let result;
        if (playerChoice === aiChoice) {
            result = '平局';
        } else if (
            (playerChoice === 'rock' && aiChoice === 'scissors') ||
            (playerChoice === 'scissors' && aiChoice === 'paper') ||
            (playerChoice === 'paper' && aiChoice === 'rock')
        ) {
            result = '你赢了';
            gameState.rpsScore.player++;
        } else {
            result = '你输了';
            gameState.rpsScore.ai++;
        }
        
        gameState.rpsResult = result;
        return { playerChoice, aiChoice, result, score: gameState.rpsScore };
    };

    // 真心话大冒险游戏逻辑
    const spinTruthOrDare = () => {
        const options = ['truth', 'dare'];
        const choice = options[Math.floor(Math.random() * options.length)];
        gameState.truthOrDare = choice;
        
        if (choice === 'truth') {
            const truths = currentGame.value.truths;
            gameState.currentTruth = truths[Math.floor(Math.random() * truths.length)];
            gameState.currentDare = null;
        } else {
            const dares = currentGame.value.dares;
            gameState.currentDare = dares[Math.floor(Math.random() * dares.length)];
            gameState.currentTruth = null;
        }
        
        return { choice, truth: gameState.currentTruth, dare: gameState.currentDare };
    };

    // UNO游戏逻辑
    const startUNOGame = () => {
        // 初始化牌组
        const colors = ['red', 'blue', 'green', 'yellow'];
        const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'];
        
        let deck = [];
        colors.forEach(color => {
            values.forEach(value => {
                deck.push({ color, value });
                if (value !== '0') {
                    deck.push({ color, value }); // 每种非0牌有两张
                }
            });
        });
        
        // 添加万能牌
        for (let i = 0; i < 4; i++) {
            deck.push({ color: 'wild', value: 'wild' });
            deck.push({ color: 'wild', value: 'draw4' });
        }
        
        // 洗牌
        deck.sort(() => Math.random() - 0.5);
        
        // 初始化游戏状态
        gameState.unoDeck = deck;
        gameState.discardPile = [deck.pop()];
        gameState.currentColor = gameState.discardPile[0].color;
        
        // 发牌
        gameState.playerHand = [];
        gameState.aiHands = [[], [], []]; // 3个AI玩家
        
        // 玩家发7张牌
        for (let i = 0; i < 7; i++) {
            gameState.playerHand.push(deck.pop());
        }
        
        // AI发7张牌
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 7; j++) {
                gameState.aiHands[i].push(deck.pop());
            }
        }
        
        gameState.phase = 'game';
        return true;
    };

    // 飞行棋游戏逻辑
    const startLudoGame = () => {
        // 初始化游戏板和玩家
        gameState.ludoBoard = [];
        gameState.ludoPlayers = [
            { color: 'red', planes: [0, 0, 0, 0], home: false },
            { color: 'blue', planes: [0, 0, 0, 0], home: false },
            { color: 'green', planes: [0, 0, 0, 0], home: false },
            { color: 'yellow', planes: [0, 0, 0, 0], home: false }
        ];
        
        gameState.phase = 'game';
        return true;
    };

    // 掷骰子
    const rollDice = () => {
        const dice = Math.floor(Math.random() * 6) + 1;
        gameState.currentDice = dice;
        return dice;
    };

    return {
        games,
        currentGame,
        gameState,
        startGame,
        joinGame,
        startGameSession,
        castVote,
        getVoteResults,
        endDay,
        checkGameEnd,
        // 新游戏函数
        playRPS,
        spinTruthOrDare,
        startUNOGame,
        startLudoGame,
        rollDice
    };
}
