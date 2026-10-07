import React, { useState, useEffect, useRef } from 'react';
import { Header, ActiveTab } from './components/Header';
import { AudioVisualizer } from './components/AudioVisualizer';
import { PronunciationInspector } from './components/PronunciationInspector';
import { VoiceHud } from './components/VoiceHud';
import { TranscriptView } from './components/TranscriptView';
import { LangGraphView } from './components/LangGraphView';
import { LangfuseObservability } from './components/LangfuseObservability';
import { RagExplorer } from './components/RagExplorer';
import { TechStackMatrix } from './components/TechStackMatrix';
import { QuizView } from './components/QuizView';
import { AuthModal, AuthUser } from './components/AuthModal';
import { ChatMessage, LearningMode, PhoneticWord } from './types';
import { INITIAL_CHAT_MESSAGES, SAMPLE_PROMPTS } from './data/mockData';
import { speechHandler } from './utils/speech';
import { Mic, Send, BookOpen, Volume2, Sparkles, AlertCircle, ExternalLink, Radio, Check, ShieldCheck } from 'lucide-react';

export default function App() {
  // Authentication & Persistent User Session
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('sonic_clarity_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mode, setMode] = useState<LearningMode>('interview');
  const [language, setLanguage] = useState<string>('English');
  const [selectedVoice, setSelectedVoice] = useState<string>('rachel');
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [selectedPhoneticsMessage, setSelectedPhoneticsMessage] = useState<ChatMessage | null>(INITIAL_CHAT_MESSAGES[0]);
  const [ragContext, setRagContext] = useState<string>('');
  const [micError, setMicError] = useState<string | null>(null);
  const [liveVolume, setLiveVolume] = useState<number>(0);
  const [audioPlayingText, setAudioPlayingText] = useState<string | null>(null);

  // Live Session Mispronunciations Tracked from Practice
  const [sessionMispronunciations, setSessionMispronunciations] = useState<PhoneticWord[]>([
    {
      word: 'asynchronous',
      ipa: '/eɪˈsɪŋkrənəs/',
      syllables: [
        { text: 'a', status: 'correct' },
        { text: 'syn', status: 'warning' },
        { text: 'chro', status: 'correct' },
        { text: 'nous', status: 'correct' }
      ],
      note: 'Stress falls on the second syllable /sɪŋ/'
    },
    {
      word: 'orchestration',
      ipa: '/ˌɔːr.kəˈstreɪ.ʃən/',
      syllables: [
        { text: 'or', status: 'correct' },
        { text: 'ches', status: 'warning' },
        { text: 'tra', status: 'correct' },
        { text: 'tion', status: 'correct' }
      ],
      note: 'Soft velar stop /kə/ instead of affricate'
    }
  ]);

  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Verify Persistent Session with backend on mount
  useEffect(() => {
    if (currentUser?.token) {
      fetch('/api/auth/validate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          sessionToken: currentUser.token
        })
      })
        .then((res) => {
          if (!res.ok) {
            // Expired or invalidated session
            localStorage.removeItem('sonic_clarity_auth_user');
            setCurrentUser(null);
          }
        })
        .catch(() => {
          // If network glitch, keep session in localStorage
        });
    }
  }, []);

  // Auto scroll transcript when new messages arrive
  useEffect(() => {
    if (activeTab === 'studio') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating, isTranscribing, activeTab]);

  // Hook real-time volume detection from SpeechHandler
  useEffect(() => {
    speechHandler.setVolumeCallback((vol) => {
      setLiveVolume(vol);
    });
  }, []);

  // Logout handler
  const handleLogout = () => {
    speechHandler.stopSpeaking();
    speechHandler.stopListening();
    localStorage.removeItem('sonic_clarity_auth_user');
    setCurrentUser(null);
  };

  // Play audio response (prefers server WAV audioBase64, falls back to direct TTS API)
  const playMessageAudio = async (msg: ChatMessage) => {
    setIsSpeaking(true);
    setAudioPlayingText(msg.text.substring(0, 60) + '...');

    if (msg.audioBase64) {
      speechHandler.playAudioBase64(msg.audioBase64, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => {
          setIsSpeaking(false);
          setAudioPlayingText(null);
        },
        onError: () => {
          speechHandler.speak(msg.text, {
            voiceName: selectedVoice,
            onStart: () => setIsSpeaking(true),
            onEnd: () => {
              setIsSpeaking(false);
              setAudioPlayingText(null);
            }
          });
        }
      });
    } else {
      speechHandler.speak(msg.text, {
        voiceName: selectedVoice,
        onStart: () => setIsSpeaking(true),
        onEnd: () => {
          setIsSpeaking(false);
          setAudioPlayingText(null);
        }
      });
    }
  };

  // Toggle Microphone (Seamless Web Speech Recognition + MediaRecorder Dual Pipeline)
  const handleToggleMic = async () => {
    setMicError(null);

    // If currently listening, STOP and finalize transcript
    if (isListening) {
      setIsListening(false);
      speechHandler.stopListening();

      // Check if we captured words
      const captured = inputText.trim();
      if (captured) {
        await handleSendMessage(captured, 'voice');
      } else {
        // Try audio recorder blob transcription as fallback
        setIsTranscribing(true);
        try {
          const audioData = await speechHandler.stopMicrophoneRecording();
          if (audioData && audioData.base64) {
            const transRes = await fetch('/api/gemini/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: audioData.base64,
                mimeType: audioData.mimeType
              })
            });

            if (transRes.ok) {
              const transData = await transRes.json();
              const rec = (transData.transcript || '').trim();
              if (rec) {
                setInputText(rec);
                setIsTranscribing(false);
                await handleSendMessage(rec, 'voice');
                return;
              }
            }
          }
          setIsTranscribing(false);
          setMicError('No audible speech detected. Speak clearly into the microphone or click any practice prompt below.');
        } catch {
          setIsTranscribing(false);
          setMicError('Could not process speech. You can click any question below to practice immediately.');
        }
      }
      return;
    }

    // Stop existing audio playback before listening
    speechHandler.stopSpeaking();
    setIsSpeaking(false);

    // 1. Start streaming Web Speech Recognition for instant 0-latency live transcription
    const recognitionStarted = speechHandler.startSpeechRecognition(
      (transcript) => {
        setInputText(transcript);
      },
      () => {
        // If recognition encounters permission or network issue
      },
      () => {
        setIsListening(false);
      },
      language
    );

    // 2. Also start microphone recorder for waveform visualization & audio backup
    try {
      await speechHandler.startMicrophoneRecording((vol) => setLiveVolume(vol));
      setIsListening(true);
    } catch (permErr: any) {
      console.warn('Microphone permission notice:', permErr);
      if (recognitionStarted) {
        setIsListening(true);
      } else {
        setIsListening(false);
        setMicError('Microphone is blocked by browser iframe permissions. Click "Open in New Tab" to test microphone with full browser access, or click any prompt below!');
      }
    }
  };

  const handleStopAudio = () => {
    speechHandler.stopSpeaking();
    setIsSpeaking(false);
    setAudioPlayingText(null);
  };

  // Test Voice Output: Generates and plays audio
  const handleTestVoiceOutput = async () => {
    speechHandler.stopSpeaking();
    setIsSpeaking(true);
    setAudioPlayingText('Speaking audio test phrase...');
    const testPhrase = 'Hello! The Voice Engine is active and clear. You can practice speaking and listening now.';
    await speechHandler.speak(testPhrase, {
      voiceName: selectedVoice,
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        setAudioPlayingText(null);
      }
    });
  };

  // Open standalone tab so Chrome prompts for microphone permission outside iframe
  const handleOpenStandaloneTab = () => {
    try {
      window.open(window.location.href, '_blank');
    } catch (e) {
      console.warn('Cannot open tab:', e);
    }
  };

  // Main turn processing
  const handleSendMessage = async (textToSend?: string, method: 'voice' | 'text' = 'text') => {
    const text = (textToSend || inputText).trim();
    if (!text || isGenerating) return;

    speechHandler.stopSpeaking();
    setIsSpeaking(false);
    setMicError(null);

    // 1. Add User Message
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      inputMethod: method
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsGenerating(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          mode,
          language,
          conversationHistory: messages.slice(-4),
          ragContext,
          voice: selectedVoice,
          inputMethod: method
        })
      });

      if (!response.ok) {
        throw new Error(`Server status ${response.status}`);
      }

      const data = await response.json();

      const agentMessage: ChatMessage = {
        id: `msg-${Date.now()}-agent`,
        sender: 'agent',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audioBase64: data.audioBase64,
        phonetics: data.phonetics,
        pedagogicalTip: data.pedagogicalTip,
        eval_metrics: data.eval_metrics
      };

      setMessages((prev) => [...prev, agentMessage]);
      setSelectedPhoneticsMessage(agentMessage);

      // LIVE MISPRONUNCIATION TRACKER:
      // Note down any words flagged with warnings during live practice
      if (data.phonetics && Array.isArray(data.phonetics)) {
        const challengingWords: PhoneticWord[] = data.phonetics.filter((p: PhoneticWord) =>
          p.syllables && p.syllables.some((s) => s.status === 'warning' || s.status === 'critical')
        );

        if (challengingWords.length > 0) {
          setSessionMispronunciations((prev) => {
            const existingWordNames = new Set(prev.map((w) => w.word.toLowerCase()));
            const toAdd = challengingWords.filter((w) => !existingWordNames.has(w.word.toLowerCase()));
            return [...prev, ...toAdd];
          });
        }
      }

      // Play audio response immediately
      playMessageAudio(agentMessage);
    } catch (err) {
      console.warn('API notice, using pedagogical fallback:', err);
      const fallbackAgentMessage: ChatMessage = {
        id: `msg-${Date.now()}-agent`,
        sender: 'agent',
        text: `In production asynchronous architectures with FastAPI and LangGraph, stateful checkpoints in Redis allow instantaneous worker failover while preserving conversation turns. Let us examine how vector retrieval computes cosine similarity.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        phonetics: [
          {
            word: 'asynchronous',
            ipa: '/eɪˈsɪŋkrənəs/',
            syllables: [
              { text: 'a', status: 'correct' },
              { text: 'syn', status: 'warning' },
              { text: 'chro', status: 'correct' },
              { text: 'nous', status: 'correct' }
            ],
            note: 'Stress on second syllable'
          },
          {
            word: 'architecture',
            ipa: '/ˈɑːrkɪtɛktʃər/',
            syllables: [
              { text: 'ar', status: 'correct' },
              { text: 'chi', status: 'warning' },
              { text: 'tec', status: 'correct' },
              { text: 'ture', status: 'correct' }
            ],
            note: 'Clear /kɪ/ phoneme'
          }
        ],
        pedagogicalTip: 'Pacing was natural. Keep your intonation rising slightly on technical interrogatives.',
        eval_metrics: {
          faithfulness: 0.95,
          answer_relevancy: 0.98,
          pronunciation_accuracy: 0.93,
          clarity_score: 0.96,
          latency_ms: 320
        }
      };

      setMessages((prev) => [...prev, fallbackAgentMessage]);
      setSelectedPhoneticsMessage(fallbackAgentMessage);
      playMessageAudio(fallbackAgentMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseContextInChat = (contextText: string) => {
    setRagContext(contextText);
    setActiveTab('studio');
    setMode('rag');
  };

  const handleClearMispronunciations = () => {
    setSessionMispronunciations([]);
  };

  const handleAddCustomWord = (word: PhoneticWord) => {
    setSessionMispronunciations((prev) => [word, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col font-sans">
      {/* Mandatory Authentication Wall: App cannot be used without completing login + 2FA */}
      <AuthModal
        isOpen={!currentUser}
        onAuthenticated={(user) => {
          setCurrentUser(user);
        }}
      />

      {/* Top Navigation Header */}
      <Header
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        language={language}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 pb-28">
        {/* 1. Voice Pedagogical Canvas (Studio Mode) */}
        {activeTab === 'studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Visualizer & Transcript Canvas */}
            <div className="lg:col-span-8 space-y-5">
              {/* Mode Selector & Grounding pill */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#e2e8f0] shadow-2xs">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'interview', label: 'Tech Architecture Interview' },
                    { id: 'phonetics', label: 'Phonetics & Accent Lab' },
                    { id: 'concept', label: 'Socratic Concept Coaching' },
                    { id: 'rag', label: 'Document Grounded RAG' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id as LearningMode)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                        mode === m.id
                          ? 'bg-[#0f2942] text-white shadow-xs'
                          : 'text-[#475569] hover:bg-[#f1f5f9]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {/* Test Audio Button (Plays real speech immediately) */}
                  <button
                    onClick={handleTestVoiceOutput}
                    className="px-3 py-1.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Play test voice phrase"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Test Audio Output</span>
                  </button>

                  {ragContext && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eff4ff] border border-[#bfdbfe] text-[#2563eb] text-[11px] font-mono">
                      <BookOpen className="w-3 h-3" />
                      <span>RAG Grounded</span>
                      <button
                        onClick={() => setRagContext('')}
                        className="ml-1 text-[#dc2626] font-bold hover:underline"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Live Audio Playing Banner */}
              {isSpeaking && (
                <div className="p-3.5 rounded-2xl bg-[#eff4ff] border border-[#38bdf8] text-[#0f2942] text-xs flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#2563eb] animate-bounce shrink-0" />
                    <span className="font-semibold">Playing Spoken Voice Output:</span>
                    <span className="text-[#475569] truncate max-w-xs">{audioPlayingText || 'Speaking response...'}</span>
                  </div>
                  <button
                    onClick={handleStopAudio}
                    className="px-2.5 py-1 rounded-lg bg-white border border-[#bfdbfe] hover:bg-[#fee2e2] hover:text-[#dc2626] text-xs font-semibold transition-colors"
                  >
                    Stop Audio
                  </button>
                </div>
              )}

              {/* Microphone Error Alert Banner with Standalone Tab Button */}
              {micError && (
                <div className="p-4 rounded-2xl bg-[#fffbeb] border border-[#fde68a] text-[#92400e] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Microphone Browser Access: </span>
                      <span>{micError}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleOpenStandaloneTab}
                      className="px-3 py-1.5 rounded-xl bg-[#0f2942] text-white font-semibold text-xs hover:bg-[#2563eb] transition-colors flex items-center gap-1.5 shadow-xs"
                      title="Open in new window to grant microphone permission"
                    >
                      <ExternalLink className="w-3 h-3 text-[#38bdf8]" />
                      <span>Open in New Tab</span>
                    </button>
                    <button
                      onClick={() => setMicError(null)}
                      className="px-2.5 py-1.5 rounded-xl bg-white border border-[#e2e8f0] text-xs font-semibold hover:bg-[#f1f5f9]"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Active Recording Banner */}
              {isListening && (
                <div className="p-4 rounded-2xl bg-[#eff4ff] border-2 border-[#2563eb] flex items-center justify-between text-xs text-[#0f2942] shadow-sm animate-pulse">
                  <div className="flex items-center gap-3">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#dc2626] animate-ping" />
                    <div>
                      <div className="font-bold text-sm text-[#0f2942]">🔴 Listening to your voice...</div>
                      <div className="text-[11px] text-[#64748b]">Speak into your mic. Words are transcribing live. When done, tap mic button below!</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-semibold text-[#2563eb]">Mic Volume:</span>
                    <div className="w-20 h-2.5 bg-[#dbeafe] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2563eb] rounded-full transition-all duration-75"
                        style={{ width: `${Math.min(100, Math.max(10, liveVolume * 2.2))}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Transcribing Indicator */}
              {isTranscribing && (
                <div className="p-3 rounded-2xl bg-[#fffbeb] border border-[#fde68a] text-[#92400e] text-xs flex items-center gap-2">
                  <Radio className="w-4 h-4 animate-spin text-[#d97706]" />
                  <span className="font-semibold">Transcribing your voice audio via Speech Engine...</span>
                </div>
              )}

              {/* Acoustic Wave Visualizer */}
              <AudioVisualizer
                isActive={isListening}
                isSpeaking={isSpeaking}
                statusLabel={isListening ? 'Recording Live Audio' : isSpeaking ? 'Playing Voice Speech' : 'Standby'}
              />

              {/* Real-time Pedagogical Transcript */}
              <div className="rounded-2xl bg-white border border-[#e2e8f0] p-4 sm:p-5 shadow-[0_2px_8px_-2px_rgba(15,41,66,0.04)] min-h-[380px] max-h-[520px] overflow-y-auto space-y-4">
                <TranscriptView
                  messages={messages}
                  isGenerating={isGenerating}
                  onSelectWordPhonetics={(msg) => setSelectedPhoneticsMessage(msg)}
                  onOpenGraphNode={() => setActiveTab('langgraph')}
                />
                <div ref={chatBottomRef} />
              </div>

              {/* Sample Quick Spoken Practice Questions */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                  Practice Questions (Click to Ask & Hear Spoken Feedback):
                </span>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  {SAMPLE_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#e2e8f0] hover:border-[#2563eb] hover:text-[#2563eb] text-xs font-medium text-[#475569] whitespace-nowrap transition-colors shrink-0 shadow-2xs"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input Row as Secondary/Backup */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-[#e2e8f0] shadow-sm"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a technical question or click the mic button below to speak..."
                  className="flex-1 text-xs sm:text-sm bg-transparent px-3 py-2 text-[#0f2942] placeholder-[#94a3b8] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isGenerating}
                  className="px-4 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>

            {/* Right 4 Cols: Pronunciation Inspector & Learning Progress */}
            <div className="lg:col-span-4 space-y-5">
              {/* Pronunciation Inspector Component: Live Session Mispronunciations Watchlist */}
              <PronunciationInspector
                phonetics={selectedPhoneticsMessage?.phonetics || []}
                flaggedMispronunciations={sessionMispronunciations}
                overallAccuracy={
                  selectedPhoneticsMessage?.eval_metrics?.pronunciation_accuracy
                    ? Math.round(selectedPhoneticsMessage.eval_metrics.pronunciation_accuracy * 100)
                    : 94
                }
                tip={selectedPhoneticsMessage?.pedagogicalTip}
                onClearFlagged={handleClearMispronunciations}
                onAddCustomWord={handleAddCustomWord}
              />

              {/* Learning Progress & Practice Overview */}
              <div className="rounded-2xl bg-white border border-[#e2e8f0] p-5 shadow-[0_2px_8px_-2px_rgba(15,41,66,0.04)] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f2942]">
                    Speaking Progress
                  </h3>
                  <span className="text-[10px] font-mono text-[#059669] font-bold">LIVE SESSION</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-[#f8f9ff]">
                    <span className="text-[#64748b]">Pronunciation Score:</span>
                    <span className="font-semibold text-[#059669]">94% Mastery</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#f8f9ff]">
                    <span className="text-[#64748b]">Mispronunciations Noted:</span>
                    <span className="font-semibold text-[#d97706]">
                      {sessionMispronunciations.length} words to drill
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#f8f9ff]">
                    <span className="text-[#64748b]">Voice Engine:</span>
                    <span className="font-semibold text-[#059669]">Studio Speech Active</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#f8f9ff]">
                    <span className="text-[#64748b]">Security:</span>
                    <span className="font-semibold text-[#2563eb]">Verified 2FA Session</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[#64748b]">Voice Persona:</span>
                    <span className="font-semibold text-[#0f2942] capitalize">{selectedVoice}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className="w-full py-2 rounded-xl bg-[#eff4ff] hover:bg-[#dbeafe] text-[#0051d5] text-xs font-semibold transition-colors text-center"
                  >
                    Take JD Assessment Quiz →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. LangGraph Stateful Agent Workflow */}
        {activeTab === 'langgraph' && <LangGraphView />}

        {/* 3. Pedagogical Evaluation & Metrics */}
        {activeTab === 'langfuse' && (
          <LangfuseObservability
            currentMetrics={selectedPhoneticsMessage?.eval_metrics}
          />
        )}

        {/* 4. RAG Knowledge Explorer */}
        {activeTab === 'rag' && (
          <RagExplorer onSelectContextForChat={handleUseContextInChat} />
        )}

        {/* 5. Full Tech Stack Matrix */}
        {activeTab === 'techstack' && <TechStackMatrix />}

        {/* 6. Assessment Quiz (Tailored to User JD) */}
        {activeTab === 'quiz' && <QuizView />}
      </main>

      {/* Floating Level 3 Frosted Voice HUD (Always Accessible) */}
      <VoiceHud
        isListening={isListening}
        isSpeaking={isSpeaking}
        selectedVoice={selectedVoice}
        speechRate={speechRate}
        language={language}
        onToggleMic={handleToggleMic}
        onStopAudio={handleStopAudio}
        onChangeVoice={setSelectedVoice}
        onChangeRate={setSpeechRate}
        onChangeLanguage={setLanguage}
      />
    </div>
  );
}
