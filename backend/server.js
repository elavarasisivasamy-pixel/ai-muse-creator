
// server.js - Fully ESM-Compatible Fix
import 'dotenv/config';  // Loads .env vars into process.env
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import OpenAI from 'openai';
import path from 'path'
import { createClient } from '@supabase/supabase-js'; // Optional for Supabase
import { pipeline } from '@xenova/transformers';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(express.json({ limit: '10mb' }));  // Parses POST bodies
app.use(cors());
app.use(express.json());
export default app;
app.get('/health', (req, res) => res.send('OK'));

// Then in your async function (e.g., route handler):
async function handleRequest(req, res) {
  // ... lang detection code ...
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Or your preferred model.
      messages: [{ role: 'user', content: 'Your prompt here' }],
    });
    res.json({ result: completion.choices[0].message.content });
  } catch (error) {
    console.error('OpenAI error:', error);
    res.status(500).json({ error: 'AI generation failed' });
  }
}
// Optional: Supabase (comment out if not using)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Language Detection Setup (Async, Lazy-Loaded)
let langDetector;

async function initLangDetector() {
  if (!langDetector) {
    try {
      langDetector = await pipeline('text-classification', 'Xenova/distilbert-base-multilingual-cased-sentiment', { quantized: true });
      // Adjust the model if you're using a specific one for lang detection (e.g., 'papluca/xlm-roberta-base-language-detection').
    } catch (error) {
      console.error('Failed to init lang detector:', error);
      // Fallback: return null or a mock function.
    }
  }
  return langDetector;
}
async function detectLanguage(text) {
  const detector = await initLangDetector();
  if (!detector) return 'en'; // Fallback language.
  const result = await detector(text);
  return result[0].label; // Adjust based on your model's output.
}
app.post('/analyze-mood', async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: 'Transcript required' });

    // Mood analysis (rule-based fallback)
    let mood = 'neutral', style = 'casual';
    const positiveWords = ['happy', 'excited', 'good', 'great', 'love', 'awesome', 'joy', 'fun'];
    const negativeWords = ['sad', 'angry', 'bad', 'hate', 'terrible', 'fear', 'worried'];
    const lowerTranscript = transcript.toLowerCase();
    let score = 0;
    positiveWords.forEach((word) => { if (lowerTranscript.includes(word)) score += 1; });
    negativeWords.forEach((word) => { if (lowerTranscript.includes(word)) score -= 1; });
    mood = score > 0 ? 'positive' : (score < 0 ? 'negative' : 'neutral');
    style = lowerTranscript.includes('!') || lowerTranscript.includes('?') ? 'casual' : 'formal';

    res.json({ mood, style });
  } catch (error) {
    console.error('Mood analysis error:', error);
    res.status(500).json({ mood: 'neutral', style: 'casual' });
  }
});
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
