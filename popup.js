// Stability AI Key - Replace with your own (free signup: stability.ai)
const STABILITY_API_KEY = 'sk-5vLZtz92mPu0wIkvocdthdNl3ImZsFQO6mThzfT7G5tvuTyj'; // Add your key here!

let recognition, transcript = '', mood = '', detectedLang = '', refinedText = '', imageSrc = '', currentImage = null;
const outputTextEl = document.getElementById('output-text');
const outputImageEl = document.getElementById('output-image');
const altTextEl = document.getElementById('alt-text');
const langMoodEl = document.getElementById('lang-mood');
const uploadGridEl = document.getElementById('upload-grid');

// Feature 1: Voice Recognition + Lang Check (Feature 2)
document.getElementById('mic-btn').addEventListener('click', () => {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US'; // Start with English, auto-detect later
  recognition.onresult = async (event) => {
    transcript = event.results[0][0].transcript;
    document.getElementById('transcript').textContent = `Heard: ${transcript}`;
    
    // Lang Check with Translator API (built-in)
    if (window.ai && window.ai.translator) {
      const langDetect = await window.ai.translator.detectLanguage(transcript);
      detectedLang = langDetect.language || 'en';
      if (detectedLang !== 'en') {
        const translation = await window.ai.translator.translate(transcript, 'en');
        transcript = translation.text;
      }
    }
    // Mic button
document.getElementById('mic-btn').addEventListener('click', () => {
  document.getElementById('container').classList.add('loading');
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.onresult = async (event) => {
    // ... existing code ...
    document.getElementById('container').classList.remove('loading');
  };
  recognition.onerror = () => {
    alert('Mic error—check permissions.');
    document.getElementById('container').classList.remove('loading');
  };
  recognition.start();
});
recognition.onerror = (event) => {
  document.getElementById('container').classList.remove('loading');
  let errorMsg = 'Microphone error. Please try again.';
  if (event.error === 'not-allowed') {
    errorMsg = 'Microphone access denied. Please allow microphone access in Chrome settings (chrome://settings/content/microphone) and try again.';
  } else if (event.error === 'no-speech') {
    errorMsg = 'No speech detected. Try speaking closer to the microphone.';
  } else if (event.error === 'audio-capture') {
    errorMsg = 'No microphone found. Please connect a microphone and try again.';
  }
  alert(errorMsg);
  document.getElementById('transcript').textContent = errorMsg;
};
// After recognition.onerror block
recognition.onerror = (event) => {
  document.getElementById('container').classList.remove('loading');
  let errorMsg = 'Microphone error. Please try again.';
  if (event.error === 'not-allowed') {
    errorMsg = 'Microphone access denied. Please allow microphone access in Chrome settings (chrome://settings/content/microphone) and try again.';
    document.getElementById('retry-mic-btn').style.display = 'block';
  } else if (event.error === 'no-speech') {
    errorMsg = 'No speech detected. Try speaking closer to the microphone.';
  } else if (event.error === 'audio-capture') {
    errorMsg = 'No microphone found. Please connect a microphone and try again.';
  }
  alert(errorMsg);
  document.getElementById('transcript').textContent = errorMsg;
};

// Add retry button listener
document.getElementById('retry-mic-btn').addEventListener('click', () => {
  document.getElementById('retry-mic-btn').style.display = 'none';
  document.getElementById('mic-btn').click();
});
// Generate button
document.getElementById('generate-btn').addEventListener('click', async () => {
  document.getElementById('container').classList.add('loading');
  // ... existing generate code ...
  document.getElementById('container').classList.remove('loading');
});
    // Mood Detection (Feature 2) with Prompt API (Gemini Nano)
    if (window.ai && window.ai.languageModel) {
      const session = await window.ai.languageModel.createSession({ model: 'nano' });
      const moodPrompt = `Analyze mood (positive/negative/neutral) and style (formal/casual) of: "${transcript}". Respond as JSON: {"mood": "...", "style": "..."}`;
      const response = await session.prompt(moodPrompt);
      const analysis = JSON.parse(response.text);
      mood = analysis.mood;
      langMoodEl.textContent = `Lang: ${detectedLang} | Mood: ${mood} (${analysis.style})`;
    }
    
    document.getElementById('generate-btn').disabled = false;
  };
  recognition.onerror = () => alert('Mic error—check permissions.');
  recognition.start();
});

// Feature 3: Generate Button
document.getElementById('generate-btn').addEventListener('click', async () => {
  // Simplified Text with Writer API (or Prompt fallback)
  let textPrompt = `Rewrite "${transcript}" in simple, engaging way for ${mood} mood.`;
  if (window.ai && window.ai.writer) {
    refinedText = await window.ai.writer.generate(textPrompt, { style: 'concise' });
  } else {
    // Fallback to Prompt API
    const session = await window.ai.languageModel.createSession({ model: 'nano' });
    refinedText = await session.prompt(textPrompt);
  }
  outputTextEl.value = refinedText;

  // Image Prompt from Text
  const imgPromptPrompt = `Create vivid image prompt from ${mood} text: "${refinedText}". Style: digital art.`;
  const imgPrompt = await (await window.ai.languageModel.createSession()).prompt(imgPromptPrompt);

  // Generate Image via Stability AI
  const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${STABILITY_API_KEY}`
    },
    body: JSON.stringify({
      text_prompts: [{ text: imgPrompt.text }],
      height: 1024, width: 1024, steps: 20, seed: 42
    })
  });
  const data = await response.json();
  imageSrc = `data:image/png;base64,${data.artifacts[0].base64}`;
  outputImageEl.src = imageSrc;
  outputImageEl.style.display = 'block';
  currentImage = imageSrc;

  // Auto Alt Text with Summarizer API
  if (window.ai && window.ai.summarizer) {
    const alt = await window.ai.summarizer.summarize(imgPrompt.text, { length: 'short' });
    altTextEl.textContent = `Alt: ${alt.summary}`;
    outputImageEl.alt = alt.summary;
  } else {
    altTextEl.textContent = 'Alt: Generated from voice mood.';
  }

  // Show post-gen UI (Feature 4)
  document.getElementById('regenerate-btn').style.display = 'block';
  document.getElementById('edit-mic-btn').style.display = 'block';
  document.getElementById('share-btn').style.display = 'block';
});

// Feature 4: Post-Gen Regenerate
document.getElementById('regenerate-btn').addEventListener('click', () => {
  // Reuse generate logic with mood tweak
  mood = mood === 'positive' ? 'negative' : 'positive'; // Simple toggle
  document.getElementById('generate-btn').click();
});

// Feature 5: Voice Edit for Image
document.getElementById('edit-mic-btn').addEventListener('click', async () => {
  // Reuse recognition for edit command
  const editRec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  editRec.onresult = async (event) => {
    const editCmd = event.results[0][0].transcript;
    
    // Parse edit with Prompt API
    const session = await window.ai.languageModel.createSession();
    const editPrompt = `Parse image edit from: "${editCmd}". Return JSON: {"action": "brightness|contrast|color", "value": "increase|decrease by 20%"}`;
    const editParams = JSON.parse(await session.prompt(editPrompt));
    
    // Apply via Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width; canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        // Simple brightness adjust (extend for others)
        if (editParams.action === 'brightness') {
          data[i] *= editParams.value.includes('increase') ? 1.2 : 0.8; // R,G,B
          data[i+1] *= editParams.value.includes('increase') ? 1.2 : 0.8;
          data[i+2] *= editParams.value.includes('increase') ? 1.2 : 0.8;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      currentImage = canvas.toDataURL();
      outputImageEl.src = currentImage;
    };
    img.src = currentImage;
  };
  editRec.start();
});

// Feature 6: Upload Grid (Optional)
document.getElementById('upload-btn').addEventListener('click', () => {
  document.getElementById('upload-input').click();
});
document.getElementById('upload-input').addEventListener('change', (e) => {
  uploadGridEl.innerHTML = '';
  Array.from(e.target.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.createElement('img');
      img.src = ev.target.result;
      img.onclick = () => { currentImage = img.src; outputImageEl.src = img.src; }; // Select for edit
      uploadGridEl.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

// Feature 7: QR Share
document.getElementById('share-btn').addEventListener('click', () => {
  const shareData = { text: refinedText, image: imageSrc, alt: outputImageEl.alt };
  const shareUrl = `data:text/json;base64,${btoa(JSON.stringify(shareData))}`; // Simple data URL
  QRCode.toCanvas(document.getElementById('qr-canvas'), shareUrl, { width: 200 });
  document.getElementById('qr-canvas').style.display = 'block';
});