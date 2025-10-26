// test-key.js
import 'dotenv/config';
import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ No OPENAI_API_KEY in .env');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testAPI() {
  try {
    console.log('🧪 Testing OpenAI API...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Say hello!' }]
    });
    console.log('✅ Success! Response:', completion.choices[0].message.content);
  } catch (err) {
    console.error('❌ Test failed:', {
      message: err.message,
      status: err.status || 'N/A',
      code: err.code || 'N/A'
    });
  }
}

testAPI();