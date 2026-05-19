import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

export class LiveService {
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputNode: MediaStreamAudioSourceNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private outputNode: GainNode | null = null;
  private stream: MediaStream | null = null;
  private nextStartTime: number = 0;
  private sources: Set<AudioBufferSourceNode> = new Set();
  
  public isActive: boolean = false;
  public isMuted: boolean = false;
  public isSpeakerOn: boolean = true;

  constructor() {}

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public setSpeaker(on: boolean) {
    this.isSpeakerOn = on;
    if (this.outputNode && this.outputAudioContext) {
      this.outputNode.gain.setValueAtTime(on ? 1.0 : 0.0, this.outputAudioContext.currentTime);
    }
  }

  async connect(
      onActiveChange: (active: boolean) => void, 
      onError?: (error: Error) => void,
      onTranscription?: (text: string, isUser: boolean, isFinal: boolean) => void
    ) {
    if (this.isActive) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      const e = new Error("VITE_GEMINI_API_KEY is missing. Check your .env file.");
      if (onError) onError(e);
      return;
    }

    try {
      // 1. Get Microphone Access
      console.log("Requesting microphone access...");
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: true,
          sampleRate: 16000, 
        } 
      });
      console.log("Microphone access granted.");

      // 2. Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      
      try {
        this.inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
      } catch (e) {
        console.warn("Browser does not support forcing 16kHz sample rate. Falling back to native rate.");
        this.inputAudioContext = new AudioContextClass();
      }

      this.outputAudioContext = new AudioContextClass({ sampleRate: 24000 });

      // 3. Resume Contexts
      if (this.inputAudioContext.state === 'suspended') {
        await this.inputAudioContext.resume();
      }
      if (this.outputAudioContext.state === 'suspended') {
        await this.outputAudioContext.resume();
      }
      
      this.outputNode = this.outputAudioContext.createGain();
      this.outputNode.gain.setValueAtTime(this.isSpeakerOn ? 1.0 : 0.0, this.outputAudioContext.currentTime);
      this.outputNode.connect(this.outputAudioContext.destination);

      // 4. Initialize AI Client & Session
      const ai = new GoogleGenAI({ apiKey: apiKey });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
            },
            systemInstruction: {
              parts: [{ text: "You are Friday, a helpful AI assistant. You are multilingual. You must listen to, transcribe, and respond in the language spoken by the user (including English, Hindi, Tamil, Spanish, French, or a mix like Hinglish). Maintain the language context of the conversation naturally. Ensure your transcription matches the script and language of the user's spoken input." }]
            },
            // Enable Transcription
            inputAudioTranscription: {},
            outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            console.log("Friday Live Session Opened");
            this.isActive = true;
            onActiveChange(true);
            this.startAudioInput(sessionPromise);
          },
          onmessage: async (message: LiveServerMessage) => {
             this.handleMessage(message, onTranscription);
          },
          onclose: (e) => {
            console.log("Friday Live Session Closed", e);
            this.isActive = false;
            onActiveChange(false);
            this.disconnect();
          },
          onerror: (err) => {
             console.debug("Friday Live Session Error:", err);
             this.isActive = false;
             onActiveChange(false);
             this.disconnect();
             if (onError) onError(new Error("Network connection failed. Check your API Quota or internet connection."));
          }
        }
      });
      
    } catch (error: any) {
      console.warn("Setup failed:", error);
      this.disconnect();
      if (onError) onError(error);
    }
  }

  async disconnect() {
    this.isActive = false;
    
    // Stop tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    // Stop nodes
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }
    if (this.inputNode) {
      this.inputNode.disconnect();
      this.inputNode = null;
    }
    
    // Close contexts
    if (this.inputAudioContext) {
      try { await this.inputAudioContext.close(); } catch(e){}
      this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
      try { await this.outputAudioContext.close(); } catch(e){}
      this.outputAudioContext = null;
    }
  }

  private startAudioInput(sessionPromise: Promise<any>) {
    if (!this.inputAudioContext || !this.stream) return;

    this.inputNode = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    this.scriptProcessor.onaudioprocess = (e) => {
      if (!this.isActive || this.isMuted) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      const b64Data = this.pcmToB64(inputData);
      
      sessionPromise.then(session => {
        session.sendRealtimeInput({
          media: {
            mimeType: "audio/pcm;rate=16000",
            data: b64Data
          }
        });
      }).catch(err => {
         // Session likely not ready or closed, ignore
      });
    };

    this.inputNode.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputAudioContext.destination);
  }

  private async handleMessage(message: LiveServerMessage, onTranscription?: (text: string, isUser: boolean, isFinal: boolean) => void) {
    // 1. Handle Audio
    const parts = message.serverContent?.modelTurn?.parts;
    if (parts && this.outputAudioContext && this.outputNode) {
      for (const part of parts) {
        if (part.inlineData?.data) {
           try {
             const audioBuffer = await this.decodeAudioData(part.inlineData.data);
             this.playAudio(audioBuffer);
           } catch (e) {
             console.debug("Audio decode error", e);
           }
        }
      }
    }

    // 2. Handle Transcription
    if (onTranscription) {
        if (message.serverContent?.outputTranscription?.text) {
            onTranscription(message.serverContent.outputTranscription.text, false, false);
        }
        if (message.serverContent?.inputTranscription?.text) {
            onTranscription(message.serverContent.inputTranscription.text, true, false);
        }
        if (message.serverContent?.turnComplete) {
            onTranscription("", false, true); // Signal turn complete
        }
    }
  }

  private playAudio(buffer: AudioBuffer) {
    if (!this.outputAudioContext || !this.outputNode) return;

    const source = this.outputAudioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputNode);
    
    const now = this.outputAudioContext.currentTime;
    const start = Math.max(now, this.nextStartTime);
    
    source.start(start);
    this.nextStartTime = start + buffer.duration;
    
    source.onended = () => {
      this.sources.delete(source);
    };
    this.sources.add(source);
  }

  private pcmToB64(data: Float32Array): string {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
       let s = Math.max(-1, Math.min(1, data[i]));
       int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    let binary = '';
    const bytes = new Uint8Array(int16.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  private async decodeAudioData(base64: string): Promise<AudioBuffer> {
    if (!this.outputAudioContext) throw new Error("No output context");
    
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const safeLength = Math.floor(bytes.byteLength / 2);
    const dataInt16 = new Int16Array(bytes.buffer, 0, safeLength);
    const buffer = this.outputAudioContext.createBuffer(1, safeLength, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < safeLength; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
  }
}

export const liveService = new LiveService();