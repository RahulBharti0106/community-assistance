import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.NODE_ENV !== 'production') {
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  try {
    require('dotenv').config({ path: '.env.local' });
  } catch (e) {}
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  let genAI = null;
  let model = null;

  function getModel() {
    if (!model) {
      if (!process.env.GEMINI_KEY && !process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_KEY environment variable is missing.");
      }
      genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY || process.env.GEMINI_API_KEY);
      model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }
    return model;
  }

  app.post('/api/analyze', async (req, res) => {
    try {
      const aiModel = getModel();
      const { base64, mimeType } = req.body;
      
      if (!base64 || !mimeType) {
        return res.status(400).json({ error: 'base64 and mimeType are required' });
      }

      const prompt = `Analyze this image of a community infrastructure issue.
Return valid JSON only — no markdown, no backticks, no explanation.
Schema:
{
  "category": "pothole" | "streetlight" | "water_leak" | "waste" | "other",
  "severity": "critical" | "moderate" | "minor",
  "title": "string — max 10 words",
  "description": "string — 2 to 3 sentences describing the issue clearly",
  "urgency_reason": "string — one sentence explaining the severity rating",
  "action_recommendation": "string — one sentence recommending next action for authorities"
}`;

      const image = {
        inlineData: {
          data: base64,
          mimeType
        }
      };

      const result = await aiModel.generateContent([prompt, image]);
      const responseText = result.response.text();
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      res.status(200).json(parsed);
    } catch (error) {
      console.error('Error analyzing image:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/duplicate-check', async (req, res) => {
    try {
      const aiModel = getModel();
      const { newTitle, newDescription, existingTitle, existingDescription } = req.body;
      
      if (!newTitle || !newDescription || !existingTitle || !existingDescription) {
        return res.status(400).json({ error: 'All four fields are required' });
      }

      const prompt = `You are a duplicate detection system for civic issue reports.

New report:
Title: ${newTitle}
Description: ${newDescription}
Existing report:
Title: ${existingTitle}
Description: ${existingDescription}

Are these describing the same physical issue at the same location?
Return valid JSON only — no markdown, no explanation:
{"duplicate": true | false, "confidence": 0.0–1.0, "reason": "one sentence"}`;

      const result = await aiModel.generateContent(prompt);
      const responseText = result.response.text();
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      res.status(200).json(parsed);
    } catch (error) {
      console.error('Error checking duplicate:', error);
      res.status(500).json({ error: error.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, '..', 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
