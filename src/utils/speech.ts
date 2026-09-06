/**
 * Text-to-Speech (TTS) Voice Synthesis Helper
 * Provides play, pause, resume, cancel, and speed toggles
 * with natural voice selection for mindful reading of Gemini reflections.
 */

export interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  activeId: string | null;
  rate: number;
}

type StateListener = (state: TTSState) => void;

class TTSService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private state: TTSState = {
    isPlaying: false,
    isPaused: false,
    activeId: null,
    rate: 1.0,
  };
  private listeners: Set<StateListener> = new Set();
  private voices: SpeechSynthesisVoice[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.voices = window.speechSynthesis.getVoices();
    }
  }

  public subscribe(listener: StateListener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }

  public getState(): TTSState {
    return { ...this.state };
  }

  public speak(id: string, text: string, rate: number = 1.0) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis is not supported by this browser.');
      return;
    }

    // Cancel existing speech
    this.stop();

    const cleanText = text
      .replace(/[#*`_~]/g, '')
      .replace(/\[.*?\]\(.*?\)/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = rate;
    utterance.pitch = 1.0;

    // Pick best English voice if available
    if (this.voices.length === 0) {
      this.loadVoices();
    }
    const preferredVoice =
      this.voices.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Serena'))) ||
      this.voices.find((v) => v.lang.startsWith('en')) ||
      this.voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      this.state = {
        isPlaying: true,
        isPaused: false,
        activeId: id,
        rate,
      };
      this.notify();
    };

    utterance.onend = () => {
      this.state = {
        isPlaying: false,
        isPaused: false,
        activeId: null,
        rate,
      };
      this.currentUtterance = null;
      this.notify();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error/cancelled:', e);
      this.state = {
        isPlaying: false,
        isPaused: false,
        activeId: null,
        rate,
      };
      this.currentUtterance = null;
      this.notify();
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  public pause() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && this.state.isPlaying) {
      window.speechSynthesis.pause();
      this.state.isPaused = true;
      this.notify();
    }
  }

  public resume() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && this.state.isPaused) {
      window.speechSynthesis.resume();
      this.state.isPaused = false;
      this.notify();
    }
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.state = {
        isPlaying: false,
        isPaused: false,
        activeId: null,
        rate: this.state.rate,
      };
      this.currentUtterance = null;
      this.notify();
    }
  }

  public setRate(rate: number) {
    this.state.rate = rate;
    this.notify();
  }
}

export const ttsService = new TTSService();
