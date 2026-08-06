<template>
        <!-- Ember App - Threads-like (AI Netizens) -->
        <div  class="app-view ember-app">
            <!-- Top App Bar -->
            <div class="p-topbar" style="position: relative; justify-content: center;">
                <button class="p-icon-btn" @click="ember.activeNavTab === 'post' ? ember.activeNavTab = 'home' : closeApp()" style="position: absolute; left: 16px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <div class="p-logo-container" style="align-items: center;">
                    <div class="p-logo-title" style="font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; letter-spacing: 2px;">EMBER</div>
                </div>
            </div>


            <!-- Content Area -->
            <div class="p-content">
                
                <!-- Home Tab -->
                <div v-show="ember.activeNavTab === 'home'">
                    <!-- Dynamic Hero Banner -->
                    <div class="p-hero" style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 16px;">
                        <img :src="ember.currentSectionImage" style="width: 80px; height: 80px; border-radius: 20px; object-fit: cover; border: 1px solid var(--ink);">
                        <div class="p-hero-title" style="font-size: 28px; letter-spacing: 2px;">{{ ember.currentSectionName === '闲聊八卦' ? 'WELCOME BACK.' : ember.currentSectionName }}</div>
                        <div class="p-hero-sub" style="margin-top: 0;">{{ ember.currentSectionDesc }}</div>
                    </div>

                    <div class="p-section-header">
                        <div class="p-section-title">{{ ember.currentSectionName === '闲聊八卦' ? '精选讨论' : ember.currentSectionName }}</div>
                        <div class="p-section-more" v-if="ember.activeSectionId !== 'default'" @click="ember.activeSectionId = 'default'" style="cursor: pointer;">返回大厅</div>
                        <div class="p-section-more" v-else>更多 ></div>
                    </div>

                    <div v-if="ember.loading" style="text-align:center; padding: 20px; color: var(--p-text-muted);">
                        Loading...
                    </div>
                    <div v-else-if="ember.rootPosts.length === 0" style="text-align:center; padding: 40px; color: var(--p-text-muted);">
                        还没有动态
                    </div>

                    <template v-else v-for="post in ember.rootPosts" :key="post.id">
                        <div class="p-card" @click="ember.viewPost(post)" style="cursor: pointer;">
                            <div class="p-card-header">
                                <img class="p-avatar" :src="post.avatar" :alt="post.authorName" @click.stop="ember.viewUserProfile({name: post.authorName, avatar: post.avatar})" style="cursor: pointer;">
                                <div class="p-card-user">
                                    <span class="p-username">{{ post.authorName }}</span>
                                    <span class="p-badge" v-if="post.authorName !== '我'">置顶</span>
                                </div>
                                <span class="p-time">{{ post.timeLabel }}</span>
                            </div>
                            
                            <div class="p-card-body">
                                <div class="p-card-content">
                                    <div class="p-card-title" v-html="ember.formatPostContent(post.title || post.content.split('。')[0] || post.content)"></div>
                                    <div class="p-card-abstract" v-html="ember.formatPostContent(post.content)"></div>
                                </div>
                                <!-- Mock Thumbnail since we don't have real images in DB -->
                                <img class="p-card-thumb" src="https://placehold.co/400x200/222/666?text=Image" alt="thumb">
                            </div>

                            <div class="p-card-footer">
                                <div class="p-card-actions">
                                    <button class="p-action" @click.stop="ember.toggleLike(post.id)" :class="{ active: post.likedByMe }">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                        {{ post.likeCount || '1.2k' }}
                                    </button>
                                    <button class="p-action" @click.stop="ember.openComposer(post)">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                        {{ post.replyCount || '89' }}
                                    </button>
                                    <button class="p-action" @click.stop="ember.generateAiReply(post)" style="opacity: 0.5;">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 10 20 15 15 20"></polyline><path d="M4 4v7a4 4 0 0 0 4 4h12"></path></svg>
                                        AI
                                    </button>
                                    <button class="p-action" v-if="post.authorName === '我'" @click.stop="ember.deleteMyPost(post.id)" style="color: #FF453A;">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                                <div class="p-footer-right">最后回复 30 分钟前</div>
                            </div>

                            <!-- Nested Replies (if any) -->
                            <div class="p-replies" v-if="ember.repliesFor(post.id).length">
                                <div class="p-reply" v-for="r in ember.repliesFor(post.id)" :key="r.id">
                                    <span class="p-reply-author">{{ r.authorName }}：</span>
                                    <span class="p-reply-text">{{ r.content }}</span>
                                </div>
                            </div>
                        </div>
                    </template>
                </div>

                <!-- Sections Tab -->
                <div v-show="ember.activeNavTab === 'sections'" class="p-tab-view p-sections-view">

                    <div class="p-section-header">
                        <div class="p-section-title">我的圈子</div>
                        <div class="p-section-more" style="cursor: pointer; display: flex; align-items: center;" @click="ember.handleCreateSection()">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 16px; height: 16px; margin-right: 4px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            新建圈子
                        </div>
                    </div>
                    <div class="p-list-view" v-if="ember.customSections.length > 0">
                        <div class="p-list-item" v-for="section in ember.customSections" :key="section.id">
                            <img :src="section.image" class="p-list-avatar">
                            <div class="p-list-info">
                                <div class="p-list-title">{{ section.name }}</div>
                                <div class="p-list-desc">{{ section.desc ? (section.desc.length > 6 ? section.desc.substring(0, 6) + '...' : section.desc) : '' }}</div>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <button class="p-btn-outline" style="border-color: #F48FB1; color: #F48FB1; padding: 0 16px; height: 32px; border-radius: 16px; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; line-height: 1;" @click="ember.deleteCustomSection(section.id)">删除</button>
                                <button class="p-btn-outline" style="border-color: var(--p-accent); color: var(--p-accent); padding: 0 16px; height: 32px; border-radius: 16px; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; line-height: 1;" @click="ember.enterSection(section.id)">进入</button>
                            </div>
                        </div>
                    </div>
                    <div v-else style="text-align: center; color: var(--p-text-muted); font-size: 13px; padding: 20px 0;">
                        你还没有创建任何自定义圈子
                    </div>

                    <div class="p-section-header" style="margin-top: 30px;">
                        <div class="p-section-title">热门圈子</div>
                        <div class="p-section-more" style="cursor: pointer; display: flex; align-items: center; color: #B39DDB;" @click="ember.generateAiSection()">
                            <span v-if="ember.generatingSection" style="margin-right: 4px;">生成中...</span>
                            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 16px; height: 16px; margin-right: 4px;"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                            AI 随机建圈
                        </div>
                    </div>
                    <div class="p-list-view">
                        <div class="p-list-item" v-for="hSec in ember.hotSections" :key="hSec.id">
                            <img :src="hSec.image" class="p-list-avatar">
                            <div class="p-list-info">
                                <div class="p-list-title">{{ hSec.name }}</div>
                                <div class="p-list-desc">{{ hSec.desc ? (hSec.desc.length > 6 ? hSec.desc.substring(0, 6) + '...' : hSec.desc) : '' }}</div>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <button class="p-btn-outline" style="border-color: #B39DDB; color: #B39DDB; padding: 0 16px; height: 32px; border-radius: 16px; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; line-height: 1;" @click="ember.followHotSection(hSec)">关注</button>
                                <button class="p-btn-outline" style="border-color: var(--p-accent); color: var(--p-accent); padding: 0 16px; height: 32px; border-radius: 16px; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; line-height: 1;" @click="ember.enterSection(hSec.id)">进入</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Messages Tab -->
                <div v-show="ember.activeNavTab === 'messages'" class="p-tab-view p-messages-view">
                    <div class="p-messages-header">
                        <div class="p-msg-tab" :class="{active: ember.activeMsgTab === 'mentions'}" @click="ember.activeMsgTab = 'mentions'">提及</div>
                        <div class="p-msg-tab" :class="{active: ember.activeMsgTab === 'notifications'}" @click="ember.activeMsgTab = 'notifications'">通知</div>
                        <div class="p-msg-tab" :class="{active: ember.activeMsgTab === 'dms'}" @click="ember.activeMsgTab = 'dms'">私信</div>
                    </div>
                    
                    <div class="p-msg-list">
                        <!-- Mentions -->
                        <template v-if="ember.activeMsgTab === 'mentions'">
                            <div class="p-msg-item" v-for="msg in ember.mentionsList" :key="msg.id" :class="{unread: msg.unread}" @click="ember.handleMentionClick(msg)" style="cursor: pointer;">
                                <div class="p-msg-avatar-wrap">
                                    <img :src="msg.avatar" class="p-avatar" @click.stop="ember.viewUserProfile({name: msg.name, avatar: msg.avatar})" style="cursor: pointer;">
                                    <div class="p-msg-dot" v-if="msg.unread"></div>
                                </div>
                                <div class="p-msg-content">
                                    <div class="p-msg-top">
                                        <span class="p-msg-name">{{ msg.name }}</span>
                                        <span class="p-time">{{ msg.time }}</span>
                                    </div>
                                    <div class="p-msg-text">{{ msg.text }}</div>
                                </div>
                            </div>
                        </template>
                        
                        <!-- Notifications -->
                        <template v-if="ember.activeMsgTab === 'notifications'">
                            <div class="p-msg-item" v-for="msg in ember.notificationsList" :key="msg.id" :class="{unread: msg.unread}">
                                <div class="p-msg-avatar-wrap">
                                    <img :src="msg.avatar" class="p-avatar" @click.stop="ember.viewUserProfile({name: msg.name, avatar: msg.avatar})" style="cursor: pointer;">
                                    <div class="p-msg-dot" v-if="msg.unread"></div>
                                </div>
                                <div class="p-msg-content">
                                    <div class="p-msg-top">
                                        <span class="p-msg-name">{{ msg.name }}</span>
                                        <span class="p-time">{{ msg.time }}</span>
                                    </div>
                                    <div class="p-msg-text">{{ msg.text }}</div>
                                </div>
                            </div>
                        </template>

                        <!-- Direct Messages -->
                        <template v-if="ember.activeMsgTab === 'dms'">
                            <div class="p-msg-item" v-for="msg in ember.dmsList" :key="msg.id" :class="{unread: msg.unread}" @click="ember.openChat(msg)" style="cursor: pointer;">
                                <div class="p-msg-avatar-wrap">
                                    <img :src="msg.avatar" class="p-avatar" @click.stop="ember.viewUserProfile({name: msg.name, avatar: msg.avatar})" style="cursor: pointer;">
                                    <div class="p-msg-dot" v-if="msg.unread"></div>
                                </div>
                                <div class="p-msg-content">
                                    <div class="p-msg-top">
                                        <span class="p-msg-name">{{ msg.name }}</span>
                                        <span class="p-time">{{ msg.time }}</span>
                                    </div>
                                    <div class="p-msg-text">{{ msg.text }}</div>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>

                <!-- Profile Tab -->
                <div v-show="ember.activeNavTab === 'profile'" class="p-tab-view p-profile-view">
                    <div class="p-profile-cover">
                        <img :src="ember.currentUser.bg" alt="cover">
                    </div>
                    <div class="p-profile-info">
                        <img :src="ember.currentUser.avatar" class="p-profile-avatar">
                        <div class="p-profile-name" style="display: flex; align-items: center; justify-content: space-between;">
                            <span>{{ ember.currentUser.name }}</span>
                            <button @click="ember.openEditProfile()" style="background: transparent; border: none; color: var(--p-text-muted); padding: 4px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; opacity: 0.7; transition: opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.7">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 20px; height: 20px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                        </div>
                        <div class="p-profile-bio">{{ ember.currentUser.bio }}</div>
                        
                        <div class="p-profile-stats">
                            <div class="p-stat-item">
                                <div class="p-stat-num">128</div>
                                <div class="p-stat-label">获赞</div>
                            </div>
                            <div class="p-stat-item" @click="ember.openFollowingList()" style="cursor: pointer;">
                                <div class="p-stat-num">{{ ember.followingList.length || 0 }}</div>
                                <div class="p-stat-label">关注</div>
                            </div>
                            <div class="p-stat-item">
                                <div class="p-stat-num">1,024</div>
                                <div class="p-stat-label">粉丝</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="p-tabs" style="margin-top: 20px;">
                        <div class="p-tab" :class="{active: ember.activeProfileTab === 'posts'}" @click="ember.activeProfileTab = 'posts'">动态</div>
                        <div class="p-tab" :class="{active: ember.activeProfileTab === 'likedPosts'}" @click="ember.activeProfileTab = 'likedPosts'">点赞的帖子</div>
                        <div class="p-tab" :class="{active: ember.activeProfileTab === 'likedReplies'}" @click="ember.activeProfileTab = 'likedReplies'">点赞的评论</div>
                    </div>
                    
                    <div style="padding-top: 10px;">
                        <!-- My Posts -->
                        <template v-if="ember.activeProfileTab === 'posts'">
                            <div v-if="ember.myPosts.length === 0" style="text-align: center; padding: 40px; color: var(--p-text-muted);">还没有发布过任何动态</div>
                            <div v-else v-for="post in ember.myPosts" :key="post.id" class="p-card" @click="ember.viewPost(post)" style="cursor: pointer;">
                                <div class="p-card-header">
                                    <img class="p-avatar" :src="post.avatar" :alt="post.authorName" @click.stop="ember.viewUserProfile({name: post.authorName, avatar: post.avatar})">
                                    <div class="p-card-user">
                                        <span class="p-username">{{ post.authorName }}</span>
                                    </div>
                                    <span class="p-time">{{ post.timeLabel }}</span>
                                </div>
                                <div class="p-card-body">
                                    <h3 class="p-card-title" v-if="post.title">{{ post.title }}</h3>
                                    <div class="p-card-content">
                                        <div class="p-card-abstract" v-html="ember.formatPostContent(post.content)"></div>
                                    </div>
                                    <div class="p-card-media" v-if="post.files && post.files.length">
                                        <div class="p-media-grid" :class="'grid-' + Math.min(post.files.length, 3)">
                                            <div class="p-media-item" v-for="(f, i) in post.files.slice(0,3)" :key="i">
                                                <div class="p-media-placeholder">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width:24px;height:24px;margin-bottom:8px;opacity:0.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                                    <span style="font-size: 11px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 4px;">{{ f }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="p-card-footer">
                                    <div class="p-card-actions">
                                        <button class="p-action" @click.stop="ember.toggleLike(post.id)" :class="{ active: post.likedByMe }">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                            {{ post.likeCount || '点赞' }}
                                        </button>
                                        <button class="p-action">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                            {{ post.replyCount || '回复' }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </template>

                        <!-- Liked Posts -->
                        <template v-if="ember.activeProfileTab === 'likedPosts'">
                            <div v-if="ember.myLikedPosts.length === 0" style="text-align: center; padding: 40px; color: var(--p-text-muted);">还没有点赞过帖子</div>
                            <div v-else v-for="post in ember.myLikedPosts" :key="post.id" class="p-card" @click="ember.viewPost(post)" style="cursor: pointer;">
                                <div class="p-card-header">
                                    <img class="p-avatar" :src="post.avatar" :alt="post.authorName" @click.stop="ember.viewUserProfile({name: post.authorName, avatar: post.avatar})">
                                    <div class="p-card-user">
                                        <span class="p-username">{{ post.authorName }}</span>
                                    </div>
                                    <span class="p-time">{{ post.timeLabel }}</span>
                                </div>
                                <div class="p-card-body">
                                    <h3 class="p-card-title" v-if="post.title">{{ post.title }}</h3>
                                    <div class="p-card-content">
                                        <div class="p-card-abstract" v-html="ember.formatPostContent(post.content)"></div>
                                    </div>
                                </div>
                                <div class="p-card-footer">
                                    <div class="p-card-actions">
                                        <button class="p-action" @click.stop="ember.toggleLike(post.id)" :class="{ active: post.likedByMe }">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                            {{ post.likeCount || '点赞' }}
                                        </button>
                                        <button class="p-action">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                            {{ post.replyCount || '回复' }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </template>

                        <!-- Liked Replies -->
                        <template v-if="ember.activeProfileTab === 'likedReplies'">
                            <div v-if="ember.myLikedReplies.length === 0" style="text-align: center; padding: 40px; color: var(--p-text-muted);">还没有点赞过评论</div>
                            <div v-else v-for="reply in ember.myLikedReplies" :key="reply.id" class="p-card" style="cursor: default;">
                                <div class="p-card-header">
                                    <img class="p-avatar" :src="reply.avatar" :alt="reply.authorName" @click.stop="ember.viewUserProfile({name: reply.authorName, avatar: reply.avatar})" style="cursor: pointer;">
                                    <div class="p-card-user">
                                        <span class="p-username">{{ reply.authorName }}</span>
                                    </div>
                                    <span class="p-time">{{ reply.timeLabel }}</span>
                                </div>
                                <div class="p-card-body">
                                    <div class="p-card-content">
                                        <div class="p-card-abstract">{{ reply.content }}</div>
                                    </div>
                                </div>
                                <div class="p-card-footer">
                                    <div class="p-card-actions">
                                        <button class="p-action" @click.stop="ember.toggleLike(reply.id)" :class="{ active: reply.likedByMe }">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                            {{ reply.likeCount || '点赞' }}
                                        </button>
                                        <button class="p-action">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                            {{ reply.replyCount || '回复' }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                </div>

                <!-- Post Detail View -->
                <div v-if="ember.activeNavTab === 'post' && ember.viewingPost" class="p-tab-view p-post-detail-view" style="padding-top: 10px;">
                    <div class="p-card" style="border: none; background: transparent;">
                        <div class="p-card-header">
                            <img class="p-avatar" :src="ember.viewingPost.avatar" :alt="ember.viewingPost.authorName" @click.stop="ember.viewUserProfile({name: ember.viewingPost.authorName, avatar: ember.viewingPost.avatar})" style="cursor: pointer;">
                            <div class="p-card-user">
                                <span class="p-username" style="font-size: 16px;">{{ ember.viewingPost.authorName }}</span>
                            </div>
                            <span class="p-time">{{ ember.viewingPost.timeLabel }}</span>
                        </div>
                        
                        <div class="p-card-body">
                            <div class="p-card-content">
                                <div class="p-card-title" style="font-size: 18px;" v-html="ember.formatPostContent(ember.viewingPost.title || ember.viewingPost.content.split('。')[0] || ember.viewingPost.content)"></div>
                                <div class="p-card-abstract" style="font-size: 15px; margin-top: 8px;" v-html="ember.formatPostContent(ember.viewingPost.content)"></div>
                            </div>
                            <!-- Mock Thumbnail -->
                            <img class="p-card-thumb" src="https://placehold.co/400x200/222/666?text=Image" alt="thumb" style="width: 100%; height: auto; max-height: 300px; border-radius: 16px;">
                            <div v-if="ember.viewingPost.files && ember.viewingPost.files.length > 0" style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
                                <div v-for="file in ember.viewingPost.files" :key="file" style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 8px; font-size: 13px; color: var(--p-text-main);">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 16px; height: 16px; color: #F48FB1;"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                                    {{ file }}
                                </div>
                            </div>
                        </div>

                        <div class="p-card-footer">
                            <div class="p-card-actions">
                                <button class="p-action" @click="ember.toggleLike(ember.viewingPost.id)" :class="{ active: ember.viewingPost.likedByMe }">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                    {{ ember.viewingPost.likeCount || '1.2k' }}
                                </button>
                                <button class="p-action" @click="ember.openComposer(ember.viewingPost)">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                                    {{ ember.viewingPost.replyCount || '89' }}
                                </button>
                                <button class="p-action" @click="ember.generateAiReply(ember.viewingPost)" style="opacity: 0.5;">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 10 20 15 15 20"></polyline><path d="M4 4v7a4 4 0 0 0 4 4h12"></path></svg>
                                    AI 回复
                                </button>
                            </div>
                        </div>

                        <!-- Full Replies List -->
                        <div class="p-replies" style="margin-top: 20px; border-top: 1px solid var(--p-card-border); padding-top: 20px; gap: 16px;">
                            <div style="font-weight: 600; font-size: 16px; margin-bottom: 10px;">所有回复</div>
                            <div v-if="!ember.repliesFor(ember.viewingPost.id).length" style="color: var(--p-text-muted); font-size: 14px;">暂无回复</div>
                            <div class="p-reply" v-for="r in ember.repliesFor(ember.viewingPost.id)" :key="r.id" style="display: flex; gap: 12px; margin-bottom: 12px;">
                                <img :src="r.avatar || 'https://i.pravatar.cc/150?u=' + r.id" class="p-avatar" style="width: 36px; height: 36px; cursor: pointer;" @click.stop="ember.viewUserProfile({name: r.authorName, avatar: r.avatar || 'https://i.pravatar.cc/150?u=' + r.id})">
                                <div style="flex: 1;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                        <span class="p-reply-author" style="font-size: 14px;">{{ r.authorName }}</span>
                                        <span class="p-time" style="font-size: 12px;">{{ r.timeLabel }}</span>
                                    </div>
                                    <div class="p-reply-text" style="font-size: 14px; color: var(--p-text-main);" v-html="ember.formatPostContent(r.content)"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Composer Overlay (Bottom Sheet) -->
            <div v-if="ember.showComposer" class="p-composer-overlay" @click.self="ember.closeComposer()">
                <div class="p-editor-view">
                    <div class="p-editor-header">
                        <button class="p-editor-btn" @click="ember.closeComposer()">取消</button>
                        <button class="p-editor-btn p-editor-publish" @click="ember.publishMyPost()" :disabled="!ember.composerText">发布</button>
                    </div>

                    <div v-if="!ember.replyingTo" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 12px;">
                        <span style="font-size: 13px; color: var(--p-text-muted);">发布到:</span>
                        <select v-model="ember.composerSectionId" style="flex: 1; background: transparent; border: none; color: var(--p-text-main); font-size: 14px; font-weight: 600; outline: none; cursor: pointer;">
                            <option value="default" style="color: #000;">闲聊大厅 (默认)</option>
                            <optgroup label="我的圈子" v-if="ember.customSections.length > 0" style="color: #000;">
                                <option v-for="sec in ember.customSections" :key="sec.id" :value="sec.id">{{ sec.name }}</option>
                            </optgroup>
                            <optgroup label="热门圈子" v-if="ember.hotSections.length > 0" style="color: #000;">
                                <option v-for="sec in ember.hotSections" :key="sec.id" :value="sec.id">{{ sec.name }}</option>
                            </optgroup>
                        </select>
                    </div>

                    <input v-if="!ember.replyingTo" type="text" v-model="ember.composerTitle" placeholder="标题 (选填)" style="background: transparent; border: none; outline: none; padding: 0 0 16px 0; font-size: 20px; font-weight: 700; color: var(--p-text-main);">
                    
                    <textarea class="p-editor-input" v-model="ember.composerText" :placeholder="ember.replyingTo ? '回复 ' + ember.replyingTo.authorName + '...' : '正文 (分享你的想法...)'"></textarea>
                    <div class="p-sheet-grid" style="margin-top: 20px;">
                        <label class="p-grid-item" style="cursor: pointer; position: relative;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                            <div>
                                <div class="p-grid-item-title">多媒体分享</div>
                                <div class="p-grid-item-sub">支持图片、视频等任意文件</div>
                            </div>
                            <input type="file" multiple style="display: none;" @change="ember.handleComposerFiles($event)">
                            <div v-if="ember.composerFiles.length > 0" style="position: absolute; right: 12px; background: #F48FB1; color: #fff; font-size: 11px; font-weight: bold; padding: 2px 8px; border-radius: 10px;">
                                已选 {{ ember.composerFiles.length }} 个
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            <!-- User Profile Overlay -->
            <div v-if="ember.showUserProfileView" class="p-user-profile-overlay" style="position: absolute; inset: 0; background: var(--p-bg); z-index: 250; display: flex; flex-direction: column;">
                <div class="p-chat-header" style="display: flex; align-items: center; padding: 20px; border-bottom: 1px solid var(--p-card-border); background: var(--p-bg); position: sticky; top: 0; z-index: 10;">
                    <button @click="ember.closeUserProfile()" style="background: none; border: none; color: var(--p-text-main); font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; margin-right: 12px; border-radius: 50%;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 24px; height: 24px;"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
                    </button>
                    <span style="font-size: 18px; font-weight: 700;">用户主页</span>
                </div>
                
                <div style="padding: 30px 20px; text-align: center; border-bottom: 1px solid var(--p-card-border);">
                    <img :src="ember.viewingProfileUser.avatar" style="width: 100px; height: 100px; border-radius: 50%; border: 4px solid var(--p-accent); padding: 4px; background: var(--p-card-bg);">
                    <div style="font-size: 24px; font-weight: 700; margin-top: 16px;">{{ ember.viewingProfileUser.name }}</div>
                    <div style="color: var(--p-text-muted); font-size: 14px; margin-top: 8px;">加入 EMBER 已有 30 天</div>
                    
                    <div style="display: flex; justify-content: center; gap: 24px; margin-top: 20px;">
                        <div>
                            <div style="font-size: 18px; font-weight: bold;">128</div>
                            <div style="font-size: 12px; color: var(--p-text-muted);">关注</div>
                        </div>
                        <div>
                            <div style="font-size: 18px; font-weight: bold;">8k</div>
                            <div style="font-size: 12px; color: var(--p-text-muted);">粉丝</div>
                        </div>
                        <div>
                            <div style="font-size: 18px; font-weight: bold;">42</div>
                            <div style="font-size: 12px; color: var(--p-text-muted);">帖子</div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 12px; margin-top: 24px; justify-content: center;">
                        <button @click="ember.toggleFollowProfileUser()" :style="{ background: ember.isFollowingProfileUser ? 'rgba(255,255,255,0.1)' : 'var(--p-accent)', color: ember.isFollowingProfileUser ? 'var(--p-text-main)' : 'var(--p-bg)' }" style="border: none; padding: 10px 32px; border-radius: 24px; font-weight: bold; font-size: 15px; cursor: pointer; transition: all 0.2s;">
                            {{ ember.isFollowingProfileUser ? '已关注' : '关注' }}
                        </button>
                        <button @click="ember.openChat(ember.viewingProfileUser); ember.showUserProfileView = false;" style="background: rgba(255,255,255,0.1); color: var(--p-text-main); border: none; padding: 10px 32px; border-radius: 24px; font-weight: bold; font-size: 15px; cursor: pointer;">私信</button>
                    </div>
                </div>

                <div style="flex: 1; overflow-y: auto; padding: 20px; background: #000;">
                    <div style="font-weight: 600; font-size: 16px; margin-bottom: 16px;">最新动态</div>
                    
                    <div v-for="post in ember.profileUserPosts" :key="post.id" class="p-card" style="margin-bottom: 16px; cursor: default;">
                        <div class="p-card-header">
                            <img class="p-avatar" :src="post.avatar" :alt="post.authorName">
                            <div class="p-card-user">
                                <span class="p-username">{{ post.authorName }}</span>
                            </div>
                            <span class="p-time">{{ post.timeLabel }}</span>
                        </div>
                        <div class="p-card-body">
                            <div class="p-card-content">
                                <div class="p-card-abstract">{{ post.content }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Edit Profile Modal -->
            <div v-if="ember.showEditProfile" class="p-section-modal-overlay" @click.self="ember.showEditProfile = false">
                <div class="p-section-modal">
                    <div class="p-modal-title">编辑个人资料</div>
                    
                    <div class="p-input-group">
                        <label>昵称 (ID)</label>
                        <input type="text" class="p-input" v-model="ember.editProfileForm.name" placeholder="您的昵称">
                    </div>
                    
                    <div class="p-input-group">
                        <label>简介</label>
                        <textarea class="p-input" v-model="ember.editProfileForm.bio" placeholder="一句话介绍自己..." style="min-height: 80px; resize: none;"></textarea>
                    </div>

                    <div class="p-input-group">
                        <label>头像</label>
                        <label style="display: block; width: 64px; height: 64px; border-radius: 50%; overflow: hidden; border: 2px dashed var(--p-card-border); cursor: pointer; position: relative; background: var(--p-card-bg);">
                            <img v-if="ember.editProfileForm.avatar" :src="ember.editProfileForm.avatar" style="width: 100%; height: 100%; object-fit: cover;">
                            <div v-else style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--p-text-muted); font-size: 24px;">+</div>
                            <input type="file" style="display: none;" @change="ember.handleProfileImageUpload('avatar', $event)">
                        </label>
                    </div>

                    <div class="p-input-group">
                        <label>主页背景</label>
                        <label style="display: block; width: 100%; height: 100px; border-radius: 12px; overflow: hidden; border: 2px dashed var(--p-card-border); cursor: pointer; position: relative; background: var(--p-card-bg);">
                            <img v-if="ember.editProfileForm.bg" :src="ember.editProfileForm.bg" style="width: 100%; height: 100%; object-fit: cover;">
                            <div v-else style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--p-text-muted); font-size: 24px;">+</div>
                            <input type="file" style="display: none;" @change="ember.handleProfileImageUpload('bg', $event)">
                        </label>
                    </div>

                    <div class="p-modal-actions" style="margin-top: 24px;">
                        <button class="p-btn-outline" @click="ember.showEditProfile = false">取消</button>
                        <button class="p-btn-primary" @click="ember.saveProfile()">保存</button>
                    </div>
                </div>
            </div>

            <!-- Following List Modal -->
            <div v-if="ember.showFollowingListOverlay" class="p-section-modal-overlay" @click.self="ember.closeFollowingList()">
                <div class="p-section-modal-content" style="max-height: 80vh; overflow-y: auto;">
                    <div style="font-size: 18px; font-weight: 600; color: var(--p-text-main); margin-bottom: 20px;">我的关注</div>
                    
                    <div v-if="ember.followingList.length === 0" style="color: var(--p-text-sub); font-size: 14px; text-align: center; padding: 40px 0;">
                        还没有关注任何人
                    </div>
                    <div v-else style="display: flex; flex-direction: column; gap: 16px;">
                        <div v-for="user in ember.followingList" :key="user.name" style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 12px; cursor: pointer;" @click="ember.viewUserProfile(user); ember.closeFollowingList()">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <img :src="user.avatar || 'https://placehold.co/100x100?text=Ava'" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
                                <div>
                                    <div style="color: var(--p-text-main); font-weight: 500; font-size: 15px;">{{ user.name }}</div>
                                    <div style="color: var(--p-text-sub); font-size: 13px; margin-top: 2px;">{{ user.bio }}</div>
                                </div>
                            </div>
                            <!-- Unfollow button can go here if needed later -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Chat View Overlay -->
            <div v-if="ember.showChatView" class="p-chat-overlay" style="position: absolute; inset: 0; background: var(--p-bg); z-index: 200; display: flex; flex-direction: column;">
                <div class="p-chat-header" style="display: flex; align-items: center; padding: 20px; border-bottom: 1px solid var(--p-card-border); background: var(--p-bg); position: sticky; top: 0; z-index: 10;">
                    <button @click="ember.closeChat()" style="background: none; border: none; color: var(--p-text-main); font-size: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; margin-right: 12px; border-radius: 50%;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 24px; height: 24px;"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
                    </button>
                    <img :src="ember.currentChatUser.avatar" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 12px;">
                    <span style="font-size: 18px; font-weight: 700;">{{ ember.currentChatUser.name }}</span>
                </div>
                
                <div class="p-chat-messages" style="flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px;">
                    <div v-for="msg in ember.chatMessages" :key="msg.id" style="display: flex; flex-direction: column; max-width: 75%;" :style="{ alignSelf: msg.isMe ? 'flex-end' : 'flex-start' }">
                        <div :style="{ background: msg.isMe ? 'var(--p-accent)' : 'var(--p-card-bg)', color: msg.isMe ? 'var(--p-bg)' : 'var(--p-text-main)', padding: '12px 16px', borderRadius: msg.isMe ? '16px 16px 0 16px' : '16px 16px 16px 0', fontSize: '15px', lineHeight: '1.4' }">
                            {{ msg.text }}
                        </div>
                        <span style="font-size: 11px; color: var(--p-text-muted); margin-top: 4px;" :style="{ textAlign: msg.isMe ? 'right' : 'left' }">{{ msg.time }}</span>
                    </div>
                </div>

                <div class="p-chat-input-area" style="padding: 16px 20px 30px; background: var(--p-bg); border-top: 1px solid var(--p-card-border); display: flex; align-items: center; gap: 12px;">
                    <input type="text" v-model="ember.chatInput" @keyup.enter="ember.sendChatMessage()" placeholder="发消息..." style="flex: 1; padding: 12px 16px; border-radius: 20px; border: none; background: rgba(255,255,255,0.1); color: var(--p-text-main); font-size: 15px; outline: none;">
                    <button @click="ember.sendChatMessage()" style="background: var(--p-accent); color: var(--p-bg); border: none; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;" :style="{ opacity: ember.chatInput.trim() ? 1 : 0.5 }">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="width: 20px; height: 20px; margin-left: -2px;"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>

            <!-- Create Section Modal -->
            <div v-if="ember.showCreateSectionModal" class="p-section-modal-overlay" @click.self="ember.showCreateSectionModal = false">
                <div class="p-section-modal">
                    <div class="p-modal-title">新建圈子</div>
                    
                    <div class="p-input-group">
                        <label>圈子名称</label>
                        <input type="text" class="p-input" v-model="ember.newSectionForm.name" placeholder="例如: 赛博机械交流">
                    </div>
                    
                    <div class="p-input-group">
                        <label>自定义头像 (支持上传本地图片)</label>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <input type="text" class="p-input" v-model="ember.newSectionForm.image" placeholder="可粘贴图片URL，或点右侧上传...">
                            <label class="p-btn-outline" style="padding: 0 16px; height: 36px; border-radius: 18px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; white-space: nowrap;">
                                本地上传
                                <input type="file" style="display: none" accept="image/*" @change="ember.handleSectionImageUpload($event)">
                            </label>
                        </div>
                    </div>
                    
                    <div class="p-input-group">
                        <label>一句话简介</label>
                        <input type="text" class="p-input" v-model="ember.newSectionForm.desc" placeholder="一句话描述这个圈子...">
                    </div>

                    <div class="p-input-group">
                        <label>设置版主 (Moderator)</label>
                        <select class="p-input" v-model="ember.newSectionForm.moderatorId">
                            <option :value="null">由我担任 (You)</option>
                            <option v-for="char in characters" :key="char.id" :value="char.id">
                                {{ char.nickname || char.name }}
                            </option>
                        </select>
                    </div>

                    <div class="p-input-group">
                        <label>准入成员 (仅勾选的角色可见此圈子)</label>
                        <div class="p-char-list">
                            <div 
                                v-for="char in characters" 
                                :key="char.id"
                                class="p-char-badge"
                                :class="{ active: ember.newSectionForm.includedCharIds.includes(char.id) }"
                                @click="ember.toggleIncludedChar(char.id)"
                            >
                                <img :src="char.avatarUrl || 'https://i.pravatar.cc/150?u=' + char.id" alt="avatar">
                                {{ char.nickname || char.name }}
                            </div>
                        </div>
                    </div>

                    <div class="p-modal-actions">
                        <button class="p-modal-btn p-modal-btn-cancel" @click="ember.showCreateSectionModal = false">取消</button>
                        <button class="p-modal-btn p-modal-btn-submit" @click="ember.submitCustomSection()">创建</button>
                    </div>
                </div>
            </div>

            <!-- Bottom Nav -->
            <div class="p-bottom-nav">
                <button class="p-nav-item" :class="{ active: ember.activeNavTab === 'home' }" @click="ember.activeNavTab = 'home'; ember.onEnter()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    首页
                </button>
                <button class="p-nav-item" :class="{ active: ember.activeNavTab === 'sections' }" @click="ember.activeNavTab = 'sections'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    分区
                </button>
                <button class="p-nav-center" @click="ember.openComposer()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <button class="p-nav-item" :class="{ active: ember.activeNavTab === 'messages' }" @click="ember.activeNavTab = 'messages'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    消息
                </button>
                <button class="p-nav-item" :class="{ active: ember.activeNavTab === 'profile' }" @click="ember.activeNavTab = 'profile'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    我的
                </button>
            </div>


        </div>
        <!-- Chat Image Viewer Modal -->
        <div v-if="chatImageViewerOpen" class="image-viewer-overlay" @click.self="closeChatImageViewer">
            <div class="image-viewer" style="display: flex; flex-direction: column; position: relative;">
                <img :src="chatViewingHighResUrl" class="viewer-image" style="max-height: 80vh; max-width: 90vw; object-fit: contain; border-radius: 8px;">
                <button class="close-viewer-btn" @click="closeChatImageViewer"><i class="fas fa-times"></i></button>
                <div style="position: absolute; bottom: 20px; right: 20px; display: flex; gap: 10px; z-index: 9999;">
                    <button class="chat-btn" @click="downloadChatImage" style="background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer;">
                        <i class="fas fa-download"></i> 存图
                    </button>
                    <button v-if="chatViewingMsg && chatViewingMsg.optimizedPrompt" class="chat-btn" @click="openRerollModal" style="background: var(--ios-blue); color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,122,255,0.3);">
                        <i class="fas fa-dice"></i> 重 Roll
                    </button>
                </div>
            </div>
        </div>

        <!-- Re-roll Modal -->
        <div v-if="showRerollModal" class="modal-overlay" @click.self="closeRerollModal">
            <div class="modal-content" style="width: 90%; max-width: 500px;">
                <div class="modal-header">
                    <h3>重新生成 (Re-roll)</h3>
                    <button class="close-btn" @click="closeRerollModal"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body" style="display: flex; flex-direction: column; gap: 15px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none;">
                        <input type="checkbox" v-model="rerollUseAI">
                        <strong>AI优化提示词 (选中修改中文，取消直接修改英文Tag)</strong>
                    </label>
                    <div class="settings-group" v-if="rerollUseAI">
                        <label>原始输入 (中文)</label>
                        <textarea v-model="rerollOriginalPrompt" rows="3" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #ddd; resize: vertical;"></textarea>
                    </div>
                    <div class="settings-group" v-else>
                        <label>实际请求的英文 Tags (可直接修改)</label>
                        <textarea v-model="rerollOptimizedPrompt" rows="5" style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid #ddd; resize: vertical; font-family: monospace;"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn secondary" @click="closeRerollModal">取消</button>
                    <button class="btn primary" @click="executeReroll" :disabled="isGeneratingChatImage">
                        <i class="fas" :class="isGeneratingChatImage ? 'fa-spinner fa-spin' : 'fa-magic'"></i>
                        {{ isGeneratingChatImage ? '生成中...' : '生成并发送' }}
                    </button>
                </div>
            </div>
        </div>

</template>

<script>
import { inject } from 'vue';

export default {
    name: 'EmberApp',
    setup() {
        return inject('globalState');
    }
}
</script>
