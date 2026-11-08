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

// Endpoint to test an API key directly from the modal
app.post('/api/test-key', async (req, res) => {
  try {
    const { apiKey, model } = req.body;
    const cleanKey = sanitizeKey(apiKey) || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    if (!cleanKey) {
      return res.status(400).json({ success: false, message: 'Chưa cung cấp API Key để kiểm tra.' });
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

    // Test simple generation call
    await ai.models.generateContent({
      model: selectedModel,
      contents: 'test'
    });

    return res.json({
      success: true,
      message: `Key hoạt động tốt và có quyền truy cập model ${selectedModel}!`
    });
  } catch (error: any) {
    const msg = error?.message || '';
    const status = error?.status || error?.code || 500;

    if (msg.includes('free_tier') || msg.includes('limit: 0') || status === 429) {
      return res.json({
        success: false,
        code: 429,
        errorType: 'FREE_TIER_NO_QUOTA',
        message: 'Key hợp lệ nhưng thuộc gói Free Tier (hạn mức model tạo ảnh là 0 lượt/phút). Google yêu cầu tài khoản API Key phải bật Billing (Pay-as-you-go) tại aistudio.google.com để dùng các model tạo ảnh.'
      });
    }

    if (msg.includes('API_KEY_INVALID') || status === 400 || status === 403) {
      return res.json({
        success: false,
        code: status,
        errorType: 'INVALID_KEY',
        message: 'API Key không hợp lệ hoặc thiếu quyền truy cập.'
      });
    }

    return res.json({
      success: false,
      code: status,
      message: msg || 'Không thể kết nối đến Gemini API với key này.'
    });
  }
});

// Endpoint for image generation
app.post('/api/generate', async (req, res) => {
  try {
    const { parts, apiKey: clientApiKey, model: clientModel } = req.body;
    if (!parts || !Array.isArray(parts)) {
      return res.status(400).json({ error: 'Dữ liệu yêu cầu không hợp lệ (cần danh sách parts).' });
    }

    const cleanClientKey = sanitizeKey(clientApiKey);
    const effectiveKey = cleanClientKey || process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!effectiveKey) {
      return res.status(401).json({
        error: 'Chưa có Gemini API Key. Vui lòng bấm nút API ở góc trên bên phải để thêm API Key của bạn hoặc thiết lập biến môi trường.'
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
      contents: { parts }
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
        error: textOutput || 'Không thể tạo hình ảnh từ AI. Vui lòng thử lại với ảnh hoặc tùy chọn khác.'
      });
    }

    return res.json({ imageUrl, text: textOutput });
  } catch (error: any) {
    console.error('Server error generating image:', error);
    const rawMsg = error?.message || '';
    const status = error?.status || error?.code || 500;

    let friendlyMsg = rawMsg || 'Đã xảy ra lỗi trên máy chủ khi tạo ảnh.';
    if (rawMsg.includes('free_tier') || rawMsg.includes('limit: 0') || status === 429) {
      friendlyMsg = 'Lỗi 429: Key đang dùng thuộc gói Free Tier (hạn mức model tạo ảnh là 0 lượt/phút). Để tạo ảnh, tài khoản Google của Key cần bật Billing (Pay-as-you-go) tại https://aistudio.google.com.';
    } else if (rawMsg.includes('API_KEY_INVALID') || status === 400 || status === 403) {
      friendlyMsg = 'Lỗi xác thực: API Key không hợp lệ hoặc thiếu quyền hạn.';
    }

    return res.status(status === 429 ? 429 : 500).json({ error: friendlyMsg, raw: rawMsg });
  }
});

// Serve static frontend files in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
