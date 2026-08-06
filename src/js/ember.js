// ember.js
// Threads-like microblog where "netizens" are AI roles.
import { ref, computed, watch } from 'vue';
import { callAI } from './api.js';

const CURRENT_USER_NAME = '我'; // legacy, keeping just in case

// ---------------------------------------------------------------------
// IndexedDB (local-first timeline)
// ---------------------------------------------------------------------
let emberDB = null;
const EMBER_DB_NAME = 'EmberDB';
const EMBER_DB_VERSION = 1;

async function initEmberDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(EMBER_DB_NAME, EMBER_DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      emberDB = request.result;
      resolve(emberDB);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('posts')) {
        const store = db.createObjectStore('posts', { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('authorId', 'authorId', { unique: false });
        store.createIndex('replyTo', 'replyTo', { unique: false });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
  });
}

async function dbPut(storeName, value) {
  if (!emberDB) return false;
  return new Promise((resolve, reject) => {
    const tx = emberDB.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(value);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAll(storeName) {
  if (!emberDB) return [];
  return new Promise((resolve, reject) => {
    const tx = emberDB.transaction([storeName], 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function dbDelete(storeName, key) {
  if (!emberDB) return false;
  return new Promise((resolve, reject) => {
    const tx = emberDB.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

function safeJsonClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    return null;
  }
}

function nowId() {
  // numeric id works well with date formatting and sorting
  return Date.now();
}

function formatTimeShort(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '刚刚';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function pickRandom(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function normalizeCharacters(characters) {
  const raw = Array.isArray(characters) ? characters : (characters?.value || []);
  return Array.isArray(raw) ? raw : [];
}

function characterToAuthor(character) {
  const name = character?.nickname || character?.name || '匿名AI';
  const avatar = character?.avatarUrl || `https://placehold.co/96x96?text=${encodeURIComponent(name.slice(0, 1))}`;
  return { authorId: String(character?.id ?? name), authorName: name, avatar };
}

function isAiProfileReady(activeProfile) {
  const ap = activeProfile?.value ? activeProfile.value : activeProfile;
  const endpoint = String(ap?.endpoint || '').trim();
  const key = String(ap?.key || '').trim();
  return !!(endpoint && key);
}

function activeProfileSnapshot(activeProfile) {
  const ap = activeProfile?.value ? activeProfile.value : activeProfile;
  return {
    endpoint: String(ap?.endpoint || '').trim(),
    key: String(ap?.key || '').trim(),
    model: ap?.model || 'gpt-3.5-turbo'
  };
}

// ---------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------
export function useEmber(characters, activeProfile) {
  const loading = ref(true);
  const error = ref(null);

  const activeNavTab = ref('home'); // home, search, messages, profile
  const activeMsgTab = ref('mentions'); // mentions, notifications, dms
  const viewingPostId = ref(null);
  const loadCustomSections = () => {
    try {
        const stored = localStorage.getItem('ember_custom_sections');
        if (stored) return JSON.parse(stored);
    } catch(e) {}
    return [];
  };

  const customSections = ref(loadCustomSections());
  watch(customSections, (newVal) => {
    try {
        localStorage.setItem('ember_custom_sections', JSON.stringify(newVal));
    } catch(e) {}
  }, { deep: true });
  
  const hotSections = ref([
      { id: 'hot_retro', name: '复古硬件交流', desc: '回到那个充满机械美感的年代...', image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=100&q=80' },
      { id: 'hot_indie', name: '独立开发者', desc: '分享你的独立产品与心路历程。', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=100&q=80' }
  ]);

  const activeSectionId = ref('default');
  const currentSectionName = computed(() => {
      if (activeSectionId.value === 'default') return '闲聊八卦';
      const cSec = customSections.value.find(s => String(s.id) === String(activeSectionId.value));
      if (cSec) return cSec.name;
      const hSec = hotSections.value.find(s => String(s.id) === String(activeSectionId.value));
      if (hSec) return hSec.name;
      return '未知圈子';
  });
  
  const currentSectionImage = computed(() => {
      if (activeSectionId.value === 'default') return 'https://placehold.co/400x400/222/666?text=MAIN';
      const cSec = customSections.value.find(s => String(s.id) === String(activeSectionId.value));
      if (cSec) return cSec.image;
      const hSec = hotSections.value.find(s => String(s.id) === String(activeSectionId.value));
      if (hSec) return hSec.image;
      return 'https://placehold.co/400x400/222/666?text=Circle';
  });

  const currentSectionDesc = computed(() => {
      if (activeSectionId.value === 'default') return '欢迎来到大厅，探索全站动态。';
      const cSec = customSections.value.find(s => String(s.id) === String(activeSectionId.value));
      if (cSec) return cSec.desc;
      const hSec = hotSections.value.find(s => String(s.id) === String(activeSectionId.value));
      if (hSec) return hSec.desc;
      return '探索未知领域...';
  });

  const enterSection = (id) => {
      activeSectionId.value = String(id);
      activeNavTab.value = 'home';
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const timeline = ref([]);
  const showComposer = ref(false);
  const composerTitle = ref('');
  const composerText = ref('');
  const composerFiles = ref([]);
  const composerSectionId = ref('default');
  const replyingTo = ref(null); // post object
  const autoMode = ref(true);

  // Current User Profile State
  const defaultCurrentUser = {
    name: '探索者',
    bio: '在赛博荒原中寻找共鸣的幽灵。',
    avatar: 'https://i.pravatar.cc/300?u=me',
    bg: 'https://placehold.co/800x400/222/666?text=Image'
  };
  
  const storedUser = localStorage.getItem('ember_currentUser');
  const currentUser = ref(storedUser ? JSON.parse(storedUser) : { ...defaultCurrentUser });

  const showEditProfile = ref(false);
  const editProfileForm = ref({ name: '', bio: '', avatar: '', bg: '' });

  function openEditProfile() {
      editProfileForm.value = { ...currentUser.value };
      showEditProfile.value = true;
  }

  function saveProfile() {
      currentUser.value = { ...editProfileForm.value };
      localStorage.setItem('ember_currentUser', JSON.stringify(currentUser.value));
      showEditProfile.value = false;
  }

  function handleProfileImageUpload(field, event) {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
          editProfileForm.value[field] = e.target.result;
      };
      reader.readAsDataURL(file);
  }

  // Profile Tabs State
  const activeProfileTab = ref('posts');
  
  const myPosts = computed(() => {
      return timeline.value.filter(p => p.authorId === 'me' && !p.replyTo).sort((a, b) => b.createdAt - a.createdAt);
  });

  const myLikedPosts = computed(() => {
      return timeline.value.filter(p => p.likedByMe && !p.replyTo).sort((a, b) => b.createdAt - a.createdAt);
  });

  const myLikedReplies = computed(() => {
      return timeline.value.filter(p => p.likedByMe && p.replyTo).sort((a, b) => b.createdAt - a.createdAt);
  });

  // For simple "Threads-like" behavior: show root posts, and for each root post show its replies count.
  const postsById = computed(() => {
    const map = new Map();
    for (const p of timeline.value) map.set(String(p.id), p);
    return map;
  });

  const rootPosts = computed(() => {
    return timeline.value
      .filter(p => !p.replyTo)
      .filter(p => {
          const sid = String(p.sectionId || 'default');
          return sid === String(activeSectionId.value);
      })
      .sort((a, b) => (b.createdAt || b.id || 0) - (a.createdAt || a.id || 0));
  });

  function repliesFor(postId) {
    const id = String(postId);
    return timeline.value
      .filter(p => String(p.replyTo || '') === id)
      .sort((a, b) => (a.createdAt || a.id || 0) - (b.createdAt || b.id || 0));
  }

  const viewingPost = computed(() => timeline.value.find(p => p.id === viewingPostId.value));
  function viewPost(post) {
    viewingPostId.value = post.id;
    activeNavTab.value = 'post';
  }

  async function ensureDb() {
    if (emberDB) return emberDB;
    return await initEmberDB();
  }

  async function loadTimeline() {
    loading.value = true;
    error.value = null;
    try {
      await ensureDb();
      const posts = await dbGetAll('posts');
      timeline.value = (posts || []).map(p => ({
        ...p,
        // derived fields for template
        timeLabel: p?.timeLabel || formatTimeShort(p?.createdAt || p?.id)
      })).sort((a, b) => (b.createdAt || b.id || 0) - (a.createdAt || a.id || 0));
    } catch (e) {
      console.error('Ember loadTimeline failed:', e);
      error.value = e;
      timeline.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function persistPost(post) {
    try {
      await ensureDb();
      const safe = safeJsonClone(post) || post;
      await dbPut('posts', safe);
    } catch (e) {
      console.warn('Ember persist failed:', e);
    }
  }

  async function removePost(postId) {
    try {
      await ensureDb();
      await dbDelete('posts', postId);
    } catch (e) {
      console.warn('Ember delete failed:', e);
    }
  }

  function openComposer(targetPost = null) {
    replyingTo.value = targetPost;
    showComposer.value = true;
    composerTitle.value = '';
    composerText.value = '';
    composerFiles.value = [];
    composerSectionId.value = activeSectionId.value || 'default';
  }

  function closeComposer() {
    showComposer.value = false;
    composerTitle.value = '';
    composerText.value = '';
    composerFiles.value = [];
    composerSectionId.value = 'default';
    replyingTo.value = null;
  }

  function handleComposerFiles(event) {
    if (event.target.files) {
      composerFiles.value = Array.from(event.target.files);
    }
  }

  function formatPostContent(content) {
    if (!content) return '';
    const escapeHtml = (unsafe) => {
        return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    };
    let html = escapeHtml(content);
    // Replace hashtags (letters, numbers, underscores, and Chinese characters)
    html = html.replace(/#([\w\u4e00-\u9fa5]+)/g, '<span style="color: #F48FB1; font-weight: 600;">#$1</span>');
    if (window.DOMPurify) {
        html = window.DOMPurify.sanitize(html);
    }
    return html;
  }

  async function publishMyPost() {
    const text = String(composerText.value || '').trim();
    const title = String(composerTitle.value || '').trim();
    if (!text && !title) return; // need at least some content

    const id = nowId();
    const post = {
      id,
      createdAt: id,
      authorId: 'me',
      authorName: currentUser.value.name,
      avatar: currentUser.value.avatar,
      title: title,
      content: text,
      files: composerFiles.value.map(f => f.name),
      replyTo: replyingTo.value ? String(replyingTo.value.id) : '',
      sectionId: composerSectionId.value || activeSectionId.value || 'default',
      likedByMe: false,
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      timeLabel: formatTimeShort(id)
    };

    // optimistic insert
    timeline.value.unshift(post);
    await persistPost(post);

    // bump counters for parent
    if (post.replyTo) {
      const parent = postsById.value.get(String(post.replyTo));
      if (parent) {
        parent.replyCount = (parent.replyCount || 0) + 1;
        await persistPost(parent);
      }
    }

    closeComposer();
  }

  function toggleLike(postId) {
    const p = timeline.value.find(x => x.id === postId);
    if (!p) return;
    const wasLiked = !!p.likedByMe;
    p.likedByMe = !wasLiked;
    const next = (p.likeCount || 0) + (p.likedByMe ? 1 : -1);
    p.likeCount = Math.max(0, next);
    persistPost(p);
  }

  async function deleteMyPost(postId) {
    const idx = timeline.value.findIndex(p => p.id === postId);
    if (idx < 0) return;
    const p = timeline.value[idx];
    if (p.authorId !== 'me') return;

    timeline.value.splice(idx, 1);
    await removePost(postId);
  }

  // 当没有配置角色时使用的默认 AI 网友人设池
  const DEFAULT_PERSONAS = [
    { id: 'persona_1', name: '晚风小酌', avatar: 'https://i.pravatar.cc/96?u=persona1', bio: '喜欢在深夜刷帖的打工人' },
    { id: 'persona_2', name: '宇宙尘埃', avatar: 'https://i.pravatar.cc/96?u=persona2', bio: '对所有事物都有点好奇' },
    { id: 'persona_3', name: '柠檬绿茶', avatar: 'https://i.pravatar.cc/96?u=persona3', bio: '话不多但说到点上' },
    { id: 'persona_4', name: '深海咸鱼', avatar: 'https://i.pravatar.cc/96?u=persona4', bio: '摸鱼专业户，爱好冲浪' },
    { id: 'persona_5', name: '雨天窗台', avatar: 'https://i.pravatar.cc/96?u=persona5', bio: '文艺但不做作' },
    { id: 'persona_6', name: '夜市炒饭', avatar: 'https://i.pravatar.cc/96?u=persona6', bio: '人间烟火气最治愈' },
  ];

  function resolveAuthor() {
    const chars = normalizeCharacters(characters);
    const validChars = chars.filter(c => String(c?.id || '').trim());
    if (validChars.length > 0) {
      return characterToAuthor(pickRandom(validChars));
    }
    // 没有配置角色时，从默认人设里随机挑一个
    const persona = pickRandom(DEFAULT_PERSONAS);
    return { authorId: persona.id, authorName: persona.name, avatar: persona.avatar };
  }

  async function generateAiPost() {
    // 如果没有 API 也没有角色，则不生成
    if (!isAiProfileReady(activeProfile) && normalizeCharacters(characters).length === 0) return;

    const author = resolveAuthor();
    const id = nowId();

    // fallback content
    const fallback = pickRandom([
      '今天有点想发点什么，但又不知道说啥。',
      '刚刚看到一个很离谱的观点，我沉默了三秒。',
      '你们有没有那种：越忙越想摸鱼的时刻？',
      '如果你现在能立刻学会一项技能，你会选什么？'
    ]);

    let content = fallback;
    if (isAiProfileReady(activeProfile)) {
      const ap = activeProfileSnapshot(activeProfile);
      const sys = `你在一个类似 Threads 的中文女性社区 Ember 发帖。你扮演一个真实的网友，昵称是【${author.authorName}】。
要求：
1) 口语化、真实感强，像普通女生随手发的日常或感想。
2) 1-3 句，不要太长。
3) 内容可以是日常吐槽、情绪共鸣、生活分享、追剧感受等，贴近女性视角。
4) 可以有 0-1 个 emoji，但不要堆。
5) 不要使用话题标签（#），不要加引号，不要输出任何解释或前缀。`;
      try {
        const out = await callAI(
          { ...ap, model: ap.model },
          [{ role: 'system', content: sys }, { role: 'user', content: '发一条动态' }],
          { temperature: 0.95 }
        );
        const cleaned = String(out || '').replace(/^["'「」【】]|["'「」【】]$/g, '').trim();
        if (cleaned) content = cleaned;
      } catch (e) {
        console.warn('Ember AI post failed, fallback used:', e);
      }
    }

    const post = {
      id,
      createdAt: id,
      authorId: author.authorId,
      authorName: author.authorName,
      avatar: author.avatar,
      content,
      replyTo: '',
      sectionId: activeSectionId.value,
      likedByMe: false,
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      timeLabel: formatTimeShort(id)
    };

    timeline.value.unshift(post);
    await persistPost(post);
  }

  async function generateAiReply(targetPost) {
    if (!targetPost) return;
    // 如果没有 API 也没有角色，则不生成
    if (!isAiProfileReady(activeProfile) && normalizeCharacters(characters).length === 0) return;

    const author = resolveAuthor();
    const id = nowId();
    const fallback = pickRandom(['同感。', '这点我不同意。', '笑死我了。', '展开说说？', '我觉得关键在于…']);

    let content = fallback;
    if (isAiProfileReady(activeProfile)) {
      const ap = activeProfileSnapshot(activeProfile);
      const sys = `你在一个中文女性社区 Ember 回复帖子。你扮演一个真实网友，昵称是【${author.authorName}】。
被回复的帖子作者：${targetPost.authorName}
被回复的帖子内容：${targetPost.content}
要求：
1) 1 句话为主，最多 2 句。
2) 语气自然，像女生网友随口的回复，可以共情、追问或轻松调侃。
3) 不要攻击性内容，不要加引号，不要输出任何解释或前缀。`;
      try {
        const out = await callAI(
          { ...ap, model: ap.model },
          [{ role: 'system', content: sys }, { role: 'user', content: '写一条回复' }],
          { temperature: 0.95 }
        );
        const cleaned = String(out || '').replace(/^["'「」【】]|["'「」【】]$/g, '').trim();
        if (cleaned) content = cleaned;
      } catch (e) {
        console.warn('Ember AI reply failed, fallback used:', e);
      }
    }

    const reply = {
      id,
      createdAt: id,
      authorId: author.authorId,
      authorName: author.authorName,
      avatar: author.avatar,
      content,
      replyTo: String(targetPost.id),
      sectionId: activeSectionId.value,
      likedByMe: false,
      likeCount: 0,
      repostCount: 0,
      replyCount: 0,
      timeLabel: formatTimeShort(id)
    };

    timeline.value.unshift(reply);
    await persistPost(reply);

    const parent = postsById.value.get(String(targetPost.id));
    if (parent) {
      parent.replyCount = (parent.replyCount || 0) + 1;
      await persistPost(parent);
    }
  }

  // Auto mode: periodically let AI post while Ember is opened.
  let autoTimer = null;
  function startAuto() {
    stopAuto();
    if (!autoMode.value) return;
    // 35~75s a post, slightly random
    const tick = async () => {
      const delay = 35000 + Math.floor(Math.random() * 40000);
      autoTimer = setTimeout(async () => {
        // 65% new post, 35% reply to a recent post
        const roll = Math.random();
        const roots = rootPosts.value.slice(0, 12);
        if (roll < 0.35 && roots.length) {
          await generateAiReply(pickRandom(roots));
        } else {
          await generateAiPost();
        }
        tick();
      }, delay);
    };
    tick();
  }

  function stopAuto() {
    if (autoTimer) {
      clearTimeout(autoTimer);
      autoTimer = null;
    }
  }

  async function onEnter() {
    await loadTimeline();
    startAuto();
  }

  function onLeave() {
    stopAuto();
    closeComposer();
  }

  const cleanup = () => {
    stopAuto();
  };

  // First init: try to load once so empty timeline doesn't look broken
  // (real refresh is done via onEnter from script.js watcher)
  ensureDb().then(() => loadTimeline()).catch(() => {});

  const showCreateSectionModal = ref(false);
  const newSectionForm = ref({ name: '', desc: '', image: '', moderatorId: null, includedCharIds: [] });

  const handleCreateSection = () => {
    newSectionForm.value = { name: '', desc: '', image: '', moderatorId: null, includedCharIds: [] };
    showCreateSectionModal.value = true;
  };

  const handleSectionImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        newSectionForm.value.image = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const triggerSectionImageUpload = () => {
    const el = document.getElementById('ember-section-image-input');
    if (el) el.click();
  };

  const followHotSection = (hSec) => {
    if (customSections.value.some(s => s.id === hSec.id)) {
        alert("已经关注过该圈子啦！");
        return;
    }
    customSections.value.unshift({
        id: hSec.id,
        name: hSec.name,
        desc: hSec.desc,
        image: hSec.image,
        moderatorId: null,
        includedCharIds: []
    });
    alert(`成功关注圈子: ${hSec.name}`);
  };

  const toggleIncludedChar = (id) => {
    const idx = newSectionForm.value.includedCharIds.indexOf(id);
    if (idx >= 0) newSectionForm.value.includedCharIds.splice(idx, 1);
    else newSectionForm.value.includedCharIds.push(id);
  };

  const submitCustomSection = () => {
    if (!newSectionForm.value.name.trim()) return;
    const defaultImage = `https://placehold.co/100x100/121212/888?text=${encodeURIComponent(newSectionForm.value.name.substring(0,2))}`;
    customSections.value.unshift({
        id: Date.now(),
        name: newSectionForm.value.name,
        desc: newSectionForm.value.desc || '探索未知领域...',
        image: newSectionForm.value.image.trim() || defaultImage,
        moderatorId: newSectionForm.value.moderatorId,
        includedCharIds: [...newSectionForm.value.includedCharIds]
    });
    showCreateSectionModal.value = false;
  };

  const deleteCustomSection = (id) => {
    if (confirm('确定要删除这个圈子吗？')) {
      customSections.value = customSections.value.filter(s => s.id !== id);
      if (activeSectionId.value === String(id)) {
        activeSectionId.value = 'default';
      }
    }
  };

  const generatingSection = ref(false);
  const generateAiSection = async () => {
    if (!isAiProfileReady(activeProfile)) {
        alert("请先配置 AI 秘钥！");
        return;
    }
    generatingSection.value = true;
    try {
        const ap = activeProfileSnapshot(activeProfile);
        const sys = `你是一个充满创意的赛博朋克社区管理员。请随机想一个前卫、极客或脑洞大开的圈子（比如讨论旧时代硬件、仿生人心理学、电子失灵症候群等）。
要求只返回两行文本：
第一行：圈子名称（不超过8个字）
第二行：圈子一句话简介（不超过20个字）
不要输出多余解释或标点符号。`;

        const out = await callAI(
          { ...ap, model: ap.model },
          [{ role: 'user', content: sys }],
          { temperature: 1.0 }
        );
        const lines = String(out || '').split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length >= 2) {
            const name = lines[0].replace(/^["']|["']$/g, '');
            const desc = lines[1].replace(/^["']|["']$/g, '');
            customSections.value.unshift({
                id: Date.now(),
                name,
                desc,
                moderatorId: null,
                includedCharIds: [],
                image: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&w=100&q=80`,
            });
            enterSection(customSections.value[0].id);
        } else {
            alert("AI 生成失败，请重试");
        }
    } catch (e) {
        console.warn('Ember AI section generation failed:', e);
        alert("AI 请求失败，请重试");
    } finally {
        generatingSection.value = false;
    }
  };

  // Mock Messages Data
  const mentionsList = ref([
      { id: 1, avatar: 'https://i.pravatar.cc/150?u=12', name: 'Mia', time: '10 分钟前', text: '@了你：快来看看这个！', unread: true },
      { id: 2, avatar: 'https://i.pravatar.cc/150?u=33', name: 'Kael', time: '2 小时前', text: '回复了你：完全同意你的看法，这太棒了。', unread: false }
  ]);

  function handleMentionClick(msg) {
      msg.unread = false;
      // Navigate to the first available post as a mock
      if (timeline.value.length > 0) {
          viewPost(timeline.value[0]);
      }
  }

  const notificationsList = ref([
      { id: 1, avatar: 'https://i.pravatar.cc/150?u=99', name: 'System', time: '1 小时前', text: '你的帖子《欢迎来到...》收到了 15 个赞', unread: true },
      { id: 2, avatar: 'https://i.pravatar.cc/150?u=44', name: 'Zoe', time: '昨天', text: '关注了你，去打个招呼吧！', unread: false }
  ]);

  const dmsList = ref([
      { id: 1, avatar: 'https://i.pravatar.cc/150?u=55', name: 'Lily', time: '刚刚', text: '嗨，昨天你提到的那本书叫什么名字？', unread: true },
      { id: 2, avatar: 'https://i.pravatar.cc/150?u=77', name: 'Alex', time: '3 天前', text: '下次聚会见！', unread: false }
  ]);

  // Chat UI State
  const showChatView = ref(false);
  const currentChatUser = ref(null);
  const chatInput = ref('');
  const chatMessages = ref([]);

  function openChat(msg) {
      msg.unread = false;
      currentChatUser.value = { name: msg.name, avatar: msg.avatar };
      showChatView.value = true;
      chatMessages.value = [
          { id: 1, isMe: false, text: msg.text, time: msg.time }
      ];
  }

  function closeChat() {
      showChatView.value = false;
      currentChatUser.value = null;
      chatInput.value = '';
  }

  function sendChatMessage() {
      const text = chatInput.value.trim();
      if (!text) return;
      chatMessages.value.push({
          id: Date.now(),
          isMe: true,
          text: text,
          time: '刚刚'
      });
      chatInput.value = '';
  }

  // User Profile State
  const showUserProfileView = ref(false);
  const viewingProfileUser = ref(null);
  const profileUserPosts = ref([]);
  
  const storedFollowing = localStorage.getItem('ember_following');
  const followingMap = ref(storedFollowing ? JSON.parse(storedFollowing) : {});

  const isFollowingProfileUser = computed(() => {
      if (!viewingProfileUser.value) return false;
      return !!followingMap.value[viewingProfileUser.value.name];
  });

  const followingList = computed(() => {
      return Object.entries(followingMap.value).map(([name, data]) => ({ name, ...data }));
  });

  const showFollowingListOverlay = ref(false);
  function openFollowingList() {
      showFollowingListOverlay.value = true;
  }
  function closeFollowingList() {
      showFollowingListOverlay.value = false;
  }

  function viewUserProfile(user) {
      viewingProfileUser.value = user;
      
      // Mock posts for this user
      profileUserPosts.value = [
          {
              id: Date.now(),
              authorName: user.name,
              avatar: user.avatar,
              content: '今天真是个好天气！分享一张刚刚拍的照片。',
              timeLabel: '2小时前'
          },
          {
              id: Date.now() - 100000,
              authorName: user.name,
              avatar: user.avatar,
              content: '有没有什么好看的电影推荐？周末想在家看电影。',
              timeLabel: '1天前'
          }
      ];

      showUserProfileView.value = true;
  }

  function closeUserProfile() {
      showUserProfileView.value = false;
      viewingProfileUser.value = null;
  }

  function toggleFollowProfileUser() {
      if (!viewingProfileUser.value) return;
      const user = viewingProfileUser.value;
      if (followingMap.value[user.name]) {
          delete followingMap.value[user.name];
      } else {
          followingMap.value[user.name] = { 
              avatar: user.avatar, 
              bio: user.bio || '在这个宇宙中寻找同频共振的人。' 
          };
      }
      localStorage.setItem('ember_following', JSON.stringify(followingMap.value));
  }

  return {
    loading,
    error,
    activeNavTab,
    activeMsgTab,
    viewingPostId,
    viewingPost,
    viewPost,
    customSections,
    hotSections,
    activeSectionId,
    currentSectionName,
    currentSectionImage,
    currentSectionDesc,
    enterSection,
    showCreateSectionModal,
    newSectionForm,
    handleCreateSection,
    handleSectionImageUpload,
    triggerSectionImageUpload,
    followHotSection,
    toggleIncludedChar,
    submitCustomSection,
    deleteCustomSection,
    generatingSection,
    generateAiSection,
    timeline,
    rootPosts,
    repliesFor,
    showComposer,
    composerTitle,
    composerText,
    composerFiles,
    composerSectionId,
    replyingTo,
    autoMode,
    openComposer,
    closeComposer,
    handleComposerFiles,
    formatPostContent,
    publishMyPost,
    toggleLike,
    deleteMyPost,
    generateAiPost,
    generateAiReply,
    onEnter,
    onLeave,
    cleanup,
    initEmberDB,
    mentionsList,
    notificationsList,
    dmsList,
    handleMentionClick,
    showChatView,
    currentChatUser,
    chatInput,
    chatMessages,
    openChat,
    closeChat,
    sendChatMessage,
    showUserProfileView,
    viewingProfileUser,
    profileUserPosts,
    isFollowingProfileUser,
    followingList,
    showFollowingListOverlay,
    openFollowingList,
    closeFollowingList,
    viewUserProfile,
    closeUserProfile,
    toggleFollowProfileUser,
    currentUser,
    showEditProfile,
    editProfileForm,
    openEditProfile,
    saveProfile,
    handleProfileImageUpload,
    activeProfileTab,
    myPosts,
    myLikedPosts,
    myLikedReplies
  };
}