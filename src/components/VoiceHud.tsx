import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Square, Globe, SlidersHorizontal, Settings2, Sparkles } from 'lucide-react';
import { VOICE_OPTIONS } from '../data/mockData';

interface VoiceHudProps {
  isListening: boolean;
  isSpeaking: boolean;
  selectedVoice: string;
  speechRate: number;
  language: string;
  onToggleMic: () => void;
  onStopAudio: () => void;
  onChangeVoice: (voiceId: string) => void;
  onChangeRate: (rate: number) => void;
  onChangeLanguage: (lang: string) => void;
}

export const VoiceHud: React.FC<VoiceHudProps> = ({
  isListening,
  isSpeaking,
  selectedVoice,
  speechRate,
  language,
  onToggleMic,
  onStopAudio,
  onChangeVoice,
  onChangeRate,
  onChangeLanguage,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="sticky bottom-4 z-40 w-full max-w-3xl mx-auto px-4">
      {/* Settings popover */}
      {showSettings && (
        <div className="mb-3 p-4 rounded-2xl glass-hud border border-[#e2e8f0]/80 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#e2e8f0]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#0f2942] flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#2563eb]" />
              Voice Engine & Acoustic Parameters
            </h4>
            <button
              onClick={() => setShowSettings(false)}
              className="text-xs text-[#64748b] hover:text-[#0f2942]"
            >
              Done
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Voice Persona Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-[#64748b] uppercase mb-1">
                ElevenLabs Persona
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => onChangeVoice(e.target.value)}
                className="w-full text-xs font-medium bg-white border border-[#e2e8f0] rounded-lg p-2 text-[#0f2942] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              >
                {VOICE_OPTIONS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.tone})
                  </option>
                ))}
              </select>
            </div>

            {/* Speaking Rate */}
            <div>
              <label className="block text-[11px] font-semibold text-[#64748b] uppercase mb-1">
                Playback Speed ({speechRate}x)
              </label>
              <div className="flex items-center gap-1 bg-[#f1f5f9] p-1 rounded-lg border border-[#e2e8f0]">
                {[0.8, 1.0, 1.2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => onChangeRate(rate)}
                    className={`flex-1 py-1 text-xs font-semibold rounded transition-colors ${
                      speechRate === rate
                        ? 'bg-white text-[#2563eb] shadow-xs'
                        : 'text-[#64748b] hover:text-[#0f2942]'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            {/* Target Language */}
            <div>
              <label className="block text-[11px] font-semibold text-[#64748b] uppercase mb-1">
                Conversation Language
              </label>
              <select
                value={language}
                onChange={(e) => onChangeLanguage(e.target.value)}
                className="w-full text-xs font-medium bg-white border border-[#e2e8f0] rounded-lg p-2 text-[#0f2942] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              >
                <option value="English">English (US/UK)</option>
                <option value="Hinglish">Hindi / Hinglish (Bilingual)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Frosted HUD Bar */}
      <div className="glass-hud rounded-2xl border border-white/80 p-2 sm:p-3 flex items-center justify-between gap-3 shadow-[0_20px_32px_-8px_rgba(15,41,66,0.12)]">
        {/* Left Status pill */}
        <div className="flex items-center gap-2 pl-2">
          <div className="w-9 h-9 rounded-xl bg-[#eff4ff] border border-[#dbeafe] flex items-center justify-center text-[#2563eb] shrink-0">
            {isSpeaking ? (
              <Volume2 className="w-4 h-4 animate-bounce" />
            ) : isListening ? (
              <Mic className="w-4 h-4 text-[#38bdf8] animate-pulse" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-bold text-[#0f2942] flex items-center gap-1.5">
              <span>{isListening ? 'Listening...' : isSpeaking ? 'Playing Voice' : 'Sonic Clarity HUD'}</span>
              <span className="text-[10px] text-[#2563eb] bg-[#dbeafe] px-1.5 py-0.2 rounded font-mono font-medium">
                {language}
              </span>
            </div>
            <div className="text-[11px] text-[#64748b]">
              {isListening
                ? 'Deepgram STT streaming'
                : isSpeaking
                ? 'ElevenLabs audio active'
                : 'Tap mic or press space to speak'}
            </div>
          </div>
        </div>

        {/* Center 72px Primary Circular Mic Trigger */}
        <div className="flex items-center justify-center relative">
          <button
            onClick={onToggleMic}
            className={`relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
              isListening
                ? 'bg-[#0051d5] text-white active-listening-aura scale-105'
                : 'bg-[#0f2942] text-white hover:bg-[#1d4ed8] hover:scale-102 active:scale-95'
            }`}
            title={isListening ? 'Click to stop listening' : 'Click to start voice input'}
            aria-label="Toggle Microphone"
          >
            {isListening ? (
              <Mic className="w-7 h-7 sm:w-8 sm:h-8 text-[#38bdf8] animate-pulse" />
            ) : (
              <Mic className="w-7 h-7 sm:w-8 sm:h-8" />
            )}

            {/* Subtle cyan inner ring */}
            <span className="absolute inset-0 rounded-full border-2 border-white/20 pointer-events-none" />
          </button>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-1.5 pr-1">
          {/* Stop Audio Button if currently playing */}
          {isSpeaking && (
            <button
              onClick={onStopAudio}
              className="px-3 py-2 rounded-xl bg-[#fee2e2] text-[#dc2626] border border-[#fecaca] text-xs font-semibold flex items-center gap-1.5 transition-colors hover:bg-[#fecaca]"
              title="Stop current speech"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span className="hidden md:inline">Stop Audio</span>
            </button>
          )}

          {/* Quick Language Toggle */}
          <button
            onClick={() => {
              const langs = ['English', 'Hinglish', 'Spanish'];
              const nextIdx = (langs.indexOf(language) + 1) % langs.length;
              onChangeLanguage(langs[nextIdx]);
            }}
            className="px-2.5 py-2 rounded-xl bg-white border border-[#e2e8f0] text-[#0f2942] text-xs font-semibold flex items-center gap-1 hover:bg-[#f8fafc] transition-colors"
            title="Switch language"
          >
            <Globe className="w-3.5 h-3.5 text-[#2563eb]" />
            <span className="font-mono text-[11px]">{language.substring(0, 3).toUpperCase()}</span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2.5 rounded-xl border text-xs font-semibold transition-colors ${
              showSettings
                ? 'bg-[#2563eb] text-white border-[#2563eb]'
                : 'bg-white border-[#e2e8f0] text-[#0f2942] hover:bg-[#f8fafc]'
            }`}
            title="Voice & Audio Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
