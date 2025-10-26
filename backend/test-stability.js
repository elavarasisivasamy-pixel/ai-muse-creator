require('dotenv').config();
const axios = require('axios');

async function testStability() {
  const prompt = 'A red apple on a table';  // Simple test prompt
  const requestBody = {
    text_prompts: [
      { text: prompt, weight: 1.0 },
      { text: 'blurry, lowres, deformed', weight: -1.0 }
    ],
    cfg_scale: 7,
    height: 1024,
    width: 1024,
    samples: 1,
    steps: 20
  };
  console.log('JSON body:', JSON.stringify(requestBody));

  try {
    const response = await axios.post('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`
      }
    });
    console.log('Success! Image base64 length:', response.data.artifacts[0].base64.length);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testStability();