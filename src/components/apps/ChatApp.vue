<template>
<div class="chat-app-wrapper">
<!-- Chat App -->
        <div  class="app-view">
            <div class="app-header">
                <button class="back-btn" @click="goBackInSoulLink"><i class="fas fa-chevron-left"></i></button>
                <div class="header-center">
                    <span v-if="soulLinkActiveChatType !== 'group'" class="app-title" @click="shakeCharacter" style="cursor: pointer;">{{ soulLinkActiveChat ? (isAiTyping ? 'TYPING...' : currentChatName) : '聊天' }}</span>
                    <span v-else class="app-title" @click="showRenameGroupDialog = true" style="cursor: pointer;">{{ soulLinkActiveChat ? (isAiTyping ? 'TYPING...' : currentChatName) : '聊天' }}</span>
                    <div v-if="soulLinkActiveChatType === 'group' && activeGroupChat" class="group-members-bar">
                        <div class="group-member-avatar" v-for="(member, index) in activeGroupChat.members.slice(0, 5)" :key="index" @click="shakeGroupMember(member, index)">
                            <img :src="member.avatarUrl || 'https://placehold.co/100x100?text=No+Avatar'" :style="{ marginLeft: index > 0 ? '-8px' : '0' }">
                        </div>
                        <span v-if="activeGroupChat.members.length > 5" class="group-member-count">+{{ activeGroupChat.members.length - 5 }}</span>
                    </div>
                </div>
                <div class="header-icons">
                    <i v-if="soulLinkActiveChat" class="fas fa-phone-alt" @click="startVoiceCall"></i>
                    <i v-if="soulLinkActiveChat" class="fas fa-video" @click="startVideoCall"></i>

                    <i v-if="soulLinkActiveChat" class="fas fa-ellipsis-h" @click="toggleChatSettings"></i>
                </div>
            </div>

            <!-- 未聊天时显示列表 -->
            <div v-if="!soulLinkActiveChat" class="app-content" style="display: flex; flex-direction: column; height: 100%;">
                <!-- 标签筛选栏 (仅在单聊列表显示) -->
                <div v-if="soulLinkTab === 'msg' && chatTags.length > 0" class="chat-tag-filter" style="padding: 8px 16px; overflow-x: auto; white-space: nowrap; display: flex; gap: 8px; flex-shrink: 0; background: #fff; border-bottom: 1px solid #f0f0f0;">
                    <span :class="['tag', { 'active': activeChatTag === '' }]" @click="activeChatTag = ''" style="cursor:pointer; padding: 4px 12px; border-radius: 12px; font-size: 12px; background: #f0f0f0; color: #333;">全部</span>
                    <span v-for="tag in chatTags" :key="tag" :class="['tag', { 'active': activeChatTag === tag }]" @click="activeChatTag = tag" :style="{ cursor:'pointer', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', background: activeChatTag === tag ? '#000' : '#f0f0f0', color: activeChatTag === tag ? '#fff' : '#333' }">{{ tag }}</span>
                </div>

                <!-- 角色列表 -->
                <div v-if="soulLinkTab === 'msg'" class="wechat-list" style="flex: 1; overflow-y: auto; padding-bottom: 80px;">
                    <div v-for="char in displayChatCharacters" :key="char?.id || char?.name" :class="['wechat-item', { 'pinned': char.isPinned }]" @click="startSoulLinkChat(char?.id)" @contextmenu.prevent="togglePin(char?.id, false)">
                        <img :src="char.avatarUrl || char.avatar || char.image || char.icon || char.coverUrl || 'https://placehold.co/100x100?text=Avatar'" class="wechat-avatar">
                        <div class="wechat-info">
                            <div class="wechat-name-row">
                                <span class="wechat-name">
                                    <i v-if="char.isPinned" class="fas fa-thumbtack" style="font-size: 10px; color: #999; margin-right: 4px; transform: rotate(-45deg);"></i>
                                    {{ char.nickname || char.name }}
                                </span>
                                <span class="wechat-time">{{ formatLastMsgTime(char?.id) }}</span>
                            </div>
                            <div class="wechat-last-msg">{{ getLastMessage(char?.id) }}</div>
                        </div>
                        <div v-if="getUnrepliedCountForChar(char?.id) > 0" class="unread-indicator circle-style">
                            <span>{{ formatUnreadCount(getUnrepliedCountForChar(char?.id)) }}</span>
                        </div>
                    </div>
                    <div v-if="displayChatCharacters.length === 0" class="wechat-empty">
                        暂无角色或未找到对应标签的角色
                    </div>
                </div>
                
                <!-- 群聊列表 -->
                <div v-if="soulLinkTab === 'group'" class="wechat-list" style="flex: 1; overflow-y: auto; padding-bottom: 80px;">
                    <div class="wechat-item" @click="showCreateGroupDialog = true" style="border: 2px dashed #CCCCCC; background: #F9F9F9;">
                        <div class="wechat-avatar" style="background: #E5E7EB; display: flex; align-items: center; justify-content: center; font-size: 24px;">
                            <i class="fas fa-plus"></i>
                        </div>
                        <div class="wechat-info">
                            <div class="wechat-name-row">
                                <span class="wechat-name" style="color: #666666;">创建新群聊</span>
                            </div>
                            <div class="wechat-last-msg" style="color: #999999;">点击创建一个新的群聊</div>
                        </div>
                    </div>
                    <div v-for="group in displayChatGroups" :key="group.id" :class="['wechat-item', { 'pinned': group.isPinned }]" @click="openSoulLinkGroupChat(group.id)" @contextmenu.prevent="togglePin(group.id, true)">
                        <img :src="group.avatarUrl || 'https://placehold.co/100x100?text=Group'" class="wechat-avatar" style="object-fit: cover;">
                        <div class="wechat-info">
                            <div class="wechat-name-row">
                                <span class="wechat-name">
                                    <i v-if="group.isPinned" class="fas fa-thumbtack" style="font-size: 10px; color: #999; margin-right: 4px; transform: rotate(-45deg);"></i>
                                    {{ group.name }}
                                </span>
                                <span class="wechat-time">{{ formatLastMsgTime(group.id) }}</span>
                            </div>
                            <div class="wechat-last-msg">{{ getLastMessage(group.id) }}</div>
                        </div>
                        <div v-if="getUnrepliedCountForGroup(group.id) > 0" class="unread-indicator circle-style">
                            <span>{{ formatUnreadCount(getUnrepliedCountForGroup(group.id)) }}</span>
                        </div>
                    </div>
                    <div v-if="displayChatGroups.length === 0" class="wechat-empty" style="margin-top: 80px;">
                        暂无群聊，点击上方创建一个
                    </div>
                </div>
                
                <!-- 标签栏在底部 -->
                <div class="chat-tabs" style="position: absolute; bottom: 0; left: 0; right: 0; z-index: 10;">
                    <div :class="['chat-tab', { 'active': soulLinkTab === 'msg' }]" @click="soulLinkTab = 'msg'">角色</div>
                    <div :class="['chat-tab', { 'active': soulLinkTab === 'group' }]" @click="soulLinkTab = 'group'">群聊</div>
                </div>
            </div>

            <!-- 聊天界面 -->
            <div v-else class="chat-fullscreen" @click.self="closeAllPanels">
                <!-- 装饰元素 -->
                <svg class="chat-twinkle chat-twinkle-1" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill="currentColor"/>
                </svg>
                <svg class="chat-twinkle chat-twinkle-2" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12 L19 12 M12 5 L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <svg class="chat-twinkle chat-twinkle-3" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="3" fill="currentColor"/>
                </svg>

                <!-- 通话界面 -->
                <div v-if="callActive" class="call-fullscreen" :class="{ 'voice-call': callType === 'voice', 'video-call': callType === 'video' }">
                    <!-- 语音通话界面 -->
                    <template v-if="callType === 'voice'">
                        <!-- 顶部信息 -->
                        <div class="call-header">
                            <div class="call-role-name">{{ currentChatName }}</div>
                            <div class="call-status">语音通话中 {{ callTimer }}</div>
                        </div>
                        
                        <!-- 中间头像区域 -->
                        <div class="call-avatar-section">
                            <div v-if="soulLinkActiveChatType !== 'group' || !activeGroupChat" class="call-avatar-wrapper">
                                <!-- 脉冲波纹 -->
                                <div class="pulse-ring pulse-ring-1"></div>
                                <div class="pulse-ring pulse-ring-2"></div>
                                <div class="pulse-ring pulse-ring-3"></div>
                                <!-- 头像 -->
                                <div class="call-avatar-large">
                                    <img :src="currentChatAvatar" alt="avatar">
                                </div>
                            </div>
                            <!-- 群聊多头像 -->
                            <div v-else class="call-group-avatars">
                                <div class="group-call-avatar" v-for="(member, index) in activeGroupChat.members.slice(0, 8)" :key="index">
                                    <img :src="member.avatarUrl || 'https://placehold.co/100x100?text=No+Avatar'">
                                </div>
                                <div v-if="activeGroupChat.members.length > 8" class="group-call-avatar more">
                                    <span>...</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 通话消息列表 -->
                        <div class="call-messages-area" ref="callMessagesContainer">
                            <div v-for="(msg, index) in callMessages" :key="index" class="call-msg" :class="msg.sender">
                                <div v-if="soulLinkActiveChatType === 'group' && msg.sender !== 'user'" class="call-msg-sender-name">
                                    {{ msg.senderName || '成员' }}
                                </div>
                                <div class="call-msg-bubble">{{ msg.text }}</div>
                            </div>
                            <div v-if="isCallAiTyping" class="call-msg ai">
                                <div class="call-msg-bubble typing">
                                    <div class="typing-dots">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 底部输入和控制区域 -->
                        <div class="call-bottom-area">
                            <!-- 文字输入框 -->
                            <div class="call-text-input-bar">
                                <input name="sp_field_2" id="sp-field-2" type="text" v-model="callInputText" @keyup.enter="sendCallText" placeholder="输入消息...">
                                <button class="call-send-btn" @click="sendCallText">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>
                            
                            <!-- 控制按钮 -->
                            <div class="call-controls-bar">
                                <button class="call-ctrl-btn" :class="{ 'active': isSpeakerOn }" @click="toggleSpeaker">
                                    <i class="fas" :class="isSpeakerOn ? 'fa-volume-up' : 'fa-volume-down'"></i>
                                    <span>扬声器</span>
                                </button>
                                <button class="call-ctrl-btn end-call" @click="endCall">
                                    <i class="fas fa-phone-slash"></i>
                                    <span>挂断</span>
                                </button>
                            </div>
                        </div>
                    </template>

                    <!-- 视频通话界面 - Magazine Poster Style -->
                    <template v-if="callType === 'video'">
                        <!-- 装饰元素 -->
                        <svg class="video-decoration video-deco-1" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill="currentColor"/>
                        </svg>
                        <svg class="video-decoration video-deco-2" viewBox="0 0 24 24" fill="none">
                            <path d="M5 12 L19 12 M12 5 L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        
                        <!-- 小窗口 - 自己/对方 (可拖拽，全屏定位，点击可交换) -->
                        <div class="video-magazine-self" 
                             :class="{ 'swapped': isVideoAvatarSwapped }"
                             :style="{ top: videoSelfPosition.y + 'px', left: videoSelfPosition.x + 'px' }"
                             @mousedown="startDragVideoSelf"
                             @touchstart="startDragVideoSelf"
                             @click="swapVideoAvatars">
                            <div class="video-self-frame">
                                <img v-if="isVideoAvatarSwapped" :src="currentChatAvatar" alt="avatar" class="video-self-avatar">
                                <img v-else-if="userAvatar" :src="userAvatar" alt="avatar" class="video-self-avatar">
                                <i v-else class="fas fa-user"></i>
                            </div>
                            <div class="drag-hint">⋮⋮</div>
                            <div class="swap-hint">点击交换</div>
                        </div>
                        
                        <!-- 杂志海报布局 -->
                        <div class="video-magazine-layout">
                            <!-- 顶部标题区 -->
                            <div class="video-magazine-header">
                                <div class="video-magazine-title">{{ currentChatName }}</div>
                                <div class="video-magazine-subtitle">VIDEO CALL</div>
                                <div class="video-magazine-timer">{{ callTimer }}</div>
                            </div>
                            
                            <!-- 主视觉区 - 大头像 (点击可交换) -->
                            <div v-if="soulLinkActiveChatType !== 'group' || !activeGroupChat" class="video-magazine-visual" @click="swapVideoAvatars">
                                <div class="video-magazine-frame">
                                    <img v-if="!isVideoAvatarSwapped" :src="currentChatAvatar" alt="avatar" class="video-magazine-avatar">
                                    <img v-else-if="userAvatar" :src="userAvatar" alt="avatar" class="video-magazine-avatar">
                                    <div v-else class="video-magazine-avatar video-self-large">
                                        <i class="fas fa-user"></i>
                                    </div>
                                    <div class="video-magazine-border"></div>
                                </div>
                                <div class="video-magazine-caption">
                                    <span class="caption-line"></span>
                                    <span class="caption-text">LIVE</span>
                                    <span class="caption-line"></span>
                                </div>
                                <div class="swap-hint-main">点击交换位置</div>
                            </div>
                            <!-- 群聊多头像 -->
                            <div v-else class="video-magazine-visual group-visual">
                                <div class="call-group-avatars">
                                    <div class="group-call-avatar" v-for="(member, index) in activeGroupChat.members.slice(0, 8)" :key="index">
                                        <img :src="member.avatarUrl || 'https://placehold.co/100x100?text=No+Avatar'">
                                    </div>
                                    <div v-if="activeGroupChat.members.length > 8" class="group-call-avatar more">
                                        <span>...</span>
                                    </div>
                                </div>
                                <div class="video-magazine-caption">
                                    <span class="caption-line"></span>
                                    <span class="caption-text">GROUP CALL</span>
                                    <span class="caption-line"></span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 视频通话消息区域 -->
                        <div class="video-call-messages" ref="videoCallMessagesContainer">
                            <div v-for="(msg, index) in callMessages" :key="index" class="video-call-msg" :class="msg.sender">
                                <div v-if="soulLinkActiveChatType === 'group' && msg.sender !== 'user'" class="video-call-msg-sender-name">
                                    {{ msg.senderName || '成员' }}
                                </div>
                                <div class="video-call-msg-bubble">{{ msg.text }}</div>
                            </div>
                            <div v-if="isCallAiTyping" class="video-call-msg ai">
                                <div class="video-call-msg-bubble typing">
                                    <div class="typing-dots">
                                        <span></span><span></span><span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 底部控制区 - 极简风格 + 输入框 -->
                        <div class="video-magazine-bottom">
                            <!-- 文字输入框 -->
                            <div class="video-call-input-bar">
                                <input name="sp_field_3" id="sp-field-3" type="text" v-model="callInputText" @keyup.enter="sendCallText" placeholder="输入消息...">
                                <button class="video-call-send-btn" @click="sendCallText">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>
                            
                            <!-- 控制按钮 -->
                            <div class="video-magazine-controls">
                                <button class="video-mag-btn" :class="{ 'active': isMuted }" @click="toggleMute">
                                    <i class="fas" :class="isMuted ? 'fa-microphone-slash' : 'fa-microphone'"></i>
                                </button>
                                <button class="video-mag-btn end" @click="endCall">
                                    <i class="fas fa-phone-slash"></i>
                                </button>
                                <button class="video-mag-btn" :class="{ 'active': isCameraOn }" @click="toggleCamera">
                                    <i class="fas" :class="isCameraOn ? 'fa-video' : 'fa-video-slash'"></i>
                                </button>
                            </div>
                        </div>
                    </template>
                </div>

                <!-- 普通聊天 -->
                <template v-else>
                    <div class="wechat-messages" :class="{ 'novel-mode': isOfflineMode, 'group-chat': soulLinkActiveChatType === 'group' }" :style="chatBackgroundInlineStyle" ref="chatMessagesContainer" @click="onChatBackgroundClick">
                        <template v-for="(msg, index) in currentChatMessages" :key="index">
                        <div v-if="!isOfflineMode && chatSettings.timeSenseEnabled && shouldShowTimeDivider(index) && msg.timestamp" class="message-time system-time-divider">
                            {{ formatTime(msg.timestamp, chatSettings.messageTimeNow) }}
                        </div>
                        <div class="message" :class="[msg.sender, { 'novel-message': isOfflineMode, 'call-message': msg.isCallMessage, 'special-card-message': msg.messageType === 'location' || msg.messageType === 'transfer' || msg.messageType === 'textImage' || msg.messageType === 'image' || msg.messageType === 'takeaway' || msg.messageType === 'tarot' || msg.messageType === 'pet' || msg.messageType === 'vote' || msg.messageType === 'order' || msg.messageType === 'helpBuy' || msg.messageType === 'share' || msg.messageType === 'voice' || msg.messageType === 'sticker', 'group-message': soulLinkActiveChatType === 'group', 'system-message': msg.isSystem }]" @contextmenu="onMessageContextMenu($event, msg)" @touchstart="onMessageTouchStart($event, msg)" @touchmove="onMessageTouchMove" @touchend="onMessageTouchEnd" @click.stop>

                            <div class="message-content-wrapper">
                                <div v-if="isOfflineMode" class="novel-text">
                                    <div v-if="soulLinkActiveChatType === 'group' && msg.senderName && !msg.isSystem" class="group-sender-name novel-sender">{{ msg.senderName }}</div>
                                    <div v-if="msg.isCallMessage" class="novel-call-note">{{ msg.text }}</div>
                                    <div v-else-if="msg.messageType === 'image'" class="novel-paragraph">
                                        {{ (msg.sender === 'user' ? '我' : (msg.senderName || currentChatName)) }}发来一张照片，照片里{{ msg.text || '有着说不清的情绪。' }}
                                    </div>
                                    <div v-else-if="msg.messageType === 'location'" class="novel-paragraph">
                                        {{ (msg.sender === 'user' ? '我' : (msg.senderName || currentChatName)) }}轻轻分享了位置，仿佛在说：{{ msg.userLocation || msg.aiLocation || '我们离彼此并不远。' }}
                                    </div>
                                    <div v-else-if="msg.messageType === 'voice'" class="novel-paragraph">
                                        {{ (msg.sender === 'user' ? '我' : (msg.senderName || currentChatName)) }}发来一段语音，声音里藏着{{ msg.transcription || msg.voiceText || msg.text || '未说出口的心事。' }}
                                    </div>
                                    <div v-else-if="msg.messageType === 'sticker'" class="novel-paragraph">
                                        {{ (msg.sender === 'user' ? '我' : (msg.senderName || currentChatName)) }}发来一枚表情，像是一个没说完的动作与神情。
                                    </div>
                                    <div v-else-if="msg.messageType === 'transfer'" class="novel-paragraph">
                                        {{ (msg.sender === 'user' ? '我' : (msg.senderName || currentChatName)) }}递出一笔转账，金额为 {{ msg.transferAmount || msg.amount || '0.00' }} 元，像一场安静的心意。
                                    </div>
                                    <div v-else-if="msg.messageType === 'takeaway'" class="novel-paragraph">
                                        {{ (msg.sender === 'user' ? '我' : (msg.senderName || currentChatName)) }}点了一份外卖，{{ msg.restaurant }}的{{ msg.food }}很快就会送到，餐桌前的期待也跟着升温。
                                    </div>
                                    <div v-else-if="msg.messageType === 'tarot'" class="novel-paragraph">
                                        {{ (msg.sender === 'user' ? '我' : (msg.senderName || currentChatName)) }}翻开了塔罗牌，牌面写着{{ msg.cardName }}，{{ msg.cardMeaning }}。
                                    </div>
                                    <div v-else-if="msg.messageType === 'pet'" class="novel-paragraph">
                                        {{ (msg.sender === 'user' ? '我' : (msg.senderName || currentChatName)) }}带着小宠物{{ msg.action }}，它的心情仿佛也跟着{{ msg.mood }}%地起伏。
                                    </div>
                                    <div v-else-if="msg.messageType === 'vote'" class="novel-paragraph">
                                        {{ (msg.sender === 'user' ? '我' : (msg.senderName || currentChatName)) }}抛出了一个问题：{{ msg.question }}。
                                    </div>
                                    <div v-else-if="msg.messageType === 'order'" class="novel-paragraph">
                                        {{ (msg.sender === 'user' ? '我' : (msg.senderName || currentChatName)) }}下单了 {{ msg.platform }} 上的 {{ msg.item }}，{{ msg.status }}，预计 {{ msg.eta }}。
                                    </div>
                                    <div v-else-if="msg.messageType === 'helpBuy'" class="novel-paragraph">
                                        {{ (msg.sender === 'user' ? '我' : (msg.senderName || currentChatName)) }}发出帮买请求，想要 {{ msg.item }}，价格是 {{ msg.price }}。
                                    </div>
                                    <div v-else-if="msg.messageType === 'share'" class="novel-paragraph">
                                        {{ (msg.sender === 'user' ? '我' : (msg.senderName || currentChatName)) }}分享了 {{ msg.source }} 的内容：{{ msg.content }}。
                                    </div>
                                    <div v-else-if="msg.messageType === 'friendRequest'" class="novel-paragraph">
                                        {{ (msg.sender === 'user' ? '我' : (msg.senderName || currentChatName)) }}发出了一条好友申请。
                                    </div>
                                    <div v-else class="novel-paragraph">
                                        {{ msg.sender === 'user' ? '我' : (msg.senderName || currentChatName) }}：{{ msg.text }}
                                    </div>
                                    <div v-if="chatSettings.soulLinkForeignTranslationEnabled && msg.replyTranslation" class="reply-translation">
                                        <div class="translation-divider"></div>
                                        <div class="translation-text">{{ msg.replyTranslation }}</div>
                                    </div>
                                </div>
                                <div v-else>
                                    <div v-if="soulLinkActiveChatType === 'group' && msg.senderName && !msg.isSystem" class="group-sender-name">{{ msg.senderName }}</div>
                                    <div v-if="msg.isCallMessage || msg.messageType || (msg.text && msg.text.trim()) || msg.replyTo" class="bubble">
                                        <div v-if="msg.replyTo" class="reply-quote">
                                            <div class="reply-quote-content">
                                                <div class="reply-quote-sender">{{ msg.replyTo.sender === 'user' ? '我' : (msg.replyTo.senderName || currentChatName) }}</div>
                                                <div class="reply-quote-text">
                                                    <template v-if="msg.replyTo.messageType === 'image'">
                                                        <img :src="msg.replyTo.imageUrl" style="max-height: 80px; max-width: 120px; border-radius: 6px; object-fit: cover; margin-top: 4px;">
                                                    </template>
                                                    <template v-else>
                                                        {{ msg.replyTo.text }}
                                                    </template>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-if="msg.isCallMessage" class="call-content" :class="{ 'clickable': !!msg.callDiaryId }" @click.stop="openCallDiary(msg)">
                                            <span class="call-icon" :class="msg.callType === 'video' ? 'video' : 'voice'"></span>
                                            <div class="wander-text">{{ msg.text }}</div>
                                            <small v-if="msg.callDiaryHint" class="call-diary-hint">{{ msg.callDiaryHint }}</small>
                                        </div>
                                        <div v-else-if="msg.messageType === 'image'" class="special-card polaroid-card">
                                            <div class="polaroid-frame">
                                                <img v-if="msg.imageUrl" :src="msg.imageUrl" class="chat-image" @click="openChatImageViewer(msg)" style="cursor: pointer;">
                                                <div v-else class="polaroid-text">{{ msg.text || '一张照片' }}</div>
                                            </div>
                                            <div class="polaroid-bottom">
                                                <span class="polaroid-date">{{ formatMessageDate(msg.timestamp) }}</span>
                                            </div>
                                        </div>
                                        <div v-else-if="msg.messageType === 'location'" class="special-card location-card">
                                            <div class="location-card-postmark"></div>
                                            <div class="location-card-map">
                                                <svg class="map-preview" viewBox="0 0 200 100" fill="none">
                                                    <path d="M20 80 L60 30 L100 60 L140 20 L180 70" stroke="#000000" stroke-width="2" fill="none"/>
                                                    <circle cx="100" cy="60" r="8" fill="none" stroke="#000000" stroke-width="2"/>
                                                    <path d="M100 50 L100 70 M90 60 L110 60" stroke="#000000" stroke-width="2"/>
                                                </svg>
                                                <div class="location-star">★</div>
                                            </div>
                                            <div class="location-card-info">
                                                <div v-if="msg.userLocation" class="location-card-item">
                                                    <span class="location-card-label">我</span>
                                                    <span class="location-card-value">{{ msg.userLocation }}</span>
                                                </div>
                                                <div v-if="msg.aiLocation" class="location-card-item">
                                                    <span class="location-card-label">TA</span>
                                                    <span class="location-card-value">{{ msg.aiLocation }}</span>
                                                </div>
                                                <div v-if="msg.distance" class="location-card-item distance">
                                                    <span class="location-card-label">相距</span>
                                                    <span class="location-card-value">{{ msg.distance }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-else-if="msg.messageType === 'transfer'" class="special-card transfer-card">
                                            <div class="transfer-card-label">TRANSFER</div>
                                            <div class="transfer-card-amount">¥ {{ msg.transferAmount || msg.amount || '0.00' }}</div>
                                            <svg class="transfer-card-coin" viewBox="0 0 40 40" fill="none">
                                                <circle cx="20" cy="20" r="18" stroke="#000000" stroke-width="2" fill="none"/>
                                                <circle cx="20" cy="20" r="12" stroke="#000000" stroke-width="1.5" fill="none"/>
                                                <text x="20" y="26" text-anchor="middle" font-family="Playfair Display, serif" font-size="16" font-weight="700" fill="#000000">$</text>
                                            </svg>
                                            <div class="transfer-card-hint">Click to collect</div>
                                        </div>
                                        <div v-else-if="msg.messageType === 'textImage'" class="special-card polaroid-card">
                                            <div class="polaroid-frame">
                                                <div class="polaroid-text">{{ msg.textImageText }}</div>
                                            </div>
                                            <div class="polaroid-bottom">
                                                <span class="polaroid-date">{{ formatMessageDate(msg.timestamp) }}</span>
                                            </div>
                                        </div>
                                        <div v-else-if="msg.messageType === 'takeaway'" class="special-card takeaway-card">
                                            <div class="takeaway-header">
                                                <i class="fas fa-bowl-food"></i>
                                                <span>外卖</span>
                                            </div>
                                            <div class="takeaway-content">
                                                <div class="takeaway-restaurant">{{ msg.restaurant }}</div>
                                                <div class="takeaway-food">{{ msg.food }}</div>
                                                <div class="takeaway-price">¥{{ msg.price }}</div>
                                            </div>
                                        </div>
                                        <div v-else-if="msg.messageType === 'tarot'" class="special-card tarot-card">
                                            <div class="tarot-emoji">{{ msg.emoji }}</div>
                                            <div class="tarot-info">
                                                <div class="tarot-name">{{ msg.cardName }}{{ msg.isReversed ? '（逆位）' : '' }}</div>
                                                <div class="tarot-meaning">{{ msg.cardMeaning }}</div>
                                            </div>
                                        </div>
                                        <div v-else-if="msg.messageType === 'pet'" class="special-card pet-card">
                                            <div class="pet-header">
                                                <i class="fas fa-paw"></i>
                                                <span>{{ msg.petName }}</span>
                                            </div>
                                            <div class="pet-action">{{ msg.action }} {{ msg.emoji }}</div>
                                            <div class="pet-stats">
                                                <div class="pet-stat">
                                                    <i class="fas fa-heart"></i>
                                                    <span>心情: {{ msg.mood }}%</span>
                                                </div>
                                                <div class="pet-stat">
                                                    <i class="fas fa-drumstick-bite"></i>
                                                    <span>饱食: {{ msg.hunger }}%</span>
                                                </div>
                                                <div class="pet-stat">
                                                    <i class="fas fa-star"></i>
                                                    <span>Lv.{{ msg.level }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-else-if="msg.messageType === 'vote'" class="special-card vote-card">
                                            <div class="vote-question">{{ msg.question }}</div>
                                            <div class="vote-options">
                                                <div v-for="(opt, optIndex) in msg.options" :key="optIndex" class="vote-option" :class="{ 'voted': msg.hasVoted }" @click="!msg.hasVoted && castVoteInChat(msg.id, optIndex)">
                                                    <div class="vote-option-text">{{ opt.text }}</div>
                                                    <div v-if="msg.hasVoted" class="vote-option-bar" :style="{ width: (opt.votes / msg.totalVotes * 100) + '%' }"></div>
                                                    <div v-if="msg.hasVoted" class="vote-option-count">{{ opt.votes }}票</div>
                                                </div>
                                            </div>
                                            <div v-if="msg.hasVoted" class="vote-total">共 {{ msg.totalVotes }} 票</div>
                                        </div>
                                        <div v-else-if="msg.messageType === 'order'" class="special-card order-card">
                                            <div class="order-header">
                                                <i class="fas fa-receipt"></i>
                                                <span>{{ msg.platform }}</span>
                                            </div>
                                            <div class="order-item">{{ msg.item }}</div>
                                            <div class="order-price">{{ msg.price }}</div>
                                            <div class="order-status" :class="msg.status">
                                                <span class="status-dot"></span>
                                                {{ msg.status }}
                                            </div>
                                            <div class="order-eta">预计{{ msg.eta }}</div>
                                        </div>
                                        <div v-else-if="msg.messageType === 'helpBuy'" class="special-card help-buy-card" :class="{ 'purchased': msg.isPurchased, 'clickable': msg.sender === 'ai' && !msg.isPurchased }" @click="msg.sender === 'ai' && !msg.isPurchased && confirmHelpBuy(msg)">
                                            <div class="help-buy-header">
                                                <i class="fas fa-hand-holding-heart"></i>
                                                <span>{{ msg.isPurchased ? '已购买' : (msg.sender === 'ai' ? '请帮我买' : '帮买请求') }}</span>
                                            </div>
                                            <div class="help-buy-item">{{ msg.item }}</div>
                                            <div class="help-buy-price">{{ msg.price }}</div>
                                            <div v-if="msg.isPurchased" class="help-buy-thanks">
                                                <i class="fas fa-check-circle"></i> {{ msg.sender === 'ai' ? '谢谢！' : '已帮你买！' }}
                                            </div>
                                            <div v-else class="help-buy-status">
                                                <span class="status-dot pending"></span>
                                                {{ msg.sender === 'ai' ? '点击帮Ta买' : '等待中...' }}
                                            </div>
                                        </div>
                                        <div v-else-if="msg.messageType === 'share'" class="special-card share-card">
                                            <div class="share-header">
                                                <i class="fas fa-share-nodes"></i>
                                                <span>{{ msg.source }}</span>
                                            </div>
                                            <div class="share-content">{{ msg.content }}</div>
                                        </div>
                                        <div v-else-if="msg.messageType === 'friendRequest'" class="special-card share-card">
                                            <div class="share-header">
                                                <i class="fas fa-user-plus"></i>
                                                <span>{{ msg.requestDirection === 'incoming' ? '好友申请' : '申请已发送' }}</span>
                                            </div>
                                            <div class="share-content">{{ msg.text || '好友申请' }}</div>
                                            <div v-if="msg.requestDirection === 'incoming'" style="font-size:12px;color:rgba(0,0,0,.45);margin-top:8px;">历史记录：好友申请功能已下线，可忽略此条。</div>
                                        </div>
                                        <div v-else-if="msg.messageType === 'voice'" class="voice-message-bubble" :class="{ 'playing': msg.isPlaying }" @click="toggleVoicePlayback(msg)">
                                            <div class="voice-waveform">
                                                <span></span><span></span><span></span><span></span><span></span>
                                                <span></span><span></span><span></span><span></span><span></span>
                                            </div>
                                            <span class="voice-length">{{ msg.voiceDuration || 3 }}秒</span>
                                            <div v-if="msg.showTranslation" class="voice-translation">
                                                <div class="translation-label">转文字</div>
                                                <div class="translation-text">{{ msg.transcription || msg.voiceText || msg.text }}</div>
                                                <div v-if="chatSettings.soulLinkForeignTranslationEnabled && msg.voiceTranslation" class="reply-translation">
                                                    <div class="translation-divider"></div>
                                                    <div class="translation-text">{{ msg.voiceTranslation }}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div v-else-if="msg.messageType === 'sticker'" class="sticker-message-wrapper">
                                            <img :src="msg.stickerUrl" :alt="msg.stickerName" class="sticker-image">
                                            <button v-if="msg.sender === 'ai'" class="sticker-counter-btn" @click="counterWithSticker(msg)" title="斗图">怼</button>
                                        </div>
                                        <template v-else>
                                            <div v-if="isOfflineMode" class="message-text" v-html="formatRightnowText(msg.text)"></div>
                                            <div v-else class="message-text">{{ msg.text }}</div>
                                            <div v-if="chatSettings.soulLinkForeignTranslationEnabled && msg.replyTranslation" class="reply-translation">
                                                <div class="translation-divider"></div>
                                                <div class="translation-text">{{ msg.replyTranslation }}</div>
                                            </div>
                                        </template>
                                    </div>
                                </div>
                            </div>
                            <div v-if="!isOfflineMode && !msg.isCallMessage && !msg.isSystem && (msg.text || msg.messageType)" class="message-status" :class="{ 'group-status': soulLinkActiveChatType === 'group' }">
                                <template v-if="msg.sender === 'user'">
                                    <span class="status-check single">✓</span>
                                    <span v-if="msg.isReplied" class="status-check double">✓</span>
                                </template>
                            </div>
                            </div>
                            <div v-if="msg.sender === 'ai' && msg.osContent && !msg.isSystem" 
                                 class="ai-os-container" 
                                 :class="{ focused: focusedOsMessageId === msg.id }"
                                 @click.stop="focusedOsMessageId = focusedOsMessageId === msg.id ? null : msg.id">
                                <div class="os-index">内心：</div>
                                <div class="os-content">{{ msg.osContent }}</div>
                                <div v-if="chatSettings.soulLinkForeignTranslationEnabled && msg.osTranslation" class="os-translation">
                                    <div class="translation-divider"></div>
                                    <div class="translation-text">{{ msg.osTranslation }}</div>
                                </div>
                            </div>
                            <div v-if="!msg.isSystem && msg.isLiked" :class="['message-like', msg.sender]">
                                <svg viewBox="0 0 24 24" fill="#000000" stroke="none">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                            </div>
                        </template>
                        <!-- 流式输出实时气泡（数据已合并进 currentChatMessages 自动复用正常气泡渲染） -->
                        <template v-if="isAiTyping && (!streamingBubbles || streamingBubbles.length === 0)">
                            <div class="message ai" style="pointer-events:none;">
                                <img class="avatar" :src="currentChatAvatar" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;">
                                <div class="message-content-wrapper">
                                    <div class="message-bubble ai" style="padding:10px 14px;">
                                        <div class="typing-dots" style="display:flex;gap:4px;align-items:center;">
                                            <span style="width:6px;height:6px;background:#999;border-radius:50%;animation:typing-bounce 1.4s infinite ease-in-out both;animation-delay:-0.32s;"></span>
                                            <span style="width:6px;height:6px;background:#999;border-radius:50%;animation:typing-bounce 1.4s infinite ease-in-out both;animation-delay:-0.16s;"></span>
                                            <span style="width:6px;height:6px;background:#999;border-radius:50%;animation:typing-bounce 1.4s infinite ease-in-out both;"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>

                    
                    <div class="chat-input-container">
                        <!-- Rightnow Narrations Panel -->
                        <div v-if="isOfflineMode" class="rightnow-symbols-panel" style="display: flex; gap: 8px; padding: 6px 12px; background: transparent; border-bottom: 1px solid rgba(0,0,0,0.05); align-items: center; overflow-x: auto; white-space: nowrap;">
                            <button @click="insertIntoRightnowFn('“', '”')" style="border: 1px solid rgba(0,0,0,0.1); background: rgba(255,255,255,0.7); border-radius: 12px; padding: 4px 12px; font-size: 13px; cursor: pointer; color: #333;">对话 “”</button>
                            <button @click="insertIntoRightnowFn('（', '）')" style="border: 1px solid rgba(0,0,0,0.1); background: rgba(255,255,255,0.7); border-radius: 12px; padding: 4px 12px; font-size: 13px; cursor: pointer; color: #333;">内心 （）</button>
                            <button @click="insertIntoRightnowFn('*', '*')" style="border: 1px solid rgba(0,0,0,0.1); background: rgba(255,255,255,0.7); border-radius: 12px; padding: 4px 12px; font-size: 13px; cursor: pointer; color: #333;">旁白 **</button>
                        </div>
                        <div v-if="editingMessageId" class="editing-indicator">
                            <span>正在编辑消息</span>
                            <i class="fas fa-times" @click="editingMessageId = null; soulLinkInput = ''; soulLinkReplyTarget = null;"></i>
                        </div>
                        <div v-if="soulLinkReplyTarget" class="reply-preview">
                            <div class="reply-preview-content">
                                <div class="reply-preview-sender">{{ soulLinkReplyTarget.sender === 'user' ? '我' : currentChatName }}</div>
                                <div class="reply-preview-text">{{ soulLinkReplyTarget.text }}</div>
                            </div>
                            <i class="fas fa-times" @click="soulLinkReplyTarget = null; soulLinkInput = '';"></i>
                        </div>
                        <div class="wechat-input-row">
                            <button class="action-btn" @click="toggleAttachmentPanel" title="添加">
                                <i class="fas fa-plus"></i>
                            </button>
                            <textarea name="sp_field_4" id="sp-field-4" v-model="soulLinkInput" @keydown.enter.exact="if(!$event.isComposing){ $event.preventDefault(); onSendOrCall(); }" :placeholder="editingMessageId ? '修改消息...' : (isOfflineMode ? '输入消息（线下模式）' : '输入消息...')" style="flex: 1; border: none; background: transparent; outline: none; font-size: 15px; color: #333; resize: none; overflow-y: auto; max-height: 120px; line-height: 1.4; padding: 10px 0; min-height: 20px; box-sizing: border-box;" oninput="this.style.height = 'auto'; this.style.height = (this.scrollHeight) + 'px';"></textarea>
                            <button class="send-btn" @click="onSendOrCall" title="发送">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Sticker Panel -->
                    <div v-if="showEmojiPanel" class="sticker-panel-overlay" @click.self="showEmojiPanel = false">
                        <div class="sticker-panel">
                            <div class="sticker-panel-header">
                                <div class="sticker-tabs-scroll">
                                    <div class="sticker-tabs-wrapper">
                                        <div class="sticker-tab-item" :class="{ active: activeStickerTab === 'favorite' }" @click="activeStickerTab = 'favorite'">
                                            <i class="fas fa-heart"></i>
                                        </div>
                                        <div v-for="pack in stickerPacks" :key="pack.id" 
                                             class="sticker-tab-item" 
                                             :class="{ active: activeStickerTab === pack.id }" 
                                             @click="activeStickerTab = pack.id">
                                            {{ pack.name.slice(0, 4) }}
                                        </div>
                                    </div>
                                </div>
                                <button class="sticker-import-btn" @click="showStickerImportPanel = true">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                            
                            <div class="sticker-content-area">
                                <div v-if="activeStickerTab === 'favorite'" class="sticker-tab-content">
                                    <div v-if="favoriteStickers.length === 0" class="sticker-empty-state small">
                                        <div class="empty-icon-small"><i class="fas fa-heart"></i></div>
                                        <p>长按表情可收藏</p>
                                    </div>
                                    <div v-else class="sticker-grid">
                                        <div v-for="(sticker, idx) in favoriteStickers" :key="'fav-' + idx" 
                                             class="sticker-item" 
                                             @click="sendSticker(sticker)"
                                             @touchstart="onStickerTouchStart($event, sticker)"
                                             @touchend="onStickerTouchEnd"
                                             @contextmenu.prevent="removeFavorite(sticker)">
                                            <img :src="sticker.url" :alt="sticker.name" @error="$event.target.style.display='none'">
                                            <div class="favorite-badge"><i class="fas fa-heart"></i></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div v-for="pack in stickerPacks" :key="pack.id" 
                                     v-show="activeStickerTab === pack.id" 
                                     class="sticker-tab-content">
                                    <div class="sticker-pack-header-inline">
                                        <span class="pack-name">{{ pack.name }}</span>
                                        <button class="delete-pack-btn" @click="deleteStickerPack(pack.id)">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                    <div class="sticker-grid">
                                        <div v-for="(sticker, idx) in pack.stickers" :key="idx" 
                                             class="sticker-item" 
                                             :class="{ 'is-favorite': isFavorite(sticker) }"
                                             @click="sendSticker(sticker)"
                                             @touchstart="onStickerTouchStart($event, sticker)"
                                             @touchend="onStickerTouchEnd"
                                             @contextmenu.prevent="toggleFavorite(sticker)">
                                            <img :src="sticker.url" :alt="sticker.name" @error="$event.target.style.display='none'">
                                            <div v-if="isFavorite(sticker)" class="favorite-badge"><i class="fas fa-heart"></i></div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div v-if="stickerPacks.length === 0 && activeStickerTab !== 'favorite'" class="sticker-empty-state">
                                    <div class="empty-icon">📦</div>
                                    <p>暂无表情包</p>
                                    <button class="add-first-pack-btn" @click="showStickerImportPanel = true">
                                        <i class="fas fa-plus"></i> 添加表情包
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Sticker Import Panel -->
                    <div v-if="showStickerImportPanel" class="sticker-import-overlay" @click.self="showStickerImportPanel = false">
                        <div class="sticker-import-panel">
                            <div class="sticker-import-header">
                                <button class="back-btn-small" @click="showStickerImportPanel = false">
                                    <i class="fas fa-arrow-left"></i>
                                </button>
                                <span>导入表情包</span>
                                <div style="width: 40px;"></div>
                            </div>
                            
                            <div class="sticker-import-content">
                                <div class="import-field">
                                    <label>表情包名称</label>
                                    <input name="sp_field_5" id="sp-field-5" type="text" v-model="newPackName" placeholder="输入表情包名称..." class="pack-name-input">
                                </div>
                                
                                <div class="import-field">
                                    <label>表情内容</label>
                                    <textarea name="sp_field_6" id="sp-field-6" v-model="stickerImportText" class="sticker-import-textarea" placeholder="格式示例：
委屈： https://example.com/1.jpg
开心： https://example.com/2.jpg"></textarea>
                                </div>
                                
                                <div class="import-preview" v-if="stickerImportText.trim()">
                                    <label>预览 (识别到 {{ parseStickerImport(stickerImportText).length }} 个表情)</label>
                                    <div class="preview-grid">
                                        <div v-for="(sticker, idx) in parseStickerImport(stickerImportText).slice(0, 8)" :key="idx" class="preview-item">
                                            <img :src="sticker.url" :alt="sticker.name" @error="$event.target.style.display='none'">
                                            <span>{{ sticker.name }}</span>
                                        </div>
                                        <div v-if="parseStickerImport(stickerImportText).length > 8" class="preview-more">
                                            +{{ parseStickerImport(stickerImportText).length - 8 }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <button class="import-submit-btn" @click="importStickerPack" :disabled="!stickerImportText.trim() || !newPackName.trim()">
                                导入
                            </button>
                        </div>
                    </div>
                </template>
            </div>
        </div>

        <!-- 开场白选择模态框 -->
        <div v-if="showGreetingSelect" class="modal-overlay" @click.self="showGreetingSelect = false">
            <div class="greeting-modal">
                <div class="greeting-modal-header">
                    <h3>选择开场白</h3>
                    <button class="close-btn" @click="showGreetingSelect = false"><i class="fas fa-times"></i></button>
                </div>
                <div class="greeting-list">
                    <div v-for="(greeting, index) in availableGreetings" :key="index" class="greeting-item" @click="selectGreeting(greeting)">
                        <div class="greeting-text">{{ greeting.title }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 转账面板 -->
        <div v-if="showTransferPanel" class="modal-overlay" @click.self="showTransferPanel = false">
            <div class="transfer-modal">
                <div class="modal-header">
                    <h3>转账</h3>
                    <button class="close-btn" @click="closeTransferPanel"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-content">
                    <div class="transfer-input-group">
                        <label>金额</label>
                        <div class="transfer-amount-input">
                            <span class="currency-symbol">¥</span>
                            <input name="sp_field_7" id="sp-field-7" type="number" v-model="transferAmount" placeholder="0.00" min="0" step="0.01">
                        </div>
                    </div>
                    <div class="transfer-input-group">
                        <label>备注</label>
                        <input name="sp_field_8" id="sp-field-8" type="text" v-model="transferNote" placeholder="添加转账备注（可选）">
                    </div>
                    <button class="transfer-btn" @click="sendTransfer" :disabled="!transferAmount || transferAmount <= 0">确认转账</button>
                </div>
            </div>
        </div>

        <!-- 聊天设置面板 -->
        <ChatSettings v-if="showChatSettings" />

        

        <div v-if="showImageCropModal" class="modal-overlay" @click.self="closeImageCropModal">
            <div class="art-savearchive-panel" style="max-width: 420px;">
                <h3 style="margin:0 0 10px 0;">裁剪图片</h3>
                <div class="image-cropper-canvas" :style="{ position:'relative', width:'100%', aspectRatio: String(imageCropCanvasAspect), background:'#111', borderRadius:'12px', overflow:'hidden', touchAction:'none' }">
                    <img :src="imageCropSource" style="width:100%; height:100%; object-fit:contain; display:block; user-select:none; pointer-events:none;">
                    <div
                        :style="{ position:'absolute', left:(imageCropRect.x*100)+'%', top:(imageCropRect.y*100)+'%', width:(imageCropRect.w*100)+'%', height:(imageCropRect.h*100)+'%', border:'2px solid #fff', boxShadow:'0 0 0 9999px rgba(0,0,0,.35)', borderRadius:'10px', cursor:'move' }"
                        @mousedown.stop.prevent="onImageCropDragStart"
                        @touchstart.stop.prevent="onImageCropDragStart"
                    ></div>
                </div>
                <div style="margin-top:10px;">
                    <label style="font-size:12px; color:#666;">框选大小</label>
                    <input name="sp_field_29" id="sp-field-29" type="range" min="0.45" max="0.95" step="0.01" v-model.number="imageCropScale" @input="onImageCropScaleChange" style="width:100%;">
                </div>
                <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px;">
                    <button class="btn-small" @click="closeImageCropModal">取消</button>
                    <button class="btn-small" @click="confirmImageCrop">确定</button>
                </div>
            </div>
        </div>

        <!-- 存档对话框 -->
        <div v-if="showArchiveDialog" class="art-savearchive-overlay" @click.self="showArchiveDialog = false">
            <div class="art-savearchive-panel">
                <button class="art-savearchive-close" @click="showArchiveDialog = false">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                
                <h1 class="art-savearchive-title">SAVE</h1>
                
                <div class="art-savearchive-illustration">
                    <svg viewBox="0 0 160 100" fill="none">
                        <rect x="30" y="35" width="100" height="55" stroke="#000000" stroke-width="2" fill="#FFFFFF"/>
                        <path d="M30 35 L50 18 L110 18 L130 35" stroke="#000000" stroke-width="2" fill="#FDFDFB"/>
                        <line x1="50" y1="55" x2="110" y2="55" stroke="#000000" stroke-width="1.5" stroke-dasharray="4 4"/>
                        <line x1="50" y1="68" x2="100" y2="68" stroke="#000000" stroke-width="1.5" stroke-dasharray="4 4"/>
                        <circle cx="135" cy="25" r="12" stroke="#000000" stroke-width="1.5" fill="none"/>
                        <path d="M132 20 L138 30" stroke="#000000" stroke-width="1.5"/>
                        <path d="M132 30 L138 20" stroke="#000000" stroke-width="1.5"/>
                    </svg>
                </div>
                
                <div class="art-savearchive-input-group">
                    <label class="art-savearchive-label">存档名称</label>
                    <input name="sp_field_30" id="sp-field-30" type="text" v-model="archiveName" class="art-savearchive-input" placeholder="给这段回忆起个名字">
                </div>
                
                <div class="art-savearchive-input-group">
                    <label class="art-savearchive-label">描述</label>
                    <textarea name="sp_field_31" id="sp-field-31" v-model="archiveDescription" class="art-savearchive-textarea" placeholder="添加一些笔记..."></textarea>
                </div>
                
                <div class="art-savearchive-buttons">
                    <button class="art-savearchive-btn art-savearchive-btn-cancel" @click="showArchiveDialog = false">取消</button>
                    <button class="art-savearchive-btn art-savearchive-btn-save" @click="archiveCurrentChat">保存</button>
                </div>
            </div>
        </div>
        
        <!-- 创建群聊对话框 -->
        <div v-if="showCreateGroupDialog" class="art-savearchive-overlay" @click.self="showCreateGroupDialog = false">
            <div class="art-savearchive-panel" style="max-height: 80vh; overflow-y: auto;">
                <button class="art-savearchive-close" @click="showCreateGroupDialog = false">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                
                <h1 class="art-savearchive-title">GROUP</h1>
                
                <div class="art-savearchive-illustration">
                    <svg viewBox="0 0 160 100" fill="none">
                        <circle cx="50" cy="45" r="20" stroke="#000000" stroke-width="2" fill="none"/>
                        <circle cx="90" cy="45" r="20" stroke="#000000" stroke-width="2" fill="none"/>
                        <circle cx="70" cy="70" r="20" stroke="#000000" stroke-width="2" fill="none"/>
                        <circle cx="45" cy="40" r="3" fill="#000000"/>
                        <circle cx="55" cy="40" r="3" fill="#000000"/>
                        <circle cx="85" cy="40" r="3" fill="#000000"/>
                        <circle cx="95" cy="40" r="3" fill="#000000"/>
                        <circle cx="65" cy="65" r="3" fill="#000000"/>
                        <circle cx="75" cy="65" r="3" fill="#000000"/>
                    </svg>
                </div>
                
                <div class="art-savearchive-input-group">
                    <label class="art-savearchive-label">群头像</label>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <img :src="newGroupAvatar || 'https://placehold.co/80x80?text=Group'" 
                             style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid #000; object-fit: cover; cursor: pointer;"
                             @click="triggerGroupAvatarUpload">
                        <input name="sp_field_32" id="sp-field-32" type="file" ref="groupAvatarInput" @change="handleGroupAvatarUpload" accept="image/*" style="display: none;">
                        <button @click="triggerGroupAvatarUpload" 
                                style="padding: 8px 16px; border: 2px solid #000; border-radius: 12px; background: #FFF; cursor: pointer; font-family: 'Inter', sans-serif;">
                            选择图片
                        </button>
                    </div>
                </div>
                
                <div class="art-savearchive-input-group">
                    <label class="art-savearchive-label">群聊名称</label>
                    <input name="sp_field_33" id="sp-field-33" type="text" v-model="newGroupName" class="art-savearchive-input" placeholder="给群聊起个名字">
                </div>
                
                <div class="art-savearchive-input-group">
                    <label class="art-savearchive-label">选择群成员</label>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; max-height: 200px; overflow-y: auto; padding: 8px; border: 2px dashed #CCCCCC; border-radius: 12px; background: #F9F9F9;">
                        <div v-for="char in (characters || []).filter(Boolean)" :key="char?.id" 
                             :class="['group-member-select', { 'selected': selectedGroupMembers.includes(char.id) }]"
                             @click="toggleGroupMember(char.id)">
                            <img :src="char.avatarUrl || 'https://placehold.co/60x60?text=No+Avatar'" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">
                            <span style="font-size: 12px; margin-top: 4px; text-align: center; max-width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                {{ char.nickname || char.name }}
                            </span>
                        </div>
                        <div v-if="characters.length === 0" style="color: #999; padding: 20px; text-align: center; width: 100%;">
                            暂无角色，请先去工作室创建
                        </div>
                    </div>
                </div>
                
                <div class="art-savearchive-buttons">
                    <button class="art-savearchive-btn art-savearchive-btn-cancel" @click="showCreateGroupDialog = false">取消</button>
                    <button class="art-savearchive-btn art-savearchive-btn-save" @click="createNewGroup" :disabled="!newGroupName">创建</button>
                </div>
            </div>
        </div>
        
        <!-- 添加群成员对话框 -->
        <div v-if="showAddMemberDialog" class="art-savearchive-overlay" @click.self="showAddMemberDialog = false">
            <div class="art-savearchive-panel" style="max-height: 85vh; overflow-y: auto;">
                <button class="art-savearchive-close" @click="showAddMemberDialog = false">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                
                <h1 class="art-savearchive-title">ADD MEMBER</h1>
                
                <div class="art-savearchive-illustration">
                    <svg viewBox="0 0 160 100" fill="none">
                        <circle cx="80" cy="50" r="25" stroke="#000000" stroke-width="2" fill="none"/>
                        <line x1="80" y1="35" x2="80" y2="65" stroke="#000000" stroke-width="2"/>
                        <line x1="65" y1="50" x2="95" y2="50" stroke="#000000" stroke-width="2"/>
                    </svg>
                </div>
                
                <!-- 添加方式切换 -->
                <div class="add-member-tabs">
                    <button :class="['add-member-tab', { 'active': addMemberMode === 'existing' }]" @click="addMemberMode = 'existing'">从角色库</button>
                    <button :class="['add-member-tab', { 'active': addMemberMode === 'custom' }]" @click="addMemberMode = 'custom'">自定义成员</button>
                </div>
                
                <!-- 从角色库添加 -->
                <div v-if="addMemberMode === 'existing'" class="art-savearchive-input-group">
                    <label class="art-savearchive-label">选择要添加的成员</label>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; max-height: 250px; overflow-y: auto; padding: 8px; border: 2px dashed #CCCCCC; border-radius: 12px; background: #F9F9F9;">
                        <div v-for="char in getAvailableCharactersForAdd" :key="char.id" 
                             :class="['group-member-select', { 'selected': selectedAddMembers.includes(char.id) }]"
                             @click="toggleAddMember(char.id)">
                            <img :src="char.avatarUrl || 'https://placehold.co/60x60?text=No+Avatar'" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">
                            <span style="font-size: 12px; margin-top: 4px; text-align: center; max-width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                {{ char.nickname || char.name }}
                            </span>
                        </div>
                        <div v-if="getAvailableCharactersForAdd.length === 0" style="color: #999; padding: 20px; text-align: center; width: 100%;">
                            没有可添加的成员了
                        </div>
                    </div>
                </div>
                
                <!-- 自定义成员 -->
                <div v-if="addMemberMode === 'custom'">
                    <div class="art-savearchive-input-group">
                        <label class="art-savearchive-label">成员头像</label>
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <img :src="customMemberAvatar || 'https://placehold.co/80x80?text=NPC'" 
                                 style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid #000; object-fit: cover; cursor: pointer;"
                                 @click="triggerCustomMemberAvatarUpload">
                            <input name="sp_field_34" id="sp-field-34" type="file" ref="customMemberAvatarInput" @change="handleCustomMemberAvatarUpload" accept="image/*" style="display: none;">
                            <button @click="triggerCustomMemberAvatarUpload" 
                                    style="padding: 8px 16px; border: 2px solid #000; border-radius: 12px; background: #FFF; cursor: pointer; font-family: 'Inter', sans-serif;">
                                选择图片
                            </button>
                        </div>
                    </div>
                    
                    <div class="art-savearchive-input-group">
                        <label class="art-savearchive-label">成员名字</label>
                        <input name="sp_field_35" id="sp-field-35" type="text" v-model="customMemberName" class="art-savearchive-input" placeholder="给这位成员起个名字">
                    </div>
                    
                    <div class="art-savearchive-input-group">
                        <label class="art-savearchive-label">成员人设</label>
                        <textarea name="sp_field_36" id="sp-field-36" v-model="customMemberPersona" class="art-savearchive-input" placeholder="简单描述一下这位成员的性格特点..." style="min-height: 100px; resize: vertical;"></textarea>
                    </div>
                    <div class="art-savearchive-input-group">
                        <label class="art-savearchive-label">绑定世界书（可多选）</label>
                        <div v-if="!worldbooks || worldbooks.length === 0" class="profile-meta" style="padding:8px 0;">暂无世界书，请先在工作室创建</div>
                        <div v-else class="custom-member-worldbook-list">
                            <label v-for="wb in worldbooks" :key="wb.id" class="custom-member-wb-row">
                                <span>{{ wb.name }}</span>
                                <input name="sp_field_37" id="sp-field-37" type="checkbox" v-model="customMemberWorldbookIds" :value="wb.id">
                            </label>
                        </div>
                    </div>
                    <div class="art-savearchive-input-group">
                        <label class="art-savearchive-label">绑定预设</label>
                        <select name="sp_field_38" id="sp-field-38" v-model="customMemberPresetId" class="art-savearchive-input">
                            <option :value="null">不绑定预设</option>
                            <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
                        </select>
                    </div>
                    <div v-if="addMemberMode === 'custom'" class="art-savearchive-input-group">
                        <label class="art-savearchive-label">时区（群聊时差）</label>
                        <select name="sp_field_39" id="sp-field-39" v-model="customMemberTimeZone" class="art-savearchive-input">
                            <option value="Asia/Shanghai">上海/北京 (UTC+8)</option>
                            <option value="Asia/Tokyo">东京 (UTC+9)</option>
                            <option value="America/New_York">纽约 (UTC-5/UTC-4)</option>
                            <option value="Europe/London">伦敦 (UTC+0/UTC+1)</option>
                            <option value="Australia/Sydney">悉尼 (UTC+10/UTC+11)</option>
                        </select>
                    </div>
                </div>
                
                <div class="art-savearchive-buttons">
                    <button class="art-savearchive-btn art-savearchive-btn-cancel" @click="showAddMemberDialog = false">取消</button>
                    <button v-if="addMemberMode === 'existing'" class="art-savearchive-btn art-savearchive-btn-save" @click="addMembersToGroup" :disabled="selectedAddMembers.length === 0">添加</button>
                    <button v-if="addMemberMode === 'custom'" class="art-savearchive-btn art-savearchive-btn-save" @click="addCustomMember" :disabled="!customMemberName">添加</button>
                </div>
            </div>
        </div>

        <!-- 编辑群成员（人设 / 世界书 / 预设） -->
        <div v-if="showMemberEditor && editingMember" class="modal-overlay" @click.self="closeMemberEditor">
            <div class="modal-content member-editor-modal" style="max-width: 480px;">
                <div class="modal-header">
                    <span>编辑成员 — {{ editingMember.name }}</span>
                    <button type="button" class="close-btn" @click="closeMemberEditor"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body member-editor-modal-body">
                    <label class="member-editor-label">人设</label>
                    <textarea name="sp_field_40" id="sp-field-40" v-model="editingMember.persona" class="art-settings-input" rows="3" placeholder="成员的性格描述..."></textarea>

                    <label class="member-editor-label mt-2">绑定世界书</label>
                    <div v-if="!worldbooks || worldbooks.length === 0" class="profile-meta">暂无世界书，请先在工作室创建</div>
                    <div v-else class="member-editor-wb-list">
                        <div v-for="wb in worldbooks" :key="wb.id" class="member-editor-wb-row">
                            <span>{{ wb.name }}</span>
                            <input name="sp_field_41" id="sp-field-41" type="checkbox" v-model="editingMember.worldbookIds" :value="wb.id">
                        </div>
                    </div>

                    <label class="member-editor-label mt-2">绑定预设</label>
                    <select name="sp_field_42" id="sp-field-42" v-model="editingMember.selectedPresetId" class="art-settings-input">
                        <option :value="null">不绑定预设</option>
                        <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
                    </select>

                    <label class="member-editor-label mt-2">时区（群聊时差）</label>
                    <select name="sp_field_43" id="sp-field-43" v-model="editingMember.timeZone" class="art-settings-input">
                        <option value="Asia/Shanghai">上海/北京 (UTC+8)</option>
                        <option value="Asia/Tokyo">东京 (UTC+9)</option>
                        <option value="America/New_York">纽约 (UTC-5/UTC-4)</option>
                        <option value="Europe/London">伦敦 (UTC+0/UTC+1)</option>
                        <option value="Australia/Sydney">悉尼 (UTC+10/UTC+11)</option>
                    </select>

                    <div class="member-editor-actions">
                        <button type="button" class="btn" @click="closeMemberEditor">取消</button>
                        <button type="button" class="btn btn-primary" @click="saveMemberEditor">保存</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- 已存档对话管理 -->
        <div v-if="showArchivedChats" class="art-archive-overlay" @click.self="showArchivedChats = false">
            <div class="art-archive-panel">
                <button class="art-archive-close" @click="showArchivedChats = false">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                
                <h1 class="art-archive-title">ARCHIVE</h1>
                
                <div v-if="sortedArchivedChats.length === 0" class="art-archive-empty">
                    <div class="art-empty-illustration">
                        <svg viewBox="0 0 120 120" fill="none">
                            <rect x="20" y="40" width="80" height="60" stroke="#000000" stroke-width="2" fill="#FDFDFB"/>
                            <path d="M20 40 L40 25 L80 25 L100 40" stroke="#000000" stroke-width="2" fill="#FFFFFF"/>
                            <line x1="40" y1="70" x2="80" y2="70" stroke="#000000" stroke-width="1.5" stroke-dasharray="4 4"/>
                            <line x1="40" y1="80" x2="70" y2="80" stroke="#000000" stroke-width="1.5" stroke-dasharray="4 4"/>
                        </svg>
                    </div>
                    <p class="art-empty-text">{{ soulLinkActiveChat ? '该对话暂无存档' : '还没有存档的对话' }}</p>
                    <p class="art-empty-hint">{{ soulLinkActiveChat ? '保存一段珍贵的回忆吧 ✦' : '保存一段珍贵的回忆吧 ✦' }}</p>
                </div>
                
                <div v-else class="art-archive-list">
                    <div v-for="archive in sortedArchivedChats" :key="archive.id" class="art-archive-card">
                        <div class="art-archive-header">
                            <div class="art-archive-icon">
                                <svg viewBox="0 0 32 32" fill="none">
                                    <polyline points="28 10 28 28 4 28 4 10" stroke="#000000" stroke-width="1.5"/>
                                    <rect x="2" y="4" width="28" height="6" stroke="#000000" stroke-width="1.5"/>
                                    <line x1="12" y1="18" x2="20" y2="18" stroke="#000000" stroke-width="1.5"/>
                                </svg>
                            </div>
                            <div class="art-archive-name-wrapper">
                                <div class="art-archive-name">{{ archive.name }}</div>
                                <div class="art-archive-tag-wrapper">
                                    <span :class="['art-archive-tag', archive.chatType === 'group' ? 'group-tag' : 'single-tag']">
                                        {{ archive.chatType === 'group' ? '群聊' : '单聊' }}
                                    </span>
                                    <span class="art-archive-chatname">{{ archive.chatName }}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="art-archive-preview">{{ archive.preview }}</div>
                        
                        <div class="art-archive-footer">
                            <span class="art-archive-time">{{ new Date(archive.timestamp).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
                            <div class="art-archive-buttons">
                                <button class="art-archive-btn art-archive-btn-restore" @click="restoreArchivedChat(archive)">
                                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <polyline points="1 4 1 10 7 10"></polyline>
                                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                                    </svg>
                                    恢复
                                </button>
                                <button class="art-archive-btn art-archive-btn-delete" @click="deleteArchivedChat(archive.id)">
                                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    删除
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="art-archive-bottom">
                    <svg class="art-archive-decoration" viewBox="0 0 300 60" fill="none">
                        <path d="M0 60 L30 45 L60 52 L90 38 L120 48 L150 35 L180 48 L210 38 L240 50 L270 40 L300 52 L300 60 Z" stroke="#000000" stroke-width="1.5" fill="#FDFDFB"/>
                        <circle cx="270" cy="18" r="8" stroke="#000000" stroke-width="1.5" fill="none"/>
                        <path d="M268 14 L272 22" stroke="#000000" stroke-width="1.5"/>
                        <path d="M268 22 L272 14" stroke="#000000" stroke-width="1.5"/>
                    </svg>
                </div>
            </div>
        </div>

        <!-- 重命名群聊对话框 -->
        <div v-if="showRenameGroupDialog" class="art-savearchive-overlay" @click.self="showRenameGroupDialog = false">
            <div class="art-savearchive-panel">
                <button class="art-savearchive-close" @click="showRenameGroupDialog = false">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                
                <h1 class="art-savearchive-title">RENAME</h1>
                
                <div class="art-savearchive-illustration">
                    <svg viewBox="0 0 160 100" fill="none">
                        <circle cx="80" cy="50" r="30" stroke="#000000" stroke-width="2" fill="none"/>
                        <text x="80" y="58" text-anchor="middle" font-family="Inter" font-size="24" font-weight="700" fill="#000000">Aa</text>
                    </svg>
                </div>
                
                <div class="art-savearchive-input-group">
                    <label class="art-savearchive-label">群头像</label>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <img :src="tempGroupAvatar || activeGroupChat?.avatarUrl || 'https://placehold.co/80x80?text=Group'" 
                             style="width: 80px; height: 80px; border-radius: 50%; border: 2px solid #000; object-fit: cover; cursor: pointer;"
                             @click="triggerRenameGroupAvatarUpload">
                        <input name="sp_field_44" id="sp-field-44" type="file" ref="renameGroupAvatarInput" @change="handleRenameGroupAvatarUpload" accept="image/*" style="display: none;">
                        <button @click="triggerRenameGroupAvatarUpload" 
                                style="padding: 8px 16px; border: 2px solid #000; border-radius: 12px; background: #FFF; cursor: pointer; font-family: 'Inter', sans-serif;">
                            选择图片
                        </button>
                    </div>
                </div>
                
                <div class="art-savearchive-input-group">
                    <label class="art-savearchive-label">群聊名称</label>
                    <input name="sp_field_45" id="sp-field-45" type="text" v-model="newGroupNameInput" class="art-savearchive-input" placeholder="给群聊起个新名字">
                </div>
                
                <div class="art-savearchive-buttons">
                    <button class="art-savearchive-btn art-savearchive-btn-cancel" @click="showRenameGroupDialog = false">取消</button>
                    <button class="art-savearchive-btn art-savearchive-btn-save" @click="renameGroup" :disabled="!newGroupNameInput.trim()">保存</button>
                </div>
            </div>
        </div>

        <!-- 上下文菜单 -->
        <div v-if="contextMenu.visible" class="context-menu-overlay" @click="closeContextMenu">
            <div class="context-menu" :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }" @click.stop>
                <div class="context-menu-item" @click="handleContextAction('quote')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span>引用</span>
                </div>
                <div class="context-menu-item" @click="handleContextAction('like')">
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span>点赞</span>
                </div>
                <div class="context-menu-item" @click="handleContextAction('edit')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    <span>编辑</span>
                </div>
                <div class="context-menu-item" @click="handleContextAction('regenerate')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <polyline points="1 20 1 14 7 14"></polyline>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                    <span>重新生成</span>
                </div>
                <div class="context-menu-item" @click="handleContextAction('recall')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="1 4 1 10 7 10"></polyline>
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                    </svg>
                    <span>撤回</span>
                </div>
                <div class="context-menu-item" @click="handleContextAction('delete')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    <span>删除</span>
                </div>
            </div>
        </div>

        
</div>
</template>

<script>
import { inject } from 'vue';

import ChatSettings from './ChatSettings.vue';

export default {
    components: { ChatSettings },
    name: 'ChatApp',
    setup() {
        const globalState = inject('globalState');
        return {
            ...globalState
        };
    }
}
</script>
