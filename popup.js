// popup.js (Updated - No External Libs)
class AIMuseCreator {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isRecording = false;
    this.transcribedText = '';
    this.detectedLang = 'en-US'; // Default; server detects if needed
    this.detectedMood = 'neutral'; // Default
    this.generatedPrompt = '';
    this.generatedImageUrl = '';
    
    this.initializeElements();
    this.initializeRecognition();
    this.bindEvents();
  }

  initializeElements() {
    this.startBtn = document.getElementById('start-recording');
    this.stopBtn = document.getElementById('stop-recording');
    this.langDisplay = document.getElementById('language-display');
    this.moodDisplay = document.getElementById('mood-display');
    this.transcriptionDiv = document.getElementById('transcription');
    this.editSection = document.getElementById('edit-section');
    this.editText = document.getElementById('edit-text');
    this.voiceEditBtn = document.getElementById('voice-edit');
    this.generatePromptBtn = document.getElementById('generate-prompt');
    this.promptSection = document.getElementById('prompt-section');
    this.promptText = document.getElementById('prompt-text');
   // this.playVoiceoverBtn = document.getElementById('play-voiceover');
    this.generateImageBtn = document.getElementById('generate-image');
    this.imageSection = document.getElementById('image-section');
    this.generatedImage = document.getElementById('generated-image');
    this.downloadBtn = document.getElementById('download-image');
    this.shareQrBtn = document.getElementById('share-qr');
    this.shareUrlBtn = document.getElementById('share-url');
    this.statusDiv = document.getElementById('status');
  }

  initializeRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.detectedLang;
      this.recognition.onresult = (event) => this.handleRecognitionResult(event);
      this.recognition.onerror = (event) => this.updateStatus(`Error: ${event.error}`);
    } else {
      this.updateStatus('Speech recognition not supported.');
    }
  }

  bindEvents() {
    this.startBtn.addEventListener('click', () => this.startRecording());
    this.stopBtn.addEventListener('click', () => this.stopRecording());
    this.voiceEditBtn.addEventListener('click', () => this.startVoiceEdit());
    this.generatePromptBtn.addEventListener('click', () => this.generateImagePrompt());
   // this.playVoiceoverBtn.addEventListener('click', () => this.playVoiceOver());
    this.generateImageBtn.addEventListener('click', () => this.generateImage());
    this.downloadBtn.addEventListener('click', () => this.downloadImage());
    this.shareQrBtn.addEventListener('click', () => this.generateQR());
    this.shareUrlBtn.addEventListener('click', () => this.shareURL());
  }

  startRecording() {
    if (this.recognition) {
      this.recognition.start();
      this.isRecording = true;
      this.startBtn.disabled = true;
      this.stopBtn.disabled = false;
      this.updateStatus('Recording... Speak now!');
    }
  }

  stopRecording() {
    if (this.recognition) {
      this.recognition.stop();
      this.isRecording = false;
      this.startBtn.disabled = false;
      this.stopBtn.disabled = true;
      this.updateStatus('Processing...');
      this.processAudio();
    }
  }

  handleRecognitionResult(event) {
    let interimTranscript = '';
    let finalTranscript = this.transcribedText;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    this.transcribedText = finalTranscript;
    this.transcriptionDiv.textContent = this.transcribedText + interimTranscript;
  }

  processAudio() {
    // Mood detection: Simple text-based (no ML needed)
    this.detectedMood = this.analyzeMood(this.transcribedText);
    this.moodDisplay.textContent = `Mood: ${this.detectedMood}`;

    // Show edit section
    this.editSection.style.display = 'block';
    this.editText.value = this.transcribedText;
  }

  analyzeMood(text) {
    // Simple keyword-based
    const positiveWords = ['happy', 'joy', 'excited'];
    const negativeWords = ['sad', 'angry', 'frustrated'];
    const words = text.toLowerCase().split(' ');
    const posCount = words.filter(w => positiveWords.includes(w)).length;
    const negCount = words.filter(w => negativeWords.includes(w)).length;
    return posCount > negCount ? 'positive' : negCount > posCount ? 'negative' : 'neutral';
  }

  startVoiceEdit() {
    this.startRecording();
    this.updateStatus('Recording edit...');
  }

  async generateImagePrompt() {
    const text = this.editText.value;
    if (!text) return this.updateStatus('No text to generate prompt.');

    this.updateStatus('Generating prompt...');
    try {
      const response = await fetch('http://localhost:3000/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: null, mood: this.detectedMood }) // Backend detects lang
      });
      const data = await response.json();
      this.generatedPrompt = data.prompt;
      this.detectedLang = data.detectedLang || 'en-US'; // Update from backend
      this.langDisplay.textContent = `Language: ${this.detectedLang}`;
      this.promptText.textContent = this.generatedPrompt;
      this.promptSection.style.display = 'block';
      this.updateStatus('Prompt generated!');
    } catch (err) {
      this.updateStatus(`Error: ${err.message}`);
    }
  }

  playVoiceOver() {
    if (this.synthesis) {
      const utterance = new SpeechSynthesisUtterance(this.generatedPrompt);
      utterance.lang = this.detectedLang;
      this.synthesis.speak(utterance);
    }
  }

  async generateImage() {
    if (!this.generatedPrompt) return this.updateStatus('No prompt to generate image.');

    this.updateStatus('Generating image...');
    try {
      const response = await fetch('http://localhost:3000/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: this.generatedPrompt })
      });
      const data = await response.json();
      this.generatedImageUrl = data.imageUrl;
      this.generatedImage.src = this.generatedImageUrl;
      this.imageSection.style.display = 'block';
      this.updateStatus('Image generated!');
    } catch (err) {
      this.updateStatus(`Error: ${err.message}`);
    }
  }

  downloadImage() {
    if (this.generatedImageUrl) {
      const a = document.createElement('a');
      a.href = this.generatedImageUrl;
      a.download = 'muse-image.png';
      a.click();
    }
  }

  generateQR() {
    if (!this.generatedImageUrl) return this.updateStatus('No image to share.');
    if (typeof QRCode === 'undefined') return this.updateStatus('QRCode not loaded.');

    const qrCanvas = document.createElement('canvas');
    QRCode.toCanvas(qrCanvas, this.generatedImageUrl, (err) => {
      if (err) {
        this.updateStatus('QR generation failed.');
      } else {
        // Open QR in new tab for viewing/sharing
        const newWindow = window.open('', '_blank');
        newWindow.document.write('<img src="' + qrCanvas.toDataURL() + '" />');
        newWindow.document.close();
      }
    });
  }

  shareURL() {
    if (!this.generatedImageUrl) return;
    if (navigator.share) {
      navigator.share({ title: 'My AI Muse', url: this.generatedImageUrl });
    } else {
      navigator.clipboard.writeText(this.generatedImageUrl);
      this.updateStatus('URL copied to clipboard!');
    }
  }

  updateStatus(message) {
    this.statusDiv.textContent = message;
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => new AIMuseCreator());