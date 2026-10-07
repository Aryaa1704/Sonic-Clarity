import React from 'react';
import { ChatMessage } from '../types';
import { Volume2, User, Bot, Sparkles, Activity, FileCode, CheckCircle2 } from 'lucide-react';
import { speechHandler } from '../utils/speech';

interface TranscriptViewProps {
  messages: ChatMessage[];
  isGenerating: boolean;
  onSelectWordPhonetics?: (message: ChatMessage) => void;
  onOpenTrace?: (traceId: string) => void;
  onOpenGraphNode?: (nodeName: string) => void;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({
  messages,
  isGenerating,
  onSelectWordPhonetics,
  onOpenTrace,
  onOpenGraphNode,
}) => {
  const handleReplay = (msg: ChatMessage) => {
    if (msg.audioBase64) {
      speechHandler.playAudioBase64(msg.audioBase64, {
        onError: () => speechHandler.speak(msg.text, { rate: 1.0 })
      });
    } else {
      speechHandler.speak(msg.text, { rate: 1.0 });
    }
  };

  return (
    <div className="space-y-4">
      {messages.map((msg) => {
        const isAgent = msg.sender === 'agent';

        return (
          <div
            key={msg.id}
            className={`transition-all duration-200 ${
              isAgent ? 'flex items-start gap-3' : 'flex items-start justify-end gap-3'
            }`}
          >
            {/* Agent Avatar */}
            {isAgent && (
              <div className="w-9 h-9 rounded-xl bg-[#0f2942] text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                <Bot className="w-5 h-5 text-[#38bdf8]" />
              </div>
            )}

            {/* Bubble Container */}
            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 sm:p-5 shadow-[0_2px_8px_-2px_rgba(15,41,66,0.04)] border transition-all ${
                isAgent
                  ? 'bg-white border-[#e2e8f0] border-l-4 border-l-[#38bdf8] text-[#0b1c30]'
                  : 'bg-[#f0f9ff] border-[#bae6fd] text-[#0f2942]'
              }`}
            >
              {/* Header inside bubble */}
              <div className="flex items-center justify-between gap-3 mb-2 pb-1.5 border-b border-[#e2e8f0]/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tracking-tight">
                    {isAgent
                      ? 'Sonic Clarity (Interview Coach)'
                      : msg.inputMethod === 'voice'
                      ? 'Candidate (Voice Input)'
                      : 'Candidate (Question)'}
                  </span>
                  <span className="text-[10px] text-[#64748b] font-mono">{msg.timestamp}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {isAgent && (
                    <button
                      onClick={() => handleReplay(msg)}
                      className="p-1 rounded-md text-[#2563eb] hover:bg-[#eff4ff] transition-colors"
                      title="Replay Voice Audio"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  )}
                  {msg.eval_metrics && (
                    <span
                      className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0] flex items-center gap-1"
                      title="Pedagogical Pronunciation Score"
                    >
                      <Sparkles className="w-3 h-3 text-[#059669]" />
                      <span>{Math.round(msg.eval_metrics.pronunciation_accuracy * 100)}% accuracy</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Speech Text */}
              <p className="text-sm sm:text-base leading-relaxed font-normal whitespace-pre-wrap">
                {msg.text}
              </p>

              {/* Pedagogical Note / Phonetic trigger */}
              {isAgent && msg.phonetics && msg.phonetics.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#f1f5f9] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-[#64748b]">Key terms:</span>
                    {msg.phonetics.slice(0, 3).map((p, i) => (
                      <button
                        key={i}
                        onClick={() => onSelectWordPhonetics && onSelectWordPhonetics(msg)}
                        className="px-2 py-0.5 rounded-md bg-[#eff4ff] text-[#2563eb] text-xs font-mono font-medium hover:bg-[#dbeafe] transition-colors"
                        title={`Inspect syllables for ${p.word}`}
                      >
                        {p.word} <span className="opacity-70 text-[10px]">{p.ipa}</span>
                      </button>
                    ))}
                  </div>

                  <span className="text-[11px] font-semibold text-[#0051d5] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                    <span>Verified Pronunciation</span>
                  </span>
                </div>
              )}

              {/* Pedagogical Tip Banner */}
              {msg.pedagogicalTip && (
                <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-[#fffbeb] border border-[#fde68a] text-xs text-[#92400e] flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#d97706] shrink-0 mt-0.5" />
                  <span>{msg.pedagogicalTip}</span>
                </div>
              )}
            </div>

            {/* User Avatar */}
            {!isAgent && (
              <div className="w-9 h-9 rounded-xl bg-[#2563eb] text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
        );
      })}

      {/* Generating / Streaming Indicator */}
      {isGenerating && (
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0f2942] text-white flex items-center justify-center shrink-0 shadow-xs mt-1 animate-pulse">
            <Bot className="w-5 h-5 text-[#38bdf8]" />
          </div>
          <div className="rounded-2xl p-4 bg-white border border-[#e2e8f0] border-l-4 border-l-[#38bdf8] text-[#0b1c30] shadow-xs flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-[#2563eb] animate-bounce delay-150" />
              <span className="w-2 h-2 rounded-full bg-[#0f2942] animate-bounce delay-300" />
            </div>
            <span className="text-xs font-medium text-[#64748b]">
              Analyzing question and formulating interview response...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
