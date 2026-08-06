<template>
  <div class="peek-app-nav" v-if="peek.peekInnerApp !== 'messages'">
      <button class="peek-app-back" @click="peek.closePeekInnerApp"><i class="fas fa-chevron-left"></i></button>
      <span class="peek-app-title">{{ peek.getPeekAppName(peek.peekInnerApp) }}</span>
  </div>
  <div class="peek-app-body">
                                                                  <div v-if="peek.peekInnerApp === 'messages'" class="peek-app-im peek-modern-im">
          <!-- Inbox View -->
          <div v-if="!peek.peekActiveChatContact" class="peek-modern-inbox">
              <div class="peek-modern-header">
                  <div class="peek-modern-back" @click="peek.closePeekInnerApp()">
                      <i class="fas fa-chevron-left"></i>
                  </div>
                  <div class="header-title">信息</div>
                  <div class="header-action"><i class="fas fa-edit"></i></div>
              </div>
              <div v-if="peek.peekChatInbox.length === 0" class="peek-modern-empty">无信息</div>
              <div class="peek-modern-inbox-list">
                  <div v-for="c in peek.peekChatInbox" :key="c.contactName" class="peek-modern-inbox-item" @click="peek.openPeekChat(c.contactName)">
                      <div class="peek-modern-avatar-box">
                          <span class="avatar-text">{{ c.contactName.charAt(0) }}</span>
                      </div>
                      <div class="peek-modern-inbox-info">
                          <div class="peek-modern-inbox-top">
                              <span class="peek-modern-name">{{ c.contactName }}</span>
                              <span class="peek-modern-time">{{ c.lastMessageTime }}</span>
                          </div>
                          <div class="peek-modern-inbox-bottom">
                              <span class="peek-modern-preview" :class="{'unread-text': c.unread > 0}">{{ c.lastMessageText }}</span>
                              <span class="peek-modern-unread-dot" v-if="c.unread > 0"></span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
          <!-- Chat Thread View -->
          <div v-else class="peek-modern-thread">
              <div class="peek-modern-header peek-modern-thread-header">
                  <div class="peek-modern-back" @click="peek.closePeekChat()">
                      <i class="fas fa-chevron-left"></i>
                      <span class="back-text">信息</span>
                  </div>
                  <div class="peek-modern-contact-info">
                      <div class="peek-modern-contact-avatar">{{ peek.peekActiveChatContact.charAt(0) }}</div>
                      <span class="peek-modern-contact-name">{{ peek.peekActiveChatContact }}</span>
                  </div>
                  <div class="peek-modern-action"><i class="fas fa-video"></i></div>
              </div>
              <div class="peek-modern-thread-body">
                  <div class="peek-modern-timestamp">今天 {{ peek.peekStatusTime || '09:41' }}</div>
                  <div v-if="peek.peekActiveChatMessages.length === 0" class="peek-modern-empty">没有消息记录</div>
                  <div v-for="m in peek.peekActiveChatMessages" :key="m.id" class="peek-modern-msg-row" :class="m.sender">
                      <div class="peek-modern-bubble-group">
                          <div class="peek-modern-bubble-wrap">
                              <div class="peek-modern-bubble">{{ m.text }}</div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
                                                                  <div v-else-if="peek.peekInnerApp === 'todo'" class="peek-modern-app-container">
          <div v-if="(peek.peekTodoItems || []).length === 0" class="peek-modern-empty">暂无待办</div>
          <div class="peek-modern-card-group" v-else>
              <div class="peek-modern-card-item" v-for="t in peek.peekTodoItems" :key="t.id" :class="{ 'done': t.done }">
                  <div class="peek-modern-checkbox"><i class="fas" :class="t.done ? 'fa-check-circle' : 'fa-circle'"></i></div>
                  <div class="peek-modern-item-content">
                      <div class="peek-modern-item-title">{{ t.text || '待办' }}</div>
                      <div class="peek-modern-item-sub" v-if="t.due">截止：{{ t.due }} <span v-if="t.at">· {{ t.at }}</span></div>
                  </div>
              </div>
          </div>
      </div>
      <div v-else-if="peek.peekInnerApp === 'calendar'" class="peek-modern-app-container">
          <div v-if="(peek.peekCalendarEvents || []).length === 0" class="peek-modern-empty">暂无日程</div>
          <div class="peek-modern-timeline" v-else>
              <div class="peek-modern-timeline-item" v-for="e in peek.peekCalendarEvents" :key="e.id">
                  <div class="peek-modern-timeline-time">{{ e.at?.split(' ')[1] || e.at || '全天' }}</div>
                  <div class="peek-modern-timeline-card">
                      <div class="peek-modern-timeline-title">{{ e.title || '日程' }}</div>
                      <div class="peek-modern-timeline-loc" v-if="e.location"><i class="fas fa-map-marker-alt"></i> {{ e.location }}</div>
                  </div>
              </div>
          </div>
      </div>
      <div v-else-if="peek.peekInnerApp === 'wallet'" class="peek-modern-app-container">
          <div class="peek-modern-wallet-balance-card">
              <div class="balance-label">零钱余额</div>
              <div class="balance-amount">¥ {{ (peek.peekWallet && peek.peekWallet.balance) || 0 }}</div>
          </div>
          <div class="peek-modern-card-group-title">账单明细</div>
          <div class="peek-modern-card-group">
              <div class="peek-modern-card-item" v-for="r in ((peek.peekWallet && peek.peekWallet.records) || [])" :key="r.id">
                  <div class="peek-modern-wallet-icon"><i class="fas fa-wallet"></i></div>
                  <div class="peek-modern-item-content">
                      <div class="peek-modern-item-title">{{ r.item || '消费' }}</div>
                      <div class="peek-modern-item-sub">{{ r.at }}<span v-if="r.note"> · {{ r.note }}</span></div>
                  </div>
                  <div class="peek-modern-wallet-amount" :class="{ 'income': r.amount > 0 }">{{ peek.peekFormatAmount(r.amount) }}</div>
              </div>
          </div>
      </div>
      <div v-else-if="peek.peekInnerApp === 'health'" class="peek-modern-app-container">
          <div class="peek-modern-health-grid">
              <div class="peek-modern-health-card">
                  <div class="health-card-header"><i class="fas fa-fire" style="color: #ff3b30;"></i> 活动步数</div>
                  <div class="health-card-value">{{ ((peek.peekHealth && peek.peekHealth.steps) || [])[0]?.count || 0 }} <span class="unit">步</span></div>
              </div>
              <div class="peek-modern-health-card">
                  <div class="health-card-header"><i class="fas fa-bed" style="color: #5856d6;"></i> 睡眠</div>
                  <div class="health-card-value">{{ ((peek.peekHealth && peek.peekHealth.sleep) || [])[0]?.hours || 0 }} <span class="unit">小时</span></div>
              </div>
          </div>
      </div>
      <div v-else-if="peek.peekInnerApp === 'mail'" class="peek-modern-app-container no-padding">
          <div v-if="(peek.peekMailThreads || []).length === 0" class="peek-modern-empty">暂无邮件</div>
          <div class="peek-modern-mail-list" v-else>
              <div class="peek-modern-mail-item" v-for="m in peek.peekMailThreads" :key="m.id">
                  <div class="peek-modern-mail-dot" :class="{ 'unread': m.unread }"></div>
                  <div class="peek-modern-mail-content">
                      <div class="peek-modern-mail-top">
                          <div class="peek-modern-mail-from">{{ m.from || '发件人' }}</div>
                          <div class="peek-modern-mail-time">{{ m.at || '' }}</div>
                      </div>
                      <div class="peek-modern-mail-subject">{{ m.subject || '无主题' }}</div>
                      <div class="peek-modern-mail-preview">{{ m.preview || '' }}</div>
                  </div>
              </div>
          </div>
      </div>
      <div v-else-if="peek.peekInnerApp === 'calls'" class="peek-modern-app-container">
          <div class="peek-modern-card-group">
              <div class="peek-modern-card-item" v-for="c in peek.peekCalls" :key="c.id">
                  <div class="peek-modern-wallet-icon" :style="{ color: c.type === 'missed' ? '#ff3b30' : '#34c759', background: 'transparent' }"><i class="fas fa-phone-alt"></i></div>
                  <div class="peek-modern-item-content">
                      <div class="peek-modern-item-title" :style="{ color: c.type === 'missed' ? '#ff3b30' : '' }">{{ c.who }}</div>
                      <div class="peek-modern-item-sub">{{ c.type === 'missed' ? '未接来电' : '已拨出' }}</div>
                  </div>
                  <div style="font-size: 14px; color: #8e8e93;">{{ c.at }}</div>
              </div>
          </div>
      </div>
      <div v-else-if="peek.peekInnerApp === 'album'" class="peek-modern-app-container no-padding">
          <div class="peek-modern-album-grid">
              <div v-for="(p, i) in peek.peekPhotos" :key="p.id || i" class="peek-modern-album-item">
                  <div class="peek-modern-album-photo" :style="{ background: 'linear-gradient(135deg,' + (p.bgColor || '#333') + ',' + (p.bgColor2 || '#111') + ')' }">
                      <i class="fas fa-image"></i>
                      <div class="photo-desc">{{ p.description }}</div>
                  </div>
              </div>
          </div>
          <div class="peek-modern-card-group" style="margin: 16px;">
              <div class="peek-modern-card-item">
                  <div class="peek-modern-album-icon" style="color: #007aff;"><i class="fas fa-eye-slash"></i></div>
                  <div class="peek-modern-item-content"><div class="peek-modern-item-title">已隐藏</div></div>
                  <div style="color: #8e8e93;"><i class="fas fa-lock"></i></div>
              </div>
              <div class="peek-modern-card-item">
                  <div class="peek-modern-album-icon" style="color: #ff3b30;"><i class="fas fa-trash-alt"></i></div>
                  <div class="peek-modern-item-content"><div class="peek-modern-item-title">最近删除</div></div>
                  <div style="color: #8e8e93;">{{ peek.peekPhotos.length > 0 ? 3 : 0 }}</div>
              </div>
          </div>
      </div>
      <div v-else-if="peek.peekInnerApp === 'notes' || peek.peekInnerApp === 'diary'" class="peek-modern-app-container">
          <div class="peek-modern-card-group">
              <div class="peek-modern-card-item" style="flex-direction: column; align-items: flex-start; padding: 16px;" v-for="d in peek.peekDiaryEntries" :key="d.id">
                  <div class="peek-modern-item-title" style="font-size: 18px; margin-bottom: 8px;">{{ d.title }}</div>
                  <div style="font-size: 13px; color: #8e8e93; margin-bottom: 12px;"><i class="fas fa-tag"></i> {{ d.mood }}</div>
                  <div style="font-size: 15px; line-height: 1.5; color: #333;" class="peek-note-body-dark">{{ d.content }}</div>
              </div>
          </div>
          <div class="peek-modern-card-group">
              <div class="peek-modern-card-item" style="flex-direction: column; align-items: flex-start; padding: 16px;" v-for="n in peek.peekNotes" :key="n.id">
                  <div class="peek-modern-item-title" style="font-size: 18px; margin-bottom: 8px;">{{ n.title }}</div>
                  <div style="font-size: 15px; line-height: 1.5; color: #333;" class="peek-note-body-dark">{{ n.content }}</div>
              </div>
          </div>
      </div>
      <div v-else-if="peek.peekInnerApp === 'browser'" class="peek-modern-app-container">
          <div class="peek-modern-browser-search">
              <i class="fas fa-lock" style="margin-right: 8px;"></i> 搜索或键入网址
          </div>
          <div class="peek-modern-card-group-title" style="margin-top: 16px;">历史记录</div>
          <div class="peek-modern-card-group">
              <div class="peek-modern-card-item" v-for="b in peek.peekBrowserHistory" :key="b.id">
                  <div class="peek-modern-wallet-icon" style="background: transparent; color: #8e8e93;"><i class="fas fa-search"></i></div>
                  <div class="peek-modern-item-content">
                      <div class="peek-modern-item-title">{{ b.title }}</div>
                      <div class="peek-modern-item-sub" style="color: #007aff;">{{ b.url }}</div>
                  </div>
              </div>
          </div>
      </div>
      <div v-else-if="peek.peekInnerApp === 'files'" class="peek-modern-app-container">
          <div class="peek-modern-card-group">
              <div class="peek-modern-card-item" v-for="f in peek.peekFiles" :key="f.id">
                  <div class="peek-modern-wallet-icon" style="color: #007aff; background: rgba(0,122,255,0.1);"><i class="fas fa-file-alt"></i></div>
                  <div class="peek-modern-item-content">
                      <div class="peek-modern-item-title">{{ f.name }}</div>
                  </div>
                  <div style="font-size: 14px; color: #8e8e93;">{{ f.size }}</div>
              </div>
          </div>
      </div>
      <div v-else-if="peek.peekInnerApp === 'bank'" class="peek-modern-app-container">
          <div class="peek-modern-wallet-balance-card" style="background: linear-gradient(135deg, #1c1c1e 0%, #3a3a3c 100%);">
              <div class="balance-label">账户总览</div>
              <div class="balance-amount">¥ {{ peek.peekBankAccount.balance }}</div>
              <div style="font-size: 13px; opacity: 0.8; margin-top: 12px;">本月支出: ¥ {{ peek.peekBankAccount.monthlySpend }}</div>
          </div>
          <div class="peek-modern-card-group-title">近期明细</div>
          <div class="peek-modern-card-group">
              <div class="peek-modern-card-item" v-for="r in (peek.peekBankAccount.records || [])" :key="r.id">
                  <div class="peek-modern-wallet-icon" style="background: rgba(0,0,0,0.05); color: #000;"><i class="fas fa-money-check"></i></div>
                  <div class="peek-modern-item-content">
                      <div class="peek-modern-item-title">{{ r.item }}</div>
                      <div class="peek-modern-item-sub">{{ r.at }}</div>
                  </div>
                  <div class="peek-modern-wallet-amount" :class="{ 'income': r.amount > 0 }">{{ peek.peekFormatAmount(r.amount) }}</div>
              </div>
          </div>
      </div>


      <div v-else-if="peek.peekInnerApp === 'map'" class="peek-modern-app-container no-padding" style="position: relative; overflow: hidden; background: #0d0f12; cursor: grab;"
           :style="{ cursor: isPanning ? 'grabbing' : 'grab' }"
           @mousedown="startPan" @mousemove="doPan" @mouseup="endPan" @mouseleave="endPan"
           @touchstart="startPan" @touchmove="doPan" @touchend="endPan">
           
          <div class="peek-map-viewport" :style="{ transform: `translate(${mapPanX}px, ${mapPanY}px)`, transition: isPanning ? 'none' : 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)' }" style="width: 300%; height: 300%; position: absolute; top: -100%; left: -100%;">
              <div class="peek-dense-map-bg" style="width: 100%; height: 100%; background-image: linear-gradient(rgba(0, 224, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 224, 255, 0.05) 1px, transparent 1px); background-size: 40px 40px; background-position: center center;"></div>
              
              <!-- Path Lines -->
              <svg class="peek-map-path-layer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; filter: drop-shadow(0 0 4px rgba(0, 224, 255, 0.5));">
                  <defs>
                      <linearGradient id="neonGradientMap" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="#00e0ff" stop-opacity="0.8" />
                          <stop offset="100%" stop-color="#bf00ff" stop-opacity="0.8" />
                      </linearGradient>
                  </defs>
                  <template v-for="(m, i) in peek.peekMapTracks" :key="'line-'+m.id">
                      <line v-if="i > 0"
                            :x1="getPlaceCoord(peek.peekMapTracks[i-1].place).left + '%'"
                            :y1="getPlaceCoord(peek.peekMapTracks[i-1].place).top + '%'"
                            :x2="getPlaceCoord(m.place).left + '%'"
                            :y2="getPlaceCoord(m.place).top + '%'"
                            stroke="url(#neonGradientMap)"
                            stroke-width="3"
                            stroke-dasharray="8,6"
                            stroke-linecap="round" />
                  </template>
              </svg>

              <!-- Pins -->
              <div class="peek-immersive-pin" v-for="(m, i) in peek.peekMapTracks" :key="m.id" 
                   :style="{ top: getPlaceCoord(m.place).top + '%', left: getPlaceCoord(m.place).left + '%', animationDelay: (i * 0.1) + 's', zIndex: selectedMapNode && selectedMapNode.id === m.id ? 100 : 10 }"
                   @click.stop="openMapDetail(m, i)" @touchstart.stop="openMapDetail(m, i)">
                  <div class="pin-marker" :style="{ transform: selectedMapNode && selectedMapNode.id === m.id ? 'scale(1.3)' : 'scale(1)' }">
                      <div class="pin-pulse"></div>
                      <i class="fas fa-map-marker-alt"></i>
                  </div>
                  <div class="pin-tooltip">
                      <div class="pin-title">{{ m.place }}</div>
                      <div class="pin-time">{{ m.at }}</div>
                  </div>
              </div>
          </div>
          
          <div class="peek-map-fab" @click.stop="resetPan" style="cursor: pointer;">
              <i class="fas fa-location-arrow"></i>
          </div>

          <!-- Detail Bottom Sheet -->
          <transition name="fade">
              <div v-if="selectedMapNode" class="peek-map-detail-overlay" @click.stop="closeMapDetail" @touchstart.stop="closeMapDetail" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 999; backdrop-filter: blur(4px);"></div>
          </transition>
          <transition name="slide-up">
              <div v-if="selectedMapNode" class="peek-map-detail-sheet" style="position: absolute; bottom: 0; left: 0; width: 100%; background: rgba(20, 22, 28, 0.85); border-top: 1px solid rgba(255,255,255,0.08); border-top-left-radius: 28px; border-top-right-radius: 28px; box-shadow: 0 -10px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1); z-index: 1000; padding: 28px 24px; box-sizing: border-box; backdrop-filter: blur(32px) saturate(180%); -webkit-backdrop-filter: blur(32px) saturate(180%); color: #fff;">
                  <div style="width: 48px; height: 5px; background: rgba(255,255,255,0.2); border-radius: 3px; margin: 0 auto 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.2);"></div>
                  <div style="font-size: 22px; font-weight: 700; margin-bottom: 8px; letter-spacing: 0.5px; text-shadow: 0 2px 10px rgba(255,255,255,0.2);">{{ selectedMapNode.place }}</div>
                  <div style="font-size: 14px; color: rgba(255,255,255,0.5); margin-bottom: 24px; font-weight: 500; display: flex; align-items: center; gap: 6px;"><i class="far fa-clock"></i> {{ selectedMapNode.at }}</div>
                  
                  <div v-if="selectedMapNode.travelData" style="background: linear-gradient(135deg, rgba(0, 224, 255, 0.12), rgba(0, 114, 255, 0.05)); border: 1px solid rgba(0, 224, 255, 0.2); box-shadow: 0 8px 20px rgba(0, 114, 255, 0.08); border-radius: 16px; padding: 16px; margin-bottom: 24px; display: flex; align-items: center; position: relative; overflow: hidden;">
                      <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: radial-gradient(circle, rgba(0,224,255,0.15) 0%, transparent 70%); border-radius: 50%;"></div>
                      <div style="font-size: 28px; color: #00e0ff; margin-right: 18px; filter: drop-shadow(0 2px 8px rgba(0,224,255,0.4));"><i :class="selectedMapNode.travelData.icon"></i></div>
                      <div style="position: relative; z-index: 1;">
                          <div style="font-size: 13px; color: rgba(0, 224, 255, 0.9); font-weight: 600; margin-bottom: 6px; letter-spacing: 0.5px; text-transform: uppercase;">行程信息</div>
                          <div style="font-size: 14px; color: rgba(255,255,255,0.85);">从上一个地点出发，耗时 <strong style="color: #00e0ff; font-size: 16px; font-weight: 700; text-shadow: 0 0 10px rgba(0, 224, 255, 0.5);">{{ selectedMapNode.travelData.duration }}</strong> 分钟</div>
                      </div>
                  </div>

                  <div style="font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.7); font-weight: 400; background: rgba(0,0,0,0.2); padding: 16px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.03);">
                      {{ selectedMapNode.note }}
                  </div>
              </div>
          </transition>
      </div>
  </div>
  <div class="peek-home-indicator"></div>
</template>

<script setup>
import { inject, ref } from 'vue';
const state = inject('globalState');
const peek = state.peek;

// Map Panning Logic
const getPlaceCoord = (placeName) => {
    let hash = 0;
    const str = String(placeName || '');
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    const left = 20 + (hash % 60);
    const top = 20 + ((hash >> 4) % 60);
    return { left, top };
};

const mapPanX = ref(0);
const mapPanY = ref(0);
const isPanning = ref(false);
let startX = 0;
let startY = 0;
let initialPanX = 0;
let initialPanY = 0;

const startPan = (e) => {
    isPanning.value = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startX = clientX;
    startY = clientY;
    initialPanX = mapPanX.value;
    initialPanY = mapPanY.value;
};

const doPan = (e) => {
    if (!isPanning.value) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const dx = clientX - startX;
    const dy = clientY - startY;
    
    mapPanX.value = initialPanX + dx;
    mapPanY.value = initialPanY + dy;
};

const endPan = () => {
    isPanning.value = false;
};

const resetPan = () => {
    mapPanX.value = 0;
    mapPanY.value = 0;
};

const selectedMapNode = ref(null);

const openMapDetail = (node, index) => {
    // Generate mock travel data if it has a previous node
    let travelData = null;
    if (index > 0) {
        // pseudo-random based on ID string
        const hash = node.id.charCodeAt(node.id.length - 1) || 0;
        const modes = [
            { icon: 'fas fa-walking', timeFactor: 15 },
            { icon: 'fas fa-subway', timeFactor: 5 },
            { icon: 'fas fa-car', timeFactor: 8 },
            { icon: 'fas fa-bicycle', timeFactor: 10 }
        ];
        const mode = modes[hash % modes.length];
        const duration = 10 + (hash % 40);
        travelData = {
            icon: mode.icon,
            duration: duration
        };
    }
    
    selectedMapNode.value = { ...node, travelData };
    isPanning.value = false; // stop any panning
};

const closeMapDetail = () => {
    selectedMapNode.value = null;
};

</script>