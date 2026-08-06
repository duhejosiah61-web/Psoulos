<template>
        <!-- Theme App -->
        <!-- Theme App - 主题壁纸 -->
        <div  class="app-view theme-view">
            <div class="app-header">
                <button class="back-btn" @click="closeApp"><i class="fas fa-chevron-left"></i></button>
                <span class="app-title">主题壁纸</span>
                <div style="width: 40px;"></div>
            </div>
            <div class="app-content theme-content">
                                <LockScreenTheme />
                <HomeScreenTheme />
            </div>
        </div>

</template>

<script>
import { inject } from 'vue';
import LockScreenTheme from './LockScreenTheme.vue';
import HomeScreenTheme from './HomeScreenTheme.vue';

export default {
    name: 'ThemeApp',
    components: {
        LockScreenTheme,
        HomeScreenTheme
    },
    setup() {
        return inject('globalState');
    }
}
</script>
