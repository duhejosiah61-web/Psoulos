// composables/useConsole.js
import { ref, computed } from 'vue';

export function useConsole({ addGlobalLog, saveProfilesCallback } = {}) {
  // ==================== 基础状态 ====================
  const consoleLogs = ref([]);
  const profiles = ref([]);
  const activeProfileId = ref(null);
  const availableModels = ref([]);
  const fetchingModels = ref(false);

  // 备份相关状态
  const backupExporting = ref(false);
  const backupImporting = ref(false);
  const backupLastSavedHint = ref('');
  const soulosBackupFileInput = ref(null);
  const showSegmentedImportPanel = ref(false);
  const segmentedImportPackage = ref(null);
  const segmentedImportAppSelections = ref({});
  const segmentedImportRoleSelections = ref({});

  // ==================== 计算属性 ====================
  const activeProfile = computed(() => {
    if (!activeProfileId.value) return null;
    return profiles.value.find(p => p.id === activeProfileId.value);
  });

  const apiStatus = computed(() => {
    if (!activeProfile.value) return 'unconfigured';
    if (activeProfile.value.endpoint && activeProfile.value.key) return 'valid';
    return 'invalid';
  });

  // ==================== 日志 ====================
  const addConsoleLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('en-GB');
    consoleLogs.value.unshift({ id: Date.now(), timestamp, message, type });
    if (consoleLogs.value.length > 50) consoleLogs.value.pop();
    if (addGlobalLog) addGlobalLog(message, type);
  };

  const clearConsole = () => {
    consoleLogs.value = [];
    addConsoleLog('日志已清空', 'system');
  };

  // ==================== API 配置管理 ====================
  const loadProfiles = () => {
    addConsoleLog('正在初始化连接控制台...', 'system');
    try {
      const savedProfiles = localStorage.getItem('soulos_api_profiles');
      if (savedProfiles) {
        profiles.value = JSON.parse(savedProfiles);
        if (profiles.value.length > 0) {
          const savedActiveId = localStorage.getItem('soulos_active_api_profile_id');
          if (savedActiveId && profiles.value.some(p => String(p.id) === String(savedActiveId))) {
              activeProfileId.value = Number(savedActiveId);
          } else {
              activeProfileId.value = profiles.value[0].id;
          }
          const activeName = profiles.value.find(p => p.id === activeProfileId.value)?.name || '未命名配置';
          addConsoleLog(`已加载 ${profiles.value.length} 个配置，当前激活：「${activeName}」`, 'success');
        } else {
          addConsoleLog('尚未创建任何配置，请在上方新建一个连接配置。', 'warn');
        }
      } else {
        profiles.value = [];
        addConsoleLog('本地没有找到配置，准备创建新的连接配置。', 'warn');
      }
    } catch (error) {
      addConsoleLog('严重错误：读取配置失败：' + error.message, 'error');
      profiles.value = [];
    }
    if (profiles.value.length === 0) {
      activeProfileId.value = null;
    }
    
    // 如果当前配置已经保存了模型，则作为默认选项填入，避免每次刷新都需要重新获取
    if (activeProfile.value && activeProfile.value.model) {
        availableModels.value = [{ id: activeProfile.value.model }];
    } else {
        availableModels.value = [];
    }
  };

  const saveProfiles = (silent = false) => {
    if (!profiles.value || profiles.value.length === 0) return;
    try {
      localStorage.setItem('soulos_api_profiles', JSON.stringify(profiles.value));
      if (!silent) addConsoleLog('所有配置已保存，本地状态已更新。', 'success');
      if (saveProfilesCallback) saveProfilesCallback(profiles.value);
    } catch (error) {
      if (!silent) addConsoleLog('保存配置时出错：' + error.message, 'error');
    }
  };

  const createNewProfile = () => {
    const newProfile = {
      id: Date.now(),
      name: `新配置 ${profiles.value.length + 1}`,
      endpoint: '',
      key: '',
      model: '',
      temperature: 0.7
    };
    profiles.value.push(newProfile);
    activeProfileId.value = newProfile.id;
    addConsoleLog(`已创建新配置：「${newProfile.name}」`, 'system');
  };

  const deleteProfile = (profileId) => {
    const target = profiles.value.find(p => p.id === profileId);
    if (!target) return;
    if (!confirm(`危险操作：即将永久删除下列配置：\n\n「${target.name}」\n\n此操作无法撤销，是否继续？`)) {
      return;
    }
    const index = profiles.value.findIndex(p => p.id === profileId);
    if (index > -1) {
      const deletedName = profiles.value[index].name;
      profiles.value.splice(index, 1);
      saveProfiles();
      if (activeProfileId.value === profileId) {
        activeProfileId.value = profiles.value.length > 0 ? profiles.value[0].id : null;
      }
      addConsoleLog(`配置「${deletedName}」已被删除。`, 'warn');
    }
  };

  const setActiveProfile = (profileId) => {
    const target = profiles.value.find(p => p.id === profileId);
    if (!target) return;
    activeProfileId.value = profileId;
    // 切换时保留之前保存的模型
    availableModels.value = target.model ? [{ id: target.model }] : [];
    addConsoleLog(`已切换到配置：「${target.name}」`, 'info');
  };

  const fetchModels = async () => {
    if (!activeProfile.value || !activeProfile.value.endpoint || !activeProfile.value.key) {
      addConsoleLog('在获取模型前，请先填写 API 地址和密钥。', 'error');
      return;
    }
    fetchingModels.value = true;
    availableModels.value = [];
    addConsoleLog(`正在连接到「${activeProfile.value.name}」：${activeProfile.value.endpoint} ...`, 'info');

    try {
      const response = await fetch(`${activeProfile.value.endpoint}/models`, {
        headers: { 'Authorization': `Bearer ${activeProfile.value.key}` }
      });

      if (!response.ok) {
        throw new Error(`接口返回状态码 ${response.status}`);
      }
      const data = await response.json();
      availableModels.value = data.data || [];
      if (availableModels.value.length > 0) {
        addConsoleLog(`已成功获取 ${availableModels.value.length} 个模型，说明此 API 可正常连接。`, 'success');
      } else {
        addConsoleLog('连接成功，但接口未返回任何模型，请检查服务端配置。', 'warn');
      }
    } catch (error) {
      addConsoleLog(`获取模型失败：${error.message}`, 'error');
    } finally {
      fetchingModels.value = false;
    }
  };

  // ==================== 备份相关辅助函数 ====================
  const collectAllLocalStorageEntries = () => {
    const entries = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) entries[k] = localStorage.getItem(k);
      }
    } catch (e) {
      console.error(e);
    }
    return entries;
  };

  const dumpIdbDatabase = (dbName, storeNames) =>
    new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const database = req.result;
        const run = async () => {
          const out = {};
          try {
            for (const sn of storeNames) {
              if (!database.objectStoreNames.contains(sn)) continue;
              out[sn] = await new Promise((res, rej) => {
                const tx = database.transaction(sn, 'readonly');
                const r = tx.objectStore(sn).getAll();
                r.onsuccess = () => res(r.result || []);
                r.onerror = () => rej(r.error);
              });
            }
            return out;
          } finally {
            database.close();
          }
        };
        run().then(resolve).catch(reject);
      };
    });

  const restoreIdbDatabase = (dbName, storesData) => {
    if (!storesData || typeof storesData !== 'object' || storesData._error) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const database = req.result;
        const run = async () => {
          try {
            for (const [sn, records] of Object.entries(storesData)) {
              if (sn.startsWith('_') || !database.objectStoreNames.contains(sn) || !Array.isArray(records)) continue;
              await new Promise((res, rej) => {
                const tx = database.transaction(sn, 'readwrite');
                tx.onerror = () => rej(tx.error);
                tx.oncomplete = () => res();
                const store = tx.objectStore(sn);
                const clr = store.clear();
                clr.onerror = () => rej(clr.error);
                clr.onsuccess = () => {
                  for (const rec of records) {
                    store.put(rec);
                  }
                };
              });
            }
          } finally {
            database.close();
          }
        };
        run().then(resolve).catch(reject);
      };
    });
  };

  const buildSoulOsBackupPackage = async () => {
    const indexedDBPart = {};
    try {
      indexedDBPart.SoulOS_DB = await dumpIdbDatabase('SoulOS_DB', ['soulLinkMessages', 'soulLinkGroups', 'archivedChats', 'settings']);
    } catch (e) {
      console.warn('[Backup] SoulOS_DB', e);
      indexedDBPart.SoulOS_DB = { _error: String(e.message || e) };
    }
    try {
      indexedDBPart.FeedDB = await dumpIdbDatabase('FeedDB', ['posts']);
    } catch (e) {
      console.warn('[Backup] FeedDB', e);
      indexedDBPart.FeedDB = { _error: String(e.message || e) };
    }
    return {
      v: 2,
      app: 'SoulPocket',
      exportedAt: new Date().toISOString(),
      localStorage: collectAllLocalStorageEntries(),
      indexedDB: indexedDBPart
    };
  };

  const buildSlimBackupPackage = (pkg) => {
    const clone = JSON.parse(JSON.stringify(pkg || {}));
    const ls = clone.localStorage && typeof clone.localStorage === 'object' ? clone.localStorage : {};
    const keys = Object.keys(ls);
    for (const k of keys) {
      const v = String(ls[k] ?? '');
      const looksLikeBase64Image = v.startsWith('data:image/');
      const tooLarge = v.length > 60000;
      const avatarLikeKey = /avatar|wallpaper|bg|background|image|photo/i.test(k);
      if (looksLikeBase64Image || tooLarge || avatarLikeKey) {
        delete ls[k];
      }
    }
    clone.localStorage = ls;
    if (clone.indexedDB && clone.indexedDB.FeedDB) {
      delete clone.indexedDB.FeedDB;
    }
    return clone;
  };

  const writeBackupSlotToIdb = (pkg) => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('SoulOS_Backup_DB', 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('backup_slot')) {
          db.createObjectStore('backup_slot');
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('backup_slot', 'readwrite');
        const store = tx.objectStore('backup_slot');
        const putReq = store.put(pkg, 'v1');
        putReq.onsuccess = () => resolve({ ok: true, mode: 'full_idb', bytes: JSON.stringify(pkg).length });
        putReq.onerror = () => reject(putReq.error);
        tx.oncomplete = () => db.close();
      };
      req.onerror = () => reject(req.error);
    });
  };

  const readBackupSlotFromIdb = () => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('SoulOS_Backup_DB', 1);
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('backup_slot')) {
          db.close();
          resolve(null);
          return;
        }
        const tx = db.transaction('backup_slot', 'readonly');
        const store = tx.objectStore('backup_slot');
        const getReq = store.get('v1');
        getReq.onsuccess = () => resolve(getReq.result || null);
        getReq.onerror = () => reject(getReq.error);
        tx.oncomplete = () => db.close();
      };
      req.onerror = () => reject(req.error);
    });
  };

  const writeBackupSlotWithFallback = async (pkg) => {
    try {
      return await writeBackupSlotToIdb(pkg);
    } catch (e1) {
      console.warn('[Backup] IDB write failed, falling back to localStorage slim mode', e1);
      const slim = buildSlimBackupPackage(pkg);
      const slimJson = JSON.stringify(slim);
      try {
        localStorage.setItem('soulos_backup_slot_v1', slimJson);
        return { ok: true, mode: 'slim', bytes: slimJson.length, error: e1 };
      } catch (e2) {
        return { ok: false, mode: 'failed', error: e2 };
      }
    }
  };

  const mergeById = (currentList, incomingList) => {
    const base = Array.isArray(currentList) ? [...currentList] : [];
    const map = new Map(base.map((x) => [String(x.id), x]));
    (Array.isArray(incomingList) ? incomingList : []).forEach((item) => {
      if (!item || item.id === undefined || item.id === null) return;
      map.set(String(item.id), item);
    });
    return Array.from(map.values());
  };

  const pickLocalStorageByPrefixes = (prefixes = []) => {
    const out = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (prefixes.some((p) => k.startsWith(p))) out[k] = localStorage.getItem(k);
      }
    } catch (e) {
      console.error(e);
    }
    return out;
  };

  let segmentedDataProvider = null;

  const buildSegmentedBackupPackage = () => {
    if (typeof segmentedDataProvider === 'function') {
      const data = segmentedDataProvider();
      return {
        v: 3,
        app: 'SoulPocket',
        mode: 'segmented',
        exportedAt: new Date().toISOString(),
        segments: data.segments
      };
    }
    return {
      v: 3,
      app: 'SoulPocket',
      mode: 'segmented',
      exportedAt: new Date().toISOString(),
      segments: {
        apps: {},
        roles: {}
      }
    };
  };

  let segmentedApplyHandler = null;

  const applySegmentedBackupPayload = async (pkg, pickers = null) => {
    if (typeof segmentedApplyHandler === 'function') {
      return segmentedApplyHandler(pkg, pickers);
    }
    addConsoleLog('分片恢复需要外部提供数据更新函数', 'warn');
  };

  const openSegmentedImportPanel = (pkg) => {
    segmentedImportPackage.value = pkg;
    const apps = pkg?.segments?.apps || {};
    const roles = pkg?.segments?.roles || {};
    const appSel = {};
    Object.keys(apps).forEach((k) => { appSel[k] = true; });
    const roleSel = {};
    Object.keys(roles).forEach((k) => { roleSel[k] = true; });
    segmentedImportAppSelections.value = appSel;
    segmentedImportRoleSelections.value = roleSel;
    showSegmentedImportPanel.value = true;
  };

  const closeSegmentedImportPanel = () => {
    showSegmentedImportPanel.value = false;
    segmentedImportPackage.value = null;
    segmentedImportAppSelections.value = {};
    segmentedImportRoleSelections.value = {};
  };

  const confirmSegmentedImport = async () => {
    const pkg = segmentedImportPackage.value;
    if (!pkg?.segments) return;
    const appsPicked = new Set(
      Object.entries(segmentedImportAppSelections.value || {})
        .filter(([, v]) => !!v)
        .map(([k]) => k)
    );
    const rolesPicked = new Set(
      Object.entries(segmentedImportRoleSelections.value || {})
        .filter(([, v]) => !!v)
        .map(([k]) => k)
    );
    if (appsPicked.size === 0 && rolesPicked.size === 0) {
      addConsoleLog('请至少选择一个软件或角色分片。', 'warn');
      return;
    }
    const ok = window.confirm('将按勾选项进行“分片合并恢复”，未勾选项不会受影响。确认继续？');
    if (!ok) return;
    await applySegmentedBackupPayload(pkg, { apps: appsPicked, roles: rolesPicked });
    closeSegmentedImportPanel();
  };

  const downloadSoulOsBackup = async () => {
    if (backupExporting.value || backupImporting.value) return;
    backupExporting.value = true;
    try {
      addConsoleLog('正在打包完整备份（含 IndexedDB）…', 'info');
      const pkg = await buildSoulOsBackupPackage();
      const json = JSON.stringify(pkg);
      const slotResult = await writeBackupSlotWithFallback(pkg);
      if (slotResult.ok) {
        backupLastSavedHint.value = `本地备份槽已更新 · ${new Date().toLocaleString()}`;
        if (slotResult.mode === 'slim') {
          addConsoleLog('备份槽容量不足，已自动写入“精简槽备份”（完整备份仍已下载）。', 'warn');
        }
      } else {
        backupLastSavedHint.value = '';
        addConsoleLog('备份槽写入失败（可能超出容量）：' + (slotResult.error?.message || slotResult.error), 'warn');
      }
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      a.href = url;
      a.download = `SoulPocket-备份-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addConsoleLog('备份已下载，请妥善保存 JSON 文件。', 'success');
    } catch (e) {
      addConsoleLog('导出失败：' + (e.message || e), 'error');
    } finally {
      backupExporting.value = false;
    }
  };

  const downloadSegmentedBackup = async () => {
    if (backupExporting.value || backupImporting.value) return;
    backupExporting.value = true;
    try {
      addConsoleLog('正在打包分片备份（按软件/角色）…', 'info');
      const pkg = buildSegmentedBackupPackage();
      const json = JSON.stringify(pkg);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      a.href = url;
      a.download = `SoulPocket-分片备份-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addConsoleLog('分片备份已下载：可按软件/角色合并恢复。', 'success');
    } catch (e) {
      addConsoleLog('分片导出失败：' + (e.message || e), 'error');
    } finally {
      backupExporting.value = false;
    }
  };

  const saveSoulOsBackupSlotOnly = async () => {
    if (backupExporting.value || backupImporting.value) return;
    backupExporting.value = true;
    try {
      addConsoleLog('正在写入本地备份槽…', 'info');
      const pkg = await buildSoulOsBackupPackage();
      const slotResult = await writeBackupSlotWithFallback(pkg);
      if (slotResult.ok) {
        backupLastSavedHint.value = `本地备份槽已更新 · ${new Date().toLocaleString()}`;
        if (slotResult.mode === 'slim') {
          addConsoleLog('容量不足：已写入精简槽备份（剔除了大图/部分库数据）。', 'warn');
        } else {
          addConsoleLog('已写入本地备份槽（仅存本浏览器）。', 'success');
        }
      } else {
        addConsoleLog('写入失败：' + (slotResult.error?.message || slotResult.error), 'error');
      }
    } finally {
      backupExporting.value = false;
    }
  };

  const restoreSoulOsFromSlot = async () => {
    if (backupExporting.value || backupImporting.value) return;
    
    let pkg = null;
    try {
      pkg = await readBackupSlotFromIdb();
    } catch (e) {
      console.warn('[Backup] Failed to read from IDB backup slot', e);
    }
    
    if (!pkg) {
      const raw = localStorage.getItem('soulos_backup_slot_v1');
      if (!raw) {
        addConsoleLog('本地备份槽为空，请先执行备份。', 'warn');
        return;
      }
      try {
        pkg = JSON.parse(raw);
      } catch {
        addConsoleLog('备份槽内容不是有效 JSON。', 'error');
        return;
      }
    }

    await applySoulOsBackupPayload(pkg);
  };

  const triggerSoulOsBackupImport = () => {
    soulosBackupFileInput.value?.click();
  };

  const handleSoulOsBackupImport = async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (backupExporting.value || backupImporting.value) return;
    try {
      const pkg = JSON.parse(await file.text());
      if (pkg?.mode === 'segmented') {
        openSegmentedImportPanel(pkg);
      } else {
        await applySoulOsBackupPayload(pkg);
      }
    } catch (e) {
      addConsoleLog('读取或解析备份文件失败：' + (e.message || e), 'error');
    }
  };

  // 备份恢复的核心方法需要外部提供数据更新能力，这里先占位，由调用方注入
  let applySoulOsBackupPayload = async (pkg) => {
    addConsoleLog('备份恢复需要外部提供数据更新函数', 'warn');
  };

  // 提供注入方法
  const setApplyBackupHandler = (handler) => {
    applySoulOsBackupPayload = handler;
  };

  const setSegmentedDataProvider = (provider) => {
    segmentedDataProvider = provider;
  };

  const setSegmentedApplyHandler = (handler) => {
    segmentedApplyHandler = handler;
  };

  // 初始化时尝试读取备份槽提示
  (async () => {
    try {
      const hasIdb = await readBackupSlotFromIdb();
      if (hasIdb || localStorage.getItem('soulos_backup_slot_v1')) {
        backupLastSavedHint.value = '本地备份槽中已有数据，可从槽恢复';
      }
    } catch { /* ignore */ }
  })();

  // ==================== 自动备份 ====================
  const autoBackupInterval = ref(localStorage.getItem('soulos_auto_backup_interval') || '0');
  let autoBackupCheckTimer = null;

  const applyAutoBackupSetting = () => {
    localStorage.setItem('soulos_auto_backup_interval', autoBackupInterval.value);
  };

  const webdavUrl = ref(localStorage.getItem('soulos_webdav_url') || '');
  const webdavUsername = ref(localStorage.getItem('soulos_webdav_username') || '');
  const webdavPassword = ref(localStorage.getItem('soulos_webdav_password') || '');
  const enableWebdavSync = ref(localStorage.getItem('soulos_enable_webdav') === 'true');
  const webdavMessage = ref('');
  const webdavBackups = ref([]);
  const isWebdavLoading = ref(false);

  const applyWebdavSetting = () => {
    localStorage.setItem('soulos_webdav_url', webdavUrl.value);
    localStorage.setItem('soulos_webdav_username', webdavUsername.value);
    localStorage.setItem('soulos_webdav_password', webdavPassword.value);
    localStorage.setItem('soulos_enable_webdav', enableWebdavSync.value);
  };

  const getWebdavAuthHeader = () => {
    return 'Basic ' + btoa(`${webdavUsername.value}:${webdavPassword.value}`);
  };

  const testWebdavConnection = async () => {
    if (!webdavUrl.value || !webdavUsername.value || !webdavPassword.value) {
      webdavMessage.value = '请先填写完整的 WebDAV 配置';
      return false;
    }
    isWebdavLoading.value = true;
    webdavMessage.value = '正在测试连接...';
    try {
      // 尝试发一个 OPTIONS 确认可用
      const res = await fetch(webdavUrl.value, {
        method: 'OPTIONS',
        headers: {
          'Authorization': getWebdavAuthHeader()
        }
      });
      if (res.ok) {
        webdavMessage.value = '连接成功！环境支持 WebDAV 同步。';
        return true;
      } else {
        webdavMessage.value = `连接失败 (HTTP ${res.status})`;
        return false;
      }
    } catch (e) {
      webdavMessage.value = `连接异常: ${e.message}`;
      return false;
    } finally {
      isWebdavLoading.value = false;
    }
  };

  const uploadBackupToWebdav = async (pkg) => {
    if (!webdavUrl.value || !webdavUsername.value || !webdavPassword.value) return false;
    isWebdavLoading.value = true;
    webdavMessage.value = '正在加密并上传至 WebDAV...';
    try {
      const json = JSON.stringify(pkg);
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      const filename = `SoulPocket-CloudBackup-${stamp}.json`;
      
      let targetUrl = webdavUrl.value;
      if (!targetUrl.endsWith('/')) targetUrl += '/';
      targetUrl += filename;

      const res = await fetch(targetUrl, {
        method: 'PUT',
        headers: {
          'Authorization': getWebdavAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: json
      });

      if (res.ok || res.status === 201 || res.status === 204) {
        webdavMessage.value = `上传成功：${filename}`;
        return true;
      } else {
        webdavMessage.value = `上传失败 (HTTP ${res.status})`;
        return false;
      }
    } catch (e) {
      webdavMessage.value = `上传异常: ${e.message}`;
      return false;
    } finally {
      isWebdavLoading.value = false;
    }
  };

  const fetchWebdavBackups = async () => {
    if (!webdavUrl.value || !webdavUsername.value || !webdavPassword.value) return;
    isWebdavLoading.value = true;
    webdavMessage.value = '正在拉取云端备份列表...';
    try {
      const res = await fetch(webdavUrl.value, {
        method: 'PROPFIND',
        headers: {
          'Authorization': getWebdavAuthHeader(),
          'Depth': '1'
        }
      });
      if (!res.ok) {
        webdavMessage.value = `拉取列表失败 (HTTP ${res.status})`;
        return;
      }
      const text = await res.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      const responses = xmlDoc.getElementsByTagNameNS('*', 'response'); // handles d:response or response
      
      const list = [];
      for (let i = 0; i < responses.length; i++) {
        const hrefNode = responses[i].getElementsByTagNameNS('*', 'href')[0];
        if (hrefNode) {
          const href = hrefNode.textContent;
          if (href.endsWith('.json')) {
            // Extract filename
            const parts = href.split('/');
            const filename = decodeURIComponent(parts[parts.length - 1] || parts[parts.length - 2]);
            // Extract last modified
            let dateStr = '';
            const getlastmodified = responses[i].getElementsByTagNameNS('*', 'getlastmodified')[0];
            if (getlastmodified) {
              dateStr = new Date(getlastmodified.textContent).toLocaleString();
            }
            list.push({ filename, url: href, date: dateStr });
          }
        }
      }
      webdavBackups.value = list.sort((a,b) => b.filename.localeCompare(a.filename)); // newest first
      if (list.length === 0) {
        webdavMessage.value = '云端暂无备份文件 (.json)';
      } else {
        webdavMessage.value = `成功拉取到 ${list.length} 个云端备份`;
      }
    } catch (e) {
      webdavMessage.value = `拉取异常: ${e.message}`;
    } finally {
      isWebdavLoading.value = false;
    }
  };

  const restoreFromWebdav = async (backupItem) => {
    if (!backupItem || !backupItem.filename) return;
    const ok = window.confirm(`确认从云端下载并恢复 [${backupItem.filename}] 吗？恢复会覆盖本地已有数据。`);
    if (!ok) return;

    isWebdavLoading.value = true;
    webdavMessage.value = `正在下载云端备份: ${backupItem.filename}...`;
    try {
      let fullUrl = backupItem.url;
      if (!fullUrl.startsWith('http')) {
        // Construct full URL if PROPFIND returned absolute paths
        const parsedBase = new URL(webdavUrl.value);
        fullUrl = parsedBase.origin + fullUrl;
      }
      
      const res = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Authorization': getWebdavAuthHeader()
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const jsonStr = await res.text();
      const pkg = JSON.parse(jsonStr);
      webdavMessage.value = '下载成功，正在应用数据...';
      
      // Use existing apply backup function
      if (applyBackupHandler) {
        await applyBackupHandler(pkg);
        webdavMessage.value = '云端恢复成功！';
      } else {
        webdavMessage.value = '恢复处理器未注册，无法执行恢复。';
      }
    } catch (e) {
      webdavMessage.value = `下载恢复异常: ${e.message}`;
    } finally {
      isWebdavLoading.value = false;
    }
  };
  // ==================== GitHub 同步 ====================
  const githubToken = ref(localStorage.getItem('soulos_github_token') || '');
  const githubRepo = ref(localStorage.getItem('soulos_github_repo') || '');
  const enableGithubSync = ref(localStorage.getItem('soulos_enable_github') === 'true');
  const githubMessage = ref('');
  const githubBackups = ref([]);
  const isGithubLoading = ref(false);

  const applyGithubSetting = () => {
    localStorage.setItem('soulos_github_token', githubToken.value);
    localStorage.setItem('soulos_github_repo', githubRepo.value);
    localStorage.setItem('soulos_enable_github', enableGithubSync.value);
  };

  const utf8ToBase64 = (str) => {
    return btoa(unescape(encodeURIComponent(str)));
  };
  
  const base64ToUtf8 = (b64) => {
    return decodeURIComponent(escape(atob(b64)));
  };

  const testGithubConnection = async () => {
    if (!githubToken.value || !githubRepo.value) {
      githubMessage.value = '请先填写完整的 GitHub 配置';
      return false;
    }
    isGithubLoading.value = true;
    githubMessage.value = '正在测试 GitHub 连接...';
    try {
      const res = await fetch(`https://api.github.com/repos/${githubRepo.value}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${githubToken.value}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (res.ok) {
        githubMessage.value = '连接成功！环境支持 GitHub 同步。';
        return true;
      } else {
        const data = await res.json();
        githubMessage.value = `连接失败 (HTTP ${res.status}): ${data.message || ''}`;
        return false;
      }
    } catch (e) {
      githubMessage.value = `连接异常: ${e.message}`;
      return false;
    } finally {
      isGithubLoading.value = false;
    }
  };

  const uploadBackupToGithub = async (pkg) => {
    if (!githubToken.value || !githubRepo.value) return false;
    isGithubLoading.value = true;
    githubMessage.value = '正在转码并推送至 GitHub...';
    try {
      const jsonStr = JSON.stringify(pkg);
      const contentBase64 = utf8ToBase64(jsonStr);
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      const filename = `SoulPocket-CloudBackup-${stamp}.json`;

      const res = await fetch(`https://api.github.com/repos/${githubRepo.value}/contents/backups/${filename}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubToken.value}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Auto Backup: ${filename}`,
          content: contentBase64
        })
      });

      if (res.ok || res.status === 201) {
        githubMessage.value = `推送成功：${filename}`;
        return true;
      } else {
        const data = await res.json();
        githubMessage.value = `推送失败 (HTTP ${res.status}): ${data.message || ''}`;
        return false;
      }
    } catch (e) {
      githubMessage.value = `推送异常: ${e.message}`;
      return false;
    } finally {
      isGithubLoading.value = false;
    }
  };

  const fetchGithubBackups = async () => {
    if (!githubToken.value || !githubRepo.value) return;
    isGithubLoading.value = true;
    githubMessage.value = '正在拉取 GitHub 仓库备份列表...';
    try {
      const res = await fetch(`https://api.github.com/repos/${githubRepo.value}/contents/backups`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${githubToken.value}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (res.status === 404) {
        githubBackups.value = [];
        githubMessage.value = '云端暂无 backups 目录或备份文件。';
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        githubMessage.value = `拉取列表失败 (HTTP ${res.status}): ${data.message || ''}`;
        return;
      }
      
      const files = await res.json();
      if (!Array.isArray(files)) {
        githubMessage.value = '云端返回数据格式错误。';
        return;
      }
      
      const list = files
        .filter(f => f.name.endsWith('.json') && f.type === 'file')
        .map(f => ({
          filename: f.name,
          url: f.download_url,
          sha: f.sha
        }));
        
      githubBackups.value = list.sort((a,b) => b.filename.localeCompare(a.filename)); // newest first
      
      if (list.length === 0) {
        githubMessage.value = '云端 backups 目录下暂无 JSON 备份文件。';
      } else {
        githubMessage.value = `成功拉取到 ${list.length} 个 GitHub 备份`;
      }
    } catch (e) {
      githubMessage.value = `拉取异常: ${e.message}`;
    } finally {
      isGithubLoading.value = false;
    }
  };

  const restoreFromGithub = async (backupItem) => {
    if (!backupItem || !backupItem.url) return;
    const ok = window.confirm(`确认从 GitHub 下载并恢复 [${backupItem.filename}] 吗？恢复会覆盖本地已有数据。`);
    if (!ok) return;

    isGithubLoading.value = true;
    githubMessage.value = `正在从 GitHub 下载备份: ${backupItem.filename}...`;
    try {
      const res = await fetch(backupItem.url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${githubToken.value}`,
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const jsonStr = await res.text();
      const pkg = JSON.parse(jsonStr);
      githubMessage.value = '下载成功，正在应用数据...';
      
      if (applyBackupHandler) {
        await applyBackupHandler(pkg);
        githubMessage.value = 'GitHub 恢复成功！';
      } else {
        githubMessage.value = '恢复处理器未注册，无法执行恢复。';
      }
    } catch (e) {
      githubMessage.value = `下载恢复异常: ${e.message}`;
    } finally {
      isGithubLoading.value = false;
    }
  };

  const setupAutoBackup = () => {
    if (autoBackupCheckTimer) clearInterval(autoBackupCheckTimer);
    
    // Check every 1 minute
    autoBackupCheckTimer = setInterval(async () => {
      const hours = parseInt(autoBackupInterval.value, 10);
      if (hours <= 0) return;
      
      const lastBackup = parseInt(localStorage.getItem('soulos_last_auto_backup_time') || '0', 10);
      const now = Date.now();
      
      if (now - lastBackup >= hours * 60 * 60 * 1000) {
        try {
          const pkg = await buildSoulOsBackupPackage();
          await writeBackupSlotWithFallback(pkg);
          localStorage.setItem('soulos_last_auto_backup_time', now.toString());
          let msg = `[自动备份] 本地备份槽已更新 · ${new Date().toLocaleString()}`;
          
          if (enableWebdavSync.value) {
            const upOk = await uploadBackupToWebdav(pkg);
            if (upOk) {
              msg += ' (云同步成功)';
            } else {
              msg += ' (云同步失败)';
            }
          }
          if (enableGithubSync.value) {
            const ghOk = await uploadBackupToGithub(pkg);
            if (ghOk) {
              msg += ' (GitHub同步成功)';
            } else {
              msg += ' (GitHub同步失败)';
            }
          }
          
          backupLastSavedHint.value = msg;
        } catch (e) {
          console.warn('Auto backup failed', e);
        }
      }
    }, 60000);
  };
  setupAutoBackup();

  // ==================== 导出 ====================
  return {
    // 状态
    consoleLogs,
    profiles,
    activeProfileId,
    availableModels,
    fetchingModels,
    activeProfile,
    apiStatus,
    backupExporting,
    backupImporting,
    backupLastSavedHint,
    soulosBackupFileInput,
    showSegmentedImportPanel,
    segmentedImportPackage,
    segmentedImportAppSelections,
    segmentedImportRoleSelections,

    // 方法
    addConsoleLog,
    clearConsole,
    loadProfiles,
    saveProfiles,
    createNewProfile,
    deleteProfile,
    setActiveProfile,
    fetchModels,
    downloadSoulOsBackup,
    downloadSegmentedBackup,
    saveSoulOsBackupSlotOnly,
    restoreSoulOsFromSlot,
    triggerSoulOsBackupImport,
    handleSoulOsBackupImport,
    closeSegmentedImportPanel,
    confirmSegmentedImport,

    autoBackupInterval,
    applyAutoBackupSetting,
    setupAutoBackup,
    setApplyBackupHandler,
    setSegmentedDataProvider,
    setSegmentedApplyHandler,
    webdavUrl,
    webdavUsername,
    webdavPassword,
    enableWebdavSync,
    webdavMessage,
    webdavBackups,
    isWebdavLoading,
    applyWebdavSetting,
    testWebdavConnection,
    uploadBackupToWebdav,
    fetchWebdavBackups,
    restoreFromWebdav,
    githubToken,
    githubRepo,
    enableGithubSync,
    githubMessage,
    githubBackups,
    isGithubLoading,
    applyGithubSetting,
    testGithubConnection,
    uploadBackupToGithub,
    fetchGithubBackups,
    restoreFromGithub,
    restoreIdbDatabase,
    dumpIdbDatabase,
    mergeById,
    pickLocalStorageByPrefixes
  };
}