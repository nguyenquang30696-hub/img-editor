import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';

function sanitizeKey(key?: string): string {
  if (!key || typeof key !== 'string') return '';
  return key.trim().replace(/^[;,\s"']+|[;,\s"']+$/g, '');
}

function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      // Test key endpoint
      server.middlewares.use('/api/test-key', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { apiKey, model } = JSON.parse(body || '{}');
            const cleanKey = sanitizeKey(apiKey) || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
            if (!cleanKey) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: 'Chưa cung cấp API Key để kiểm tra.' }));
              return;
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
              contents: 'test'
            });

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              message: `Key hoạt động tốt và có quyền truy cập model ${selectedModel}!`
            }));
          } catch (error: any) {
            const msg = error?.message || '';
            const status = error?.status || error?.code || 500;
            res.setHeader('Content-Type', 'application/json');

            if (msg.includes('free_tier') || msg.includes('limit: 0') || status === 429) {
              res.statusCode = 200;
              res.end(JSON.stringify({
                success: false,
                code: 429,
                errorType: 'FREE_TIER_NO_QUOTA',
                message: 'Key hợp lệ nhưng thuộc gói Free Tier (hạn mức model tạo ảnh là 0 lượt/phút). Google yêu cầu tài khoản API Key phải bật Billing (Pay-as-you-go) tại https://aistudio.google.com để dùng các model tạo ảnh.'
              }));
              return;
            }

            if (msg.includes('API_KEY_INVALID') || status === 400 || status === 403) {
              res.statusCode = 200;
              res.end(JSON.stringify({
                success: false,
                code: status,
                errorType: 'INVALID_KEY',
                message: 'API Key không hợp lệ hoặc thiếu quyền hạn.'
              }));
              return;
            }

            res.statusCode = 200;
            res.end(JSON.stringify({
              success: false,
              code: status,
              message: msg || 'Không thể kết nối đến Gemini API.'
            }));
          }
        });
      });

      // Generate endpoint
      server.middlewares.use('/api/generate', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const { parts, apiKey: clientApiKey, model: clientModel } = JSON.parse(body || '{}');
            if (!parts || !Array.isArray(parts)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Dữ liệu không hợp lệ.' }));
              return;
            }

            const cleanClientKey = sanitizeKey(clientApiKey);
            const effectiveKey = cleanClientKey || process.env.GEMINI_API_KEY || process.env.API_KEY;

            if (!effectiveKey) {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                error: 'Chưa có Gemini API Key. Vui lòng bấm nút API ở góc trên bên phải để thêm API Key của bạn hoặc thiết lập biến môi trường.'
              }));
              return;
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
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                error: textOutput || 'Không tạo được ảnh từ AI. Vui lòng thử lại.'
              }));
              return;
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ imageUrl, text: textOutput }));
          } catch (err: any) {
            console.error('Vite dev API error:', err);
            const rawMsg = err?.message || '';
            const status = err?.status || err?.code || 500;

            let friendlyMsg = rawMsg || 'Đã xảy ra lỗi khi tạo ảnh.';
            if (rawMsg.includes('free_tier') || rawMsg.includes('limit: 0') || status === 429) {
              friendlyMsg = 'Lỗi 429: Key đang dùng thuộc gói Free Tier (hạn mức model tạo ảnh là 0 lượt/phút). Để tạo ảnh, tài khoản Google của Key cần bật Billing (Pay-as-you-go) tại https://aistudio.google.com.';
            } else if (rawMsg.includes('API_KEY_INVALID') || status === 400 || status === 403) {
              friendlyMsg = 'Lỗi xác thực: API Key không hợp lệ hoặc thiếu quyền hạn.';
            }

            res.statusCode = status === 429 ? 429 : 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: friendlyMsg, raw: rawMsg }));
          }
        });
      });
    }
  };
}

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [apiDevPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
