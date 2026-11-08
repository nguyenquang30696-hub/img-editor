import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Helper to sanitize key
function sanitizeKey(key?: string): string {
  if (!key || typeof key !== 'string') return '';
  return key.trim().replace(/^[;,\s"']+|[;,\s"']+$/g, '');
}

// Helper to clean base URL
function sanitizeBaseUrl(url?: string): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return 'https://api.deepseek.com/v1';
  }
  return url.trim().replace(/\/+$/, '');
}

// Endpoint to test an API key (supports both Gemini and DeepSeek)
app.post('/api/test-key', async (req, res) => {
  const { provider = 'gemini', apiKey, model, baseUrl } = req.body;
  const providedKey = sanitizeKey(apiKey);

  try {
    if (provider === 'deepseek') {
      const cleanKey = providedKey || process.env.DEEPSEEK_API_KEY || '';
      if (!cleanKey) {
        return res.status(400).json({ success: false, message: 'Chưa nhập DeepSeek API Key.' });
      }

      const cleanUrl = sanitizeBaseUrl(baseUrl);
      const selectedModel = model || 'deepseek-flash';

      try {
        const deepseekRes = await fetch(`${cleanUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanKey}`,
          },
          body: JSON.stringify({
            model: selectedModel === 'deepseek-flash' ? 'deepseek-chat' : selectedModel,
            messages: [{ role: 'user', content: 'test connection' }],
            max_tokens: 5,
          }),
        });

        const data = await deepseekRes.json();

        if (deepseekRes.ok) {
          return res.json({
            success: true,
            message: `Key DeepSeek hợp lệ! Kết nối thành công tới model ${selectedModel}.`,
          });
        }

        const errMsg = data?.error?.message || data?.message || JSON.stringify(data);
        if (deepseekRes.status === 401) {
          return res.json({ success: false, code: 401, message: 'DeepSeek API Key không hợp lệ.' });
        }
        if (deepseekRes.status === 402) {
          return res.json({ success: false, code: 402, message: 'Tài khoản DeepSeek hết số dư (Insufficient Balance). Vui lòng nạp tiền vào tài khoản DeepSeek.' });
        }
        if (deepseekRes.status === 429) {
          return res.json({ success: false, code: 429, message: 'DeepSeek API chạm hạn mức Rate Limit (429).' });
        }

        return res.json({ success: false, code: deepseekRes.status, message: errMsg });
      } catch (e: any) {
        return res.json({ success: false, message: `Lỗi kết nối tới DeepSeek endpoint: ${e.message}` });
      }
    }

    // Default: Gemini
    const cleanKey = sanitizeKey(apiKey) || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    if (!cleanKey) {
      return res.status(400).json({ success: false, message: 'Chưa cung cấp Gemini API Key để kiểm tra.' });
    }

    const selectedModel = model || 'gemini-3.1-flash-lite-image';
    const ai = new GoogleGenAI({
      apiKey: cleanKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    await ai.models.generateContent({
      model: selectedModel,
      contents: 'test',
    });

    return res.json({
      success: true,
      message: `Key Gemini hoạt động tốt và có quyền truy cập model ${selectedModel}!`,
    });
  } catch (error: any) {
    const msg = error?.message || '';
    const status = error?.status || error?.code || 500;

    if (msg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') || providedKey.startsWith('AQ.') || providedKey.startsWith('ya29.')) {
      return res.json({
        success: false,
        code: 401,
        errorType: 'ACCESS_TOKEN_NOT_SUPPORTED',
        message: 'Key bạn vừa nhập bắt đầu bằng "AQ." là Access Token tạm thời, không phải Gemini API Key. Google AI Studio chỉ chấp nhận API Key bắt đầu bằng "AIzaSy...". Hãy lấy key tại https://aistudio.google.com/app/apikey.',
      });
    }

    if (msg.includes('free_tier') || msg.includes('limit: 0') || status === 429) {
      return res.json({
        success: false,
        code: 429,
        errorType: 'FREE_TIER_NO_QUOTA',
        message: 'Key hợp lệ nhưng thuộc gói Free Tier (hạn mức model tạo ảnh là 0 lượt/phút). Google yêu cầu tài khoản API Key phải bật Billing (Pay-as-you-go) tại aistudio.google.com để dùng các model tạo ảnh.',
      });
    }

    if (msg.includes('API_KEY_INVALID') || status === 400 || status === 403 || msg.includes('UNAUTHENTICATED')) {
      return res.json({
        success: false,
        code: status,
        errorType: 'INVALID_KEY',
        message: 'API Key không hợp lệ. Vui lòng kiểm tra lại key (Gemini API Key thường bắt đầu bằng "AIzaSy...").',
      });
    }

    return res.json({
      success: false,
      code: status,
      message: msg || 'Không thể kết nối đến Gemini API với key này.',
    });
  }
});

// Endpoint for image generation
app.post('/api/generate', async (req, res) => {
  const { parts, apiKey: clientApiKey, model: clientModel, provider = 'gemini', baseUrl } = req.body;
  const cleanClientKey = sanitizeKey(clientApiKey);

  try {
    if (!parts || !Array.isArray(parts)) {
      return res.status(400).json({ error: 'Dữ liệu yêu cầu không hợp lệ (cần danh sách parts).' });
    }

    // --- DEEPSEEK PROVIDER ---
    if (provider === 'deepseek') {
      const cleanKey = sanitizeKey(clientApiKey) || process.env.DEEPSEEK_API_KEY;
      if (!cleanKey) {
        return res.status(401).json({
          error: 'Chưa có DeepSeek API Key. Vui lòng bấm nút API ở góc trên bên phải > chọn tab DeepSeek để nhập key.',
        });
      }

      const cleanUrl = sanitizeBaseUrl(baseUrl);
      const selectedModel = (clientModel === 'deepseek-flash' || !clientModel) ? 'deepseek-chat' : clientModel;

      const promptText = parts.filter(p => p.text).map(p => p.text).join('\n') || 'Chỉnh sửa ảnh thẻ chuyên nghiệp';

      const deepseekRes = await fetch(`${cleanUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: 'You are an expert AI photo generator and stylist for professional Vietnamese ID photos (ảnh thẻ). Analyze the request and provide output.',
            },
            {
              role: 'user',
              content: promptText,
            },
          ],
        }),
      });

      const data = await deepseekRes.json();
      if (!deepseekRes.ok) {
        const msg = data?.error?.message || data?.message || `Lỗi DeepSeek (${deepseekRes.status})`;
        return res.status(deepseekRes.status).json({ error: msg });
      }

      const replyContent = data.choices?.[0]?.message?.content || '';

      // Check if DeepSeek response contains an image URL (markdown or direct)
      const imgMatch = replyContent.match(/!\[.*?\]\((https?:\/\/.*?)\)/) || replyContent.match(/(https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|webp))/i);

      if (imgMatch) {
        return res.json({ imageUrl: imgMatch[1], text: replyContent });
      }

      // If DeepSeek returns text advice / prompt, return text with explanation
      return res.json({
        imageUrl: null,
        text: replyContent,
        message: 'DeepSeek Flash đã phân tích yêu cầu tạo ảnh thẻ thành công. Lưu ý: DeepSeek hiện là mô hình ngôn ngữ (LLM); để render trực tiếp pixel ảnh thẻ, bạn hãy chuyển sang tab Google Gemini (model gemini-3.1-flash-lite-image).',
      });
    }

    // --- GEMINI PROVIDER ---
    const effectiveKey = cleanClientKey || process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!effectiveKey) {
      return res.status(401).json({
        error: 'Chưa có Gemini API Key. Vui lòng bấm nút API ở góc trên bên phải để thêm API Key của bạn hoặc thiết lập biến môi trường.',
      });
    }

    const allowedModels = ['gemini-3.1-flash-lite-image', 'gemini-nano-banana-2.1', 'gemini-3-pro-image', 'gemini-2.5-flash-image'];
    const selectedModel = (typeof clientModel === 'string' && allowedModels.includes(clientModel))
      ? clientModel
      : 'gemini-3.1-flash-lite-image';

    const ai = new GoogleGenAI({
      apiKey: effectiveKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: { parts },
    });

    let imageUrl: string | null = null;
    let textOutput = '';

    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        } else if (part.text) {
          textOutput += part.text;
        }
      }
      if (imageUrl) break;
    }

    if (!imageUrl) {
      return res.status(500).json({
        error: textOutput || 'Không thể tạo hình ảnh từ AI. Vui lòng thử lại với ảnh hoặc tùy chọn khác.',
      });
    }

    return res.json({ imageUrl, text: textOutput });
  } catch (error: any) {
    console.error('Server error generating image:', error);
    const rawMsg = error?.message || '';
    const status = error?.status || error?.code || 500;

    let friendlyMsg = rawMsg || 'Đã xảy ra lỗi trên máy chủ khi tạo ảnh.';
    if (rawMsg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') || (cleanClientKey && (cleanClientKey.startsWith('AQ.') || cleanClientKey.startsWith('ya29.')))) {
      friendlyMsg = 'Key bạn nhập bắt đầu bằng "AQ." là Access Token tạm thời, không phải Gemini API Key. Google AI Studio chỉ chấp nhận API Key chuẩn bắt đầu bằng "AIzaSy...". Vui lòng tạo key tại https://aistudio.google.com/app/apikey.';
    } else if (rawMsg.includes('free_tier') || rawMsg.includes('limit: 0') || status === 429) {
      friendlyMsg = 'Lỗi 429: Key đang dùng thuộc gói Free Tier (hạn mức model tạo ảnh là 0 lượt/phút). Để tạo ảnh, tài khoản Google của Key cần bật Billing (Pay-as-you-go) tại https://aistudio.google.com.';
    } else if (rawMsg.includes('API_KEY_INVALID') || status === 400 || status === 403 || rawMsg.includes('UNAUTHENTICATED')) {
      friendlyMsg = 'Lỗi xác thực: API Key không hợp lệ. Vui lòng kiểm tra lại key (Gemini API Key thường bắt đầu bằng "AIzaSy...").';
    }

    return res.status(status === 429 ? 429 : 500).json({ error: friendlyMsg, raw: rawMsg });
  }
});

// Serve static frontend files in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.use((_req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});

