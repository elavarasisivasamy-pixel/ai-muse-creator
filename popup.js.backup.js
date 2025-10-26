// Backend URL - Update to Vercel after deploy
const BACKEND_URL = 'http://localhost:3000'; // Local dev

let recognition, transcript = '', mood = '', detectedLang = '', refinedText = '', imageSrc = '', currentImage = null;
const outputTextEl = document.getElementById('output-text');
const outputImageEl = document.getElementById('output-image');
const altTextEl = document.getElementById('alt-text');
const langMoodEl = document.getElementById('lang-mood');
const uploadGridEl = document.getElementById('upload-grid');

// Feature 1 & 2: Voice Recognition + Lang/Mood Detection
document.getElementById('mic-btn').addEventListener('click', () => {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  recognition.onresult = (event) => {  // No async - use .then for fetches
    transcript = event.results[0][0].transcript;
    document.getElementById('transcript').textContent = `Heard: ${transcript}`;
    
    // Lang Detection (sync fallback to 'en')
    detectedLang = 'en';
    if (window.ai && window.ai.translator) {
      // Assume sync or wrap if needed; skip await
      window.ai.translator.detectLanguage(transcript).then((langDetect) => {
        detectedLang = langDetect.language || 'en';
        if (detectedLang !== 'en') {
          window.ai.translator.translate(transcript, 'en').then((translation) => {
            transcript = translation.text;
            processMood();  // Chain to mood after lang
          });
        } else {
          processMood();
        }
      }).catch((e) => {
        console.warn('Lang detection failed:', e);
        processMood();
      });
    } else {
      processMood();
    }
    
    function processMood() {
      // Mood Detection (on-device first - assume sync or wrap)
      let analysis = { mood: 'neutral', style: 'casual' };
      if (window.ai && window.ai.languageModel) {
        window.ai.languageModel.createSession({ model: 'nano' }).then((session) => {
          const moodPrompt = `Analyze mood (positive/negative/neutral) and style (formal/casual) of: "${transcript}". Respond as JSON: {"mood": "...", "style": "..."}`;
          session.prompt(moodPrompt).then((response) => {
            analysis = JSON.parse(response.text);
            checkFallback();
          }).catch((e) => {
            console.warn('On-device mood failed:', e);
            checkFallback();
          });
        }).catch((e) => {
          console.warn('Session failed:', e);
          checkFallback();
        });
      } else {
        checkFallback();
      }
      
      function checkFallback() {
        if (analysis.mood === 'neutral') {
          fetch(`${BACKEND_URL}/analyze-mood`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript })
          }).then((fallbackRes) => fallbackRes.json())
            .then((data) => {
              analysis = data;
              finishMood();
            }).catch((e) => {
              console.warn('Backend mood failed:', e);
              finishMood();
            });
        } else {
          finishMood();
        }
      }
      
      function finishMood() {
        mood = analysis.mood;
        langMoodEl.textContent = `Lang: ${detectedLang} | Mood: ${mood} (${analysis.style})`;
        document.getElementById('generate-btn').disabled = false;
      }
    }
  };
  recognition.onerror = (e) => alert(`Mic error: ${e.error}`);
  recognition.start();
});

// Feature 3: Generate Text + Image + Alt
document.getElementById('generate-btn').addEventListener('click', () => {  // No async - use .then
  // Text Generation (on-device - wrap if needed)
  const textPrompt = `Rewrite "${transcript}" in simple, engaging way for ${mood} mood.`;
  refinedText = transcript;  // Fallback
  let genComplete = false;
  if (window.ai && window.ai.writer) {
    window.ai.writer.generate(textPrompt, { style: 'concise' }).then((result) => {
      refinedText = result;
      outputTextEl.value = refinedText;
      genComplete = true;
      proceedToImage();
    }).catch((e) => {
      console.warn('Writer failed:', e);
      outputTextEl.value = refinedText;
      genComplete = true;
      proceedToImage();
    });
  } else if (window.ai && window.ai.languageModel) {
    window.ai.languageModel.createSession({ model: 'nano' }).then((session) => {
      session.prompt(textPrompt).then((response) => {
        refinedText = response.text;
        outputTextEl.value = refinedText;
        genComplete = true;
        proceedToImage();
      }).catch((e) => {
        console.warn('Prompt for text failed:', e);
        outputTextEl.value = refinedText;
        genComplete = true;
        proceedToImage();
      });
    }).catch((e) => {
      console.warn('Session for text failed:', e);
      outputTextEl.value = refinedText;
      genComplete = true;
      proceedToImage();
    });
  } else {
    outputTextEl.value = refinedText;
    proceedToImage();
  }
  
  function proceedToImage() {
    // Image Prompt (on-device)
    const imgPromptPrompt = `Create vivid image prompt from ${mood} text: "${refinedText}". Style: digital art.`;
    let imgPromptText = 'A simple vibrant scene';
    if (window.ai && window.ai.languageModel) {
      window.ai.languageModel.createSession().then((session) => {
        session.prompt(imgPromptPrompt).then((response) => {
          imgPromptText = response.text;
          generateImage();
        }).catch((e) => {
          console.warn('Image prompt failed:', e);
          generateImage();
        });
      }).catch((e) => {
        console.warn('Session for image prompt failed:', e);
        generateImage();
      });
    } else {
      generateImage();
    }
  }
  
  function generateImage() {
    // Image via Backend - .then chain
    fetch(`${BACKEND_URL}/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: imgPromptText })
    }).then((imgRes) => imgRes.json())
      .then((imgData) => {
        imageSrc = imgData.image;
        outputImageEl.src = imageSrc;
        outputImageEl.style.display = 'block';
        currentImage = imageSrc;
        finishGen();
      }).catch((e) => {
        console.error('Image gen failed:', e);
        // Mock
        outputImageEl.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBzdHlsZT0iZmlsbDojNDI4NWY0Ii8+PHRleHQgeD0iMTAwIiB5PSIxMDUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QUkgSW1hZ2U8L3RleHQ+PC9zdmc+';
        outputImageEl.style.display = 'block';
        imageSrc = outputImageEl.src;
        currentImage = imageSrc;
        finishGen();
      });
  }
  
  function finishGen() {
    // Alt Text (on-device)
    if (window.ai && window.ai.summarizer) {
      window.ai.summarizer.summarize(imgPromptText, { length: 'short' }).then((alt) => {
        altTextEl.textContent = `Alt: ${alt.summary}`;
        outputImageEl.alt = alt.summary;
      }).catch((e) => {
        console.warn('Alt failed:', e);
      });
    } else {
      altTextEl.textContent = 'Alt: AI-generated from voice.';
      outputImageEl.alt = 'AI-generated image';
    }
    
    // Post-Gen UI
    document.getElementById('regenerate-btn').style.display = 'block';
    document.getElementById('edit-mic-btn').style.display = 'block';
    document.getElementById('share-btn').style.display = 'block';
  }
});

// Feature 4: Regenerate
document.getElementById('regenerate-btn').addEventListener('click', () => {
  mood = mood === 'positive' ? 'negative' : 'positive';
  langMoodEl.textContent = `Mood toggled to: ${mood}`;
  document.getElementById('generate-btn').click();  // Triggers chain
});

// Feature 5: Voice Edit
document.getElementById('edit-mic-btn').addEventListener('click', () => {
  if (!currentImage) {
    alert('Generate an image first!');
    return;
  }
  const editRec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  editRec.onresult = (e) => {  // No async - AI wrap if needed
    const editCmd = e.results[0][0].transcript;
    console.log('Edit command:', editCmd);
    
    // Parse Edit (on-device)
    let editParams = { action: 'brightness', value: 'increase by 20%' };
    if (window.ai && window.ai.languageModel) {
      window.ai.languageModel.createSession().then((session) => {
        const editPrompt = `Parse: "${editCmd}". JSON: {"action": "brightness|contrast|color", "value": "increase|decrease by 20%"}`;
        session.prompt(editPrompt).then((response) => {
          editParams = JSON.parse(response.text);
          applyEdit();
        }).catch((e) => {
          console.warn('Edit parse failed:', e);
          applyEdit();
        });
      }).catch((e) => {
        console.warn('Session for edit failed:', e);
        applyEdit();
      });
    } else {
      applyEdit();
    }
  };
  function applyEdit() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const factor = editParams.value.includes('increase') ? 1.2 : 0.8;
      for (let i = 0; i < data.length; i += 4) {
        if (editParams.action === 'brightness') {
          data[i] = Math.min(255, data[i] * factor);     // R
          data[i + 1] = Math.min(255, data[i + 1] * factor); // G
          data[i + 2] = Math.min(255, data[i + 2] * factor); // B
        }
      }
      ctx.putImageData(imageData, 0, 0);
      currentImage = canvas.toDataURL();
      outputImageEl.src = currentImage;
      imageSrc = currentImage;
    };
    img.src = currentImage;
  }
  editRec.onerror = () => alert('Edit mic error.');
  editRec.start();
});

// Feature 6: Upload Grid
document.getElementById('upload-btn').addEventListener('click', () => {
  document.getElementById('upload-input').click();
});
document.getElementById('upload-input').addEventListener('change', (e) => {
  uploadGridEl.innerHTML = '';
  Array.from(e.target.files).forEach((file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = document.createElement('img');
      img.src = ev.target.result;
      img.onclick = () => {
        currentImage = img.src;
        outputImageEl.src = img.src;
        outputImageEl.style.display = 'block';
        imageSrc = img.src;
      };
      uploadGridEl.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

// Feature 7: Share QR
document.getElementById('share-btn').addEventListener('click', () => {  // No async - .then
  if (!refinedText || !imageSrc) {
    alert('Generate content first!');
    return;
  }
  fetch(`${BACKEND_URL}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: refinedText,
      imageBase64: imageSrc.split(',')[1] || '',  // Base64 part
      alt: outputImageEl.alt
    })
  }).then((shareRes) => shareRes.json())
    .then((shareData) => {
      const qrCanvas = document.getElementById('qr-canvas');
      qrCanvas.style.display = 'block';
      QRCode.toCanvas(qrCanvas, shareData.shareUrl, { width: 200 }, (error) => {
        if (error) console.error('QR failed:', error);
      });
      navigator.clipboard.writeText(shareData.shareUrl).then(() => {
        alert(`Shared! URL copied: ${shareData.shareUrl}\nScan QR to view.`);
      });
    }).catch((e) => {
      console.error('Share failed:', e);
      alert('Share failed—ensure backend is running.');
    });
});