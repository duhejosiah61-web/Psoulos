<template>
        <!-- Notice App -->
        <div  class="app-view">
            <div class="app-header">
                <button class="back-btn" @click="closeApp"><i class="fas fa-chevron-left"></i></button>
                <span class="app-title">更新公告</span>
                <div style="width: 40px;"></div>
            </div>
            <div class="app-content notice-content" style="padding: 16px;">
                <div class="card">
                    <div class="card-title">最新更新</div>
                    <div v-for="noticeItem in notice.notices" :key="noticeItem.id" class="notice-item">
                        <div class="notice-date">{{ noticeItem.date }}</div>
                        <div class="notice-title">{{ noticeItem.title }}</div>
                        <div class="notice-content">
                            <ul>
                                <li v-for="(item, index) in noticeItem.content" :key="index">{{ item }}</li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-title">功能介绍</div>
                    <div v-for="feature in notice.features" :key="feature.id" class="notice-item">
                        <div class="notice-title">{{ feature.title }}</div>
                        <div class="notice-content">
                            <p>{{ feature.description }}</p>
                            <ul>
                                <li v-for="(item, index) in feature.items" :key="index">
                                    <strong>{{ item.title }}</strong>：{{ item.description }}
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-title">使用提示</div>
                    <div class="notice-item">
                        <div class="notice-content">
                            <ul>
                                <li v-for="(tip, index) in notice.tips" :key="index">{{ tip }}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

</template>

<script>
import { inject } from 'vue';

export default {
    name: 'NoticeApp',
    setup() {
        return inject('globalState');
    }
}
</script>
