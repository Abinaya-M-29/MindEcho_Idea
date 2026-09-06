import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// 1. Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured. Please set your Gemini API key in the AI Studio Settings panel.');
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// Resilient Model Fallback Ladder
const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-2.5-flash',
];

const RECOVERABLE_CODES = [503, 429, 404, 500];

async function generateWithFallback<T>(
  promptFn: (ai: GoogleGenAI, model: string) => Promise<T>
): Promise<T> {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of FALLBACK_MODELS) {
    try {
      return await promptFn(ai, model);
    } catch (err: any) {
      lastError = err;
      const statusCode = err?.status || err?.statusCode || (err?.message?.includes('503') ? 503 : (err?.message?.includes('429') ? 429 : 0));
      console.warn(`[Gemini Fallback] Model ${model} failed with code ${statusCode || 'unknown'}: ${err.message}. Retrying next model...`);
      if (statusCode && !RECOVERABLE_CODES.includes(Number(statusCode))) {
        // Continue to fallback anyway to guarantee best-effort resilience
      }
    }
  }
  throw lastError || new Error('All fallback models exhausted.');
}

// API Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
  });
});

// API Multi-turn Reflection Endpoint
app.post('/api/reflect', async (req, res) => {
  try {
    // Defensive payload ingestion (Null-Safe Destructuring)
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const conversationHistory = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return res.status(400).json({ error: 'Journal reflection message is required.' });
    }

    const systemInstruction = `You are MindEcho, an intelligent, empathetic, and compassionate psychological reflection companion.
Your goal is to actively listen, gently validate emotions, offer mindfulness insights, and guide the user through deeper self-discovery.
Always return structured responses that:
1. Provide a warm, meaningful reflection (2-4 brief, grounded paragraphs, with 1-2 open-ended questions).
2. Extract 2-4 primary mood/thematic tags describing emotional state (e.g. ['Mindful', 'Productive', 'Grateful', 'Anxious', 'Hopeful', 'Vulnerable', 'Overwhelmed', 'Restless', 'Determined']).
3. Identify dominant sentiment (e.g. 'Reflective', 'Optimistic', 'Vulnerable', 'Calm', 'Stressed', 'Motivated').`;

    // Construct conversation context
    const contents: any[] = [];
    for (const item of conversationHistory.slice(-10)) {
      if (item && item.role && item.text) {
        contents.push({
          role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
          parts: [{ text: item.text }],
        });
      }
    }
    // Add current user turn
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const result = await generateWithFallback(async (ai, model) => {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: 'Empathetic, compassionate reflection response to the user.',
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 4 primary mood or thematic tags.',
              },
              sentiment: {
                type: Type.STRING,
                description: 'Dominant emotional sentiment.',
              },
            },
            required: ['reply', 'tags', 'sentiment'],
          },
        },
      });

      const text = response.text || '';
      try {
        return JSON.parse(text);
      } catch (parseError) {
        return {
          reply: text || 'Thank you for sharing your thoughts today.',
          tags: ['Reflective', 'Mindful'],
          sentiment: 'Reflective',
        };
      }
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error in /api/reflect:', error);
    let errorMessage = 'Failed to process reflection with Gemini.';
    if (error?.message) {
      try {
        const parsed = JSON.parse(error.message);
        errorMessage = parsed?.error?.message || error.message;
      } catch {
        errorMessage = error.message;
      }
    }
    return res.status(500).json({
      error: errorMessage,
    });
  }
});

// API Voice/Audio Transcription & Reflection Endpoint
app.post('/api/transcribe-reflect', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const audioBase64 = typeof body.audioBase64 === 'string' ? body.audioBase64 : '';
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'audio/webm';
    const conversationHistory = Array.isArray(body.history) ? body.history : [];

    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is required.' });
    }

    // Clean base64 string: robustly strip any data URI prefix regardless of codecs or parameters
    let cleanBase64 = audioBase64.trim();
    if (cleanBase64.includes(';base64,')) {
      cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(';base64,') + 8);
    } else if (cleanBase64.startsWith('data:') && cleanBase64.includes(',')) {
      cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(',') + 1);
    }
    // Remove any whitespace, newlines, or carriage returns
    cleanBase64 = cleanBase64.replace(/[\r\n\s]+/g, '');

    if (!cleanBase64) {
      return res.status(400).json({ error: 'Valid audio data is required.' });
    }

    // Sanitize MIME type for Gemini inlineData (strip parameters like ;codecs=opus)
    let cleanMimeType = (typeof mimeType === 'string' && mimeType ? mimeType : 'audio/webm')
      .split(';')[0]
      .trim()
      .toLowerCase();

    // If data URI had a mimeType header, extract it if valid
    const uriMatch = audioBase64.match(/^data:([^;,]+)/);
    if (uriMatch && uriMatch[1]) {
      cleanMimeType = uriMatch[1].split(';')[0].trim().toLowerCase();
    }
    if (!cleanMimeType) {
      cleanMimeType = 'audio/webm';
    }

    const systemInstruction = `You are MindEcho, an empathetic, compassionate psychological reflection companion.
The user has provided an audio journal voice entry.
1. Accurately transcribe everything spoken in the audio without skipping or summarizing what was said.
2. Provide a warm, mindful reflection exploring their emotions, validating their experience, and offering 1-2 open-ended deepening prompts.
3. Extract 2-4 primary mood/thematic tags from what was spoken.
4. Identify the dominant emotional sentiment.`;

    const contents: any[] = [];
    for (const item of conversationHistory.slice(-6)) {
      if (item && item.role && item.text) {
        contents.push({
          role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
          parts: [{ text: item.text }],
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType: cleanMimeType,
            data: cleanBase64,
          },
        },
        {
          text: 'Please transcribe my spoken voice journal entry accurately and provide your empathetic reflection, mood tags, and sentiment.',
        },
      ],
    });

    const result = await generateWithFallback(async (ai, model) => {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcription: {
                type: Type.STRING,
                description: 'Accurate and complete verbatim transcription of the user spoken audio.',
              },
              reply: {
                type: Type.STRING,
                description: 'Empathetic and compassionate reflection response to the audio journal.',
              },
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 4 primary mood or thematic tags.',
              },
              sentiment: {
                type: Type.STRING,
                description: 'Dominant emotional sentiment.',
              },
            },
            required: ['transcription', 'reply', 'tags', 'sentiment'],
          },
        },
      });

      const text = response.text || '';
      try {
        return JSON.parse(text);
      } catch (parseErr) {
        return {
          transcription: 'Audio processed.',
          reply: text,
          tags: ['Audio Entry', 'Reflective'],
          sentiment: 'Reflective',
        };
      }
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error in /api/transcribe-reflect:', error);
    let errorMessage = 'Failed to transcribe and reflect on audio with Gemini.';
    if (error?.message) {
      try {
        const parsed = JSON.parse(error.message);
        errorMessage = parsed?.error?.message || error.message;
      } catch {
        errorMessage = error.message;
      }
    }
    return res.status(500).json({
      error: errorMessage,
    });
  }
});

// API Weekly Insight & Emotion Synthesis Summary
app.post('/api/weekly-summary', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const sessions = Array.isArray(body.sessions) ? body.sessions : [];

    if (sessions.length === 0) {
      return res.status(400).json({ error: 'At least one reflection session is required to generate a summary.' });
    }

    const systemInstruction = `You are MindEcho's Master Psychological Synthesizer.
Analyze the user's recent journal entries and emotional reflections.
Provide a high-empathy, structured weekly synthesis with deep insight into their emotional trajectory.
Return a structured JSON object with:
1. overallVibe: A poetic, inspiring 3-6 word description of their weekly emotional landscape.
2. summary: A 2-3 paragraph empathetic synthesis of what they experienced, validated with warmth and perspective.
3. emotionalPatterns: 3 to 5 notable emotional rhythms or behavioral triggers identified across their entries.
4. growthMilestones: 2 to 4 positive self-compassion breakthroughs, achievements, or moments of clarity to celebrate.
5. selfCareActions: 3 gentle, concrete mindfulness or self-care micro-habits tailored to their current headspace.`;

    const contextText = sessions
      .slice(0, 15)
      .map((s, idx) => {
        const title = s.title || `Entry #${idx + 1}`;
        const date = s.updatedAt || s.createdAt || 'Recent';
        const tags = Array.isArray(s.tags) ? s.tags.join(', ') : 'None';
        const userTexts = (s.messages || [])
          .filter((m: any) => m.role === 'user')
          .map((m: any) => m.text)
          .join('\n');
        return `[Session ${idx + 1} - "${title}" (${date}) | Tags: ${tags}]\nUser Wrote:\n${userTexts}`;
      })
      .join('\n\n---\n\n');

    const result = await generateWithFallback(async (ai, model) => {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Here are my recent journal reflections. Please synthesize my weekly emotional landscape:\n\n${contextText}`,
              },
            ],
          },
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallVibe: {
                type: Type.STRING,
                description: 'Poetic 3-6 word description of emotional landscape.',
              },
              summary: {
                type: Type.STRING,
                description: '2-3 paragraph empathetic synthesis.',
              },
              emotionalPatterns: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 to 5 notable emotional rhythms.',
              },
              growthMilestones: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2 to 4 celebrated personal breakthroughs.',
              },
              selfCareActions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 concrete micro-habits or self-care practices.',
              },
            },
            required: ['overallVibe', 'summary', 'emotionalPatterns', 'growthMilestones', 'selfCareActions'],
          },
        },
      });

      const text = response.text || '';
      try {
        return JSON.parse(text);
      } catch (e) {
        return {
          overallVibe: 'Grounded & Deepening Awareness',
          summary: text || 'You have shown admirable dedication to observing your inner world this week.',
          emotionalPatterns: ['Consistently seeking clarity amidst daily commitments'],
          growthMilestones: ['Dedicated regular moments for mindful self-reflection'],
          selfCareActions: ['Take three conscious belly breaths before opening screens in the morning'],
        };
      }
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error in /api/weekly-summary:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate weekly insight summary.',
    });
  }
});

// Explicit API 404 Catch-All to prevent HTML Vite fallback from intercepting API calls
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint ${req.method} ${req.path} not found.` });
});

// Express API Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path.startsWith('/api')) {
    console.error('[API Error Catch-All]', err);
    return res.status(err.status || 500).json({
      error: err.message || 'An internal server error occurred while processing your request.',
    });
  }
  next(err);
});

// Vite middleware & Static asset serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

process.on('unhandledRejection', (reason) => {
  console.error('[Process Unhandled Rejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Process Uncaught Exception]', err);
});

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
