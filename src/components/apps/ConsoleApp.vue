<template>
        <!-- Console App -->
        <!-- Console App - 设置界面 -->
        <div  class="app-view console-view">
            <div class="app-header">
                <button class="back-btn" @click="closeApp"><i class="fas fa-chevron-left"></i></button>
                <span class="app-title">设置</span>
                <div style="width: 40px;"></div>
            </div>
            <div class="app-content console-content">
                                <ApiSettings />
                <ImageGenSettings />
                <BackupManager />
                <MonitorPanel />
            </div>
        </div>

</template>

<script>
import { inject } from 'vue';
import ApiSettings from '../console/ApiSettings.vue';
import ImageGenSettings from '../console/ImageGenSettings.vue';
import BackupManager from '../console/BackupManager.vue';
import MonitorPanel from '../console/MonitorPanel.vue';

export default {
    name: 'ConsoleApp',
    components: {
        ApiSettings,
        ImageGenSettings,
        BackupManager,
        MonitorPanel
    },
    setup() {
        return inject('globalState');
    }
}
</script>
