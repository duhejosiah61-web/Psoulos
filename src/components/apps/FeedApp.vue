<template>
        <!-- Feed App -->
        <div  class="app-view feed-app">
            <div class="feed-screen" :style="feed.momentsBgStyle">
                <div class="feed-screen-overlay"></div>
                <header class="feed-topbar">
                    <button class="feed-topbar-btn" @click="goBack" aria-label="返回">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="feed-topbar-center">
                        <div class="feed-topbar-title">FEED</div>
                        <div class="feed-topbar-line"></div>
                    </div>
                    <button class="feed-topbar-btn feed-avatar-btn" @click="feed.openProfile(feed.userProfile.name)" aria-label="个人资料">
                        <img :src="feed.userProfile.avatar || 'https://placehold.co/80x80?text=Me'" alt="avatar">
                    </button>
                </header>
                <main class="feed-stage">
                    <div class="feed-card-stack">
                        <div class="feed-stack-layer feed-stack-layer-back-1"></div>
                        <div class="feed-stack-layer feed-stack-layer-back-2"></div>
                        <section v-if="feed.loading" class="feed-loading-card">
                            <div class="feed-loading-spinner"></div>
                            <div class="feed-loading-text">Loading...</div>
                        </section>
                        <section v-else class="feed-card-shell">
                            <div class="feed-card-rail" @touchstart="feed.handleCardSwipeStart" @touchmove="feed.handleCardSwipeMove" @touchend="feed.handleCardSwipeEnd">
                                <article v-for="(post, index) in feed.posts" :key="post.id" class="feed-card" :class="{ active: feed.activeCardIndex === index, prev: feed.activeCardIndex > index, next: feed.activeCardIndex < index }" :style="feed.activeCardIndex === index ? { pointerEvents: 'auto' } : { pointerEvents: 'none' }">
                                    <div class="feed-card-head">
                                        <div class="feed-user" @click="feed.openProfile(post.author)">
                                            <img :src="post.avatar || 'https://placehold.co/100x100?text=?'" class="feed-user-avatar" alt="avatar">
                                            <div class="feed-user-meta">
                                                <div class="feed-user-name">{{ post.author }}</div>
                                                <div class="feed-user-time">
                                                    <span v-if="post.location">{{ post.location }} · </span>
                                                    {{ post.time || '刚刚' }} · {{ post.visibility || '公开' }}
                                                </div>
                                            </div>
                                        </div>
                                        <div style="display: flex; gap: 8px;">
                                            <button v-if="post.author === '我'" class="feed-more-btn" @click.stop="feed.deletePost(post.id)" style="color: #ff4d4f;">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                            <button class="feed-more-btn" @click.stop="feed.triggerAIAction(post.id, characters.value || characters, activeProfile)" :disabled="feed.isGenerating(post.id)">
                                                <i v-if="feed.isGenerating(post.id)" class="fas fa-ellipsis-h fa-bounce"></i>
                                                <i v-else class="fas fa-wand-magic-sparkles"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="feed-copy">{{ post.content }}</div>
                                    <div class="feed-media" v-if="post.images && post.images.length" :class="{'grid-1': post.images.length === 1, 'grid-4': post.images.length === 4, 'grid-n': post.images.length !== 1 && post.images.length !== 4}">
                                        <div v-for="(img, idx) in post.images" :key="idx" class="feed-media-frame" @click="feed.openImageViewer(img, post.imageDescriptions && post.imageDescriptions[idx])">
                                            <img v-if="typeof img === 'string' && img.startsWith('data:image/')" :src="img" alt="post image">
                                            <div v-else-if="typeof img === 'string' && img.startsWith('mock:')" class="feed-mock-image" :style="{ background: img.replace('mock:', '') }"><span>{{ post.imageDescriptions && post.imageDescriptions[idx] ? post.imageDescriptions[idx] : '图片' }}</span></div>
                                            <div v-else-if="typeof img === 'object' && img.type === 'textImage'" class="feed-text-image" :style="{ background: img.bgColor }">{{ img.text }}</div>
                                        </div>
                                    </div>
                                    <div class="feed-actions">
                                        <button class="feed-action-btn" @click.stop="feed.toggleLike(post.id)"><i class="far fa-heart"></i></button>
                                        <button class="feed-action-btn" @click.stop="feed.toggleCommentInput(post.id)"><i class="far fa-comment"></i></button>
                                        <button class="feed-action-btn" @click.stop="feed.toggleCollect(post.id)">
                                            <i :class="post.collections && post.collections.includes('我') ? 'fas fa-bookmark' : 'far fa-bookmark'"></i>
                                        </button>
                                    </div>
                                    <div class="feed-liked-row" v-if="post.likes && post.likes.length">
                                        <img v-for="(like, i) in post.likes.slice(0, 3)" :key="i" src="https://placehold.co/48x48?text=☺" alt="like">
                                        <span>他觉得这条动态很赞</span>
                                    </div>
                                    <div class="feed-comments-preview" v-if="post.comments && post.comments.length">
                                        <div v-for="comment in post.comments" :key="comment.id" class="feed-comment-item-container">
                                            <div class="feed-comment-item">
                                                <span class="feed-comment-author">{{ comment.user }}</span>
                                                <span class="feed-comment-text">
                                                    {{ comment.content }}
                                                    <button v-if="comment.user === '我'" class="feed-comment-reply-btn" style="color:#ff4d4f" @click.stop="feed.deleteComment(post.id, comment.id)">删除</button>
                                                    <button class="feed-comment-reply-btn" @click.stop="feed.toggleReplyInput(post.id, comment.id)">回复</button>
                                                    <button class="feed-comment-reply-btn ai-action-btn" @click.stop="feed.triggerAIAction(post.id, characters.value || characters, activeProfile, comment.id)" :disabled="feed.isGenerating(post.id + '-' + comment.id)">
                                                        <i v-if="feed.isGenerating(post.id + '-' + comment.id)" class="fas fa-ellipsis-h fa-bounce"></i>
                                                        <i v-else class="fas fa-wand-magic-sparkles"></i>
                                                    </button>
                                                </span>
                                            </div>
                                            <div class="feed-comment-replies" v-if="comment.replies && comment.replies.length">
                                                <div v-for="reply in comment.replies" :key="reply.id" class="feed-comment-item feed-reply-item">
                                                    <span class="feed-comment-author">{{ reply.user }} <span style="color: rgba(255,255,255,0.4); font-weight: normal;">回复</span> {{ comment.user }}</span>
                                                    <span class="feed-comment-text">
                                                        {{ reply.content }}
                                                        <button v-if="reply.user === '我'" class="feed-comment-reply-btn" style="color:#ff4d4f" @click.stop="feed.deleteComment(post.id, comment.id, reply.id)">删除</button>
                                                        <button class="feed-comment-reply-btn" @click.stop="feed.toggleReplyInput(post.id, comment.id)">回复</button>
                                                        <button class="feed-comment-reply-btn ai-action-btn" @click.stop="feed.triggerAIAction(post.id, characters.value || characters, activeProfile, comment.id, reply.id)" :disabled="feed.isGenerating(post.id + '-' + reply.id)">
                                                            <i v-if="feed.isGenerating(post.id + '-' + reply.id)" class="fas fa-ellipsis-h fa-bounce"></i>
                                                            <i v-else class="fas fa-wand-magic-sparkles"></i>
                                                        </button>
                                                    </span>
                                                </div>
                                            </div>
                                            <!-- 楼中楼回复输入框 -->
                                            <div v-if="feed.activeReplyCommentId === comment.id && feed.activeCommentPostId === post.id" class="feed-comment-input reply-input" @click.stop>
                                                <input type="text" v-model="feed.replyInput" :placeholder="'回复 ' + comment.user + '...'" @keyup.enter="feed.submitComment(post.id, comment.id)">
                                                <button @click="feed.submitComment(post.id, comment.id)">发送</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-if="feed.activeCommentPostId === post.id && !feed.activeReplyCommentId" class="feed-comment-input" @click.stop>
                                        <input name="sp_field_47" id="sp-field-47" type="text" v-model="feed.commentInput" placeholder="说点什么..." @keyup.enter="feed.submitComment(post.id)">
                                        <button @click="feed.submitComment(post.id)">发送</button>
                                    </div>
                                    <div class="feed-card-foot">{{ index + 1 }} / {{ feed.posts.length }}</div>
                                </article>
                            </div>

                        </section>
                    </div>
                </main>
                <button class="feed-fab" @click="feed.showFabMenu = !feed.showFabMenu" aria-label="发布">
                    <i class="fas" :class="feed.showFabMenu ? 'fa-times' : 'fa-plus'"></i>
                </button>
                <div v-if="feed.showFabMenu" class="feed-fab-menu" @click.stop>
                    <button @click="feed.openCreatePost(); feed.showFabMenu = false"><i class="fas fa-pen"></i> 我发动态</button>
                    <button @click="feed.roleAction(); feed.showFabMenu = false"><i class="fas fa-wand-magic-sparkles"></i> 角色自动发</button>
                </div>
            </div>
            
            <!-- 创建帖子面板 -->
            <div v-if="feed.showCreatePost" class="create-post-overlay" @click.self="feed.closeCreatePost">
                <div class="create-post-panel">
                    <div class="create-post-header">
                        <button class="create-post-cancel" @click="feed.closeCreatePost">取消</button>
                        <span>发表</span>
                        <button class="publish-btn wechat" @click="feed.publishPost()" :disabled="!feed.newPostText.trim() && feed.newPostImages.length === 0">发表</button>
                    </div>
                    <div class="create-post-content">
                        <div class="create-post-input-row">
                            <img :src="feed.userProfile.avatar || 'https://placehold.co/100x100/333/fff?text=Me'" class="create-post-avatar">
                            <textarea name="sp_field_49" id="sp-field-49" v-model="feed.newPostText" placeholder="这一刻的想法..."></textarea>
                        </div>
                        <div class="create-post-light-options">
                            <button class="light-option-item" type="button" @click="feed.openLocationSheet()">
                                <span class="left"><i class="fas fa-location-dot"></i> 所在位置</span>
                                <span class="right">{{ feed.locationLabel() }} <i class="fas fa-chevron-right"></i></span>
                            </button>
                            <button class="light-option-item" type="button" @click="feed.openVisibilitySheet()">
                                <span class="left"><i class="fas fa-eye"></i> 谁可以看</span>
                                <span class="right">{{ feed.visibilityLabel(characters) }} <i class="fas fa-chevron-right"></i></span>
                            </button>
                            <button class="light-option-item" type="button" @click="feed.openMentionSheet()">
                                <span class="left"><i class="fas fa-at"></i> 提醒谁看</span>
                                <span class="right">{{ feed.mentionLabel(characters) }} <i class="fas fa-chevron-right"></i></span>
                            </button>
                        </div>

                        <!-- location sheet -->
                        <div v-if="feed.showLocationSheet" class="wechat-sheet-overlay" @click.self="feed.closeSheets()">
                            <div class="wechat-sheet" @click.stop>
                                <div class="wechat-sheet-head">
                                    <button class="wechat-sheet-cancel" @click="feed.closeSheets()">取消</button>
                                    <div class="wechat-sheet-title">所在位置</div>
                                    <button class="wechat-sheet-ok" @click="feed.closeSheets()">确定</button>
                                </div>
                                <div class="wechat-sheet-body">
                                    <div class="wechat-field">
                                        <input name="sp_field_50" id="sp-field-50" v-model="feed.locationText" placeholder="输入位置（可留空）" />
                                    </div>
                                    <button class="wechat-row" @click="feed.locationText=''">
                                        <span>不显示位置</span>
                                        <span class="muted">已选</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- visibility sheet -->
                        <div v-if="feed.showVisibilitySheet" class="wechat-sheet-overlay" @click.self="feed.closeSheets()">
                            <div class="wechat-sheet" @click.stop>
                                <div class="wechat-sheet-head">
                                    <button class="wechat-sheet-cancel" @click="feed.closeSheets()">取消</button>
                                    <div class="wechat-sheet-title">谁可以看</div>
                                    <button class="wechat-sheet-ok" @click="feed.closeSheets()">确定</button>
                                </div>
                                <div class="wechat-sheet-body">
                                    <button class="wechat-row" @click="feed.visibilityMode='public'">
                                        <span>公开</span>
                                        <i v-if="feed.visibilityMode==='public'" class="fas fa-check"></i>
                                    </button>
                                    <button class="wechat-row" @click="feed.visibilityMode='private'">
                                        <span>私密</span>
                                        <i v-if="feed.visibilityMode==='private'" class="fas fa-check"></i>
                                    </button>
                                    <button class="wechat-row" @click="feed.visibilityMode='partial'">
                                        <span>部分可见（选择角色）</span>
                                        <i v-if="feed.visibilityMode==='partial'" class="fas fa-check"></i>
                                    </button>

                                    <div v-if="feed.visibilityMode==='partial'" class="wechat-sub">
                                        <div class="wechat-subtitle">选择可见的角色</div>
                                        <div class="wechat-chip-wrap">
                                            <button
                                                v-for="c in characters"
                                                :key="'vis_'+c.id"
                                                class="wechat-chip"
                                                :class="{ active: feed.visibilityAllowRoleIds.includes(String(c.id)) }"
                                                @click="feed.toggleVisibilityRole(String(c.id))"
                                                type="button"
                                            >
                                                {{ c.nickname || c.name || '未命名' }}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- mention sheet -->
                        <div v-if="feed.showMentionSheet" class="wechat-sheet-overlay" @click.self="feed.closeSheets()">
                            <div class="wechat-sheet" @click.stop>
                                <div class="wechat-sheet-head">
                                    <button class="wechat-sheet-cancel" @click="feed.closeSheets()">取消</button>
                                    <div class="wechat-sheet-title">提醒谁看</div>
                                    <button class="wechat-sheet-ok" @click="feed.closeSheets()">确定</button>
                                </div>
                                <div class="wechat-sheet-body">
                                    <div class="wechat-subtitle">按标签选择（来自workshop）</div>
                                    <div class="wechat-chip-wrap">
                                        <button
                                            v-for="t in feed.allCharacterTags(characters)"
                                            :key="'tag_'+t"
                                            class="wechat-chip"
                                            :class="{ active: feed.mentionTagNames.includes(t) }"
                                            @click="feed.toggleMentionTag(t)"
                                            type="button"
                                        >
                                            #{{ t }}
                                        </button>
                                    </div>

                                    <div class="wechat-subtitle" style="margin-top:10px;">按角色选择</div>
                                    <div class="wechat-chip-wrap">
                                        <button
                                            v-for="c in characters"
                                            :key="'men_'+c.id"
                                            class="wechat-chip"
                                            :class="{ active: feed.mentionRoleIds.includes(String(c.id)) }"
                                            @click="feed.toggleMentionRole(String(c.id))"
                                            type="button"
                                        >
                                            {{ c.nickname || c.name || '未命名' }}
                                        </button>
                                    </div>

                                    <button class="wechat-row danger" style="margin-top:10px;" @click="feed.clearMentions()">
                                        <span>清空提醒</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- 图片九宫格（朋友圈样式：第一个是“+”） -->
                        <div class="create-post-images">
                            <button class="create-post-add-tile" type="button" @click="feed.openMediaSheet()" :disabled="feed.newPostImages.length >= 9">
                                <i class="fas fa-plus"></i>
                            </button>
                            <div v-for="(img, idx) in feed.newPostImages" :key="idx" class="create-post-image-wrapper">
                                <!-- 文字图预览 -->
                                <div v-if="typeof img === 'object' && img.type === 'textImage'" class="text-image-preview" :style="{ background: img.bgColor, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }">
                                    <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 14px; color: #000; text-align: center;">{{ img.text }}</span>
                                </div>
                                <!-- 普通图片预览 -->
                                <img v-else :src="img" class="create-post-image">
                                <button class="remove-image-btn" @click="feed.newPostImages.splice(idx, 1)"><i class="fas fa-times"></i></button>
                            </div>
                        </div>
                        <!-- Media picker sheet (Moments-like) -->
                        <div v-if="feed.showMediaSheet" class="wechat-sheet-overlay" @click.self="feed.closeSheets()">
                            <div class="wechat-sheet" @click.stop>
                                <div class="wechat-sheet-head">
                                    <button class="wechat-sheet-cancel" @click="feed.closeSheets()">取消</button>
                                    <div class="wechat-sheet-title">选择</div>
                                    <button class="wechat-sheet-ok" @click="feed.closeSheets()">完成</button>
                                </div>
                                <div class="wechat-sheet-body">
                                    <button class="wechat-row" @click="feed.triggerCameraUpload(); feed.closeSheets()">
                                        <span><i class="fas fa-camera"></i> 拍摄</span>
                                        <i class="fas fa-chevron-right" style="opacity:.5;"></i>
                                    </button>
                                    <button class="wechat-row" @click="feed.triggerImageUpload(); feed.closeSheets()">
                                        <span><i class="far fa-image"></i> 从相册选择</span>
                                        <i class="fas fa-chevron-right" style="opacity:.5;"></i>
                                    </button>
                                    <button class="wechat-row" @click="feed.openTextImageCreator(); feed.closeSheets()">
                                        <span><i class="fas fa-font"></i> 文字</span>
                                        <i class="fas fa-chevron-right" style="opacity:.5;"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- 文字图创建区域 -->
                    <div v-if="feed.showTextImageCreator" class="text-image-creator">
                        <div class="text-image-creator-header">
                            <button class="text-image-nav-btn" @click="feed.closeTextImageCreator">取消</button>
                            <h4>文字</h4>
                            <button class="text-image-nav-btn primary" @click="feed.addTextImageToPost()" :disabled="!feed.feedTextImageText.trim()">完成</button>
                        </div>
                        <div class="text-image-creator-content">
                            <div class="text-image-preview">
                                <div class="text-card-preview" :style="{ background: feed.feedTextImageBgColor }">
                                    <div class="text-card-decoration"></div>
                                    <div class="text-card-text">{{ feed.feedTextImageText || '输入文字...' }}</div>
                                </div>
                            </div>
                            <div class="text-image-controls">
                                <textarea name="sp_field_51" id="sp-field-51" v-model="feed.feedTextImageText" placeholder="输入要显示的文字..." class="text-image-input" maxlength="50"></textarea>
                                <div class="color-options">
                                    <span class="color-label">选择背景:</span>
                                    <div class="color-grid">
                                        <div v-for="color in feed.feedTextImageColors" :key="color" 
                                             class="color-option" 
                                             :class="{ active: feed.feedTextImageBgColor === color }"
                                             :style="{ background: color }"
                                             @click="feed.feedTextImageBgColor = color"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <input type="file" id="feed-image-input" accept="image/*" multiple style="display: none;" @change="feed.handleImageUpload">
                    <input type="file" id="feed-camera-input" accept="image/*" capture="environment" style="display: none;" @change="feed.handleImageUpload">
                </div>
            </div>
            
            <!-- 个人资料面板 -->
            <div v-if="feed.viewingUserProfile" class="profile-overlay" @click.self="feed.closeProfile">
                <div class="profile-panel">
                    <div class="profile-header">
                        <button class="back-btn-small" @click="feed.closeProfile"><i class="fas fa-arrow-left"></i></button>
                        <span>{{ feed.viewingUserProfile.name }}的资料</span>
                        <div style="width: 40px;"></div>
                    </div>
                    <div class="profile-content">
                        <div class="profile-bg" :style="{ backgroundImage: 'url(' + feed.viewingUserProfile.bgImage + ')' }">
                            <div class="profile-bg-mask"></div>
                            <div class="profile-avatar-large">
                                <img :src="feed.viewingUserProfile.avatar">
                            </div>
                        </div>
                        <div class="profile-info">
                            <h3>{{ feed.viewingUserProfile.name }}</h3>
                            <p class="profile-bio">{{ feed.viewingUserProfile.bio }}</p>
                            <div class="profile-mini-meta">
                                <span>IP属地 未知</span>
                                <span>朋友圈仅展示最近内容</span>
                            </div>
                            <div class="profile-stats">
                                <span><b>{{ feed.viewingUserPosts.length }}</b> 动态</span>
                                <span><b>{{ feed.viewingUserPosts.reduce((sum, p) => sum + ((p.likes && p.likes.length) || 0), 0) }}</b> 获赞</span>
                                <span><b>{{ feed.viewingUserPosts.reduce((sum, p) => sum + ((p.comments && p.comments.length) || 0), 0) }}</b> 评论</span>
                            </div>
                            <button v-if="feed.viewingUserProfile.isCurrentUser" class="edit-profile-btn" @click="feed.isEditingProfile = true">编辑资料</button>
                        </div>
                        
                        <!-- User Posts -->
                        <div class="profile-posts">
                            <h4>{{ feed.viewingUserProfile.name }}的朋友圈</h4>
                            <div v-if="feed.viewingUserPosts.length === 0" class="no-posts">
                                <p>还没有发布过动态</p>
                            </div>
                            <div v-else class="profile-post-list">
                                <div v-for="post in feed.viewingUserPosts" :key="post.id" class="profile-post">
                                    <div class="profile-post-content">
                                        <p class="profile-post-text">{{ post.content }}</p>
                                        
                                        <!-- Profile Post Images -->
                                        <div v-if="post.images && post.images.length" class="profile-post-images" :class="{'grid-1': post.images.length === 1, 'grid-4': post.images.length === 4, 'grid-n': post.images.length !== 1 && post.images.length !== 4}">
                                            <div v-for="(img, idx) in post.images" :key="idx" class="profile-post-image-wrap">
                                                <!-- 文字图 -->
                                                <div v-if="typeof img === 'object' && img.type === 'textImage'" class="text-image-display" :style="{ background: img.bgColor, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }">
                                                    <div class="text-image-text" style="font-family: 'Playfair Display', Georgia, serif; font-size: 14px; font-weight: 500; color: #000; text-align: center;">{{ img.text }}</div>
                                                </div>
                                                <!-- AI 生成的描述图片 -->
                                                <div v-else-if="typeof img === 'string' && img.startsWith('mock:')" class="ai-image-display" :style="{ background: img.replace('mock:', ''), padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }">
                                                    <div class="ai-image-text" style="font-family: 'Noto Serif SC', 'Playfair Display', Georgia, serif; font-size: 12px; font-weight: 400; color: #333; text-align: center; line-height: 1.4; max-height: 100%; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical;">{{ post.imageDescriptions && post.imageDescriptions[idx] ? post.imageDescriptions[idx] : '图片' }}</div>
                                                </div>
                                                <!-- 普通图片 -->
                                                <img v-else-if="typeof img === 'string'" :src="img" class="profile-post-image" @click="feed.openImageViewer(img, post.imageDescriptions && post.imageDescriptions[idx])">
                                            </div>
                                        </div>
                                        
                                        <div class="profile-post-meta">
                                            <span class="profile-post-time">{{ post.time }}</span>
                                            <div class="profile-post-actions">
                                                <span class="profile-post-action">
                                                    <i class="far fa-heart"></i>
                                                    <span>{{ post.likes ? post.likes.length : 0 }}</span>
                                                </span>
                                                <span class="profile-post-action">
                                                    <i class="far fa-comment"></i>
                                                    <span>{{ post.comments ? post.comments.length : 0 }}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 编辑资料面板 -->
            <div v-if="feed.isEditingProfile" class="edit-profile-overlay" @click.self="feed.isEditingProfile = false">
                <div class="edit-profile-panel">
                    <div class="edit-profile-header">
                        <button class="back-btn-small" @click="feed.isEditingProfile = false"><i class="fas fa-arrow-left"></i></button>
                        <span>编辑资料</span>
                        <button class="save-btn" @click="feed.saveUserProfile">保存</button>
                    </div>
                    <div class="edit-profile-content">
                        <div class="edit-avatar-section">
                            <img :src="feed.userProfile.avatar" class="edit-avatar-preview">
                            <button class="change-avatar-btn" @click="feed.triggerProfileImageUpload('avatar')">更换头像</button>
                            <input type="file" id="profile-avatar-input" accept="image/*" style="display: none;" @change="(e) => feed.handleProfileImageUpload(e, 'avatar')">
                        </div>
                        <div class="edit-bg-section">
                            <img :src="feed.userProfile.bgImage" class="edit-bg-preview">
                            <button class="change-bg-btn" @click="feed.triggerProfileImageUpload('bg')">更换背景</button>
                            <input type="file" id="profile-bg-input" accept="image/*" style="display: none;" @change="(e) => feed.handleProfileImageUpload(e, 'bg')">
                        </div>
                        <div class="edit-input-group">
                            <label>昵称</label>
                            <input name="sp_field_52" id="sp-field-52" type="text" v-model="feed.userProfile.name" placeholder="输入昵称">
                        </div>
                        <div class="edit-input-group">
                            <label>个性签名</label>
                            <textarea name="sp_field_53" id="sp-field-53" v-model="feed.userProfile.bio" placeholder="输入个性签名"></textarea>
                        </div>
                        <div class="edit-input-group">
                            <label>朋友圈背景（全面屏）</label>
                            <input name="sp_field_54" id="sp-field-54"
                                type="text"
                                :value="feed.momentsBgUrl"
                                @input="feed.setMomentsBgUrl($event.target.value)"
                                placeholder="粘贴背景图片链接"
                            >
                            <div style="font-size:12px; color:#8a8a8a; margin-top:6px;">
                                留空将恢复默认背景
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 角色发布动态面板 -->
            <div v-if="feed.showRolePostModal" class="create-post-overlay" @click.self="feed.closeRolePostModal">
                <div class="create-post-panel">
                    <div class="create-post-header">
                        <button class="back-btn-small" @click="feed.closeRolePostModal"><i class="fas fa-arrow-left"></i></button>
                        <span>角色发布</span>
                        <button class="publish-btn" @click="feed.publishRolePost(characters)" :disabled="!feed.selectedRoleId || !feed.rolePostText.trim() || feed.isGeneratingPost">发布</button>
                    </div>
                    <div class="create-post-content">
                        <div class="role-list" style="margin-bottom: 16px;">
                            <div v-for="char in (characters || []).filter(Boolean)" :key="char?.id || char?.name" class="role-item" :class="{ selected: feed.selectedRoleId === char?.id }" @click="feed.selectedRoleId = char?.id">
                                <img :src="char.avatarUrl || 'https://placehold.co/60x60?text=?'" class="role-avatar">
                                <span class="role-name">{{ char.nickname || char.name }}</span>
                            </div>
                        </div>
                        <button class="generate-btn" @click="feed.generateRolePost(characters.find ? characters.find(c => String(c.id) === String(feed.selectedRoleId)) : characters.value?.find(c => String(c.id) === String(feed.selectedRoleId)), activeProfile)" :disabled="!feed.selectedRoleId || !activeProfile || feed.isGeneratingPost" style="margin-bottom: 16px;">
                            {{ feed.isGeneratingPost ? '生成中...' : 'AI生成' }}
                        </button>
                        <textarea name="sp_field_55" id="sp-field-55" v-model="feed.rolePostText" placeholder="点击 AI生成 自动创作，或手动输入..."></textarea>
                    </div>
                </div>
            </div>
            

            
            <!-- 图片查看器 -->
            <div v-if="feed.viewingImage" class="image-viewer-overlay" @click.self="feed.closeImageViewer">
                <div class="image-viewer">
                    <!-- AI 生成的描述图片 - 在大图中显示描述文字 -->
                    <div v-if="typeof feed.viewingImage === 'string' && feed.viewingImage.startsWith('mock:')" class="viewer-ai-image" :style="{ background: feed.viewingImage.replace('mock:', ''), width: '80vw', maxWidth: '600px', height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', position: 'relative', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }">
                        <div style="font-family: 'Noto Serif SC', 'Playfair Display', Georgia, serif; font-size: 20px; font-weight: 400; color: #333; text-align: center; line-height: 1.8; overflow-y: auto; max-height: 80%;">{{ feed.viewingImageDesc || 'AI 生成的图片' }}</div>
                        <div style="position: absolute; bottom: 20px; right: 20px; font-size: 12px; color: rgba(0,0,0,0.4); font-family: 'Inter', sans-serif; background: rgba(255,255,255,0.8); padding: 4px 12px; border-radius: 20px;">AI生成</div>
                    </div>
                    <!-- 普通图片 -->
                    <img v-else :src="feed.viewingImage" class="viewer-image">
                    <p v-if="feed.viewingImageDesc && !(typeof feed.viewingImage === 'string' && feed.viewingImage.startsWith('mock:'))" class="viewer-desc">{{ feed.viewingImageDesc }}</p>
                    <button class="close-viewer-btn" @click="feed.closeImageViewer"><i class="fas fa-times"></i></button>
                </div>
            </div>
        </div>
        
        
        

</template>

<script>
import { inject } from 'vue';

export default {
    name: 'FeedApp',
    setup() {
        return inject('globalState');
    }
}
</script>
