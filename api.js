/**
 * 统一 OpenAI 兼容 /chat/completions 调用：URL 候选、错误与正文解析集中处理。
 */

export function normalizeProfile(profile) {
    if (!profile) {
        return { endpoint: '', key: '', model: 'gpt-4o-mini' };
    }
    return {
        endpoint: String(profile.endpoint || '').trim(),
        key: String(profile.key || '').trim(),
        model:
            profile.model ||
            profile.openai_model ||
            profile.claude_model ||
            profile.openrouter_model ||
            'gpt-4o-mini'
    };
}

/** @param {string} endpointRaw */
export function buildChatCompletionUrlCandidates(endpointRaw) {
    const base = String(endpointRaw || '').trim().replace(/\/+$/, '');
    if (!base) return [];
    if (/\/chat\/completions$/i.test(base)) return [base];
    if (/\/v1$/i.test(base)) return [`${base}/chat/completions`];
    return [`${base}/v1/chat/completions`, `${base}/chat/completions`];
}

export function extractChatCompletionText(data) {
    if (!data || typeof data !== 'object') return '';
    if (data.error && (data.error.message || data.error.code)) {
        console.warn('[callAI] API error:', data.error.message || data.error.code || data.error);
    }
    const ch = data.choices?.[0];
    if (ch) {
        const msg = ch.message || ch.delta;
        if (msg?.content != null) {
            if (typeof msg.content === 'string') return msg.content;
            if (Array.isArray(msg.content)) {
                return msg.content
                    .map((c) => (typeof c === 'string' ? c : (c && (c.text || c.content)) || ''))
                    .join('');
            }
        }
    }
    const msgContent = data?.choices?.[0]?.message?.content;
    const legacy =
        (typeof msgContent === 'string' ? msgContent : Array.isArray(msgContent) ? msgContent.map((x) => x?.text || '').join('') : '') ||
        data?.choices?.[0]?.delta?.content;
    if (legacy) return String(legacy);

    if (data.message?.content != null && typeof data.message.content === 'string') {
        return data.message.content;
    }
    const parts = data.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts) && parts.length) {
        return parts.map((p) => (p && p.text) || '').join('');
    }
    if (typeof data.output_text === 'string') return data.output_text;
    if (typeof data.text === 'string') return data.text;
    if (data.data && typeof data.data === 'object') {
        const nested = extractChatCompletionText(data.data);
        if (nested) return nested;
    }
    return '';
}

/**
 * @param {object} profile  Console 内的 activeProfile 对象
 * @param {Array<{role:string,content:string}>} messages
 * @param {object} [options]
 * @param {number} [options.temperature]
 * @param {number} [options.max_tokens]
 * @param {boolean} [options.stream]
 * @param {AbortSignal} [options.signal]
 * @param {object} [options.extraBody] merge 进请求 body
 * @returns {Promise<string>}
 */
export async function callAI(profile, messages, options = {}) {
    const p = normalizeProfile(profile);
    if (!p.endpoint || !p.key) {
        throw new Error('未配置 API（需要 endpoint 与 key）');
    }

    const urls = buildChatCompletionUrlCandidates(p.endpoint);
    if (!urls.length) throw new Error('API endpoint 格式不正确');

    const body = {
        model: p.model,
        messages,
        temperature: options.temperature ?? 0.8,
        stream: options.stream ?? false,
        ...options.extraBody
    };
    if (typeof options.max_tokens === 'number') {
        body.max_tokens = options.max_tokens;
    } else if (typeof profile?.max_tokens === 'number') {
        body.max_tokens = profile.max_tokens;
    } else {
        body.max_tokens = 2000;
    }

    let lastErr = null;

    for (const url of urls) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${p.key}`,
                    ...(options.headers || {})
                },
                body: JSON.stringify(body),
                signal: options.signal
            });

            const rawText = await res.text();
            let data = null;
            try {
                data = rawText ? JSON.parse(rawText) : null;
            } catch {
                lastErr = new Error(res.ok ? '响应非 JSON' : `API ${res.status}: ${rawText.slice(0, 200)}`);
                if (!res.ok && res.status === 404) continue;
                if (!res.ok) throw lastErr;
                continue;
            }

            if (!res.ok) {
                const hint = data?.error?.message || rawText.slice(0, 300);
                lastErr = new Error(`API ${res.status}: ${hint}`);
                if (res.status === 404) continue;
                throw lastErr;
            }

            return extractChatCompletionText(data);
        } catch (e) {
            if (e?.name === 'AbortError') throw e;
            lastErr = e;
        }
    }

    throw lastErr || new Error('无法连接到 AI 接口');
}
