<template>
        <!-- LIVE App -->
        <div class="app-view live-app"
            :style="liveHallWallpaperUrl ? { '--live-app-bg': 'url(' + liveHallWallpaperUrl + ')' } : {}">
            <audio ref="liveBgmAudioRef" :src="LIVE_BGM_URL" preload="metadata" class="live-bgm-audio"
                @play="onLiveBgmPlay" @pause="onLiveBgmPause" @ended="onLiveBgmEnded"></audio>
            <div class="live-bg-overlay"></div>
            <div class="live-bg-caption">ISLAND MEETS SEA</div>
            <div class="live-header-bar">
                <div class="live-brand">
                    <span class="live-tag">LIVE</span>
                    <div class="live-wave">
                        <span v-for="(h, i) in liveWaveBars" :key="'wave-' + i" :style="{ height: h + 'px' }"></span>
                    </div>
                </div>
                <h1 class="live-title">SENSE LUXURY</h1>
                <button type="button" class="live-greet live-settings-btn" @click="openLiveSettings">设置</button>
            </div>

            <!-- LIVE 设置面板 -->
            <div v-if="liveSettingsOpen" class="live-settings-overlay" @click.self="closeLiveSettings">
                <div class="live-settings-panel" @click.stop>
                    <div class="live-settings-head">
                        <span class="live-settings-title">语音厅设置</span>
                        <button type="button" class="live-settings-close" @click="closeLiveSettings" aria-label="关闭">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <div class="live-settings-body">
                        <div class="live-bgm-picker">
                            <div class="live-bgm-picker-head">
                                <label class="live-settings-label" style="margin:0;">厅内音乐（搜索/播放）</label>
                                <button type="button" class="live-bgm-mini-play"
                                    @click="toggleLiveBgm" :title="liveBgmPlaying ? '暂停' : '播放'">
                                    <i class="fas" :class="liveBgmPlaying ? 'fa-pause' : 'fa-play'"></i>
                                </button>
                            </div>

                            <div class="live-bgm-current">
                                <img class="live-bgm-current-cover"
                                    :src="liveBgmCurrentSong?.cover || 'https://i.postimg.cc/pT2xKzP-album-cover-placeholder.png'"
                                    alt="">
                                <div class="live-bgm-current-info">
                                    <div class="live-bgm-current-title">
                                        {{ liveBgmCurrentSong?.name || '自定义/默认 BGM' }}
                                    </div>
                                    <div class="live-bgm-current-artist">
                                        {{ liveBgmCurrentSong?.artist || '' }}
                                    </div>
                                </div>
                            </div>

                            <div class="live-bgm-search-row">
                                <input name="sp_field_56" id="sp-field-56" class="live-settings-input live-bgm-search-input" type="text"
                                    v-model="liveBgmSearchTerm" placeholder="输入歌名/歌手后回车"
                                    @keyup.enter="searchLiveBgmSongs(liveBgmSearchTerm)">
                                <button type="button" class="live-bgm-search-btn"
                                    @click="searchLiveBgmSongs(liveBgmSearchTerm)">搜索</button>
                            </div>

                            <div v-if="liveBgmSearchLoading" class="live-bgm-status">搜索中...</div>
                            <div v-else class="live-bgm-results">
                                <div v-if="!liveBgmSearchResults || liveBgmSearchResults.length === 0"
                                    class="live-bgm-empty">暂无结果</div>
                                <div v-for="song in liveBgmSearchResults" :key="song.source + '_' + song.id"
                                    class="live-bgm-result"
                                    :class="{ active: liveBgmCurrentSong?.id === song.id && liveBgmCurrentSong?.source === song.source }"
                                    @click="playLiveBgmFromSong(song)">
                                    <img class="live-bgm-result-cover" :src="song.cover" alt="">
                                    <div class="live-bgm-result-info">
                                        <div class="live-bgm-result-title">{{ song.name }}</div>
                                        <div class="live-bgm-result-artist">{{ song.artist }}</div>
                                    </div>
                                    <div class="live-bgm-result-play">
                                        <i class="fas"
                                            :class="liveBgmPlaying && liveBgmCurrentSong?.id === song.id && liveBgmCurrentSong?.source === song.source ? 'fa-volume-up' : 'fa-music'"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <label class="live-settings-label">用户马甲</label>
                        <input name="sp_field_57" id="sp-field-57" class="live-settings-input" type="text" v-model="liveSettingsDraftUserMask"
                            placeholder="例如：夜航船_123">

                        <label class="live-settings-label">语音厅壁纸（上传图片/链接）</label>
                        <div class="live-wallpaper-upload-row">
                            <input name="sp_field_58" id="sp-field-58" class="live-wallpaper-upload-input" type="file" accept="image/*"
                                @change="onLiveHallWallpaperUpload">
                        </div>
                        <input name="sp_field_59" id="sp-field-59" class="live-settings-input" type="text" v-model="liveSettingsDraftHallWallpaperUrl"
                            placeholder="https://.../wallpaper.jpg（或上传图片后会自动生成 dataURL）">
                        <div class="live-wallpaper-preview"
                            v-if="liveSettingsDraftHallWallpaperUrl && String(liveSettingsDraftHallWallpaperUrl).length > 10">
                            <img :src="liveSettingsDraftHallWallpaperUrl" alt="壁纸预览">
                        </div>
                    </div>

                    <div class="live-settings-actions">
                        <button type="button" class="live-settings-cancel" @click="closeLiveSettings">取消</button>
                        <button type="button" class="live-settings-save" @click="saveLiveSettings">保存</button>
                    </div>
                </div>
            </div>

            <div class="live-room-tabs">
                <button type="button" v-for="room in liveRooms" :key="room.id" class="live-room-tab"
                    :class="{ active: activeLiveRoomId === room.id }"
                    @click="switchLiveRoom(room.id)">
                    <span class="name">{{ room.name }}</span>
                    <span class="sub">{{ room.subtitle }}</span>
                </button>
            </div>

            <div class="live-speaker-stage">
                <div class="stage-title">{{ activeLiveRoom.name }}</div>
                <div class="seats">
                    <div class="seat active host">
                        <img class="live-host-avatar-tap" :src="activeLiveHost?.avatarUrl || 'https://placehold.co/96x96/f0a54d/ffffff?text=Host'" :alt="activeLiveHost?.nickname || activeLiveHost?.name || 'Host'"
                            @click.stop="toggleLiveHostHistory" title="查看主播历史发言">
                        <span>{{ activeLiveHost?.nickname || activeLiveHost?.name || '主持位' }}</span>
                    </div>
                    <div class="seat" :class="{ active: liveOnMic, waiting: !liveOnMic }">
                        <span v-if="liveOnMic">我</span>
                        <span v-else>空麦位</span>
                    </div>
                </div>
            </div>

            <div class="live-chat-panel">
                <div class="live-feed-head">
                    <span class="live-feed-head-title">语音厅动态</span>
                    <span class="live-feed-head-tag">LIVE</span>
                </div>
                <div class="live-feed-body">
                    <div class="live-feed-now" v-if="activeLiveHost || activeLiveRoom">
                        <div class="live-feed-now-avatar live-host-avatar-tap" role="button" tabindex="0"
                            title="查看主播历史发言"
                            @click="toggleLiveHostHistory"
                            @keyup.enter.prevent="toggleLiveHostHistory">
                            <img :src="activeLiveHost?.avatarUrl || 'https://placehold.co/72x72/f0a54d/ffffff?text=H'" alt="">
                        </div>
                        <div class="live-feed-now-copy">
                            <span class="live-feed-now-label">主播说</span>
                            <p class="live-feed-now-text" v-if="!liveHostSpeechLoading">
                                {{ activeLiveHostSpeech || '欢迎来到语音厅，欢迎留言～' }}
                            </p>
                            <p class="live-feed-now-text is-loading" v-else>正在组织语言…</p>
                            <div class="live-bgm-lyrics-window">
                                <p class="live-bgm-lyrics-loading" v-if="liveBgmLyricsLoading">歌词加载中…</p>
                                <p class="live-bgm-lyrics-empty" v-else-if="!liveBgmCurrentLyricText">（暂无歌词）</p>
                                <p class="live-bgm-lyrics-prev" v-else-if="liveBgmLyricPrevText">{{ liveBgmLyricPrevText }}</p>
                                <p class="live-bgm-lyrics-current">{{ liveBgmCurrentLyricText }}</p>
                                <p class="live-bgm-lyrics-next" v-if="liveBgmLyricNextText">{{ liveBgmLyricNextText }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="live-feed-stream">
                        <div class="live-feed-messages">
                            <div class="live-feed-msg" :class="{ 'is-gift': msg.kind === 'gift', 'is-npc': msg.kind === 'npc' }"
                                v-for="msg in activeLiveMessages.slice(-14)" :key="msg.id">
                                <span class="live-feed-msg-user" :class="{ system: msg.system }">{{ msg.user }}</span>
                                <span class="live-feed-msg-body">{{ msg.text }}</span>
                            </div>
                        </div>
                        <div class="live-feed-rail">
                            <div class="live-gift-shower" aria-hidden="true">
                                <span class="live-gf" style="--x:6%;--d:0s;--gx:-1px;--c:#c895a2"><i class="fas fa-gift"></i></span>
                                <span class="live-gf live-gf--alt" style="--x:14%;--d:0.12s;--gx:1px;--c:#7aab9c"><i class="fas fa-heart"></i></span>
                                <span class="live-gf" style="--x:22%;--d:0.24s;--gx:0px;--c:#9b8bc4"><i class="fas fa-star"></i></span>
                                <span class="live-gf live-gf--alt" style="--x:30%;--d:0.36s;--gx:-2px;--c:#c9a070"><i class="fas fa-gift"></i></span>
                                <span class="live-gf" style="--x:38%;--d:0.48s;--gx:2px;--c:#6b9ec9"><i class="fas fa-heart"></i></span>
                                <span class="live-gf" style="--x:46%;--d:0.6s;--gx:0px;--c:#b89bc4"><i class="fas fa-star"></i></span>
                                <span class="live-gf live-gf--alt" style="--x:54%;--d:0.72s;--gx:-1px;--c:#8eb896"><i class="fas fa-gift"></i></span>
                                <span class="live-gf" style="--x:62%;--d:0.84s;--gx:1px;--c:#c895a2"><i class="fas fa-heart"></i></span>
                                <span class="live-gf" style="--x:70%;--d:0.96s;--gx:0px;--c:#7aab9c"><i class="fas fa-star"></i></span>
                                <span class="live-gf live-gf--alt" style="--x:78%;--d:1.08s;--gx:-2px;--c:#9b8bc4"><i class="fas fa-gift"></i></span>
                                <span class="live-gf" style="--x:86%;--d:1.2s;--gx:2px;--c:#c9a070"><i class="fas fa-heart"></i></span>
                                <span class="live-gf" style="--x:94%;--d:1.32s;--gx:0px;--c:#6b9ec9"><i class="fas fa-star"></i></span>
                                <span class="live-gf live-gf--alt" style="--x:10%;--d:1.45s;--gx:1px;--c:#b89bc4"><i class="fas fa-gift"></i></span>
                                <span class="live-gf" style="--x:26%;--d:1.58s;--gx:-1px;--c:#c895a2"><i class="fas fa-heart"></i></span>
                                <span class="live-gf" style="--x:42%;--d:1.7s;--gx:0px;--c:#8eb896"><i class="fas fa-star"></i></span>
                                <span class="live-gf live-gf--alt" style="--x:58%;--d:1.82s;--gx:-2px;--c:#9b8bc4"><i class="fas fa-gift"></i></span>
                                <span class="live-gf" style="--x:74%;--d:1.94s;--gx:2px;--c:#7aab9c"><i class="fas fa-heart"></i></span>
                                <span class="live-gf" style="--x:90%;--d:2.06s;--gx:0px;--c:#c9a070"><i class="fas fa-star"></i></span>
                                <span class="live-gf live-gf--alt" style="--x:18%;--d:2.18s;--gx:-1px;--c:#6b9ec9"><i class="fas fa-gift"></i></span>
                                <span class="live-gf" style="--x:50%;--d:2.3s;--gx:1px;--c:#c895a2"><i class="fas fa-heart"></i></span>
                                <span class="live-gf" style="--x:66%;--d:2.42s;--gx:0px;--c:#b89bc4"><i class="fas fa-star"></i></span>
                                <span class="live-gf live-gf--alt" style="--x:34%;--d:2.55s;--gx:-2px;--c:#8eb896"><i class="fas fa-gift"></i></span>
                                <span class="live-gf" style="--x:82%;--d:2.68s;--gx:2px;--c:#9b8bc4"><i class="fas fa-heart"></i></span>
                            </div>
                        </div>
                    </div>
                    <div class="live-feed-compose-wrap">
                        <div class="live-feed-compose-row live-disguise-row" v-if="!liveOnMic">
                            <span class="live-disguise-hint live-disguise-hint-edit" role="button" tabindex="0"
                                @click="openLiveSettings" @keyup.enter.prevent="openLiveSettings">
                                马甲：{{ liveUserDisguiseNick || '（未设置）' }}
                            </span>
                        </div>
                        <div class="live-feed-compose-row">
                            <input name="sp_field_60" id="sp-field-60" class="live-feed-input" v-model="liveInput" @keyup.enter="sendLiveMessage" :placeholder="liveOnMic ? '说点什么…（角色知道是你）' : '说点什么…（马甲发言，角色以为是网友）'" autocomplete="off">
                            <button type="button" class="live-quick-btn" @click="sendLiveGift" title="送礼" aria-label="送礼"><i class="fas fa-gift"></i></button>
                            <button type="button" class="live-feed-send" @click="sendLiveMessage">发送</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="live-voice-actions">
                <button type="button" class="voice-btn" :class="{ off: liveMicMuted }" @click="toggleLiveMic">
                    <i class="fas" :class="liveMicMuted ? 'fa-microphone-slash' : 'fa-microphone'"></i>
                    <span>{{ liveMicMuted ? '已静音' : '麦克风' }}</span>
                </button>
                <button type="button" class="voice-btn primary" :class="{ active: liveOnMic }" @click="toggleLiveOnMic"
                    :title="liveOnMic ? '下麦（角色会以为你是普通网友）' : '上麦（掉马，角色知道是你）'">
                    <i class="fas" :class="liveOnMic ? 'fa-hand-paper' : 'fa-microphone'"></i>
                    <span>{{ liveOnMic ? '下麦' : '申请上麦' }}</span>
                </button>
                <button type="button" class="voice-btn" @click="goBack"><i class="fas fa-door-open"></i><span>离开房间</span></button>
            </div>

            <div class="live-player" :class="{ 'is-bgm-playing': liveBgmPlaying }">
                <div class="live-player-inner">
                    <div class="live-player-icon-wrap" aria-hidden="true">
                        <img class="live-player-cover-img"
                            :src="liveBgmCurrentSong?.cover || 'https://i.postimg.cc/pT2xKzP-album-cover-placeholder.png'"
                            alt="BGM">
                    </div>
                    <div class="live-player-text">
                        <span class="live-player-title">{{ liveBgmCurrentSong?.name || '厅内 BGM' }}</span>
                        <span class="live-player-sub">
                            {{ liveBgmCurrentSong?.artist || '' }} · 已播 {{ liveElapsedText }}
                        </span>
                    </div>
                    <button type="button" class="live-player-play" @click="toggleLiveBgm"
                        :title="liveBgmPlaying ? '暂停' : '播放'">
                        <i class="fas" :class="liveBgmPlaying ? 'fa-pause' : 'fa-play'"></i>
                    </button>
                </div>
            </div>

            <div v-if="liveHostHistoryOpen" class="live-host-history-overlay" @click.self="closeLiveHostHistory">
                <div class="live-host-history-sheet" @click.stop>
                    <div class="live-host-history-head">
                        <span class="live-host-history-title">主播历史发言</span>
                        <button type="button" class="live-host-history-close" @click="closeLiveHostHistory" aria-label="关闭">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <p class="live-host-history-sub">{{ activeLiveHost?.nickname || activeLiveHost?.name || '主持' }} · {{ activeLiveRoom?.name }}</p>
                    <div class="live-host-history-list">
                        <template v-if="activeLiveHostSpeechHistory.length">
                            <div v-for="item in activeLiveHostSpeechHistory" :key="item.id" class="live-host-history-item">
                                <span class="live-host-history-time">{{ formatLiveHostHistoryTime(item.at) }}</span>
                                <p class="live-host-history-text">{{ item.text }}</p>
                            </div>
                        </template>
                        <div v-else class="live-host-history-empty">
                            暂无主播台词记录。直播脚本里主播开口后会自动记在这里。
                        </div>
                    </div>
                </div>
            </div>
        </div>

</template>

<script>
import { inject } from 'vue';

export default {
    name: 'LiveApp',
    setup() {
        return inject('globalState');
    }
}
</script>
