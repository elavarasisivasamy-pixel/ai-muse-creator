// server.js - Fully ESM-Compatible Fix
import 'dotenv/config';  // Loads .env vars into process.env
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js'; // Optional for Supabase


const app = express();
app.use(cors());
app.use(express.json());
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
// Optional: Supabase (comment out if not using)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Language Detection Setup (Async, Lazy-Loaded)
let langDetector = null;
async function initLangDetector() {
  if (langDetector === null) {
    // Optional: Set cache dir
    // env.cacheDir = './.cache';
    
    langDetector = await pipeline('text-classification', 'papluca/xlm-roberta-base-language-detection');
    console.log('Language detector loaded!');
  }
  return langDetector;
}

async function detectLanguage(text) {
  try {
    await initLangDetector();
    const result = await langDetector(text, { topk: 1 });
    return result[0].label; // e.g., 'en'
  } catch (err) {
    console.error('Lang detection error:', err);
    return 'en'; // Fallback
  }
}

app.post('/api/generate-prompt', async (req, res) => {
  try {
    const { text, lang, mood } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text required' });
    }

    // Detect lang if not provided
    const detectedLang = lang || await detectLanguage(text);

    const systemPrompt = `Based on this ${mood || 'neutral'} text in ${detectedLang}: "${text}". Create a vivid image prompt for AI generation.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: systemPrompt }]
    });

    res.json({
      prompt: completion.choices[0].message.content,
      detectedLang
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt required' });
    }

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024'
    });

    let imageUrl = response.data[0].url;

    // Optional Supabase upload (uncomment if needed)
    // const blob = await (await fetch(imageUrl)).blob();
    // const fileName = `muse-${Date.now()}.png`;
    // const { error } = await supabase.storage.from('images').upload(fileName, blob);
    // if (error) throw error;
    // const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName);
    // imageUrl = urlData.publicUrl;

    res.json({ imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);
  // Optional: Pre-init detector to avoid delay on first request
  // initLangDetector();
});