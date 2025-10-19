require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json({limit: '10mb'}));

/**
 * DEBUGGING: improved logging and more robust JSON extraction.
 * Make sure to restart the server after saving.
 */

// --- 1. Language & Mood Detection (OpenAI) ---
app.post('/api/analyze', async (req, res) => {
  const { text } = req.body;
  console.log('[api/analyze] incoming text:', text);
  try {
    const prompt = `ONLY respond with a single JSON object and nothing else. Analyze the following text for language (English, Tamil, etc.) and mood (Positive, Negative, Neutral). Respond exactly as:
{"language":"...","mood":"..."}
Text: """${text}"""`;
    const resp = await openaiChat(prompt);
    console.log('[api/analyze] raw OpenAI content:', resp);
    const json = extractJSON(resp);
    console.log('[api/analyze] parsed JSON:', json);
    // If extracted but empty fields, still return what's parsed
    res.json(json);
  } catch (e) {
    console.error('[api/analyze] error:', e);
    res.json({ language: "", mood: "" });
  }
});

// --- 2. Simplified Text, Prompt, Alt Text (OpenAI) ---
app.post('/api/generate_text', async (req, res) => {
  const { text } = req.body;
  console.log('[api/generate_text] text:', text);
  try {
    const prompt = `ONLY respond with a single JSON object and nothing else. Given: "${text}". Provide:
{"simplified":"...", "prompt":"...", "alt_text":"..."}
Return valid JSON only.`;
    const resp = await openaiChat(prompt);
    console.log('[api/generate_text] raw OpenAI content:', resp);
    const json = extractJSON(resp);
    console.log('[api/generate_text] parsed JSON:', json);
    res.json(json);
  } catch (e) {
    console.error('[api/generate_text] error:', e);
    res.json({ simplified: "", prompt: "", alt_text: "" });
  }
});

// --- 3. Image Generation (Replicate Stable Diffusion) ---
app.post('/api/generate_image', async (req, res) => {
  const { prompt } = req.body;
  console.log('[api/generate_image] prompt:', prompt);
  try {
    const replicateResp = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "a9758cb6e1c7ba4aab1cfae7a6b2da9b0f4dbfcbca4be6f7c0e0e1b7b6a4e1a8",
        input: { prompt }
      })
    });
    const replicateJson = await replicateResp.json();
    console.log('[api/generate_image] replicate initial response:', JSON.stringify(replicateJson, null, 2));
    const { id } = replicateJson;
    let status = "starting", image_url = "";
    while (status !== "succeeded" && status !== "failed") {
      await new Promise(r => setTimeout(r, 2000));
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: { "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}` }
      });
      const pollData = await poll.json();
      console.log('[api/generate_image] poll data:', pollData.status);
      status = pollData.status;
      if (status === "succeeded") image_url = pollData.output[0];
      if (status === "failed") console.error('[api/generate_image] replicate failed', pollData);
    }
    res.json({ image_url });
  } catch (e) {
    console.error('[api/generate_image] error:', e);
    res.json({ image_url: "https://via.placeholder.com/400x300?text=Error" });
  }
});

// --- 4. Image Captioning (HuggingFace BLIP) ---
app.post('/api/caption_image', async (req, res) => {
  const { image_url } = req.body;
  console.log('[api/caption_image] image_url:', image_url);
  try {
    const hfResp = await fetch("https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.HF_API_TOKEN}` },
      body: JSON.stringify({ inputs: image_url })
    });
    const result = await hfResp.json();
    console.log('[api/caption_image] hf result:', JSON.stringify(result, null, 2));
    const caption = Array.isArray(result) ? result[0]?.generated_text : (result?.generated_text || "");
    res.json({ caption });
  } catch (e) {
    console.error('[api/caption_image] error:', e);
    res.json({ caption: "" });
  }
});

// --- OpenAI Chat Helper with logging ---
async function openaiChat(prompt) {
  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0
      })
    });
    const data = await resp.json();
    console.log('[openaiChat] full response object:', JSON.stringify(data, null, 2));
    return data.choices?.[0]?.message?.content || "";
  } catch (e) {
    console.error('[openaiChat] fetch error:', e);
    throw e;
  }
}

// Improved extractJSON: logs when parsing fails and returns {} on failure
function extractJSON(resp) {
  if (!resp || typeof resp !== 'string') return {};
  try {
    const match = resp.match(/\{[\s\S]*\}/);
    if (match) {
      const jsonText = match[0];
      return JSON.parse(jsonText);
    }
    // Last attempt: try to parse entire string (maybe it is exactly JSON)
    return JSON.parse(resp);
  } catch (err) {
    console.error('[extractJSON] parsing error:', err, 'raw response:', resp);
    return {};
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));