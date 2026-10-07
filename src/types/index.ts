export interface Syllable {
  text: string;
  status: 'correct' | 'warning' | 'critical';
}

export interface PhoneticWord {
  word: string;
  ipa: string;
  syllables: Syllable[];
  note?: string;
}

export interface PedagogicalMetrics {
  faithfulness: number;
  answer_relevancy: number;
  pronunciation_accuracy: number;
  clarity_score: number;
  latency_ms: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  inputMethod?: 'voice' | 'text';
  audioBase64?: string;
  phonetics?: PhoneticWord[];
  pedagogicalTip?: string;
  eval_metrics?: PedagogicalMetrics;
  audioDuration?: number;
}

export type LearningMode = 'interview' | 'phonetics' | 'concept' | 'rag';

export interface TechStackItem {
  layer: string;
  technology: string;
  kyu: string;
  category: 'frontend' | 'backend' | 'ai' | 'audio' | 'data' | 'eval' | 'devops';
  role: string;
  codeSnippet: string;
  status: 'ACTIVE' | 'CONNECTED';
}

export interface RagDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  chunksCount: number;
  embeddingScore?: number;
  source: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  provider: 'ElevenLabs' | 'Neural TTS';
  accent: string;
  tone: string;
  gender: 'female' | 'male';
}
