import express, { Router } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Enable CORS for microservice cross-origin calls
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Create API Router for microservice endpoints
const apiRouter = Router();

// MICROSERVICE REST API v1 ENDPOINTS
apiRouter.get('/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'generator-doc-gost',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    capabilities: [
      'gost_document_generation',
      'auto_registration',
      'department_code_resolution',
      'employee_database',
      'ai_document_assistant'
    ]
  });
});

apiRouter.get('/v1/spec', (req, res) => {
  res.json({
    service: 'generator-doc-gost microservice',
    description: 'Микросервис автоматического генератора и реестра документов по ГОСТ АО НПО Тепломаш',
    version: '1.0.0',
    endpoints: {
      'GET /api/v1/health': 'Проверка работоспособности сервиса',
      'POST /api/ai-text': 'Генерация/редактирование текста документа через ИИ',
      'GET /api/v1/spec': 'Спецификация интеграционного контракта микросервиса'
    },
    microfrontend: {
      postMessageEvents: ['INIT_DOCUMENT', 'GET_DOCUMENT', 'REGISTER_DOCUMENT', 'PING', 'RETURN_TO_PORTAL'],
      emittedEvents: ['MICROSERVICE_READY', 'DOCUMENT_CHANGED', 'DOCUMENT_REGISTERED', 'RETURN_TO_PORTAL', 'PONG']
    }
  });
});

// API endpoint for AI business document text generation
apiRouter.post('/ai-text', async (req, res) => {
  try {
    const { prompt, currentContent, docType } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ 
        error: 'GEMINI_API_KEY is missing',
        fallback: true 
      });
    }

    const ai = new GoogleGenAI({ 
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Вы — профессиональный корпоративный юрист и секретарь высшей категории.
Напишите или отредактируйте текст для официального документа организации в соответствии со стандартами делового стиля и ГОСТ Р 7.0.97-2016.

Вид документа: ${docType || 'Официальное письмо'}
Задача от пользователя: ${prompt}
Текущий контекст: ${currentContent || 'Нет'}

Требования:
- Верните только HTML-фрагмент с абзацами <p>Текст...</p> без лишних пояснений или блоков markdown.
- Используйте вежливые официальные формулировки (например, "Довожу до Вашего сведения", "Прошу Вас рассмотреть", "Настоящим извещаем").
- Текст должен быть структурированным, грамотным и готовым к распечатке.`
    });

    const generatedText = response.text || '';
    res.json({ text: generatedText.replace(/```html/g, '').replace(/```/g, '').trim() });
  } catch (error: any) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ error: error.message || 'Server error', fallback: true });
  }
});

// Mount API router under both /api and /docgen/api (supporting both stripped and non-stripped proxy setups)
app.use('/api', apiRouter);
app.use('/docgen/api', apiRouter);

// Vite Middleware & Production static serving setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use('/docgen', express.static(distPath));
    app.use(express.static(distPath));
    
    app.get(['/docgen*', '*'], (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
