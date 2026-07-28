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
    model: 'nai-diffusion-4-full', // 正确官方 API 模型名称
    width: 832,
    height: 1216,
    steps: 28,
    cfgScale: 5.0,
    sampler: 'k_euler',
    noiseSchedule: 'karras',
    seed: -1,
    ucPreset: 'Preset 0 - Heavy',
    smea: false,
    smeaDyn: false,
    cfgRescale: 0,
    undesiredStrength: 1.0,
    qualityTags: true,
    variety: true,
    dynamicThresholding: false,
    vibeTransfer: {
      enabled: false,
      imageUrl: '',
      strength: 0.5,
      infoExtracted: 1.0
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
    quality: 'standard', // 'standard' | 'hd'
    style: 'vivid', // 'vivid' | 'natural'
    size: '1024x1024'
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

  function openImageGenSettingsModal(channel = null) {
    imageGenModalTab.value = channel || imageGenConfig.activeChannel || 'novelai';
    showImageGenSettingsModal.value = true;
  }

  function loadConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.novelai && (parsed.novelai.model === 'nai-diffusion-4-5-full' || !parsed.novelai.model)) {
          parsed.novelai.model = 'nai-diffusion-4-full';
        }
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
      if (file.name.endsWith('.naiv4vibe') || file.type === 'application/json') {
        const text = await file.text();
        try {
          const json = JSON.parse(text);
          const b64 = json.image || json.base64 || json.vibe_image || json.vibe;
          if (b64) {
            const dataUrl = b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`;
            imageGenConfig.novelai.vibeTransfer.imageUrl = dataUrl;
            imageGenConfig.novelai.vibeTransfer.enabled = true;
            if (json.strength !== undefined) imageGenConfig.novelai.vibeTransfer.strength = Number(json.strength);
            log('成功解析并导入 .naiv4vibe 预设画风包！', 'success');
            return;
          }
        } catch (e) {
          /* fallback */
        }
      }

      // 普通图片文件处理
      const reader = new FileReader();
      reader.onload = (e) => {
        imageGenConfig.novelai.vibeTransfer.imageUrl = e.target.result;
        imageGenConfig.novelai.vibeTransfer.enabled = true;
        log('画风/垫图参考图片上传成功！', 'success');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      log('解析参考图文件失败: ' + err.message, 'error');
      alert('解析参考图文件失败：' + err.message);
    }
  }

  function removeVibeImage() {
    imageGenConfig.novelai.vibeTransfer.imageUrl = '';
    imageGenConfig.novelai.vibeTransfer.enabled = false;
    log('参考图已清空', 'info');
  }

  /**
   * 核心生图入口函数
   */
  async function generateImage({ prompt, negativePrompt = '' } = {}) {
    if (!imageGenConfig.enabled) {
      throw new Error('生图功能未启用，请在控制台中开启。');
    }

    const channel = imageGenConfig.activeChannel;
    log(`开始使用 [${channel.toUpperCase()}] 渠道生成图片...`, 'info');

    if (channel === 'pollinations') {
      return await generateViaPollinations(prompt, negativePrompt);
    } else if (channel === 'novelai') {
      return await generateViaNovelAI(prompt, negativePrompt);
    } else if (channel === 'openai') {
      return await generateViaOpenAI(prompt);
    } else if (channel === 'gemini') {
      return await generateViaGemini(prompt);
    } else if (channel === 'custom') {
      return await generateViaCustom(prompt, negativePrompt);
    } else {
      return await generateViaPollinations(prompt, negativePrompt);
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

  // NovelAI 引擎 (兼容 ZIP 解包、PNG 直出与中转 JSON 数据)
  async function generateViaNovelAI(userPrompt, extraNeg = '') {
    const cfg = imageGenConfig.novelai;
    if (!cfg.apiKey) {
      throw new Error('NovelAI API Key 未填写，请在控制台设置。');
    }

    let endpoint = 'https://image.novelai.net/ai/generate-image';
    if (cfg.endpointType === 'official_api') {
      endpoint = 'https://api.novelai.net/ai/generate-image';
    } else if (cfg.endpointType === 'proxy' && cfg.proxyUrl) {
      let pUrl = cfg.proxyUrl.trim();
      if (!pUrl.includes('/ai/generate-image') && !pUrl.includes('/generate-image')) {
        pUrl = pUrl.replace(/\/+$/, '') + '/ai/generate-image';
      }
      endpoint = pUrl;
    }

    const fullPositive = [cfg.positivePrompt, userPrompt].filter(Boolean).join(', ');
    const fullNegative = [cfg.negativePrompt, extraNeg].filter(Boolean).join(', ');
    const seed = cfg.seed === -1 ? Math.floor(Math.random() * 999999999) : cfg.seed;

    let modelName = cfg.model || 'nai-diffusion-4-full';
    if (modelName === 'nai-diffusion-4-5-full') modelName = 'nai-diffusion-4-full';

    const width = Math.floor((cfg.width || 832) / 64) * 64;
    const height = Math.floor((cfg.height || 1216) / 64) * 64;

    const parametersObj = {
      width,
      height,
      scale: Number(cfg.cfgScale) || 5.0,
      sampler: cfg.sampler || 'k_euler',
      steps: Number(cfg.steps) || 28,
      seed: seed,
      n_samples: 1,
      uc: fullNegative,
      qualityToggle: !!cfg.qualityTags,
      noise_schedule: cfg.noiseSchedule || 'karras',
      cfg_rescale: Number(cfg.cfgRescale) || 0
    };

    // Vibe Transfer (垫图/参考图) 注入
    if (cfg.vibeTransfer && cfg.vibeTransfer.enabled && cfg.vibeTransfer.imageUrl) {
      const rawB64 = cfg.vibeTransfer.imageUrl.replace(/^data:[^;]+;base64,/, '');
      const str = Number(cfg.vibeTransfer.strength) || 0.5;
      const info = Number(cfg.vibeTransfer.infoExtracted) || 1.0;

      parametersObj.vibe_transfer = {
        images: [rawB64],
        information_extracted: [info],
        reference_strength: [str]
      };
      parametersObj.reference_image = rawB64;
      parametersObj.reference_strength = str;
      parametersObj.reference_information_extracted = info;

      log('已在 NovelAI 请求中附加 Vibe Transfer 参考图数据', 'info');
    }

    const payload = {
      action: 'generate',
      input: fullPositive,
      model: modelName,
      parameters: parametersObj
    };

    log(`发送 NovelAI 请求 -> ${endpoint}`, 'info');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`NovelAI 请求失败 [${res.status}]: ${errText.slice(0, 250)}`);
    }

    const contentType = res.headers.get('content-type') || '';
    const arrayBuffer = await res.arrayBuffer();

    // 1. 如果服务器/中转端点返回的是 JSON 数据
    if (contentType.includes('application/json') || isJsonBuffer(arrayBuffer)) {
      try {
        const text = new TextDecoder().decode(arrayBuffer);
        const json = JSON.parse(text);
        if (json.image) return json.image.startsWith('data:') ? json.image : `data:image/png;base64,${json.image}`;
        if (json.images?.[0]) return json.images[0].startsWith('data:') ? json.images[0] : `data:image/png;base64,${json.images[0]}`;
        if (json.data?.[0]?.b64_json) return `data:image/png;base64,${json.data[0].b64_json}`;
        if (json.data?.[0]?.url) return json.data[0].url;
        if (json.errorMessage || json.message || json.error) {
          throw new Error(`NovelAI 接口返回错误: ${json.errorMessage || json.message || json.error}`);
        }
      } catch (e) {
        if (e.message.startsWith('NovelAI 接口返回错误')) throw e;
      }
    }

    // 2. 解包/提炼 PNG 字节流（针对 NovelAI 官方原版 API 返回的 Zip 压缩包或 Raw PNG）
    const pngBlob = extractPngFromBuffer(arrayBuffer);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(pngBlob);
    });
  }

  // OpenAI DALL-E 引擎
  async function generateViaOpenAI(userPrompt) {
    const cfg = imageGenConfig.openai;
    if (!cfg.apiKey) throw new Error('OpenAI API Key 未填写');
    const endpoint = (cfg.endpoint || 'https://api.openai.com/v1').replace(/\/+$/, '') + '/images/generations';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cfg.apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: cfg.model || 'dall-e-3',
        prompt: userPrompt,
        n: 1,
        size: cfg.size || '1024x1024',
        quality: cfg.quality || 'standard',
        style: cfg.style || 'vivid',
        response_format: 'b64_json'
      })
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
    testGenerateImage
  };
}

function extractPngFromBuffer(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  // PNG Magic bytes: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
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
