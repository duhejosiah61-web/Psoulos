// feed.js
import { ref } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

// 可以在此处配置 API 地址，或者通过 script.js 中的 profiles 动态获取（这里简化处理）
const API_BASE_URL = 'http://localhost:3000/api'; 
const CURRENT_USER_NAME = '我';

export function useFeed() {
    const posts = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const scrollTop = ref(0);
    const activeCommentPostId = ref(null);
    const commentInput = ref('');
    
    // Create Post State
    const showCreatePost = ref(false);
    const newPostText = ref('');
    const newPostImages = ref([]); // Store image URLs
    
    // User Profile State
    const userProfile = ref({
        name: CURRENT_USER_NAME,
        avatar: 'https://placehold.co/100x100/333/fff?text=Me',
        bio: '点击这里编辑个性签名',
        bgImage: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=80'
    });

    // Profile Viewer State
    const viewingUserProfile = ref(null); // null = main feed, object = showing profile
    const isEditingProfile = ref(false);

    // Load User Profile from LocalStorage
    try {
        const savedProfile = localStorage.getItem('feed_user_profile');
        if (savedProfile) {
            userProfile.value = { ...userProfile.value, ...JSON.parse(savedProfile) };
        }
    } catch (e) {
        console.error('Failed to load user profile', e);
    }

    // Save User Profile
    function saveUserProfile() {
        localStorage.setItem('feed_user_profile', JSON.stringify(userProfile.value));
        isEditingProfile.value = false;
    }

    // Open Profile
    function openProfile(authorName) {
        if (authorName === userProfile.value.name || authorName === '我') {
            // My Profile
            viewingUserProfile.value = {
                ...userProfile.value,
                isCurrentUser: true
            };
        } else {
            // Other User Profile
            // Try to find avatar from posts
            const post = posts.value.find(p => p.author === authorName);
            const avatar = post ? post.avatar : 'https://placehold.co/100x100?text=' + authorName.substring(0,1);
            
            viewingUserProfile.value = {
                name: authorName,
                avatar: avatar,
                bio: '这个角色很神秘，什么都没写',
                bgImage: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80', // Default BG for others
                isCurrentUser: false
            };
        }
    }

    // Close Profile
    function closeProfile() {
        viewingUserProfile.value = null;
        isEditingProfile.value = false;
    }

    // Handle Profile Image Upload (Avatar or BG)
    function handleProfileImageUpload(event, type) {
        // type: 'avatar' | 'bg'
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            if (type === 'avatar') {
                userProfile.value.avatar = e.target.result;
            } else if (type === 'bg') {
                userProfile.value.bgImage = e.target.result;
            }
            // Auto save when image changes
            saveUserProfile();
            
            // Update viewing profile if we are viewing ourselves
            if (viewingUserProfile.value && viewingUserProfile.value.isCurrentUser) {
                viewingUserProfile.value[type === 'avatar' ? 'avatar' : 'bgImage'] = e.target.result;
            }
        };
        reader.readAsDataURL(file);
    }

    // Trigger Profile Image Upload
    function triggerProfileImageUpload(type) {
        const id = type === 'avatar' ? 'profile-avatar-input' : 'profile-bg-input';
        const input = document.getElementById(id);
        if (input) input.click();
    }

    // Load Posts
    async function loadPosts() {
        loading.value = true;
        error.value = null;
        
        // 1. Load local user posts
        let localPosts = [];
        try {
            localPosts = JSON.parse(localStorage.getItem('feed_user_posts') || '[]');
        } catch (e) {
            console.error('Error parsing local posts:', e);
            localPosts = [];
        }
        
        try {
            // 2. Try fetch API posts (Role posts)
            // Note: If API fails, we just use local posts
            const response = await fetch(`${API_BASE_URL}/posts`);
            if (response.ok) {
                const apiData = await response.json();
                const processedApiPosts = apiData.map(post => ({
                    ...post,
                    isLiked: post.likes && post.likes.includes(CURRENT_USER_NAME),
                    isFavorited: post.isFavorited || false
                }));
                
                // Merge local posts and API posts
                // Sort by time (newest first) - assuming id is timestamp or time field is comparable
                // For simplicity, we just concat and let the UI render. 
                // In a real app, we'd sort by date.
                posts.value = [...localPosts, ...processedApiPosts].sort((a, b) => {
                    // Simple sort by ID if ID is timestamp, otherwise needs date parsing
                    return (b.id || 0) - (a.id || 0);
                });
            } else {
                // API failed but not network error (e.g. 404, 500)
                posts.value = localPosts;
            }
        } catch (err) {
            console.warn('Feed API unreachable (Role posts skipped), using local only:', err);
            // API network error - just show local posts
            posts.value = localPosts;
        } finally {
            loading.value = false;
        }
    }

    // Toggle Like
    async function toggleLike(postId) {
        const post = posts.value.find(p => p.id === postId);
        if (!post) return;

        // Local update
        const wasLiked = post.isLiked;
        post.isLiked = !wasLiked;
        
        if (post.isLiked) {
            if (!post.likes) post.likes = [];
            post.likes.push(CURRENT_USER_NAME);
        } else {
            const idx = post.likes.indexOf(CURRENT_USER_NAME);
            if (idx > -1) post.likes.splice(idx, 1);
        }

        // If it's a local post (id is number/timestamp usually), save to local storage
        // If it's an API post, we MIGHT want to sync, but user said "User actions don't call API"
        // So we only update local state.
        // However, if we reload, the like on API post will be lost unless we persist "liked API posts" locally too.
        // For now, we'll just persist if it's in the 'feed_user_posts' list.
        saveLocalPostUpdate(post);
    }

    // Toggle Favorite
    async function toggleFavorite(postId) {
        const post = posts.value.find(p => p.id === postId);
        if (!post) return;

        // Local update
        post.isFavorited = !post.isFavorited;
        
        saveLocalPostUpdate(post);
    }

    // Show/Hide Comment Input
    function toggleCommentInput(postId) {
        if (activeCommentPostId.value === postId) {
            activeCommentPostId.value = null;
            commentInput.value = '';
        } else {
            activeCommentPostId.value = postId;
            commentInput.value = '';
        }
    }

    // Submit Comment
    async function submitComment(postId) {
        if (!commentInput.value.trim()) return;
        
        const post = posts.value.find(p => p.id === postId);
        if (!post) return;

        const content = commentInput.value;
        const tempId = Date.now();
        
        // Local update
        if (!post.comments) post.comments = [];
        post.comments.push({
            id: tempId,
            user: CURRENT_USER_NAME,
            content: content
        });

        // Close input
        activeCommentPostId.value = null;
        commentInput.value = '';

        // Save locally
        saveLocalPostUpdate(post);
    }

    // Helper to save updates to local posts
    function saveLocalPostUpdate(post) {
        const localPosts = JSON.parse(localStorage.getItem('feed_user_posts') || '[]');
        const idx = localPosts.findIndex(p => p.id === post.id);
        if (idx > -1) {
            // Update existing local post
            localPosts[idx] = post;
            localStorage.setItem('feed_user_posts', JSON.stringify(localPosts));
        } else {
            // It might be an API post that we modified locally (liked/commented)
            // If we want to persist likes on API posts without API, we need a separate "user_interactions" storage.
            // For simplicity, we won't persist interactions on API posts across reloads 
            // unless we store them. But the user requirement "User actions NO API" is strict.
        }
    }

    // AI Role Comment
    const showRoleCommentModal = ref(false);
    const commentTargetPost = ref(null);
    const isGeneratingComment = ref(false);

    function openRoleCommentModal(post) {
        commentTargetPost.value = post;
        showRoleCommentModal.value = true;
        selectedRoleId.value = null; // Reuse role selector
        isGeneratingComment.value = false;
    }

    function closeRoleCommentModal() {
        showRoleCommentModal.value = false;
        commentTargetPost.value = null;
        selectedRoleId.value = null;
        isGeneratingComment.value = false;
    }

    async function generateAndSubmitComment(characters, activeProfile) {
        if (!selectedRoleId.value || !commentTargetPost.value || !activeProfile) {
            console.warn('Missing data for comment generation');
            return;
        }

        const character = characters.find(c => c.id === selectedRoleId.value);
        if (!character) return;

        isGeneratingComment.value = true;
        
        const endpoint = (activeProfile.endpoint || '').trim();
        const key = (activeProfile.key || '').trim();
        const modelId = activeProfile.model || 'gpt-3.5-turbo';

        try {
            // Construct context from post
            const postContext = `
动态作者：${commentTargetPost.value.author}
动态内容：${commentTargetPost.value.content}
配图描述：${commentTargetPost.value.imageDescriptions ? commentTargetPost.value.imageDescriptions.join(', ') : '无'}
            `.trim();

            const systemPrompt = `你正在扮演角色【${character.nickname || character.name}】。
${character.persona || ''}
你的朋友发了一条朋友圈动态：
${postContext}

请根据你们的关系和你的性格，给这条动态写一条评论。
要求：
1. 简短自然（1-2句话）。
2. 口语化，可以用emoji。
3. 如果是朋友，可以调侃、赞美或互动。
4. 直接输出评论内容，不要加引号。`;

            const response = await fetch(endpoint.replace(/\/+$/, '') + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: '请评论' }],
                    temperature: 0.8,
                    stream: false
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            
            const data = await response.json();
            let content = '';
            if (data.choices && data.choices[0] && data.choices[0].message) {
                content = data.choices[0].message.content;
            } else if (data.message && data.message.content) {
                content = data.message.content;
            }

            content = content.replace(/^["']|["']$/g, '').trim();

            // Submit the comment directly
            if (content) {
                roleAction('comment', {
                    postId: commentTargetPost.value.id,
                    author: character.nickname || character.name,
                    content: content
                });
            }

        } catch (error) {
            console.error('Generate Comment Error:', error);
            alert(`生成评论失败: ${error.message}`);
        } finally {
            isGeneratingComment.value = false;
            closeRoleCommentModal();
        }
    }

    // Role API Interface (Exposed for script.js)
    // script.js calls this when a character wants to post/comment
    async function roleAction(actionType, data) {
        console.log('Role Action triggered:', actionType, data);
        
        if (actionType === 'post') {
             // ... existing post logic ...
             // Create local role post
             const newPost = {
                id: Date.now(),
                author: data.author || '未知角色',
                avatar: data.avatar || 'https://placehold.co/100x100?text=?',
                content: data.content,
                images: data.images || [],
                imageDescriptions: data.imageDescriptions || [], // Store image descriptions
                time: '刚刚',
                likes: [],
                comments: [],
                isLiked: false,
                isFavorited: false
             };

             // Add to in-memory list
             posts.value.unshift(newPost);
             
             // Save to localStorage
             try {
                const localPosts = JSON.parse(localStorage.getItem('feed_user_posts') || '[]');
                localPosts.unshift(newPost);
                localStorage.setItem('feed_user_posts', JSON.stringify(localPosts));
             } catch (e) {
                 console.error('Failed to save role post:', e);
             }
        } else if (actionType === 'comment') {
            const post = posts.value.find(p => p.id === data.postId);
            if (post) {
                if (!post.comments) post.comments = [];
                post.comments.push({
                    id: Date.now(),
                    user: data.author,
                    content: data.content
                });
                saveLocalPostUpdate(post);
            }
        }
    }

    function handleScroll(e) {
        scrollTop.value = e.target.scrollTop;
    }

    // Create Post Logic
    function openCreatePost() {
        showCreatePost.value = true;
        newPostText.value = '';
        newPostImages.value = [];
    }

    function closeCreatePost() {
        showCreatePost.value = false;
        newPostText.value = '';
        newPostImages.value = [];
    }

    // Handle Image Upload from Album
    function handleImageUpload(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) continue;

            const reader = new FileReader();
            reader.onload = (e) => {
                if (newPostImages.value.length < 9) {
                    newPostImages.value.push(e.target.result);
                }
            };
            reader.readAsDataURL(file);
        }
        // Reset input so same file can be selected again if needed
        event.target.value = '';
    }

    // Trigger File Input Click
    function triggerImageUpload() {
        const input = document.getElementById('feed-image-input');
        if (input) input.click();
    }

    async function publishPost() {
        if (!newPostText.value.trim() && newPostImages.value.length === 0) return;

        const content = newPostText.value;
        const images = [...newPostImages.value];
        
        loading.value = true;
        
        // Local Only Mode for User
        try {
            const newPost = {
                id: Date.now(),
                author: CURRENT_USER_NAME,
                avatar: 'https://placehold.co/100x100/333/fff?text=Me',
                content: content,
                images: images,
                time: '刚刚',
                likes: [],
                comments: [],
                isLiked: false,
                isFavorited: false
            };
            
            // Add to in-memory list
            posts.value.unshift(newPost);
            
            // Save to localStorage
            try {
                const localPosts = JSON.parse(localStorage.getItem('feed_user_posts') || '[]');
                localPosts.unshift(newPost);
                localStorage.setItem('feed_user_posts', JSON.stringify(localPosts));
            } catch (storageErr) {
                console.error('LocalStorage Save Error:', storageErr);
                alert('存储空间不足，图片可能过大，无法保存到本地历史，但本次会话可见。');
            }

            // Success
            closeCreatePost();
        } catch (err) {
            console.error('Publish Error:', err);
            alert('发布失败');
        } finally {
            loading.value = false;
        }
    }

    function addImageToPost() {
        // Allow user to input URL or use random mock image
        const url = prompt('请输入图片URL (留空随机):');
        if (url) {
            newPostImages.value.push(url);
        } else {
            const mockImages = [
                'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=500&q=60',
                'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&q=60',
                'https://images.unsplash.com/photo-1628191011993-4350f92696bb?w=500&q=60'
            ];
            const randomImg = mockImages[Math.floor(Math.random() * mockImages.length)];
            newPostImages.value.push(randomImg);
        }
    }

    // Role Manual Post State
    const showRolePostModal = ref(false);
    const rolePostText = ref('');
    const selectedRoleId = ref(null);
    const isGeneratingPost = ref(false);

    // Open Role Post Modal
    function openRolePostModal() {
        showRolePostModal.value = true;
        rolePostText.value = '';
        selectedRoleId.value = null;
        isGeneratingPost.value = false;
    }

    function closeRolePostModal() {
        showRolePostModal.value = false;
        rolePostText.value = '';
        selectedRoleId.value = null;
        isGeneratingPost.value = false;
    }

    // Generate Role Post Content using LLM
    async function generateRolePost(character, activeProfile) {
        if (!character || !activeProfile) {
            console.warn('Cannot generate post: missing character or profile');
            return;
        }

        isGeneratingPost.value = true;
        rolePostText.value = '正在思考...';

        const endpoint = (activeProfile.endpoint || '').trim();
        const key = (activeProfile.key || '').trim();
        const modelId = activeProfile.model || 'gpt-3.5-turbo';

        try {
            const systemPrompt = `你正在扮演角色【${character.nickname || character.name}】。
${character.persona || ''}
请发一条符合你人设的朋友圈动态。
要求：
1. 内容简短（1-3句话），贴近生活，口语化，可加emoji。
2. 必须包含1-3张配图的描述，格式为：[图片: 画面描述]。
   例如：“今天天气真好！[图片: 蓝天白云下的公园草地] [图片: 一杯冰拿铁]”
3. 图片描述要具体且有画面感。
4. 不要加任何其他解释性文字，直接输出动态内容。`;

            const response = await fetch(endpoint.replace(/\/+$/, '') + '/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: modelId,
                    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: '发一条朋友圈' }],
                    temperature: 0.8,
                    stream: false
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            
            const data = await response.json();
            let content = '';
            if (data.choices && data.choices[0] && data.choices[0].message) {
                content = data.choices[0].message.content;
            } else if (data.message && data.message.content) {
                content = data.message.content;
            }

            rolePostText.value = content.replace(/^["']|["']$/g, '').trim();

        } catch (error) {
            console.error('Generate Post Error:', error);
            rolePostText.value = `(生成失败: ${error.message})`;
        } finally {
            isGeneratingPost.value = false;
        }
    }

    // Publish Role Post Manually
    function publishRolePost(characters) {
        if (!selectedRoleId.value || !rolePostText.value.trim()) return;
        
        const character = characters.find(c => c.id === selectedRoleId.value);
        if (!character) return;

        let finalContent = rolePostText.value;
        const images = [];
        const imageDescriptions = [];

        // Parse [图片: xxx] tags
        const imgRegex = /\[图片:\s*(.+?)\]/g;
        let match;
        const mockColors = ['#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', '#f8b195', '#f67280', '#c06c84', '#6c5b7b', '#355c7d'];
        
        while ((match = imgRegex.exec(finalContent)) !== null) {
            const desc = match[1].trim();
            // Use local mock image (color block) instead of external URL to avoid loading issues
            const randomColor = mockColors[Math.floor(Math.random() * mockColors.length)];
            images.push(`mock:${randomColor}`);
            imageDescriptions.push(desc); // Store full description
        }

        // Remove image tags from content for display
        finalContent = finalContent.replace(/\[图片:\s*.+?\]/g, '').trim();

        roleAction('post', {
            author: character.nickname || character.name,
            avatar: character.avatarUrl,
            content: finalContent,
            images: images,
            imageDescriptions: imageDescriptions
        });

        closeRolePostModal();
    }

    // Image Viewer State
    const viewingImage = ref(null); // URL
    const viewingImageDesc = ref(null);

    function openImageViewer(imgUrl, desc) {
        viewingImage.value = imgUrl;
        viewingImageDesc.value = desc;
    }

    function closeImageViewer() {
        viewingImage.value = null;
        viewingImageDesc.value = null;
    }

    return {
        posts,
        loading,
        error,
        scrollTop,
        activeCommentPostId,
        commentInput,
        showCreatePost,
        newPostText,
        newPostImages,
        loadPosts,
        toggleLike,
        toggleFavorite,
        toggleCommentInput,
        submitComment,
        handleScroll,
        openCreatePost,
        closeCreatePost,
        publishPost,
        addImageToPost,
        handleImageUpload,
        triggerImageUpload,
        roleAction,
        // Profile related exports
        userProfile,
        viewingUserProfile,
        isEditingProfile,
        openProfile,
        closeProfile,
        saveUserProfile,
        handleProfileImageUpload,
        triggerProfileImageUpload,
        // Role Manual Post
        showRolePostModal,
        rolePostText,
        selectedRoleId,
        isGeneratingPost,
        openRolePostModal,
        closeRolePostModal,
        generateRolePost,
        publishRolePost,
        // Image Viewer
        viewingImage,
        viewingImageDesc,
        openImageViewer,
        closeImageViewer,
        // AI Comment
        showRoleCommentModal,
        commentTargetPost,
        isGeneratingComment,
        openRoleCommentModal,
        closeRoleCommentModal,
        generateAndSubmitComment
    };
}
