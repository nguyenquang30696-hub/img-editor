import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';

function sanitizeKey(key?: string): string {
  if (!key || typeof key !== 'string') return '';
  return key.trim().replace(/^[;,\s"']+|[;,\s"']+$/g, '');
}

function sanitizeBaseUrl(url?: string): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return 'https://api.deepseek.com/v1';
  }
  return url.trim().replace(/\/+$/, '');
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
          const { provider = 'gemini', apiKey, model, baseUrl } = JSON.parse(body || '{}');
          const providedKey = sanitizeKey(apiKey);

          try {
            if (provider === 'deepseek') {
              const cleanKey = providedKey || process.env.DEEPSEEK_API_KEY || '';
              if (!cleanKey) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, message: 'Chưa nhập DeepSeek API Key.' }));
                return;
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
                res.setHeader('Content-Type', 'application/json');

                if (deepseekRes.ok) {
                  res.statusCode = 200;
                  res.end(JSON.stringify({
                    success: true,
                    message: `Key DeepSeek hợp lệ! Kết nối thành công tới model ${selectedModel}.`,
                  }));
                  return;
                }

                const errMsg = data?.error?.message || data?.message || JSON.stringify(data);
                res.statusCode = 200;
                if (deepseekRes.status === 401) {
                  res.end(JSON.stringify({ success: false, code: 401, message: 'DeepSeek API Key không hợp lệ.' }));
                  return;
                }
                if (deepseekRes.status === 402) {
                  res.end(JSON.stringify({ success: false, code: 402, message: 'Tài khoản DeepSeek hết số dư (Insufficient Balance).' }));
                  return;
                }
                if (deepseekRes.status === 429) {
                  res.end(JSON.stringify({ success: false, code: 429, message: 'DeepSeek API chạm hạn mức Rate Limit (429).' }));
                  return;
                }

                res.end(JSON.stringify({ success: false, code: deepseekRes.status, message: errMsg }));
                return;
              } catch (e: any) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, message: `Lỗi kết nối tới DeepSeek endpoint: ${e.message}` }));
                return;
              }
            }

            // Default: Gemini
            const cleanKey = sanitizeKey(apiKey) || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
            if (!cleanKey) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: 'Chưa cung cấp Gemini API Key để kiểm tra.' }));
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
              contents: 'test',
            });

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              message: `Key Gemini hoạt động tốt và có quyền truy cập model ${selectedModel}!`,
            }));
          } catch (error: any) {
            const msg = error?.message || '';
            const status = error?.status || error?.code || 500;
            res.setHeader('Content-Type', 'application/json');

            if (msg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') || providedKey.startsWith('AQ.') || providedKey.startsWith('ya29.')) {
              res.statusCode = 200;
              res.end(JSON.stringify({
                success: false,
                code: 401,
                errorType: 'ACCESS_TOKEN_NOT_SUPPORTED',
                message: 'Key bạn vừa nhập bắt đầu bằng "AQ." là Access Token tạm thời, không phải Gemini API Key. Google AI Studio chỉ chấp nhận API Key chuẩn bắt đầu bằng "AIzaSy...". Hãy lấy key tại https://aistudio.google.com/app/apikey.',
              }));
              return;
            }

            if (msg.includes('free_tier') || msg.includes('limit: 0') || status === 429) {
              res.statusCode = 200;
              res.end(JSON.stringify({
                success: false,
                code: 429,
                errorType: 'FREE_TIER_NO_QUOTA',
                message: 'Key hợp lệ nhưng thuộc gói Free Tier (hạn mức model tạo ảnh là 0 lượt/phút). Google yêu cầu tài khoản API Key phải bật Billing (Pay-as-you-go) tại https://aistudio.google.com để dùng các model tạo ảnh.',
              }));
              return;
            }

            if (msg.includes('API_KEY_INVALID') || status === 400 || status === 403 || msg.includes('UNAUTHENTICATED')) {
              res.statusCode = 200;
              res.end(JSON.stringify({
                success: false,
                code: status,
                errorType: 'INVALID_KEY',
                message: 'API Key không hợp lệ. Vui lòng kiểm tra lại key (Gemini API Key thường bắt đầu bằng "AIzaSy...").',
              }));
              return;
            }

            res.statusCode = 200;
            res.end(JSON.stringify({
              success: false,
              code: status,
              message: msg || 'Không thể kết nối đến Gemini API.',
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
          const { parts, apiKey: clientApiKey, model: clientModel, provider = 'gemini', baseUrl } = JSON.parse(body || '{}');
          const cleanClientKey = sanitizeKey(clientApiKey);

          try {
            if (!parts || !Array.isArray(parts)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Dữ liệu không hợp lệ.' }));
              return;
            }

            // --- DEEPSEEK PROVIDER ---
            if (provider === 'deepseek') {
              const cleanKey = sanitizeKey(clientApiKey) || process.env.DEEPSEEK_API_KEY;
              if (!cleanKey) {
                res.statusCode = 401;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  error: 'Chưa có DeepSeek API Key. Vui lòng bấm nút API > chọn tab DeepSeek để nhập key.',
                }));
                return;
              }

              const cleanUrl = sanitizeBaseUrl(baseUrl);
              const selectedModel = (clientModel === 'deepseek-flash' || !clientModel) ? 'deepseek-chat' : clientModel;
              const promptText = parts.filter((p: any) => p.text).map((p: any) => p.text).join('\n') || 'Chỉnh sửa ảnh thẻ chuyên nghiệp';

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
              res.setHeader('Content-Type', 'application/json');

              if (!deepseekRes.ok) {
                const msg = data?.error?.message || data?.message || `Lỗi DeepSeek (${deepseekRes.status})`;
                res.statusCode = deepseekRes.status;
                res.end(JSON.stringify({ error: msg }));
                return;
              }

              const replyContent = data.choices?.[0]?.message?.content || '';
              const imgMatch = replyContent.match(/!\[.*?\]\((https?:\/\/.*?)\)/) || replyContent.match(/(https?:\/\/[^\s)]+\.(?:png|jpg|jpeg|webp))/i);

              if (imgMatch) {
                res.statusCode = 200;
                res.end(JSON.stringify({ imageUrl: imgMatch[1], text: replyContent }));
                return;
              }

              res.statusCode = 200;
              res.end(JSON.stringify({
                imageUrl: null,
                text: replyContent,
                message: 'DeepSeek Flash đã phân tích yêu cầu tạo ảnh thẻ thành công. Lưu ý: DeepSeek là mô hình ngôn ngữ (LLM); để render trực tiếp pixel ảnh thẻ, bạn hãy chuyển sang tab Google Gemini (model gemini-3.1-flash-lite-image).',
              }));
              return;
            }

            // --- GEMINI PROVIDER ---
            const effectiveKey = cleanClientKey || process.env.GEMINI_API_KEY || process.env.API_KEY;

            if (!effectiveKey) {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                error: 'Chưa có Gemini API Key. Vui lòng bấm nút API ở góc trên bên phải để thêm API Key của bạn hoặc thiết lập biến môi trường.',
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
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                error: textOutput || 'Không tạo được ảnh từ AI. Vui lòng thử lại.',
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
            if (rawMsg.includes('ACCESS_TOKEN_TYPE_UNSUPPORTED') || (cleanClientKey && (cleanClientKey.startsWith('AQ.') || cleanClientKey.startsWith('ya29.')))) {
              friendlyMsg = 'Key bạn nhập bắt đầu bằng "AQ." là Access Token tạm thời, không phải Gemini API Key. Google AI Studio chỉ chấp nhận API Key chuẩn bắt đầu bằng "AIzaSy...". Vui lòng tạo key tại https://aistudio.google.com/app/apikey.';
            } else if (rawMsg.includes('free_tier') || rawMsg.includes('limit: 0') || status === 429) {
              friendlyMsg = 'Lỗi 429: Key đang dùng thuộc gói Free Tier (hạn mức model tạo ảnh là 0 lượt/phút). Để tạo ảnh, tài khoản Google của Key cần bật Billing (Pay-as-you-go) tại https://aistudio.google.com.';
            } else if (rawMsg.includes('API_KEY_INVALID') || status === 400 || status === 403 || rawMsg.includes('UNAUTHENTICATED')) {
              friendlyMsg = 'Lỗi xác thực: API Key không hợp lệ. Vui lòng kiểm tra lại key (Gemini API Key thường bắt đầu bằng "AIzaSy...").';
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
    },
  },
});
