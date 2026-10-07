// Robust Voice Engine: Real Gemini Server Audio + Web Speech API Streaming + MediaRecorder Fallback

export class SpeechHandler {
  private isListening: boolean = false;
  private currentAudioElement: HTMLAudioElement | null = null;
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognitionInstance: any = null;

  // MediaRecorder state
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private volumeCallback: ((volume: number) => void) | null = null;
  private animFrameId: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.synth = window.speechSynthesis;
      // Pre-warm voices
      if (this.synth) {
        if (this.synth.onvoiceschanged !== undefined) {
          this.synth.onvoiceschanged = () => {
            this.synth?.getVoices();
          };
        }
      }
    }
  }

  public setVolumeCallback(cb: (vol: number) => void) {
    this.volumeCallback = cb;
  }

  public isSpeechRecognitionAvailable(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    );
  }

  // Play real base64 WAV Audio (from Gemini 3.8 TTS)
  public playAudioBase64(
    base64Data: string,
    options: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    } = {}
  ): HTMLAudioElement | null {
    this.stopSpeaking();

    try {
      const audioUrl = `data:audio/wav;base64,${base64Data}`;
      const audio = new Audio(audioUrl);
      this.currentAudioElement = audio;

      audio.onplay = () => {
        if (options.onStart) options.onStart();
      };

      audio.onended = () => {
        this.currentAudioElement = null;
        if (options.onEnd) options.onEnd();
      };

      audio.onerror = (e) => {
        console.warn('Audio playback notice:', e);
        this.currentAudioElement = null;
        if (options.onError) options.onError();
        else if (options.onEnd) options.onEnd();
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio play promise caught (browser policy):', err);
          this.currentAudioElement = null;
          if (options.onError) options.onError();
          else if (options.onEnd) options.onEnd();
        });
      }

      return audio;
    } catch (err) {
      console.warn('Failed to initialize Audio:', err);
      if (options.onEnd) options.onEnd();
      return null;
    }
  }

  // Primary Speech Output: Calls browser SpeechSynthesis or /api/gemini/tts
  public async speak(
    text: string,
    options: {
      voiceName?: string;
      rate?: number;
      onStart?: () => void;
      onEnd?: () => void;
    } = {}
  ) {
    this.stopSpeaking();
    const cleanText = text.replace(/[*_#`~]/g, '').trim();
    if (!cleanText) {
      if (options.onEnd) options.onEnd();
      return;
    }

    // Immediate browser SpeechSynthesis for instant zero-latency speech output
    if (this.synth) {
      try {
        this.synth.resume();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = options.rate || 1.0;
        utterance.pitch = 1.0;

        const voices = this.synth.getVoices();
        if (voices.length > 0) {
          const match = voices.find(
            (v) =>
              (options.voiceName && v.name.toLowerCase().includes(options.voiceName.toLowerCase())) ||
              v.lang.startsWith('en')
          );
          if (match) utterance.voice = match;
        }

        utterance.onstart = () => {
          if (options.onStart) options.onStart();
        };

        utterance.onend = () => {
          this.currentUtterance = null;
          if (options.onEnd) options.onEnd();
        };

        utterance.onerror = (e) => {
          console.warn('Utterance notice:', e);
          this.currentUtterance = null;
          if (options.onEnd) options.onEnd();
        };

        this.currentUtterance = utterance;
        this.synth.speak(utterance);
        return;
      } catch (e) {
        console.warn('Browser speech synthesis error:', e);
      }
    }

    // Fallback: try server TTS if speech synthesis is unavailable
    try {
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanText.substring(0, 200),
          voice: options.voiceName || 'Kore'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          this.playAudioBase64(data.audioBase64, {
            onStart: options.onStart,
            onEnd: options.onEnd,
            onError: () => {
              if (options.onEnd) options.onEnd();
            }
          });
          return;
        }
      }
    } catch (err) {
      console.warn('Server TTS fetch notice:', err);
    }

    if (options.onEnd) options.onEnd();
  }

  public stopSpeaking() {
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
      } catch (e) {}
      this.currentAudioElement = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
      this.currentUtterance = null;
    }
  }

  // 1. Live Streaming Speech Recognition (Yields words instantaneously into UI)
  public startSpeechRecognition(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (err: any) => void,
    onEnd: () => void,
    language: string = 'English'
  ): boolean {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return false;

    this.stopSpeaking();
    this.stopListening();

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      let langCode = 'en-US';
      const l = language.toLowerCase();
      if (l.includes('hindi') || l.includes('hinglish')) {
        langCode = 'hi-IN';
      } else if (l.includes('spanish')) {
        langCode = 'es-ES';
      }

      recognition.lang = langCode;

      let accumulated = '';

      recognition.onresult = (event: any) => {
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            accumulated += (accumulated ? ' ' : '') + item[0].transcript;
          } else {
            interimText += item[0].transcript;
          }
        }
        const text = (accumulated + (interimText ? ' ' + interimText : '')).trim();
        if (text) {
          onResult(text, !!accumulated);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition event error:', event.error);
        if (event.error !== 'no-speech') {
          this.isListening = false;
          onError(event);
        }
      };

      recognition.onend = () => {
        if (this.isListening) {
          this.isListening = false;
          onEnd();
        }
      };

      this.recognitionInstance = recognition;
      this.isListening = true;
      recognition.start();
      return true;
    } catch (e) {
      console.warn('Speech recognition start failure:', e);
      return false;
    }
  }

  // 2. Start Microphone MediaRecorder + Volume Analyser
  public async startMicrophoneRecording(
    onVolume?: (vol: number) => void
  ): Promise<boolean> {
    this.stopSpeaking();
    this.cleanUpAudioStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      this.mediaStream = stream;
      this.recordedChunks = [];

      // AudioContext for live volume animation
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
          }
          const source = this.audioContext.createMediaStreamSource(stream);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 256;
          source.connect(this.analyser);

          const dataArr = new Uint8Array(this.analyser.frequencyBinCount);
          const loop = () => {
            if (!this.analyser || !this.mediaStream) return;
            this.analyser.getByteFrequencyData(dataArr);
            let sum = 0;
            for (let i = 0; i < dataArr.length; i++) sum += dataArr[i];
            const avg = sum / dataArr.length;
            if (onVolume) onVolume(avg);
            if (this.volumeCallback) this.volumeCallback(avg);
            this.animFrameId = requestAnimationFrame(loop);
          };
          this.animFrameId = requestAnimationFrame(loop);
        }
      } catch (e) {
        console.warn('Analyser setup notice:', e);
      }

      // MediaRecorder for capturing voice
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';

      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(150);
      this.isListening = true;
      return true;
    } catch (err: any) {
      console.warn('Microphone start error:', err);
      this.cleanUpAudioStream();
      throw err;
    }
  }

  // Stop Microphone and return recorded Audio as base64
  public async stopMicrophoneRecording(): Promise<{ base64: string; mimeType: string } | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        this.cleanUpAudioStream();
        resolve(null);
        return;
      }

      try {
        if (this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.requestData();
        }
      } catch (e) {}

      this.mediaRecorder.onstop = async () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        this.cleanUpAudioStream();

        if (blob.size === 0) {
          resolve(null);
          return;
        }

        try {
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1] || '';
            resolve({ base64, mimeType });
          };
          reader.readAsDataURL(blob);
        } catch (e) {
          resolve(null);
        }
      };

      setTimeout(() => {
        try {
          if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
          }
        } catch (e) {
          this.cleanUpAudioStream();
          resolve(null);
        }
      }, 80);
    });
  }

  private cleanUpAudioStream() {
    this.isListening = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.volumeCallback) this.volumeCallback(0);

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }
    this.mediaRecorder = null;
    this.recordedChunks = [];
  }

  public stopListening() {
    this.cleanUpAudioStream();
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch (e) {}
      this.recognitionInstance = null;
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechHandler = new SpeechHandler();
