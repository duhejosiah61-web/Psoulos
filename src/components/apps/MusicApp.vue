<template>
        <!-- Music App -->
        <div  class="app-view music-view">
            <div class="music-app-shell">
                <audio ref="musicAudioRef" preload="metadata" @timeupdate="onMusicAudioTimeUpdate" @loadedmetadata="onMusicAudioLoadedMetadata" @play="onMusicAudioPlay" @pause="onMusicAudioPause" @waiting="onMusicAudioWaiting" @canplay="onMusicAudioCanPlay" @error="onMusicAudioError" @ended="onMusicAudioEnded"></audio>
                <div class="music-app-header music-app-header-fixed">
                    <button class="back-btn music-back-btn music-back-btn-flat" @click="(music.activeTab === 'mine' && music.currentSubPage) ? (music.currentSubPage = null) : closeApp()" :aria-label="(music.activeTab === 'mine' && music.currentSubPage) ? '返回我的页面' : '返回桌面'" :title="(music.activeTab === 'mine' && music.currentSubPage) ? '返回我的页面' : '返回桌面'"><i class="fas fa-chevron-left"></i></button>
                    <div class="music-app-title-wrap music-app-title-wrap-center">
                        <div class="music-app-title music-app-title-main">SOUL MUSIC</div>
                    </div>
                    <button class="music-header-action music-header-disc-btn" @click="toggleMusicPlayPause" aria-label="播放或暂停" title="播放或暂停">
                        <span class="music-header-disc-orbit"></span>
                        <img class="music-header-disc-cover" :class="{ 'is-spinning': music.isPlaying }" :src="currentTrack.cover || selectedCharacter.avatarUrl || 'https://placehold.co/120x120?text=Char'" :alt="currentTrack.title || '当前歌曲封面'">
                    </button>
                </div>
                <div class="music-record-pet" :style="musicPetStyle" @mousedown.prevent="startMusicPetDrag" @touchstart.prevent="startMusicPetDrag">
                    <div class="music-record-pet-disc" :class="{ spinning: music.isPlaying }">
                        <div class="music-record-pet-hole"></div>
                    </div>
                </div>

                <template v-if="music.activeTab === 'home'">
                    <div class="music-page music-home-page music-home-shell">
                        
                        <section class="music-home-search-row">
                            <div class="music-home-search-inline">
                                <i class="fas fa-search"></i>
                                <input v-model="music.searchText" type="search" placeholder="搜索歌曲 / 心情 / 歌手 / 回忆" @keyup.enter="musicSearchOnlineSongs(music.searchText)">
                                <button v-if="music.searchText" class="music-home-search-clear" @click="musicClearSearch" aria-label="清空搜索"><i class="fas fa-circle-xmark"></i></button>
                            </div>
                        </section>
                
                        <section class="music-home-section" v-if="music.searchText.trim()">
                            <div class="music-section-head"><span>搜索结果</span><span>{{ (music.searchResults || []).length }} 首</span></div>
                            <div v-if="music.searchLoading" class="music-home-char-empty">正在搜索...</div>
                            <div v-else-if="music.searchError" class="music-home-char-empty">{{ music.searchError }}</div>
                            <div v-else-if="!(music.searchResults || []).length" class="music-home-char-empty">没有找到匹配歌曲，换个关键词试试。</div>
                            <div v-else class="music-home-history-list">
                                <button v-for="(song, idx) in music.searchResults.slice(0, 12)" :key="'home-search-' + (song.source || 's') + '-' + (song.id || idx)" class="music-home-history-item" @click="musicPlayFromSearch(song)">
                                    <div class="music-home-history-cover">
                                        <img :src="song.cover || 'https://placehold.co/96x96?text=Song'" alt="">
                                    </div>
                                    <div class="music-home-history-main">
                                        <div class="music-home-history-title">{{ song.title || '未知曲目' }}</div>
                                        <div class="music-home-history-sub">{{ song.artist || '未知歌手' }}</div>
                                    </div>
                                    <div class="music-home-history-action">
                                        <div class="music-home-history-time">{{ song.duration || '--:--' }}</div>
                                    </div>
                                </button>
                            </div>
                        </section>
                
                        <section class="music-home-section">
                            <div class="music-section-head"><span>为你推荐</span><span>更多</span></div>
                            <div class="music-home-card-row music-home-scroll-row">
                                <button v-for="(song, idx) in music.playlist.slice(0, 4)" :key="'home-reco-' + song.source + '_' + song.id + '_' + idx" class="music-home-playlist-card" @click="musicPlaySavedSong(song)">
                                    <div class="music-home-playlist-cover" :style="{ backgroundImage: `url(${song.cover || 'https://placehold.co/320x320?text=Playlist'})` }"></div>
                                    <div class="music-home-playlist-meta">
                                        <h3>{{ song.title || '未命名歌单曲目' }}</h3>
                                        <p>{{ song.artist || '未知歌手' }} · {{ song.source || 'music' }}</p>
                                    </div>
                                </button>
                                <div v-if="!music.playlist.length" class="music-home-char-empty">还没有歌单内容，先去发现页加载几首吧</div>
                            </div>
                        </section>
                
                        <section class="music-home-section">
                            <div class="music-section-head" style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span>Char 的歌单</span>
                                    <button class="music-home-char-feature-ai-inline" 
                                            @click.stop="musicGenerateCharPlaylistByAI(selectedCharacter || characters[0])" 
                                            :disabled="music.aiGeneratingCharId === String((selectedCharacter || characters[0])?.id || '')" 
                                            aria-label="AI生成歌单" title="AI生成歌单">
                                        <i v-if="music.aiGenerateStatusByChar?.[String((selectedCharacter || characters[0])?.id || '')] === 'loading'" class="fas fa-spinner fa-spin"></i>
                                        <i v-else-if="music.aiGenerateStatusByChar?.[String((selectedCharacter || characters[0])?.id || '')] === 'done'" class="fas fa-check"></i>
                                        <i v-else class="fas fa-hourglass-half"></i>
                                    </button>
                                </div>
                                <span>私人收藏</span>
                            </div>
                            
                            <div class="music-home-char-stack">
                                <div v-for="char in (characters || []).filter(Boolean)" 
                                     :key="'home-char-playlist-' + (char?.id ?? char?.name ?? Math.random())" 
                                     class="music-home-char-feature"
                                     @click="musicPlayCharPlaylistWith(char)"> 
                                    <div class="music-home-char-feature-avatar">
                                        <img :src="char?.avatarUrl || 'https://placehold.co/120x120?text=Char'" :alt="char?.nickname || char?.name || 'Char'">
                                    </div>
                                    <div class="music-home-char-feature-main">
                                        <div class="music-home-char-feature-title">{{ char?.nickname || char?.name || 'Char' }} 的歌单</div>
                                        <div class="music-home-char-feature-sub">{{ (music.recents.filter(s => s.characterId === char?.id).length || music.playlist.length || 48) }} 首 · {{ char?.nickname || char?.name || 'Kumo' }} 创建</div>
                                    </div>
                                    <button class="music-home-char-feature-play" @click.stop="musicPlayCharPlaylistWith(char)" type="button" aria-label="播放歌单" @keydown.enter.stop.prevent="musicPlayCharPlaylistWith(char)" @keydown.space.stop.prevent="musicPlayCharPlaylistWith(char)">
                                        <i class="fas fa-play"></i>
                                    </button>
                                </div>
                                <div v-if="characters.length === 0" class="music-home-char-empty">还没有可显示的角色歌单</div>
                            </div>
                        </section>
                
                        <section class="music-home-section">
                            <div class="music-section-head"><span>一起听过的歌</span><span>{{ music.recents.length }} 首</span></div>
                            <div class="music-home-history-list">
                                <button v-for="song in music.recents.slice(0, 4)" :key="song.source + '_' + song.id + '-home-recent'" class="music-home-history-item" @click="musicPlaySavedSong(song)">
                                    <div class="music-home-history-cover">
                                        <img :src="song.cover" alt="">
                                    </div>
                                    <div class="music-home-history-body">
                                        <div class="music-home-history-title">{{ song.title }}</div>
                                        <div class="music-home-history-sub">{{ song.artist }}</div>
                                    </div>
                                    <div class="music-home-history-action">
                                        <div class="music-home-history-time">{{ song.duration }}</div>
                                    </div>
                                </button>
                                <div v-if="!music.recents.length" class="music-home-char-empty">今晚的收藏还在慢慢生成</div>
                            </div>
                        </section>
                    </div>
                </template>

                <template v-else-if="music.activeTab === 'discover'">
                    <div class="music-page">
                        <div class="music-now-card music-discover-player music-discover-revamp" :style="{ '--music-cover-bg': `url(${currentTrack.cover || 'https://placehold.co/1200x1200?text=Cover'})` }">
                            <div class="music-discover-couple-head">
                                <img :src="selectedCharacter.avatarUrl || 'https://placehold.co/88x88?text=Char'" class="music-discover-couple-avatar" alt="角色头像" @click.stop="showCharacterSelector = true">
                                <div class="music-discover-couple-center">
                                    <div class="music-discover-couple-name">{{ selectedCharacter.nickname || selectedCharacter.name || 'Kumo' }} & 你</div>
                                    <div class="music-discover-couple-count">一起听 · 第 {{ music.recents.length || 128 }} 次</div>
                                </div>
                                <img :src="userAvatar || 'https://placehold.co/88x88?text=Me'" class="music-discover-couple-avatar" alt="我的头像">
                            </div>

                            <div class="music-discover-glass-panel">
                                <transition name="music-fade" mode="out-in">
                                    <div v-if="music.viewMode === 'default'" key="discover-default" class="music-discover-default-wrap">
                                        <div class="music-center-content">
                                            <div class="music-discover-song-head">
                                                <img class="music-discover-song-cover" :src="currentTrack.cover || 'https://placehold.co/240x240?text=Cover'" alt="歌曲封面">
                                                <div class="music-discover-song-meta">
                                                    <h2>{{ currentTrack.title }}</h2>
                                                    <p>{{ currentTrack.artist }}</p>
                                                </div>
                                            </div>
                                            <div class="lyrics-container music-mini-lyrics" ref="lyricsScrollBox">
                                                <div class="music-mini-lyrics-inner" :style="{ transform: `translateY(${music.lyricTranslateY || 0}px)` }">
                                                    <p v-for="(line, idx) in (music.lyricLines.length ? music.lyricLines : [{ text: '暂无歌词，先享受旋律。' }])" :key="idx" class="lyric-line music-mini-lyric-line" :class="{ active: idx === music.activeLyricIndex }">{{ line.text }}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-else-if="music.viewMode === 'private'" key="discover-private" class="music-discover-private-wrap journal-canvas">
                                        <div class="journal-block journal-top">
                                            <div class="journal-label-row">
                                                <div class="journal-label">{{ selectedCharacter.nickname || selectedCharacter.name || 'Kumo' }} 的手记</div>
                                                <button class="journal-ai-btn" @click="askMusicCharComment(currentTrack)" :disabled="music.aiJournalLoading" aria-label="AI 生成手记感谢">
                                                    <i class="fas" :class="music.aiJournalLoading ? 'fa-spinner fa-spin' : 'fa-hourglass-half'"></i>
                                                </button>
                                            </div>
                                            <p>{{ music.aiJournalText || '' }}</p>
                                            <div class="journal-stamp">{{ music.aiJournalLoading ? '生成中...' : fullDate }}</div>
                                        </div>

                                        <div class="journal-block journal-bottom">
                                            <div class="journal-label">我的感悟</div>
                                            <p v-if="music.myJournalInput" style="font-size:20px;line-height:1.5;">{{ music.myJournalInput }}</p>
                                            <p v-if="music.myJournalReply"><strong>{{ selectedCharacter.nickname || selectedCharacter.name || 'Kumo' }}：</strong>{{ music.myJournalReply }}</p>
                                            <div class="journal-stamp">{{ fullDate }}</div>
                                        </div>

                                        <div class="journal-compose-hint">
                                            <input
                                                v-model="music.myJournalInput"
                                                class="journal-inline-input"
                                                type="text"
                                                placeholder=""
                                                @keydown.enter.prevent="musicReplyToMyJournal; music.myJournalInput = ''"
                                            >
                                            <div class="journal-compose-line-wrap">
                                                <div class="journal-compose-line"></div>
                                                <button class="journal-archive-btn" aria-label="封存日记"><i class="fas fa-box-archive"></i></button>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-else key="discover-public" class="music-discover-public-wrap">
                                        <div class="music-discover-public-scroll">
                                            <div v-if="music.publicCommentsLoading" class="music-public-loading">正在抓取这首歌的评论...</div>
                                            <div class="music-public-item" v-for="(c, i) in music.publicComments" :key="'pub-'+i">
                                                <img class="music-public-avatar" :src="c.avatar || `https://picsum.photos/seed/music-comment-${i+1}/64/64`" alt="头像">
                                                <div class="music-public-body">
                                                    <div class="music-public-meta">{{ c.n }}<span v-if="c.d"> · {{ c.d }}</span></div>
                                                    <div class="music-public-text">{{ c.t }}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="music-discover-input-shell">
                                            <input class="music-discover-input" type="text" placeholder="留下你的评论...">
                                        </div>
                                    </div>
                                </transition>

                                <div class="music-discover-bottom-block">
                                    <div class="music-progress-shell" @click="musicSeekFromEvent" role="slider" aria-label="播放进度">
                                        <div class="music-progress-bar">
                                            <div class="music-progress-fill" :style="{ width: String(progressPercent || 0) + '%' }"></div>
                                            <span class="music-progress-thumb" :style="{ left: String(progressPercent || 0) + '%' }"></span>
                                        </div>
                                        <div class="music-progress-text">
                                            <span>{{ currentTimeText }}</span>
                                            <span>{{ durationText }}</span>
                                        </div>
                                    </div>

                                    <div class="music-discover-actions-row">
                                        <button class="music-icon-btn music-discover-float-action" :class="{ active: music.viewMode === 'private' }" aria-label="乐评" @click="music.viewMode = (music.viewMode === 'private' ? 'default' : 'private')"><i class="fas fa-compact-disc"></i><span>乐评</span></button>
                                        <button class="music-icon-btn music-discover-float-action" :class="{ active: music.viewMode === 'public' }" aria-label="评论区" @click="(music.viewMode === 'public' ? (music.viewMode = 'default') : (music.viewMode = 'public', fetchPublicCommentsForCurrentTrack()))"><i class="far fa-comment-dots"></i><span>评论区</span><em class="music-action-badge" v-if="(music.publicComments || []).length">{{ (music.publicComments || []).length > 99 ? '99+' : (music.publicComments || []).length }}</em></button>
                                        <button class="music-icon-btn music-discover-float-action" :class="{ active: isCurrentFavorite }" @click="musicToggleFavorite(currentTrack)" aria-label="收藏"><i class="fas" :class="isCurrentFavorite ? 'fa-star' : 'far fa-star'"></i><span>{{ isCurrentFavorite ? '已收藏' : '收藏' }}</span></button>
                                    </div>

                                    <div class="music-now-controls">
                                        <button class="music-icon-btn big" @click="musicPlayPrevious"><i class="fas fa-backward-step"></i></button>
                                        <button class="music-icon-btn play" @click="toggleMusicPlayPause"><i class="fas" :class="music.isLoading ? 'fa-spinner fa-spin' : (music.isPlaying ? 'fa-pause' : 'fa-play')"></i></button>
                                        <button class="music-icon-btn big" @click="musicPlayNext"><i class="fas fa-forward-step"></i></button>
                                    </div>
                                    <div class="music-discover-next-tip" v-if="music.playlist.length > 1">
                                        下一首：{{ music.playlist[(music.activeIndex + 1) % music.playlist.length]?.title || '待定曲目' }}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-if="music.showPlaylist" class="music-playlist-panel">
                            <div class="music-playlist-head">
                                <span>播放列表</span>
                                <span>{{ music.playlist.length }} 首</span>
                            </div>
                            <div class="music-playlist-list">
                                <div v-for="(song, index) in music.playlist" :key="song.source + '_' + song.id + '_' + index" class="music-playlist-item" :class="{ active: music.activeIndex === index }" @click="musicPlayFromQueue(index)" role="button" tabindex="0" @keyup.enter="musicPlayFromQueue(index)">
                                    <img class="music-playlist-cover" :src="song.cover" alt="">
                                    <div>
                                        <div class="music-playlist-title">{{ song.title }}</div>
                                        <div class="music-playlist-sub">{{ song.artist }} · {{ song.source }}</div>
                                    </div>
                                    <span class="music-playlist-duration">{{ song.duration }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>

                <template v-else-if="music.activeTab === 'wander'">
                    <div class="music-page music-wander-page">
                        <div class="music-wander-head">
                            <div>
                                <h3>漫游中...</h3>
                                <p>深夜 · 东京</p>
                            </div>
                        </div>

                        <div class="music-wander-chat" ref="wanderChatBox">
                            <div v-if="!music.wanderMessages.length" class="wander-empty-state">
                                <div class="wander-empty-title">开始一段漫游聊天</div>
                                <div class="wander-empty-desc">你可以先发一句，或者点击表情、引用上一条消息。对方会结合人设和当前歌曲回应你。</div>
                            </div>
                            <div v-for="msg in music.wanderMessages" :key="msg.id" class="wander-row" :class="msg.sender === 'user' ? 'right' : 'left'" @contextmenu="onMessageContextMenu($event, msg)" @touchstart="onMessageTouchStart($event, msg)" @touchmove="onMessageTouchMove" @touchend="onMessageTouchEnd">
                                <div class="wander-bubble-wrap">
                                    <div class="wander-bubble" :class="{ recalled: msg.recalled, user: msg.sender === 'user', ai: msg.sender !== 'user' }">
                                        <template v-if="msg.quoteFrom"><div class="wander-quote">{{ msg.quoteFrom }}</div></template>
                                        <div class="wander-text">{{ msg.text }}</div>
                                    </div>
                                </div>
                            </div>
                            <div v-if="music.aiJournalLoading" class="wander-reply-state wander-reply-state-global"><span class="wander-reply-dot"></span>{{ selectedCharacter.nickname || selectedCharacter.name || 'Kumo' }} 正在回复中...</div>
                        </div>

                        <div class="music-wander-inputbar">
                            <button class="wander-icon" @click="music.wanderEmojiOpen = !music.wanderEmojiOpen"><i class="far fa-face-smile"></i></button>
                            <input v-model="music.wanderInput" type="text" :placeholder="`想对 ${selectedCharacter.nickname || selectedCharacter.name || 'Kumo'} 说点什么...`" @keydown.enter.prevent="sendWanderMessage">
                            <button class="wander-send" @click="sendWanderMessage"><i class="far fa-paper-plane"></i></button>
                        </div>
                        <div v-if="music.wanderEmojiOpen" class="wander-emoji-panel">
                            <button v-for="e in ['😀','🥺','😭','✨','🌙','🎧','💭','🖤']" :key="e" @click="insertWanderEmoji(e)">{{ e }}</button>
                        </div>
                    </div>
                </template>

                <template v-else>
                    <div v-if="music.currentSubPage" class="music-page music-page-sub-host">
                        <sub-playlist
                            :title="music.currentSubPage === 'liked' ? '我喜欢的音乐' : (music.currentSubPage === 'shared' ? '一起听过的歌' : (music.currentSubPage === 'xuly' ? (selectedCharacter.nickname || selectedCharacter.name || '许临野') + ' 的歌单' : '治愈时刻'))"
                            :description="music.currentSubPage === 'liked' ? '你点过收藏的歌曲都会在这里。' : (music.currentSubPage === 'shared' ? '和 TA 一起听过的历史播放记录。' : (music.currentSubPage === 'xuly' ? '这个人的专属歌单，和首页保持一致。' : '随便放一点轻松的歌。'))"
                            :tracks="(music.currentSubPage === 'liked' ? music.favorites : (music.currentSubPage === 'shared' ? music.recents : (music.currentSubPage === 'xuly' ? (music.charPlaylists || []) : (music.recommendedPlaylists || music.playlist.slice(0, 20))))).slice(0, 20).map((track, i) => ({ id: 'sub-' + i, title: track.title, artist: track.artist, time: track.duration, cover: track.cover }))"
                            @back="music.currentSubPage = null"
                            @play-all="music.playlist.length && musicPlayFromQueue(0)"
                            @play-track="(_track, i) => musicPlayFromQueue(i)"
                        ></sub-playlist>
                    </div>
                    <div v-else class="music-page music-mine-page">
                        <section class="mine-hero">
                            <img class="mine-hero-avatar" :src="userAvatar || 'https://picsum.photos/200/200'" alt="我的头像">
                            <div class="mine-hero-main">
                                <div class="mine-hero-title mine-edit-trigger" @click="openMineProfileEditor('title')">{{ mineHeroTitle }}</div>
                                <div class="mine-hero-sub mine-edit-trigger" @click="openMineProfileEditor('sub')">{{ mineHeroSub }}</div>
                                <div class="mine-hero-quote mine-edit-trigger" @click="openMineProfileEditor('quote')">{{ mineHeroQuote }}</div>
                            </div>
                        </section>

                        <transition name="mine-float-fade">
                            <div v-if="showMineProfileEditor" class="mine-edit-overlay" @click="closeMineProfileEditor">
                                <div class="mine-edit-sheet" @click.stop>
                                    <div class="mine-edit-kicker">编辑资料</div>
                                    <div class="mine-edit-title">{{ mineProfileField === 'title' ? '昵称' : (mineProfileField === 'sub' ? '灵魂编号' : '签名') }}</div>
                                    <input
                                        v-if="mineProfileField === 'title'"
                                        v-model="mineHeroTitleInput"
                                        class="mine-edit-input"
                                        type="text"
                                        placeholder="输入昵称"
                                        autofocus
                                    >
                                    <input
                                        v-else-if="mineProfileField === 'sub'"
                                        v-model="mineHeroSubInput"
                                        class="mine-edit-input"
                                        type="text"
                                        placeholder="输入灵魂编号"
                                        autofocus
                                    >
                                    <input
                                        v-else
                                        v-model="mineHeroQuoteInput"
                                        class="mine-edit-input"
                                        type="text"
                                        placeholder="输入签名"
                                        autofocus
                                    >
                                    <div class="mine-edit-actions">
                                        <button class="mine-edit-btn ghost" @click="closeMineProfileEditor">取消</button>
                                        <button class="mine-edit-btn solid" @click="saveMineProfileField">保存</button>
                                    </div>
                                </div>
                            </div>
                        </transition>

                        <section class="mine-stats-grid">
                            <div><strong>{{ music.recents.length || 124 }}</strong><span>一起听歌（天）</span></div>
                            <div><strong>{{ music.recents.length + 258 }}</strong><span>一起听过（首）</span></div>
                            <div><strong>{{ music.favorites.length || 56 }}</strong><span>共同收藏（首）</span></div>
                            <div><strong>27</strong><span>评论（条）</span></div>
                        </section>

                        <section class="mine-memory-card">
                            <img :src="currentTrack.cover || 'https://picsum.photos/200/200'" alt="cover">
                            <div>
                                <h4>我们的音乐记忆</h4>
                                <p>属于你和 {{ selectedCharacter.nickname || selectedCharacter.name || 'Kumo' }} 的时光</p>
                            </div>
                            <div class="mine-memory-hours">124 小时<br><small>一起听歌的总时长</small></div>
                        </section>

                        <section class="mine-row-head"><h3>最近一起听</h3><button>更多 <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button></section>
                        <section class="mine-song-row" @click="musicPlaySavedSong(currentTrack)">
                            <img :src="currentTrack.cover || 'https://picsum.photos/200/200'" alt="cover">
                            <div><h4>{{ currentTrack.title }}</h4><p>{{ currentTrack.artist }}</p></div>
                            <button class="mine-song-play" aria-label="播放"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6v12l10-6z"/></svg></button>
                        </section>

                        <section class="mine-row-head"><h3>我的收藏</h3><button>创建歌单 <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></section>
                        <section class="mine-collection-grid" :style="mineCollectionBg ? { background: `linear-gradient(rgba(8,8,12,.42), rgba(8,8,12,.42)), url(${mineCollectionBg}) center/cover no-repeat`, borderRadius: '18px', padding: '12px', boxShadow: '0 10px 30px rgba(0,0,0,.18)' } : {}">
                            <button class="mine-collection-card" @click="music.currentSubPage = 'liked'"><span class="mine-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 21s-7-4.35-9.5-8C.5 9.5 2.5 5 7 5c2 0 3.4 1 5 2.6C13.6 6 15 5 17 5c4.5 0 6.5 4.5 4.5 8-2.5 3.65-9.5 8-9.5 8z"/></svg></span><div><h4>我喜欢的音乐</h4><p>{{ music.favorites.length || 0 }} 首</p></div></button>
                            <button class="mine-collection-card" @click="music.currentSubPage = 'shared'"><span class="mine-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 15V9m16 6V9M8 17V7m8 10V7"/><path d="M2 15h4m12 0h4"/></svg></span><div><h4>一起听过的歌</h4><p>{{ music.recents.length || 0 }} 首</p></div></button>
                            <button class="mine-collection-card" @click="music.currentSubPage = 'xuly'"><span class="mine-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.4l6.1-.9z"/></svg></span><div><h4>{{ selectedCharacter.nickname || selectedCharacter.name || 'Kumo' }} 的歌单</h4><p>{{ (music.charPlaylists || []).length || 0 }} 首</p></div></button>
                            <button class="mine-collection-card" @click="music.currentSubPage = 'heal'"><span class="mine-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M14 3a8 8 0 108 8 7 7 0 01-8-8z"/></svg></span><div><h4>治愈时刻</h4><p>{{ (music.recommendedPlaylists || []).length || 0 }} 首</p></div></button>
                        </section>
                        <section class="mine-row-head"><h3>设置</h3><button>背景 <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M7 12h10M10 17h4"/></svg></button></section>
                        <section class="mine-profile-editor" style="margin-top:10px;padding:14px;border-radius:18px;background:linear-gradient(160deg,rgba(20,22,34,.58),rgba(16,18,28,.38));border:1px solid rgba(255,255,255,.10);box-shadow:0 12px 34px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.06);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);">
                            <div class="mine-profile-editor-title" style="color:rgba(255,255,255,.92);font-weight:700;letter-spacing:.2px;margin-bottom:10px;">我的背景</div>
                            <div style="position:relative;height:110px;border-radius:14px;overflow:hidden;margin-bottom:12px;background:linear-gradient(135deg,#0f0f10,#161616 50%,#202020);border:1px solid rgba(255,255,255,.14);box-shadow:inset 0 0 0 1px rgba(255,255,255,.05);">
                                <div :style="mineCollectionBg ? { position:'absolute', inset:'0', background:`linear-gradient(180deg,rgba(0,0,0,.32),rgba(0,0,0,.52)),url(${mineCollectionBg}) center/cover no-repeat` } : { position:'absolute', inset:'0', background:'linear-gradient(120deg,rgba(255,255,255,.08),rgba(255,255,255,.03),rgba(0,0,0,.22))' }"></div>
                                <div style="position:absolute;left:12px;bottom:10px;color:rgba(255,255,255,.86);font-size:12px;letter-spacing:.3px;">当前背景预览</div>
                            </div>
                            <div class="mine-profile-editor-grid" style="display:block;">
                                <input v-model="mineCollectionBgInput" type="url" class="mine-beauty-input" placeholder="粘贴背景图链接（https://...）" style="width:100%;height:38px;padding:0 12px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.08);color:rgba(255,255,255,.92);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);outline:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.08);">
                            </div>
                            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
                                <button @click="applyMineCollectionBgLink" style="height:34px;padding:0 14px;border:none;border-radius:999px;background:linear-gradient(135deg,#f2f2f2,#bdbdbd);color:#111;font-size:12px;font-weight:600;letter-spacing:.2px;box-shadow:0 8px 20px rgba(0,0,0,.26);">应用背景</button>
                                <button @click="clearMineCollectionBg" style="height:34px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.06);color:rgba(255,255,255,.86);font-size:12px;font-weight:600;">清除背景</button>
                            </div>
                        </section>
                    </div>
                </template>

                <div class="music-bottom-nav">
                    <button class="music-bottom-tab" :class="{ active: music.activeTab === 'home' }" @click="music.activeTab = 'home'">
                        <i class="fas fa-house"></i>
                        <span>首页</span>
                    </button>
                    <button class="music-bottom-tab" :class="{ active: music.activeTab === 'discover' }" @click="music.activeTab = 'discover'">
                        <i class="fas fa-compass"></i>
                        <span>发现</span>
                    </button>
                    <button class="music-bottom-tab" :class="{ active: music.activeTab === 'wander' }" @click="music.activeTab = 'wander'">
                        <i class="fas fa-moon"></i>
                        <span>漫游</span>
                    </button>
                    <button class="music-bottom-tab" :class="{ active: music.activeTab === 'mine' }" @click="music.activeTab = 'mine'">
                        <i class="far fa-user"></i>
                        <span>我的</span>
                    </button>
                </div>

            </div>
        </div>

</template>

<script>
import { inject } from 'vue';

export default {
    name: 'MusicApp',
    setup() {
        return inject('globalState');
    }
}
</script>
