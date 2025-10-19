require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*' })); // Allow extension calls
app.use(express.json({ limit: '10mb' })); // For image data

// MongoDB Connect
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Schema for Shares (persistent storage)
const ShareSchema = new mongoose.Schema({
  text: String,
  imageBase64: String,
  alt: String,
  createdAt: { type: Date, default: Date.now }
});
const Share = mongoose.model('Share', ShareSchema);

// Routes

// Health Check
app.get('/health', (req, res) => res.send('OK'));

// Proxy Image Generation (hides Stability key)
app.post('/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await axios.post('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
      text_prompts: [{ text: prompt }],
      height: 1024, width: 1024, steps: 20, seed: Math.random() * 1000
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`
      }
    });
    const base64Image = response.data.artifacts[0].base64;
    res.json({ image: `data:image/png;base64,${base64Image}` });
  } catch (error) {
    console.error('Image gen error:', error);
    res.status(500).json({ error: 'Image generation failed' });
  }
});

// Optional: Cloud Mood/Text Gen Fallback (using OpenAI if provided)
app.post('/analyze-mood', async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ error: 'OpenAI key not set' });
    }
    const gptResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `Analyze mood (positive/negative/neutral) and style (formal/casual) of: "${transcript}". Respond as JSON: {"mood": "...", "style": "..."}` }]
    }, {
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
    });
    const analysis = JSON.parse(gptResponse.data.choices[0].message.content);
    res.json(analysis);
  } catch (error) {
    console.error('Mood analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Share Content (store & return QR)
app.post('/share', async (req, res) => {
  try {
    const { text, imageBase64, alt } = req.body;
    const newShare = new Share({ text, imageBase64, alt });
    await newShare.save();
    const shareId = newShare._id;
    const shareUrl = `${req.protocol}://${req.get('host')}/share/${shareId}`; // e.g., vercel.app/share/abc123

    // Generate QR
    const qrDataUrl = await QRCode.toDataURL(shareUrl);

    res.json({ shareUrl, qrDataUrl, id: shareId });
  } catch (error) {
    console.error('Share error:', error);
    res.status(500).json({ error: 'Share failed' });
  }
});

// Get Share (public view)
app.get('/share/:id', async (req, res) => {
  try {
    const share = await Share.findById(req.params.id);
    if (!share) return res.status(404).json({ error: 'Not found' });
    res.json(share);
  } catch (error) {
    res.status(500).json({ error: 'Fetch failed' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));