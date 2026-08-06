<template>
        <!-- Read App -->
        <div  class="app-view read-app" :style="read.readAppBackgroundStyle">
            <div class="app-header read-header">
                <div class="read-header-row read-header-row-top">
                    <button class="back-btn read-nav-btn" @click="read.view === 'explore' ? closeApp() : read.goExplore()" :title="read.view === 'explore' ? '返回桌面' : '返回探索'"><i class="fas fa-chevron-left"></i></button>
                    <div class="read-header-center">
                        <span class="app-title">Read</span>
                        <span class="read-subtitle">
                            {{ read.view === 'explore' ? '探索书库' : read.view === 'detail' ? '作品详情' : read.view === 'reader' ? '沉浸阅读' : read.view === 'writer' ? '创作中' : '阅读设置' }}
                        </span>
                    </div>
                </div>
                <div class="read-header-row read-header-row-bottom">
                    <div class="read-top-tabs" role="tablist" aria-label="Read 导航">
                        <button class="read-top-tab" :class="{ active: read.view === 'explore' }" @click="read.goExplore()"><i class="fas fa-compass"></i><span>探索</span></button>
                        <button class="read-top-tab" :class="{ active: read.view === 'writer' }" @click="read.openWriterCreate()"><i class="fas fa-pen-nib"></i><span>创作</span></button>
                        <button class="read-top-tab" :class="{ active: read.view === 'settings' }" @click="read.openSettings()"><i class="fas fa-sliders-h"></i><span>设置</span></button>
                    </div>
                </div>
            </div>

            <div class="app-content read-content">
                <!-- Explore -->
                <div v-if="read.view === 'explore'" class="read-view read-view-explore">
                    <div class="card read-card">
                        <div class="read-search-row">
                            <i class="fas fa-search" style="opacity:0.7;"></i>
                            <input name="sp_field_90" id="sp-field-90"
                                v-model="read.searchQuery"
                                placeholder="搜索作品标题/标签/简介..."
                                class="read-input"
                            />
                            <button class="btn-small" @click="read.searchQuery=''">清空</button>
                        </div>
                        <div style="margin-top:10px; font-size:12px; color:rgba(0,0,0,0.6);">
                            提示：可配置 Console 里的 API 后使用 Writer 生成。
                        </div>
                    </div>

                <!-- AO3 Tag Filters -->
                <div class="card read-card">
                    <div style="font-weight:700; margin-bottom:8px;">筛选（AO3：警告 & 额外标签，AND 逻辑）</div>

                    <div style="font-size:12px; font-weight:700; margin:6px 0 8px;">归档警告（Archive Warnings）</div>
                    <div class="read-chip-wrap">
                        <button
                            v-for="t in read.allWarningTags"
                            :key="'w_'+t.tag"
                            class="btn-small"
                            :style="{
                                borderColor: (read.selectedWarningTags.includes(t.tag) ? 'rgba(224,0,0,0.35)' : 'rgba(0,0,0,0.12)'),
                                background: read.selectedWarningTags.includes(t.tag) ? 'rgba(224,0,0,0.06)' : 'transparent'
                            }"
                            @click="read.toggleWarningTag(t.tag)"
                        >
                            ⚠ {{ t.tag }}
                        </button>
                        <div v-if="!read.allWarningTags.length" style="font-size:12px; color:rgba(0,0,0,0.6);">
                            暂无可筛选的警告
                        </div>
                    </div>

                    <div style="font-size:12px; font-weight:700; margin:12px 0 8px;">额外标签（Additional Tags）</div>
                    <div class="read-chip-wrap">
                        <button
                            v-for="t in read.allAdditionalTags"
                            :key="'t_'+t.tag"
                            class="btn-small"
                            :style="{
                                borderColor: (read.selectedAdditionalTags.includes(t.tag) ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.12)'),
                                background: read.selectedAdditionalTags.includes(t.tag) ? 'rgba(0,0,0,0.06)' : 'transparent'
                            }"
                            @click="read.toggleAdditionalTag(t.tag)"
                        >
                            #{{ t.tag }}
                        </button>
                        <div v-if="!read.allAdditionalTags.length" style="font-size:12px; color:rgba(0,0,0,0.6);">
                            暂无可筛选的额外标签
                        </div>
                    </div>

                    <div v-if="read.selectedWarningTags.length || read.selectedAdditionalTags.length" style="margin-top:10px; display:flex; justify-content:flex-end; gap:8px;">
                        <button class="btn-small" @click="read.clearSelectedTags">清空筛选</button>
                    </div>
                </div>

                    <div v-if="read.filteredWorks.length === 0" class="read-placeholder" style="padding-top:50px;">
                        <i class="fas fa-book-open"></i>
                        <p>还没有作品。点击右上角按钮生成第一部同人文。</p>
                    </div>

                    <div v-else class="read-works-grid">
                        <div v-for="w in read.filteredWorks" :key="w.id" class="card read-card read-work-card">
                            <div style="display:flex; justify-content:space-between; gap:12px;">
                                <div style="flex:1; min-width:0;">
                                    <div class="read-title" style="font-weight:700; margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                        {{ w.title }}
                                    </div>
                                    <div style="font-size:12px; color:rgba(0,0,0,0.65); margin-bottom:6px;">
                                        CP：{{ w.pairing || '未知' }} · 状态：{{ w.status || 'ongoing' }}
                                    </div>
                                    <div style="font-size:12px; color:rgba(0,0,0,0.75); line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                                        {{ w.summary || '暂无简介' }}
                                    </div>
                                </div>
                                <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
                                    <button class="btn-small primary" @click="read.openWork(w.id)">进入</button>
                                    <button class="btn-small" @click="read.toggleBookmark(w.id)" :title="read.isBookmarked(w.id) ? '已在书架' : '加入书架'">
                                        <i :class="read.isBookmarked(w.id) ? 'fas fa-star' : 'far fa-star'"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="read-tags" style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
                                <span
                                    v-for="t in ((w.archiveWarnings || [])).slice(0,2)"
                                    :key="'w_'+t"
                                    class="read-tag warning"
                                >
                                    警告：{{ t }}
                                </span>
                                <span
                                    v-for="t in ((w.additionalTags || [])).slice(0,3)"
                                    :key="'t_'+t"
                                    class="read-tag muted"
                                >
                                    {{ t }}
                                </span>
                                <span v-if="(!w.additionalTags || w.additionalTags.length === 0) && (!w.archiveWarnings || w.archiveWarnings.length === 0)" style="font-size:12px; color:rgba(0,0,0,0.5);">
                                    暂无标签
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Detail -->
                <div v-else-if="read.view === 'detail'" class="read-view read-view-detail">
                    <div class="card read-card">
                        <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
                            <div style="flex:1; min-width:0;">
                                <div class="read-title" style="font-weight:800; font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    {{ read.activeWork?.title || '作品' }}
                                </div>
                                <div style="font-size:12px; color:rgba(0,0,0,0.65); margin-top:6px;">
                                    CP：{{ read.activeWork?.pairing || '未知' }} · 更新至：第{{ read.activeWork?.lastChapterIndex || 1 }}章
                                </div>
                                <div style="font-size:12px; color:rgba(0,0,0,0.65); margin-top:6px;">
                                    状态：{{ read.activeWork?.status || 'ongoing' }}
                                </div>
                                <div style="margin-top:10px;">
                                    <div style="font-weight:700; font-size:12px; color:rgba(0,0,0,0.6); margin-bottom:6px;">
                                        作品简介（Summary）
                                    </div>
                                    <div style="font-size:13px; color:rgba(0,0,0,0.75); line-height:1.5;">
                                        {{ read.activeWork?.summary || '暂无简介' }}
                                    </div>
                                </div>

                                <div style="margin-top:10px; font-size:12px; color:rgba(0,0,0,0.65); line-height:1.6;">
                                    <div>作者：{{ read.activeWork?.author || '我' }} · 评级：{{ read.activeWork?.rating || 'PG-13' }}</div>
                                    <div style="margin-top:6px;">
                                        <span style="font-weight:700;">警告：</span>
                                        <span v-if="(read.activeWork?.archiveWarnings || []).length">
                                            {{ (read.activeWork?.archiveWarnings || []).slice(0, 4).join('、') }}
                                        </span>
                                        <span v-else>无</span>
                                    </div>
                                    <div style="margin-top:6px;">
                                        <span style="font-weight:700;">标签：</span>
                                        <span v-if="(read.activeWork?.additionalTags || []).length">
                                            {{ (read.activeWork?.additionalTags || []).slice(0, 4).join('、') }}
                                        </span>
                                        <span v-else>无</span>
                                    </div>
                                </div>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
                                <button class="btn-small" @click="read.toggleBookmark(read.activeWorkId)" :title="read.isBookmarked(read.activeWorkId) ? '已在书架' : '加入书架'">
                                    <i :class="read.isBookmarked(read.activeWorkId) ? 'fas fa-star' : 'far fa-star'"></i>
                                </button>
                                <button class="btn-small" @click="read.toggleKudos(read.activeWorkId)" :disabled="read.activeWorkId == null" :title="read.isKudoed(read.activeWorkId) ? '取消点赞' : '点赞该作品'">
                                    <i :class="read.isKudoed(read.activeWorkId) ? 'fas fa-heart' : 'far fa-heart'"></i>
                                    <span style="margin-left:6px;">{{ read.kudosCountForWork(read.activeWorkId) }}</span>
                                </button>
                                <button class="btn-small primary" @click="read.openWriterContinue(read.activeWorkId)" :disabled="read.activeWorkId == null">
                                    <i class="fas fa-wand-magic-sparkles" style="margin-right:6px;"></i>添加章节
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="card read-card">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:10px;">
                            <div style="font-weight:700;">章节列表</div>
                            <div style="font-size:12px; color:rgba(0,0,0,0.6);">
                                共 {{ read.activeChaptersSorted.length }} 章
                            </div>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            <div v-for="ch in read.activeChaptersSorted" :key="ch.id" class="card read-chapter-item">
                                <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
                                    <div style="flex:1; min-width:0;">
                                        <div style="font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                            第{{ ch.chapterIndex }}章：{{ ch.title }}
                                        </div>
                                        <div style="font-size:12px; color:rgba(0,0,0,0.65); margin-top:6px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
                                            {{ ch.summary || '' }}
                                        </div>
                                    </div>
                                    <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
                                        <button class="btn-small primary" @click="read.openReader(ch.id)">阅读</button>
                                    </div>
                                </div>
                                <!-- AO3-like: 章节列表只保留阅读入口 -->
                            </div>
                        </div>
                    </div>

                    <!-- Comments -->
                    <div class="card read-card" style="background:rgba(255,255,255,0.9); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.2); border-radius:18px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:12px;">
                            <div style="font-weight:700;">留言区 <span style="font-weight:600; color:rgba(0,0,0,0.45);">（本作品）</span></div>
                        </div>

                        <div v-if="read.activeWorkId == null" style="font-size:12px; color:rgba(0,0,0,0.6);">
                            暂无作品可评论。
                        </div>

                        <div v-else style="display:flex; flex-direction:column; gap:14px;">
                            <div v-for="c in read.activeWorkCommentsTree" :key="c.id" style="display:flex; gap:12px; align-items:flex-start;">
                                <div style="width:44px; flex:0 0 44px;">
                                    <div style="width:44px; height:44px; border-radius:9999px; background:linear-gradient(135deg, rgba(87,107,149,0.18), rgba(87,107,149,0.35)); border:1px solid rgba(87,107,149,0.12);"></div>
                                </div>
                                <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:8px;">
                                    <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
                                        <div style="font-weight:700; color:#576b95;">
                                            {{ c.author }}
                                        </div>
                                        <span></span>
                                    </div>

                                    <div style="white-space:pre-wrap; line-height:1.7; color:#1f2937;">
                                        {{ c.content }}
                                    </div>

                                    <div v-if="c.replies && c.replies.length" style="display:flex; flex-direction:column; gap:8px;">
                                        <div v-for="r in c.replies" :key="r.id" style="background:rgba(0,0,0,0.05); border-radius:10px; padding:10px 12px;">
                                            <div style="font-size:12px; color:#576b95; font-weight:700; display:flex; justify-content:space-between; gap:10px; align-items:center;">
                                                <span>回复 {{ c.author }}</span>
                                                <span style="font-weight:500; color:rgba(0,0,0,0.35);">{{ read.formatTime(r.createdAt) }}</span>
                                            </div>
                                            <div style="margin-top:6px; white-space:pre-wrap; line-height:1.7; color:#1f2937;">
                                                {{ r.content }}
                                            </div>
                                        </div>
                                    </div>

                                    <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; margin-top:2px;">
                                        <div style="font-size:12px; color:rgba(0,0,0,0.4);">{{ read.formatTime(c.createdAt) }}</div>
                                        <button class="btn-small" @click="read.openReply(c.id)" style="background:transparent; border:0; box-shadow:none; padding:0; color:rgba(0,0,0,0.45);">...</button>
                                    </div>

                                    <div v-if="read.replyToCommentId === c.id" style="margin-top:4px; display:flex; flex-direction:column; gap:8px;">
                                        <textarea name="sp_field_91" id="sp-field-91" v-model="read.replyInput" placeholder="写下你的回复..." rows="3" style="border:1px solid rgba(0,0,0,0.08); background:rgba(0,0,0,0.03); border-radius:10px; padding:10px 12px; outline:none;"></textarea>
                                        <div style="display:flex; gap:10px; justify-content:flex-end;">
                                            <button class="btn-small" @click="read.cancelReply">取消</button>
                                            <button class="btn-small primary" @click="read.submitReply">发送回复</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style="margin-top:4px; padding-top:12px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:8px;">
                                    <div style="font-weight:700;">发表评论</div>
                                    <button class="btn-small" @click="read.generateWorkComment" :disabled="read.isGeneratingComment" style="background:transparent; border:0; box-shadow:none; padding:0; color:rgba(0,0,0,0.45);">
                                        <i class="fas fa-wand-magic-sparkles" style="margin-right:6px;"></i>
                                        {{ read.isGeneratingComment ? '生成中...' : 'AI 生成留言' }}
                                    </button>
                                </div>
                                <textarea name="sp_field_92" id="sp-field-92" v-model="read.newCommentInput" placeholder="写下你的评论（支持换行）..." rows="3" style="width:100%; border:1px solid rgba(0,0,0,0.08); background:rgba(0,0,0,0.03); border-radius:12px; padding:12px; outline:none;"></textarea>
                                <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:10px;">
                                    <button class="btn-small" @click="read.newCommentInput=''" :disabled="!read.newCommentInput">清空</button>
                                    <button class="btn-small primary" @click="read.submitNewComment" :disabled="!read.newCommentInput">发送</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Reader -->
                <div v-else-if="read.view === 'reader'" class="read-view read-view-reader">
                    <div class="card read-card">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
                            <div style="flex:1; min-width:0;">
                                <div style="font-weight:800; font-size:16px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    第{{ read.activeChapter?.chapterIndex || 1 }}章：{{ read.activeChapter?.title || '' }}
                                </div>
                                <div v-if="read.activeChapter?.authorNotes && read.activeChapter.authorNotes.trim()" class="read-notes" style="margin-top:10px; padding:10px; border-radius:12px; background:rgba(0,0,0,0.04);">
                                    <div style="font-weight:700; font-size:12px; color:rgba(0,0,0,0.7); margin-bottom:6px;">作者的话</div>
                                    <div style="white-space:pre-wrap; line-height:1.6; font-size:13px; color:rgba(0,0,0,0.78);">
                                        {{ read.activeChapter.authorNotes }}
                                    </div>
                                </div>
                                <div style="font-size:12px; color:rgba(0,0,0,0.65); margin-top:6px;">
                                    {{ read.activeWork?.title || '' }}
                                </div>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
                                <button class="btn-small" @click="read.backToDetail">返回</button>
                                <button class="btn-small" @click="read.toggleKudos(read.activeWorkId)" :disabled="read.activeWorkId == null">
                                    <i :class="read.isKudoed(read.activeWorkId) ? 'fas fa-heart' : 'far fa-heart'"></i>
                                    <span style="margin-left:6px;">{{ read.kudosCountForWork(read.activeWorkId) }}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="card read-card read-reader-body-wrap">
                        <div v-if="!read.activeChapter" style="font-size:13px; color:rgba(0,0,0,0.6);">
                            暂无内容。
                        </div>
                        <div v-else class="read-body" :style="read.readerBodyStyle">
                            <div v-if="read.activeChapter.content && read.activeChapter.content.trim()">
                                {{ read.activeChapter.content }}
                            </div>
                            <div v-else style="font-size:13px; color:rgba(0,0,0,0.55);">
                                {{ read.activeChapter.summary || '暂无正文（可尝试重新生成这一章）' }}
                            </div>
                        </div>
                    </div>

                    <div class="read-reader-nav">
                        <button class="btn-small" @click="read.goPrevChapter" :disabled="!read.activeChapterId">
                            上一章
                        </button>
                        <button class="btn-small primary" @click="read.goNextChapter" :disabled="!read.activeChapterId">
                            下一章
                        </button>
                    </div>
                </div>

                <!-- Writer -->
                <div v-else-if="read.view === 'writer'" class="read-view read-view-writer">
                    <div class="card read-card">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">
                            <div style="flex:1; min-width:0;">
                                <div style="font-weight:800; font-size:16px;">
                                    {{ read.writerMode === 'create' ? '生成新作品' : '生成下一章' }}
                                </div>
                                <div style="font-size:12px; color:rgba(0,0,0,0.65); margin-top:6px;">
                                    {{ read.writerMode === 'continue' && read.activeWork ? `作品：${read.activeWork.title}` : '选择角色与偏好后生成' }}
                                </div>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
                                <button class="btn-small" @click="read.goExplore" v-if="read.writerMode === 'create'">取消</button>
                                <button class="btn-small" @click="read.backToDetail" v-else>返回详情</button>
                            </div>
                        </div>
                    </div>

                    <div class="card read-card read-writer-form">
                        <div>
                            <div style="font-size:12px; color:rgba(0,0,0,0.6); margin-bottom:6px;">
                                作品标题（Work Title；可留空；续写时默认取原标题）
                            </div>
                            <input name="sp_field_93" id="sp-field-93"
                                v-model="read.writerForm.workTitleText"
                                placeholder="例如：星夜下的约定"
                                :disabled="read.writerMode !== 'create'"
                                style="width:100%; padding:10px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); outline:none;"
                            >
                        </div>

                        <div>
                            <div style="font-size:12px; color:rgba(0,0,0,0.6); margin-bottom:6px; margin-top:4px;">
                                章标题（Chapter Title；可留空则由 AI 生成）
                            </div>
                            <input name="sp_field_94" id="sp-field-94"
                                v-model="read.writerForm.chapterTitleText"
                                placeholder="例如：在雨里说再见"
                                style="width:100%; padding:10px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); outline:none;"
                            >
                        </div>

                        <div>
                            <div style="font-size:12px; color:rgba(0,0,0,0.6); margin-bottom:6px; margin-top:4px;">
                                作者的话（Author Notes；可留空）
                            </div>
                            <textarea name="sp_field_95" id="sp-field-95"
                                v-model="read.writerForm.authorNotesText"
                                placeholder="例如：这章的核心是‘没说出口的那句’。"
                                rows="3"
                                style="width:100%; padding:10px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); outline:none;"
                            ></textarea>
                        </div>

                        <div style="display:flex; gap:10px;">
                            <div style="flex:1;">
                                <div style="font-size:12px; color:rgba(0,0,0,0.6); margin-bottom:6px;">角色A</div>
                                <select name="sp_field_96" id="sp-field-96" v-model="read.writerForm.charAId" style="width:100%; padding:10px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); outline:none;">
                                    <option value="__me__">我（当前用户）</option>
                                    <option v-for="c in characters" :key="c.id" :value="c.id">{{ c.nickname || c.name }}</option>
                                </select>
                            </div>
                            <div style="flex:1;">
                                <div style="font-size:12px; color:rgba(0,0,0,0.6); margin-bottom:6px;">角色B</div>
                                <select name="sp_field_97" id="sp-field-97" v-model="read.writerForm.charBId" style="width:100%; padding:10px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); outline:none;">
                                    <option value="__me__">我（当前用户）</option>
                                    <option v-for="c in characters" :key="c.id" :value="c.id">{{ c.nickname || c.name }}</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <div style="font-size:12px; color:rgba(0,0,0,0.6); margin-bottom:6px;">配对（可留空自动推断）</div>
                            <input name="sp_field_98" id="sp-field-98" v-model="read.writerForm.pairingText" placeholder="例如：A x B" style="width:100%; padding:10px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); outline:none;">
                        </div>

                        <div>
                            <div style="font-size:12px; color:rgba(0,0,0,0.6); margin-bottom:6px;">额外标签（Additional Tags；逗号分隔；可留空）</div>
                            <input name="sp_field_99" id="sp-field-99" v-model="read.writerForm.tagsText" placeholder="例如：校园, 甜文, 误会" style="width:100%; padding:10px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); outline:none;">
                        </div>

                        <div>
                            <div style="font-size:12px; color:rgba(0,0,0,0.6); margin-bottom:6px;">归档警告（Archive Warnings；逗号分隔；可留空）</div>
                            <input name="sp_field_100" id="sp-field-100" v-model="read.writerForm.archiveWarningsText" placeholder="例如：暴力, 创伤, 自伤（没有就留空）" style="width:100%; padding:10px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); outline:none;">
                        </div>

                        <div>
                            <div style="font-size:12px; color:rgba(0,0,0,0.6); margin-bottom:6px;">作品简介（Work Summary；可留空）</div>
                            <textarea name="sp_field_101" id="sp-field-101" v-model="read.writerForm.workSummaryText" placeholder="用 2-3 句话说明你想写的核心氛围/冲突/结尾走向（可留空由 AI 推断）" rows="3" style="width:100%; padding:10px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); outline:none;"></textarea>
                        </div>

                        <div style="display:flex; gap:10px;">
                            <div style="flex:1;">
                                <div style="font-size:12px; color:rgba(0,0,0,0.6); margin-bottom:6px;">世界书（可选）</div>
                                <select name="sp_field_102" id="sp-field-102" v-model="read.writerForm.worldbookId" style="width:100%; padding:10px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); outline:none;">
                                    <option :value="null">不使用世界书</option>
                                    <option v-for="wb in worldbooks" :key="wb.id" :value="wb.id">{{ wb.name }}</option>
                                </select>
                            </div>
                            <div style="flex:1;">
                                <div style="font-size:12px; color:rgba(0,0,0,0.6); margin-bottom:6px;">预设（可选）</div>
                                <select name="sp_field_103" id="sp-field-103" v-model="read.writerForm.presetId" style="width:100%; padding:10px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); outline:none;">
                                    <option :value="null">不使用预设</option>
                                    <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
                                </select>
                            </div>
                        </div>

                        <div style="display:flex; gap:10px;">
                            <div style="flex:1;">
                                <div style="font-size:12px; color:rgba(0,0,0,0.6); margin-bottom:6px;">评级</div>
                                <input name="sp_field_104" id="sp-field-104" v-model="read.writerForm.ratingText" placeholder="PG-13" style="width:100%; padding:10px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); outline:none;">
                            </div>
                            <div style="flex:1;">
                                <div style="font-size:12px; color:rgba(0,0,0,0.6); margin-bottom:6px;">字数档位</div>
                                <select name="sp_field_105" id="sp-field-105" v-model="read.writerForm.lengthPreset" style="width:100%; padding:10px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); outline:none;">
                                    <option value="short">短篇</option>
                                    <option value="medium">中篇</option>
                                    <option value="long">长篇</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <div style="font-size:12px; color:rgba(0,0,0,0.6); margin-bottom:6px;">你的额外 AI 指令（可留空）</div>
                            <textarea name="sp_field_106" id="sp-field-106" v-model="read.writerForm.userInstruction" placeholder="例如：保持人物语气一致；增加一个误会；结尾留钩子..." rows="4" style="width:100%; padding:10px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); outline:none;"></textarea>
                            <div style="font-size:12px; color:rgba(0,0,0,0.55); margin-top:6px;">
                                当前长度目标：{{ read.lengthHint }}
                            </div>
                        </div>

                        <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:4px;">
                            <button class="btn-small" @click="read.goExplore" type="button">返回探索</button>
                            <button
                                class="btn-small primary"
                                type="button"
                                @click="read.writerMode === 'create' ? read.generateWorkAndFirstChapter() : read.generateNextChapter()"
                                :disabled="read.isGenerating"
                            >
                                <i class="fas fa-wand-magic-sparkles" style="margin-right:6px;"></i>
                                {{ read.isGenerating ? '生成中...' : (read.writerMode === 'create' ? '生成作品 + 第一章' : '生成下一章') }}
                            </button>
                        </div>

                        <div v-if="read.genError" style="font-size:12px; color:#b00020;">
                            {{ read.genError }}
                        </div>
                    </div>
                </div>

                <!-- Settings -->
                <div v-else-if="read.view === 'settings'" class="read-view read-view-settings">
                    <div class="card read-card">
                        <div style="font-weight:800; font-size:16px;">阅读设置</div>
                        <div style="margin-top:6px; font-size:12px; color:rgba(0,0,0,0.6);">
                            参考常见阅读 App：背景、字体、字号、行距、版心宽度均可调整。
                        </div>
                    </div>

                    <div class="card read-card">
                        <div style="font-weight:700; margin-bottom:10px;">背景</div>
                        <div style="font-size:12px; color:rgba(0,0,0,0.62); margin-bottom:8px;">
                            背景图片链接
                        </div>
                        <input name="sp_field_107" id="sp-field-107"
                            v-model="read.readerBackgroundUrl"
                            type="url"
                            class="read-input"
                            :placeholder="'默认：' + read.defaultReadBgUrl"
                            @blur="read.saveReaderBackground"
                        />
                        <div style="margin-top:12px;">
                            <div style="display:flex; justify-content:space-between; font-size:12px; color:rgba(0,0,0,0.62); margin-bottom:6px;">
                                <span>背景遮罩</span>
                                <span>{{ Math.round(read.readerPrefs.overlayOpacity * 100) }}%</span>
                            </div>
                            <input name="sp_field_108" id="sp-field-108" v-model.number="read.readerPrefs.overlayOpacity" type="range" min="0" max="0.9" step="0.05" style="width:100%;">
                        </div>
                        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:10px;">
                            <button type="button" class="btn-small" @click="read.resetReaderBackground">恢复默认背景</button>
                            <button type="button" class="btn-small primary" @click="read.saveReaderBackground">应用背景</button>
                        </div>
                    </div>

                    <div class="card read-card">
                        <div style="font-weight:700; margin-bottom:10px;">文字排版</div>

                        <div style="font-size:12px; color:rgba(0,0,0,0.62); margin-bottom:6px;">字体风格</div>
                        <select name="sp_field_109" id="sp-field-109" v-model="read.readerPrefs.fontFamily" style="width:100%; padding:10px; border-radius:10px; border:1px solid rgba(0,0,0,0.12); outline:none;">
                            <option v-for="f in read.readerFontOptions" :key="f.value" :value="f.value">{{ f.label }}</option>
                        </select>

                        <div style="margin-top:12px;">
                            <div style="display:flex; justify-content:space-between; font-size:12px; color:rgba(0,0,0,0.62); margin-bottom:6px;">
                                <span>字号</span>
                                <span>{{ read.readerPrefs.fontSize }}px</span>
                            </div>
                            <input name="sp_field_110" id="sp-field-110" v-model.number="read.readerPrefs.fontSize" type="range" min="14" max="40" step="1" style="width:100%;">
                        </div>

                        <div style="margin-top:12px;">
                            <div style="display:flex; justify-content:space-between; font-size:12px; color:rgba(0,0,0,0.62); margin-bottom:6px;">
                                <span>行距</span>
                                <span>{{ read.readerPrefs.lineHeight.toFixed(2) }}</span>
                            </div>
                            <input name="sp_field_111" id="sp-field-111" v-model.number="read.readerPrefs.lineHeight" type="range" min="1.3" max="2.6" step="0.05" style="width:100%;">
                        </div>

                        <div style="margin-top:12px;">
                            <div style="display:flex; justify-content:space-between; font-size:12px; color:rgba(0,0,0,0.62); margin-bottom:6px;">
                                <span>版心宽度</span>
                                <span>{{ read.readerPrefs.contentWidth }}px</span>
                            </div>
                            <input name="sp_field_112" id="sp-field-112" v-model.number="read.readerPrefs.contentWidth" type="range" min="520" max="1100" step="10" style="width:100%;">
                        </div>

                        <div style="margin-top:12px;">
                            <div style="display:flex; justify-content:space-between; font-size:12px; color:rgba(0,0,0,0.62); margin-bottom:6px;">
                                <span>文字颜色</span>
                                <span>{{ read.readerPrefs.textColor }}</span>
                            </div>
                            <div style="display:flex; gap:8px; align-items:center;">
                                <input name="sp_field_113" id="sp-field-113" v-model="read.readerPrefs.textColor" type="color" style="width:44px; height:32px; border:1px solid rgba(0,0,0,0.12); border-radius:8px; padding:0;">
                                <input name="sp_field_114" id="sp-field-114" v-model="read.readerPrefs.textColor" type="text" class="read-input" placeholder="#1f2933" style="flex:1; min-width:0;" @blur="read.saveReaderPrefs">
                            </div>
                        </div>

                        <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px;">
                            <button type="button" class="btn-small" @click="read.resetReaderPrefs">恢复默认排版</button>
                            <button type="button" class="btn-small primary" @click="read.saveReaderPrefs">保存排版</button>
                        </div>
                    </div>

                    <div class="card read-card">
                        <div style="font-weight:700; margin-bottom:10px;">效果预览</div>
                        <div style="display:flex; justify-content:center;">
                            <div
                                :style="[
                                    read.readAppBackgroundStyle,
                                    {
                                        width: '260px',
                                        height: '480px',
                                        borderRadius: '26px',
                                        boxShadow: '0 18px 40px rgba(15,23,42,0.35)',
                                        border: '1px solid rgba(255,255,255,0.65)',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }
                                ]"
                            >
                                <div style="position:absolute; top:8px; left:50%; transform:translateX(-50%); width:72px; height:4px; border-radius:999px; background:rgba(255,255,255,0.72); opacity:0.9; z-index:2;"></div>
                                <div class="read-header" style="padding:12px 10px 8px; border-radius:0; border-bottom:1px solid rgba(45,47,54,0.12);">
                                    <div style="display:flex; align-items:center; justify-content:space-between;">
                                        <i class="fas fa-chevron-left" style="font-size:11px; opacity:0.7;"></i>
                                        <span style="font-size:11px; font-weight:700;">Read</span>
                                        <i class="fas fa-ellipsis-h" style="font-size:11px; opacity:0.7;"></i>
                                    </div>
                                </div>
                                <div class="read-content" style="flex:1; overflow:hidden; padding:8px;">
                                    <div class="read-view read-view-reader" style="height:100%;">
                                        <div class="card read-card" style="padding:8px 10px;">
                                            <div style="font-size:11px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                                第118章 要账（八更）
                                            </div>
                                        </div>
                                        <div class="card read-card read-reader-body-wrap" style="flex:1; min-height:0;">
                                            <div class="read-body" :style="read.readerBodyStyle" style="padding:0 2px 12px; margin:0;">
                                                {{ read.readerPreviewText }}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

</template>

<script>
import { inject } from 'vue';

export default {
    name: 'ReadApp',
    setup() {
        return inject('globalState');
    }
}
</script>
