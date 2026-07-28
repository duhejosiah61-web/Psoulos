// feed.js
import { ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';
import { callAI } from './api.js';

const CURRENT_USER_NAME = '我';
const formatFeedTime = () => { const d = new Date(); return `${d.getMonth()+1}-${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };
const DEFAULT_MOMENTS_BG_URL = 'https://img.heliar.top/file/1774802842396_1774802818159.png';

let feedDB = null;
const FEED_DB_NAME = 'FeedDB';
const FEED_DB_VERSION = 1;

async function initFeedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(FEED_DB_NAME, FEED_DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => { feedDB = request.result; resolve(feedDB); };
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains('posts')) {
                database.createObjectStore('posts', { keyPath: 'id' });
            }
        };
    });
}

async function savePostToIndexedDB(post) {
    if (!feedDB) return false;
    return new Promise((resolve, reject) => {
        const tx = feedDB.transaction(['posts'], 'readwrite');
        const store = tx.objectStore('posts');
        const request = store.put(JSON.parse(JSON.stringify(post)));
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}
async function deletePostFromIndexedDB(postId) {
    if (!feedDB) return false;
    return new Promise((resolve, reject) => {
        const tx = feedDB.transaction(['posts'], 'readwrite');
        const store = tx.objectStore('posts');
        const request = store.delete(postId);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
    });
}

async function loadPostsFromIndexedDB() {
    if (!feedDB) return [];
    return new Promise((resolve, reject) => {
        const tx = feedDB.transaction(['posts'], 'readonly');
        const store = tx.objectStore('posts');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
    });
}

export function useFeed(characters, userAvatar) {
    const posts = ref([]);
    const loading = ref(false);
    const activeCommentPostId = ref(null);
    const activeReplyCommentId = ref(null);
    const activeActionPostId = ref(null);
    const activeCardIndex = ref(0);
    const cardSwipeStartX = ref(0);
    const cardSwipeDeltaX = ref(0);
    const isCardSwipeDragging = ref(false);
    const commentInput = ref('');
    const replyInput = ref('');
    const showFabMenu = ref(false);
    const showCreatePost = ref(false);
    const newPostText = ref('');
    const newPostImages = ref([]);
    const showTextImageCreator = ref(false);
    const feedTextImageText = ref('');
    const feedTextImageBgColor = ref('#ffffff');
    const feedTextImageColors = ['#ffffff', '#f8f5f0', '#fef3c7', '#dbeafe', '#f3e8ff', '#fce7f3', '#dcfce7'];
    const showLocationSheet = ref(false);
    const showVisibilitySheet = ref(false);
    const showMentionSheet = ref(false);
    const showMediaSheet = ref(false);
    const locationText = ref('');
    const visibilityMode = ref('public');
    const visibilityAllowRoleIds = ref([]);
    const mentionRoleIds = ref([]);
    const mentionTagNames = ref([]);
    const userProfile = ref({ name: CURRENT_USER_NAME, avatar: userAvatar && userAvatar.value ? userAvatar.value : 'https://placehold.co/100x100/333/fff?text=Me', bio: '这个人很懒，什么都没写', bgImage: DEFAULT_MOMENTS_BG_URL });
    if (userAvatar && typeof userAvatar === 'object') {
        import('https://unpkg.com/vue@3/dist/vue.esm-browser.js').then(({ watch }) => {
            watch(userAvatar, (val) => {
                if (val) userProfile.value.avatar = val;
            });
        });
    }
    const momentsBgUrl = ref(DEFAULT_MOMENTS_BG_URL);
    const momentsBgStyle = ref({ backgroundImage: `url(${momentsBgUrl.value})` });
    const viewingUserProfile = ref(null);
    const viewingUserPosts = ref([]);
    const isEditingProfile = ref(false);

    function setActiveCardIndex(index) { activeCardIndex.value = Math.max(0, Math.min(index, Math.max(posts.value.length - 1, 0))); }
    function goToNextCard() { setActiveCardIndex(activeCardIndex.value + 1); }
    function goToPreviousCard() { setActiveCardIndex(activeCardIndex.value - 1); }
    function handleCardSwipeStart(e) { const t = e?.touches?.[0]; if (!t) return; isCardSwipeDragging.value = true; cardSwipeStartX.value = t.clientX; cardSwipeDeltaX.value = 0; }
    function handleCardSwipeMove(e) { if (!isCardSwipeDragging.value) return; const t = e?.touches?.[0]; if (!t) return; cardSwipeDeltaX.value = t.clientX - cardSwipeStartX.value; }
    function handleCardSwipeEnd() { if (!isCardSwipeDragging.value) return; if (cardSwipeDeltaX.value > 48) goToPreviousCard(); else if (cardSwipeDeltaX.value < -48) goToNextCard(); isCardSwipeDragging.value = false; }
    function handleScroll() { activeActionPostId.value = null; }
    function openProfile(authorName) {
        let profile = null;
        if (authorName === CURRENT_USER_NAME || authorName === '我' || authorName === userProfile.value.name) {
            profile = userProfile.value;
            profile.isCurrentUser = true;
        } else {
            const char = characters.value ? characters.value.find(c => c.name === authorName || c.nickname === authorName) : null;
            if (char) {
                profile = {
                    name: char.nickname || char.name,
                    avatar: char.avatarUrl || 'https://placehold.co/100x100?text=' + String(authorName).slice(0, 1),
                    bio: char.description || char.persona || '这是一个有趣的灵魂',
                    bgImage: DEFAULT_MOMENTS_BG_URL,
                    isCurrentUser: false
                };
            } else {
                profile = { name: authorName, avatar: 'https://placehold.co/100x100?text=' + String(authorName || '?').slice(0, 1), bio: '这个人很神秘，什么都没写', bgImage: DEFAULT_MOMENTS_BG_URL, isCurrentUser: false };
            }
        }
        viewingUserProfile.value = profile;
        viewingUserPosts.value = posts.value.filter(p => p.author === authorName).sort((a,b) => (b.id||0)-(a.id||0));
    }
    function closeProfile() { viewingUserProfile.value = null; viewingUserPosts.value = []; }
    function toggleCollect(postId) { const post = posts.value.find(p => p.id === postId); if (!post) return; post.isFavorited = !post.isFavorited; post.collections = post.collections || []; if (post.isFavorited && !post.collections.includes(CURRENT_USER_NAME)) post.collections.push(CURRENT_USER_NAME); if (!post.isFavorited) post.collections = post.collections.filter(n => n !== CURRENT_USER_NAME); savePostToIndexedDB(post); }
    function toggleLike(postId) { const post = posts.value.find(p => p.id === postId); if (!post) return; post.isLiked = !post.isLiked; post.likes ||= []; if (post.isLiked && !post.likes.includes(CURRENT_USER_NAME)) post.likes.push(CURRENT_USER_NAME); if (!post.isLiked) post.likes = post.likes.filter(n => n !== CURRENT_USER_NAME); savePostToIndexedDB(post); }
    function toggleCommentInput(postId) { activeCommentPostId.value = activeCommentPostId.value === postId ? null : postId; if (activeCommentPostId.value) activeActionPostId.value = null; }
    function toggleReplyInput(postId, commentId) { activeCommentPostId.value = postId; activeReplyCommentId.value = activeReplyCommentId.value === commentId ? null : commentId; }
    function toggleActionMenu(postId) { activeActionPostId.value = activeActionPostId.value === postId ? null : postId; }
    function closeActionMenu() { activeActionPostId.value = null; }
    function deletePost(postId) { posts.value = posts.value.filter(p => p.id !== postId); deletePostFromIndexedDB(postId); }
    function deleteComment(postId, commentId, replyId = null) { 
        const post = posts.value.find(p => p.id === postId); 
        if (!post) return; 
        if (replyId) {
            const c = (post.comments || []).find(x => x.id === commentId);
            if (c) c.replies = (c.replies || []).filter(r => r.id !== replyId);
        } else {
            post.comments = (post.comments || []).filter(c => c.id !== commentId); 
        }
        savePostToIndexedDB(post); 
    }
    function submitComment(postId, commentId = null) { const post = posts.value.find(p => p.id === postId); if (!post) return; const text = (commentId ? replyInput.value : commentInput.value).trim(); if (!text) return; if (commentId) { const c = (post.comments || []).find(x => x.id === commentId); if (c) { c.replies = c.replies || []; c.replies.push({ id: Date.now(), user: CURRENT_USER_NAME, content: text, time: '刚刚' }); } replyInput.value = ''; activeReplyCommentId.value = null; } else { post.comments ||= []; post.comments.push({ id: Date.now(), user: CURRENT_USER_NAME, content: text, time: '刚刚', replies: [] }); commentInput.value = ''; activeCommentPostId.value = null; } savePostToIndexedDB(post); }
    function openCreatePost() { showCreatePost.value = true; }
    function closeCreatePost() { showCreatePost.value = false; newPostText.value = ''; newPostImages.value = []; }
    function closeSheets() { showLocationSheet.value = false; showVisibilitySheet.value = false; showMentionSheet.value = false; showMediaSheet.value = false; }
    const openLocationSheet = () => { closeSheets(); showLocationSheet.value = true; };
    const openVisibilitySheet = () => { closeSheets(); showVisibilitySheet.value = true; };
    const openMentionSheet = () => { closeSheets(); showMentionSheet.value = true; };
    const openMediaSheet = () => { closeSheets(); showMediaSheet.value = true; };
    const locationLabel = () => locationText.value?.trim() || '不显示';
    const visibilityLabel = () => visibilityMode.value === 'public' ? '公开' : visibilityMode.value === 'private' ? '私密' : '部分可见';
    const mentionLabel = () => mentionRoleIds.value.length || mentionTagNames.value.length ? `已选 ${mentionRoleIds.value.length + mentionTagNames.value.length} 项` : '未选择';
    const toggleVisibilityRole = (id) => { const i = visibilityAllowRoleIds.value.indexOf(String(id)); i >= 0 ? visibilityAllowRoleIds.value.splice(i, 1) : visibilityAllowRoleIds.value.push(String(id)); };
    const toggleMentionRole = (id) => { const i = mentionRoleIds.value.indexOf(String(id)); i >= 0 ? mentionRoleIds.value.splice(i, 1) : mentionRoleIds.value.push(String(id)); };
    const toggleMentionTag = (tag) => { const t = String(tag || '').trim(); if (!t) return; const i = mentionTagNames.value.indexOf(t); i >= 0 ? mentionTagNames.value.splice(i, 1) : mentionTagNames.value.push(t); };
    const clearMentions = () => { mentionRoleIds.value = []; mentionTagNames.value = []; };
    const allCharacterTags = () => [];
    function openTextImageCreator() { showTextImageCreator.value = true; }
    function closeTextImageCreator() { showTextImageCreator.value = false; }
    function addTextImageToPost() { if (!feedTextImageText.value.trim()) return; newPostImages.value.push({ type: 'textImage', text: feedTextImageText.value.trim(), bgColor: feedTextImageBgColor.value }); showTextImageCreator.value = false; }
    function handleImageUpload(event) { const files = event.target.files || []; [...files].forEach(file => { const reader = new FileReader(); reader.onload = e => newPostImages.value.push(e.target.result); reader.readAsDataURL(file); }); event.target.value = ''; }
    const triggerImageUpload = () => document.getElementById('feed-image-input')?.click();
    const triggerCameraUpload = () => document.getElementById('feed-camera-input')?.click();
    async function publishPost() { if (!newPostText.value.trim() && !newPostImages.value.length) return; const post = { id: Date.now(), author: CURRENT_USER_NAME, avatar: userProfile.value.avatar, content: newPostText.value, images: [...newPostImages.value], time: formatFeedTime(), location: locationText.value || null, visibility: visibilityLabel.value || '公开', likes: [], comments: [], collections: [], isLiked: false, isFavorited: false }; posts.value.unshift(post); await savePostToIndexedDB(post); closeCreatePost(); }
    async function loadPosts() { loading.value = true; const localPosts = await loadPostsFromIndexedDB().catch(() => []); posts.value = localPosts.sort((a,b) => (b.id||0)-(a.id||0)); loading.value = false; }
    const showRolePostModal = ref(false);
    const selectedRoleId = ref(null);
    const rolePostText = ref('');
    const isGeneratingPost = ref(false);
    const rolePostImageData = ref(null);
    const rolePostLocation = ref('');
    const rolePostVisibility = ref('公开');

    const roleAction = async () => {
        showRolePostModal.value = true;
        selectedRoleId.value = null;
        rolePostText.value = '';
        rolePostImageData.value = null;
        rolePostLocation.value = '';
        rolePostVisibility.value = '公开';
    };

    const closeRolePostModal = () => {
        showRolePostModal.value = false;
        selectedRoleId.value = null;
        rolePostText.value = '';
        rolePostImageData.value = null;
        rolePostLocation.value = '';
        rolePostVisibility.value = '公开';
    };

    const generateRolePost = async (character, activeProfileObj) => {
        if (!character || !activeProfileObj) return;
        isGeneratingPost.value = true;
        try {
            const persona = character.persona || character.description || character.summary || '生活、自然';
            const name = character.nickname || character.name || 'AI角色';
            const sysPrompt = `你正在扮演角色「${name}」。角色设定：\n${persona}\n请以你的口吻发布一条生活化的短动态（类似微信朋友圈）。\n你可以选择带上 1-9 张“文字假装的图片”来增加趣味性（如果不需要图片，返回空数组）。\n请务必返回合法的 JSON 格式，包含以下字段：\n{\n  "content": "动态文字内容",\n  "location": "定位名称（如：星巴克，或为空）",\n  "visibility": "谁可以看（如：公开、仅你可见、部分朋友）",\n  "images": [\n    { "text": "图上的中心大字（1-6字）", "bgColor": "背景色HEX（如 #FFDAB9）" }\n  ]\n}`;
            const userPrompt = "请直接返回JSON。";
            
            const reply = await callAI(activeProfileObj, [
                { role: 'system', content: sysPrompt },
                { role: 'user', content: userPrompt }
            ]);
            if (reply) {
                let parsed = null;
                try {
                    const match = reply.match(/\{[\s\S]*\}/);
                    const jsonStr = match ? match[0] : reply.replace(/```(?:json)?/gi, '').trim();
                    parsed = JSON.parse(jsonStr);
                } catch(e) {
                    rolePostText.value = reply.trim();
                    rolePostImageData.value = null;
                    return;
                }
                rolePostText.value = parsed.content || '';
                rolePostLocation.value = parsed.location || '';
                rolePostVisibility.value = parsed.visibility || '公开';
                if (parsed.images && Array.isArray(parsed.images) && parsed.images.length > 0) {
                    rolePostImageData.value = parsed.images.map(img => ({
                        type: 'textImage',
                        text: img.text,
                        bgColor: img.bgColor || '#f0f0f0'
                    }));
                } else {
                    rolePostImageData.value = null;
                }
            }
        } catch (e) {
            console.error('[Feed] generateRolePost error:', e);
            alert('生成动态失败：' + (e.message || '未知错误'));
        } finally {
            isGeneratingPost.value = false;
        }
    };

    const publishRolePost = async (charactersRef) => {
        const chars = charactersRef?.value || charactersRef || [];
        const character = chars.find(c => String(c.id) === String(selectedRoleId.value));
        if (!character || !rolePostText.value.trim()) return;

        const post = {
            id: Date.now(),
            author: character.nickname || character.name,
            avatar: character.avatarUrl || 'https://placehold.co/100x100?text=?',
            content: rolePostText.value.trim(),
            images: rolePostImageData.value ? rolePostImageData.value : [],
            time: formatFeedTime(),
            location: rolePostLocation.value || null,
            visibility: rolePostVisibility.value || '公开',
            likes: [],
            comments: [],
            collections: [],
            isLiked: false,
            isFavorited: false,
            roleId: character.id
        };
        
        posts.value.unshift(post);
        await savePostToIndexedDB(post);
        closeRolePostModal();
    };

    const showRoleCommentModal = ref(false);
    const commentTargetPost = ref(null);
    const generatingPostIds = ref([]);
    const isGenerating = (postId) => generatingPostIds.value.includes(postId);

    const triggerAIAction = async (postId, charactersRef, activeProfileObj, targetCommentId = null) => {
        const generateId = targetCommentId ? postId + '-' + targetCommentId : postId;
        if (isGenerating(generateId)) return;
        const post = posts.value.find(p => p.id === postId);
        if (!post || !activeProfileObj) return;

        const chars = charactersRef?.value || charactersRef || [];
        if (!chars.length) return;

        let selectedChars = [];
        const authorChar = chars.find(c => (c.name || c.nickname) === post.author);
        if (authorChar && authorChar.tags && authorChar.tags.length > 0) {
            selectedChars = chars.filter(c => c.tags && c.tags.some(t => authorChar.tags.includes(t)));
        } else {
            selectedChars = chars;
        }
        if (selectedChars.length > 3) {
            selectedChars = selectedChars.sort(() => 0.5 - Math.random()).slice(0, 3);
        }

        generatingPostIds.value.push(generateId);
        try {
            for (const character of selectedChars) {
                const persona = character.persona || character.description || character.summary || '朋友';
                const name = character.nickname || character.name || 'AI角色';
                const postAuthor = post.author || '某人';
                const postContent = post.content || '[图片动态]';
                
                let commentContext = '';
                if (post.comments && post.comments.length > 0) {
                    commentContext = '\n当前的评论区历史：\n' + post.comments.map(c => {
                        let s = `- ID:${c.id} | ${c.user}: ${c.content}`;
                        if (c.replies) {
                            c.replies.forEach(r => { s += `\n  - ID:${r.id} | ${r.user} 回复 ${c.user}: ${r.content}`; });
                        }
                        return s;
                    }).join('\n');
                }

                let actionInstruction = targetCommentId 
                    ? `你需要专门回复评论区 ID 为 ${targetCommentId} 的那条评论。请务必选择 reply 动作，并将 replyToCommentId 设置为 ${targetCommentId}。` 
                    : `你可以点赞，收藏(collect)，直接评论，或者回复评论区某个人（楼中楼）。`;

                const sysPrompt = `你正在扮演角色「${name}」。角色设定：\n${persona}\n你的好友「${postAuthor}」刚发布了一条动态：\n“${postContent}”${commentContext}\n
请你作为「${name}」决定对这条动态的反应。${actionInstruction}
请务必返回合法的 JSON，包含以下字段：
{
  "action": "like" | "comment" | "reply" | "collect",
  "content": "如果是comment或reply，这里写你的评论文字内容（1-3句），否则为空",
  "replyToCommentId": 如果是reply，填写你要回复的那条评论的ID（整数，必须存在于历史中），否则为null
}`;
                
                const reply = await callAI(activeProfileObj, [
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: "请直接返回JSON。" }
                ]);

                if (reply) {
                    let parsed = null;
                    try {
                        const match = reply.match(/\{[\s\S]*\}/);
                        const jsonStr = match ? match[0] : reply.replace(/```(?:json)?/gi, '').trim();
                        parsed = JSON.parse(jsonStr);
                    } catch(e) {
                        console.error('[Feed] parse triggerAIAction json failed', e);
                        parsed = targetCommentId 
                            ? { action: 'reply', content: reply.trim(), replyToCommentId: targetCommentId }
                            : { action: 'comment', content: reply.trim() };
                    }

                    if (parsed.action === 'collect') {
                        post.collections = post.collections || [];
                        if (!post.collections.includes(name)) post.collections.push(name);
                    } else if (parsed.action === 'like') {
                        post.likes = post.likes || [];
                        if (!post.likes.includes(name)) post.likes.push(name);
                    } else if (parsed.action === 'comment' && parsed.content) {
                        post.comments = post.comments || [];
                        post.comments.push({ id: Date.now(), user: name, content: parsed.content, time: '刚刚', replies: [] });
                    } else if (parsed.action === 'reply' && parsed.content && parsed.replyToCommentId) {
                        const targetComment = post.comments.find(c => String(c.id) === String(parsed.replyToCommentId)) || post.comments.find(c => c.replies && c.replies.some(r => String(r.id) === String(parsed.replyToCommentId)));
                        if (targetComment) {
                            targetComment.replies = targetComment.replies || [];
                            targetComment.replies.push({ id: Date.now(), user: name, content: parsed.content, time: '刚刚' });
                        } else {
                            post.comments = post.comments || [];
                            post.comments.push({ id: Date.now(), user: name, content: parsed.content, time: '刚刚', replies: [] });
                        }
                    }
                    savePostToIndexedDB(post);
                }
                await new Promise(r => setTimeout(r, 1000));
            }
        } catch (e) {
            console.error('[Feed] triggerAIAction error:', e);
        } finally {
            generatingPostIds.value = generatingPostIds.value.filter(id => id !== generateId);
        }
    };
    const viewingImage = ref(null);
    const viewingImageDesc = ref(null);
    const openImageViewer = (imgUrl, desc) => { viewingImage.value = imgUrl; viewingImageDesc.value = desc; };
    const closeImageViewer = () => { viewingImage.value = null; viewingImageDesc.value = null; };

    return { posts, loading, activeCommentPostId, activeReplyCommentId, activeCardIndex, commentInput, replyInput, showFabMenu, showCreatePost, newPostText, newPostImages, showTextImageCreator, feedTextImageText, feedTextImageBgColor, feedTextImageColors, showLocationSheet, showVisibilitySheet, showMentionSheet, showMediaSheet, locationText, visibilityMode, visibilityAllowRoleIds, mentionRoleIds, mentionTagNames, userProfile, momentsBgUrl, momentsBgStyle, viewingUserProfile, viewingUserPosts, isEditingProfile, loadPosts, toggleLike, toggleCollect, toggleCommentInput, submitComment, deleteComment, deletePost, handleScroll, setActiveCardIndex, goToNextCard, goToPreviousCard, handleCardSwipeStart, handleCardSwipeMove, handleCardSwipeEnd, openCreatePost, closeCreatePost, closeSheets, openLocationSheet, openVisibilitySheet, openMentionSheet, openMediaSheet, locationLabel, visibilityLabel, mentionLabel, toggleVisibilityRole, toggleMentionRole, toggleMentionTag, clearMentions, allCharacterTags, openTextImageCreator, closeTextImageCreator, addTextImageToPost, toggleReplyInput, publishPost, handleImageUpload, triggerImageUpload, triggerCameraUpload, roleAction, showRolePostModal, selectedRoleId, rolePostText, isGeneratingPost, closeRolePostModal, generateRolePost, publishRolePost, generatingPostIds, isGenerating, triggerAIAction, viewingImage, viewingImageDesc, openImageViewer, closeImageViewer, initFeedDB, openProfile, closeProfile, savePostToIndexedDB };
}
