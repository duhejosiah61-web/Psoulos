// composables/useImageGen.js — Psoulos 图像生成配置与多渠道生图引擎
import { ref, reactive, watch } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js';

const STORAGE_KEY = 'soulos_image_gen_config';

const DEFAULT_CONFIG = {
  enabled: true,
  readWorldBook: true,
  activeChannel: 'pollinations', // 'novelai' | 'pollinations' | 'openai' | 'gemini' | 'grok' | 'custom'

  novelai: {
    apiKey: '',
    endpointType: 'official', // 'official' | 'official_api' | 'proxy'
    proxyUrl: '',
    useCorsProxy: false, // Web 跨域解包代理
    corsProxyUrl: 'https://corsproxy.io/?',
    model: 'nai-diffusion-4-5-full', // 推荐 V4.5 Full
    width: 832,
    height: 1216,
    steps: 28,
    cfgScale: 5.0,
    sampler: 'k_euler',
    noiseSchedule: 'karras',
    seed: -1,
    ucPreset: 0,
    smea: false,
    smeaDyn: false,
    cfgRescale: 0,
    undesiredStrength: 1.0,
    qualityTags: true,
    variety: true,
    dynamicThresholding: false,
    vibeTransfer: {
      enabled: false,
      data: ''
    },
    positivePrompt: 'masterpiece, best quality, ultra-detailed, highly aesthetic',
    negativePrompt: 'lowres, bad quality, bad anatomy, error, missing fingers, extra digit, jpeg artifacts'
  },

  pollinations: {
    model: 'flux', // 'flux' | 'flux-realism' | 'any-dark' | 'turbo'
    width: 832,
    height: 1216,
    seed: -1,
    nologo: true,
    enhance: true,
    positivePrompt: 'masterpiece, highly detailed, aesthetic anime art style',
    negativePrompt: 'blurry, low quality, distortion'
  },

  openai: {
    apiKey: '',
    endpoint: 'https://api.openai.com/v1',
    model: 'dall-e-3',
    width: 1024,
    height: 1024,
    positivePrompt: 'masterpiece, high quality',
    negativePrompt: ''
  },

  gemini: {
    apiKey: '',
    model: 'imagen-3.0-generate-002',
    aspectRatio: '1:1',
    safetyFilter: 'block_none'
  },

  grok: {
    apiKey: '',
    endpoint: 'https://api.x.ai/v1',
    model: 'grok-2-vision',
    aspectRatio: '3:4'
  },

  custom: {
    apiKey: '',
    endpoint: '',
    model: 'dall-e-3',
    width: 832,
    height: 1216,
    positivePrompt: 'masterpiece, high quality',
    negativePrompt: 'lowres, bad quality'
  }
};

export function useImageGen({ addConsoleLog } = {}) {
  const imageGenConfig = reactive(loadConfig());
  const showImageGenSettingsModal = ref(false);
  const showNovelAiSettingsModal = showImageGenSettingsModal;
  const imageGenModalTab = ref('novelai');
  const isGeneratingTestImage = ref(false);
  const testImageResult = ref('');
  const testPromptInput = ref('1girl, solo, masterpiece, looking at viewer, soft lighting');

  function log(msg, type = 'info') {
    if (addConsoleLog) addConsoleLog(`[生图服务] ${msg}`, type);
    else console.log(`[ImageGen ${type}]`, msg);
  }

  const availableOpenAiModels = ref([]);
  const fetchingOpenAiModels = ref(false);

  async function fetchOpenAiModels() {
    const cfg = imageGenConfig.openai;
    if (!cfg.endpoint || !cfg.apiKey) {
      alert('请先填写生图 API 的 Endpoint 和 API Key！');
      log('请先在上方填写 Endpoint 和 API Key。', 'warn');
      return;
    }
    fetchingOpenAiModels.value = true;
    availableOpenAiModels.value = [];
    log('开始拉取 OpenAI 图像模型...', 'info');
    try {
      const response = await fetch(`${cfg.endpoint.replace(/\/+$/, '')}/models`, {
        headers: { 'Authorization': `Bearer ${cfg.apiKey}` }
      });
      if (!response.ok) throw new Error(`状态码: ${response.status}`);
      const data = await response.json();
      availableOpenAiModels.value = data.data || [];
      if (availableOpenAiModels.value.length > 0) {
        log(`获取成功，共 ${availableOpenAiModels.value.length} 个模型。`, 'success');
        alert(`成功拉取 ${availableOpenAiModels.value.length} 个模型！`);
        if (!availableOpenAiModels.value.find(m => m.id === cfg.model)) {
          cfg.model = availableOpenAiModels.value[0].id;
        }
      } else {
        alert('该接口未返回任何可用模型。');
        log('该接口未返回任何可用模型。', 'warn');
      }
    } catch (err) {
      alert(`获取模型失败：${err.message}`);
      log(`获取模型失败：${err.message}`, 'error');
    } finally {
      fetchingOpenAiModels.value = false;
    }
  }

  function openImageGenSettingsModal(channel = null) {
    imageGenModalTab.value = channel || imageGenConfig.activeChannel || 'novelai';
    showImageGenSettingsModal.value = true;
  }

  function loadConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return deepMerge(JSON.parse(JSON.stringify(DEFAULT_CONFIG)), parsed);
      }
    } catch (e) {
      console.error('Failed to load image gen config:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  function saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(imageGenConfig));
      log('生图配置已成功保存', 'success');
    } catch (e) {
      log('保存生图配置失败：' + e.message, 'error');
    }
  }

  function resetConfigToDefault() {
    Object.assign(imageGenConfig, JSON.parse(JSON.stringify(DEFAULT_CONFIG)));
    saveConfig();
    log('生图设置已恢复默认', 'warn');
  }

  watch(imageGenConfig, () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(imageGenConfig));
    } catch (e) { /* ignore */ }
  }, { deep: true });

  /**
   * 上传参考图与解析 .naiv4vibe 垫图文件
   */
  async function handleVibeFileUpload(file) {
    if (!file) return;
    try {
      if (file.name.endsWith('.naiv4vibe') || file.type === 'application/json' || file.name.endsWith('.json')) {
        let text = await file.text();
        try {
          const json = JSON.parse(text);
          if (json.vibe_image) text = json.vibe_image;
          else if (json.image) text = json.image;
          else if (json.data) text = json.data;
        } catch (e) {}
        imageGenConfig.novelai.vibeTransfer.data = text.trim();
        imageGenConfig.novelai.vibeTransfer.enabled = true;
        log('成功解析并导入 NovelAI Vibe 预设字符串！', 'success');
      } else if (file.type.startsWith('image/')) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = () => reject(new Error('读取图片失败'));
          reader.readAsDataURL(file);
        });
        const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
        imageGenConfig.novelai.vibeTransfer.data = cleanBase64;
        imageGenConfig.novelai.vibeTransfer.enabled = true;
        log('成功导入 Vibe 参考图！', 'success');
      } else {
        const text = await file.text();
        imageGenConfig.novelai.vibeTransfer.data = text.trim();
        imageGenConfig.novelai.vibeTransfer.enabled = true;
        log('成功导入 Vibe 数据！', 'success');
      }
    } catch (err) {
      log('解析 Vibe 文件失败: ' + err.message, 'error');
      alert('解析 Vibe 文件失败：' + err.message);
    }
  }

  function removeVibeImage() {
    imageGenConfig.novelai.vibeTransfer.data = '';
    imageGenConfig.novelai.vibeTransfer.enabled = false;
    log('Vibe 预设已清空', 'info');
  }

  /**
   * 核心生图入口函数
   */
  async function generateImage({ prompt, negativePrompt = '', appearance = '', userAppearance = '' } = {}) {
    if (!imageGenConfig.enabled) {
      throw new Error('生图功能未启用，请在控制台中开启。');
    }

    const finalPrompt = [appearance, userAppearance, prompt]
        .map(p => p ? p.trim() : '')
        .filter(p => p !== '')
        .join(', ');

    const channel = imageGenConfig.activeChannel;
    log(`开始使用 [${channel.toUpperCase()}] 渠道生成图片...`, 'info');

    if (channel === 'pollinations') {
      return await generateViaPollinations(finalPrompt, negativePrompt);
    } else if (channel === 'novelai') {
      return await generateViaNovelAI(finalPrompt, negativePrompt);
    } else if (channel === 'openai') {
      return await generateViaOpenAI(finalPrompt);
    } else if (channel === 'gemini') {
      return await generateViaGemini(finalPrompt);
    } else if (channel === 'custom') {
      return await generateViaCustom(finalPrompt, negativePrompt);
    } else {
      return await generateViaPollinations(finalPrompt, negativePrompt);
    }
  }

  // Pollinations.ai 引擎 (免费无需 Key)
  async function generateViaPollinations(userPrompt, extraNeg = '') {
    const cfg = imageGenConfig.pollinations;
    const finalPrompt = [cfg.positivePrompt, userPrompt].filter(Boolean).join(', ');
    const seed = cfg.seed === -1 ? Math.floor(Math.random() * 1000000) : cfg.seed;
    const model = cfg.model || 'flux';
    const width = cfg.width || 832;
    const height = cfg.height || 1216;
    const enhance = cfg.enhance !== false ? 'true' : 'false';

    const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=${cfg.nologo ? 'true' : 'false'}&enhance=${enhance}`;

    log(`Pollinations 生图 URL 已生成: ${imgUrl}`, 'success');
    return imgUrl;
  }

  // NovelAI 引擎 (解决 CORS 拦截、V4 v4_prompt 与 ZIP 解包)
  async function generateViaNovelAI(userPrompt, extraNeg = '') {
    const cfg = imageGenConfig.novelai;
    if (!cfg.apiKey) {
      throw new Error('NovelAI API Key 未填写，请在控制台设置。');
    }

    const cleanToken = cfg.apiKey.trim().replace(/^Bearer\s+/i, '');
    const fetchUrl = 'https://image.novelai.net/ai/generate-image';

    const fullPositive = [cfg.positivePrompt, userPrompt].filter(Boolean).join(', ');
    const fullNegative = [cfg.negativePrompt, extraNeg].filter(Boolean).join(', ');
    const seedNum = cfg.seed === -1 ? Math.floor(Math.random() * 999999999) : Math.abs(Number(cfg.seed) || 123456);

    const modelName = cfg.model; // 完全使用用户配置

    const width = Math.floor((cfg.width || 832) / 64) * 64;
    const height = Math.floor((cfg.height || 1216) / 64) * 64;

    const isV4 = modelName.includes('diffusion-4');
    const isV3 = modelName.includes('diffusion-3');

    let parametersObj = {};

    if (isV4) {
      parametersObj = {
        width,
        height,
        scale: Number(cfg.cfgScale) || 5.0,
        sampler: cfg.sampler || 'k_euler_ancestral',
        steps: Number(cfg.steps) || 28,
        seed: seedNum,
        n_samples: 1,
        noise_schedule: cfg.noiseSchedule || 'karras',
        qualityToggle: !!cfg.qualityTags,
        params_version: 4,
        v4_prompt: {
          caption: {
            base_caption: fullPositive,
            char_captions: []
          },
          use_coords: false,
          use_order: true
        },
        v4_negative_prompt: {
          caption: {
            base_caption: fullNegative,
            char_captions: []
          },
          use_coords: false,
          use_order: true
        }
      };

      console.log("VIBE STATUS", {
        enabled: cfg.vibeTransfer?.enabled,
        hasData: !!cfg.vibeTransfer?.data
      });

      if (
        cfg.vibeTransfer &&
        cfg.vibeTransfer.enabled &&
        cfg.vibeTransfer.data
      ) {
        let vibeData = cfg.vibeTransfer.data;
        let isBundle = false;
        
        if (vibeData.startsWith('{')) {
          try {
            const bundle = JSON.parse(vibeData);
            if (bundle.identifier === 'novelai-vibe-transfer-bundle' && bundle.vibes && bundle.vibes[0]) {
              isBundle = true;
              const vibe = bundle.vibes[0];
              const encodings = vibe.encodings || {};
              let encodingStr = '';
              for (const mod of Object.values(encodings)) {
                if (mod.unknown && mod.unknown.encoding) {
                  encodingStr = mod.unknown.encoding;
                  break;
                }
              }
              if (encodingStr) {
                parametersObj.reference_image_multiple = [""];
                parametersObj.reference_information_extracted_multiple = [{
                  reference_id: vibe.id || "vibe_bundle",
                  reference_information_extracted: encodingStr,
                  reference_strength: 0.6
                }];
              } else {
                parametersObj.reference_image_multiple = [vibeData];
              }
            }
          } catch(e) {}
        }
        
        if (!isBundle) {
          parametersObj.reference_image_multiple = [vibeData];
          parametersObj.reference_information_extracted_multiple = [{
            reference_id: "image_vibe",
            reference_information_extracted: null,
            reference_strength: 0.6
          }];
        }
        
        console.log("VIBE ATTACHED", {
          isBundle: isBundle,
          length: cfg.vibeTransfer.data.length
        });
      }
    } else if (isV3) {
      parametersObj = {
        width,
        height,
        scale: Number(cfg.cfgScale) || 5.0,
        sampler: cfg.sampler || 'k_euler_ancestral',
        steps: Number(cfg.steps) || 28,
        seed: seedNum,
        n_samples: 1,
        noise_schedule: cfg.noiseSchedule || 'karras',
        params_version: 3,
        uc: fullNegative
      };
    } else {
      // Fallback 兼容
      parametersObj = {
        width,
        height,
        scale: Number(cfg.cfgScale) || 5.0,
        sampler: cfg.sampler || 'k_euler_ancestral',
        steps: Number(cfg.steps) || 28,
        seed: seedNum,
        n_samples: 1,
        noise_schedule: cfg.noiseSchedule || 'karras',
        params_version: 3,
        uc: fullNegative
      };
    }

    const payload = {
      action: 'generate',
      input: isV4 ? '' : fullPositive,
      model: modelName,
      parameters: parametersObj
    };

    console.log('NAI MODEL:', modelName);
    console.log('NAI PAYLOAD:', JSON.stringify(payload, null, 2));

    let res;
    try {
      res = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
    } catch (netErr) {
      throw new Error(`网络拦截错误: ${netErr.message}`);
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      let failHint = `NovelAI 请求失败 [HTTP ${res.status}]: ${errText.slice(0, 250)}`;
      throw new Error(failHint);
    }

    const contentType = res.headers.get('content-type') || '';
    const arrayBuffer = await res.arrayBuffer();
    
    if (contentType.includes('application/json') || isJsonBuffer(arrayBuffer)) {
      try {
        const text = new TextDecoder().decode(arrayBuffer);
        const json = JSON.parse(text);
        if (json.image) return json.image.startsWith('data:') ? json.image : `data:image/png;base64,${json.image}`;
        if (json.images?.[0]) return json.images[0].startsWith('data:') ? json.images[0] : `data:image/png;base64,${json.images[0]}`;
        if (json.data?.[0]?.b64_json) return `data:image/png;base64,${json.data[0].b64_json}`;
        if (json.data?.[0]?.url) return json.data[0].url;
      } catch (e) {
        // ignore
      }
    }

    try {
      const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
      const zip = await JSZip.loadAsync(arrayBuffer);
      const pngName = Object.keys(zip.files).find(name => name.toLowerCase().endsWith('.png'));

      if (!pngName) {
        throw new Error('NAI ZIP 中没有找到 PNG: ' + Object.keys(zip.files).join(','));
      }

      const base64 = await zip.files[pngName].async('base64');
      return `data:image/png;base64,${base64}`;
    } catch (err) {
      throw new Error(`解压ZIP失败: ${err.message}`);
    }
  }

  // OpenAI DALL-E 引擎
  async function generateViaOpenAI(userPrompt) {
    const cfg = imageGenConfig.openai;
    if (!cfg.apiKey) throw new Error('OpenAI API Key 未填写');
    const endpoint = (cfg.endpoint || 'https://api.openai.com/v1').replace(/\/+$/, '') + '/images/generations';

    let finalPrompt = userPrompt;
    if (cfg.positivePrompt) {
      finalPrompt = `${cfg.positivePrompt}, ${userPrompt}`;
    }
    if (cfg.negativePrompt) {
      finalPrompt = `${finalPrompt}\nAvoid: ${cfg.negativePrompt}`;
    }

    const payload = {
      model: cfg.model || 'dall-e-3',
      prompt: finalPrompt,
      n: 1,
      size: `${cfg.width || 1024}x${cfg.height || 1024}`,
      response_format: 'b64_json'
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`OpenAI 生图失败: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    if (data.data && data.data[0]) {
      const item = data.data[0];
      if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
      if (item.url) return item.url;
    }
    throw new Error('OpenAI 返回结果无效');
  }

  // Gemini / Imagen 引擎
  async function generateViaGemini(userPrompt) {
    const cfg = imageGenConfig.gemini;
    if (!cfg.apiKey) throw new Error('Gemini API Key 未填写');
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model || 'imagen-3.0-generate-002'}:predict?key=${cfg.apiKey.trim()}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: userPrompt }],
        parameters: { sampleCount: 1, aspectRatio: cfg.aspectRatio || '1:1' }
      })
    });

    if (!res.ok) throw new Error(`Gemini Imagen生图错误 [${res.status}]`);
    const data = await res.json();
    const b64 = data.predictions?.[0]?.bytesBase64Encoded;
    if (b64) return `data:image/png;base64,${b64}`;
    throw new Error('Gemini 未能生成有效图片数据');
  }

  // Custom / OpenAI-Compatible 引擎
  async function generateViaCustom(userPrompt, extraNeg = '') {
    const cfg = imageGenConfig.custom;
    if (!cfg.endpoint) throw new Error('自定义 API 地址未填写');
    const endpoint = cfg.endpoint.replace(/\/+$/, '') + '/images/generations';

    const fullPositive = [cfg.positivePrompt, userPrompt].filter(Boolean).join(', ');

    const headers = { 'Content-Type': 'application/json' };
    if (cfg.apiKey) headers['Authorization'] = `Bearer ${cfg.apiKey.trim()}`;

    const sizeStr = `${cfg.width || 832}x${cfg.height || 1216}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: cfg.model || 'dall-e-3',
        prompt: fullPositive,
        n: 1,
        size: sizeStr,
        response_format: 'url'
      })
    });

    if (!res.ok) throw new Error(`自定义生图请求失败: HTTP ${res.status}`);
    const data = await res.json();
    if (data.data?.[0]?.url) return data.data[0].url;
    if (data.data?.[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`;
    throw new Error('自定义接口未返回有效图片 URL');
  }

  // 控制台一键测试生图
  async function testGenerateImage() {
    if (isGeneratingTestImage.value) return;
    isGeneratingTestImage.value = true;
    testImageResult.value = '';
    log('开始执行测试生图...', 'info');

    try {
      const url = await generateImage({ prompt: testPromptInput.value || '1girl, masterpiece, solo' });
      testImageResult.value = url;
      log('测试生图生成成功！', 'success');
    } catch (e) {
      log('测试生图失败: ' + e.message, 'error');
      alert('测试生图失败：' + e.message);
    } finally {
      isGeneratingTestImage.value = false;
    }
  }

  return {
    imageGenConfig,
    showImageGenSettingsModal,
    showNovelAiSettingsModal,
    imageGenModalTab,
    openImageGenSettingsModal,
    handleVibeFileUpload,
    removeVibeImage,
    isGeneratingTestImage,
    testImageResult,
    testPromptInput,
    saveConfig,
    resetConfigToDefault,
    generateImage,
    testGenerateImage,
    availableOpenAiModels,
    fetchingOpenAiModels,
    fetchOpenAiModels
  };
}

function extractPngFromBuffer(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const pngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  let pngStart = -1;

  for (let i = 0; i <= bytes.length - 8; i++) {
    let match = true;
    for (let j = 0; j < 8; j++) {
      if (bytes[i + j] !== pngHeader[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      pngStart = i;
      break;
    }
  }

  if (pngStart !== -1) {
    const pngBytes = bytes.slice(pngStart);
    return new Blob([pngBytes], { type: 'image/png' });
  }

  return new Blob([bytes], { type: 'image/png' });
}

function isJsonBuffer(buffer) {
  try {
    const str = new TextDecoder().decode(new Uint8Array(buffer).subarray(0, 50)).trim();
    return str.startsWith('{') || str.startsWith('[');
  } catch (e) {
    return false;
  }
}

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}
