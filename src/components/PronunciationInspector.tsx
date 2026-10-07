import React, { useState } from 'react';
import { PhoneticWord } from '../types';
import { Volume2, Award, Info, Sparkles, AlertTriangle, CheckCircle2, RotateCcw, Mic, Check, Plus, HelpCircle } from 'lucide-react';
import { speechHandler } from '../utils/speech';

interface PronunciationInspectorProps {
  phonetics: PhoneticWord[];
  flaggedMispronunciations?: PhoneticWord[];
  overallAccuracy?: number;
  tip?: string;
  onClearFlagged?: () => void;
  onAddCustomWord?: (word: PhoneticWord) => void;
}

export const PronunciationInspector: React.FC<PronunciationInspectorProps> = ({
  phonetics,
  flaggedMispronunciations = [],
  overallAccuracy = 94,
  tip = 'Cadence is steady. Focus on softer consonant glides during multi-syllabic technical terms.',
  onClearFlagged,
  onAddCustomWord
}) => {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'turn'>('watchlist');
  const [activeWordIndex, setActiveWordIndex] = useState<number>(0);
  const [playingSyllable, setPlayingSyllable] = useState<string | null>(null);
  const [isPlayingWord, setIsPlayingWord] = useState<boolean>(false);
  const [isDrillingMic, setIsDrillingMic] = useState<boolean>(false);
  const [drillFeedback, setDrillFeedback] = useState<string | null>(null);
  const [customWordInput, setCustomWordInput] = useState<string>('');
  const [masteredWords, setMasteredWords] = useState<Set<string>>(new Set());

  // Merge flagged mispronunciations with current turn words
  const activeWordList =
    activeTab === 'watchlist'
      ? (flaggedMispronunciations.length > 0 ? flaggedMispronunciations : phonetics)
      : (phonetics.length > 0 ? phonetics : flaggedMispronunciations);

  const selectedWord = activeWordList[activeWordIndex] || activeWordList[0];

  const handlePlayWord = (word: string) => {
    setIsPlayingWord(true);
    speechHandler.speak(word, {
      onEnd: () => setIsPlayingWord(false)
    });
  };

  const handlePlaySyllable = (syllableText: string) => {
    setPlayingSyllable(syllableText);
    speechHandler.speak(syllableText, {
      onEnd: () => setPlayingSyllable(null)
    });
  };

  // Live Drill: Test pronunciation using microphone
  const handleTestPronunciation = () => {
    if (!selectedWord) return;

    if (isDrillingMic) {
      speechHandler.stopListening();
      setIsDrillingMic(false);
      return;
    }

    setDrillFeedback('Listening to your spoken attempt...');
    setIsDrillingMic(true);

    const started = speechHandler.startSpeechRecognition(
      (recognized, isFinal) => {
        if (isFinal || recognized.length > 2) {
          const cleanRec = recognized.toLowerCase().trim();
          const target = selectedWord.word.toLowerCase().trim();
          speechHandler.stopListening();
          setIsDrillingMic(false);

          if (cleanRec.includes(target) || target.includes(cleanRec)) {
            setDrillFeedback(`✅ Excellent! Accurately pronounced "${selectedWord.word}".`);
            setMasteredWords(new Set([...masteredWords, selectedWord.word]));
          } else {
            setDrillFeedback(`⚠️ Detected: "${recognized}". Keep the stress on the syllable "${selectedWord.syllables.find(s => s.status === 'warning')?.text || selectedWord.word.slice(0, 3)}".`);
          }
        }
      },
      (err) => {
        setIsDrillingMic(false);
        setDrillFeedback('Microphone ended. Practice listening to the syllable breakdown above.');
      },
      () => {
        setIsDrillingMic(false);
      }
    );

    if (!started) {
      setIsDrillingMic(false);
      setDrillFeedback(`Simulated drill: Practice repeating "${selectedWord.word}" with stress on ${selectedWord.ipa}`);
      setTimeout(() => {
        setDrillFeedback(`✅ Good articulation on "${selectedWord.word}".`);
        setMasteredWords(new Set([...masteredWords, selectedWord.word]));
      }, 1500);
    }
  };

  const handleMarkMastered = (word: string) => {
    const updated = new Set(masteredWords);
    if (updated.has(word)) {
      updated.delete(word);
    } else {
      updated.add(word);
    }
    setMasteredWords(updated);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const w = customWordInput.trim().toLowerCase();
    if (!w) return;

    const newPhonetic: PhoneticWord = {
      word: w,
      ipa: `/${w}/`,
      syllables: [
        { text: w.slice(0, Math.ceil(w.length / 2)), status: 'correct' },
        { text: w.slice(Math.ceil(w.length / 2)), status: 'warning' }
      ],
      note: 'Added from custom practice.'
    };

    if (onAddCustomWord) {
      onAddCustomWord(newPhonetic);
    }
    setCustomWordInput('');
  };

  return (
    <div className="rounded-2xl bg-white border border-[#e2e8f0] p-5 shadow-[0_2px_8px_-2px_rgba(15,41,66,0.04)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#2563eb]">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0f2942]">Pronunciation Inspector</h3>
            <p className="text-xs text-[#64748b]">Live session mispronunciation notes & phonetic drills</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46]">
          <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
          <span className="text-xs font-bold font-mono">{overallAccuracy}%</span>
          <span className="text-[10px] uppercase font-semibold">Score</span>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-[#f1f5f9] p-0.5 rounded-lg border border-[#e2e8f0]">
          <button
            onClick={() => {
              setActiveTab('watchlist');
              setActiveWordIndex(0);
              setDrillFeedback(null);
            }}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'watchlist'
                ? 'bg-white text-[#2563eb] shadow-xs'
                : 'text-[#64748b] hover:text-[#0f2942]'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-[#d97706]" />
            <span>Live Mistakes ({flaggedMispronunciations.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('turn');
              setActiveWordIndex(0);
              setDrillFeedback(null);
            }}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'turn'
                ? 'bg-white text-[#0f2942] shadow-xs'
                : 'text-[#64748b] hover:text-[#0f2942]'
            }`}
          >
            Turn Words ({phonetics.length})
          </button>
        </div>

        {flaggedMispronunciations.length > 0 && onClearFlagged && (
          <button
            onClick={onClearFlagged}
            className="text-[11px] font-semibold text-[#64748b] hover:text-[#dc2626] flex items-center gap-1 transition-colors"
            title="Clear list"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Word pills selector */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
        {activeWordList.length > 0 ? (
          activeWordList.map((item, idx) => {
            const isSelected = idx === activeWordIndex;
            const isMastered = masteredWords.has(item.word);
            const hasWarning = item.syllables.some(
              (s) => s.status === 'warning' || s.status === 'critical'
            );

            return (
              <button
                key={`${item.word}-${idx}`}
                onClick={() => {
                  setActiveWordIndex(idx);
                  setDrillFeedback(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                  isSelected
                    ? 'bg-[#0f2942] text-white shadow-sm'
                    : isMastered
                    ? 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]'
                    : hasWarning
                    ? 'bg-[#fffbeb] text-[#92400e] border border-[#fde68a]'
                    : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
                }`}
              >
                <span>{item.word}</span>
                {isMastered ? (
                  <Check className="w-3 h-3 text-[#059669]" />
                ) : hasWarning ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                ) : null}
              </button>
            );
          })
        ) : (
          <div className="text-xs text-[#64748b] py-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
            <span>No pronunciation mistakes noted yet. Practice speaking with the AI!</span>
          </div>
        )}
      </div>

      {/* Main Pronunciation Dual-Layer Card */}
      {selectedWord && (
        <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-[#0f2942]">
                  {selectedWord.word}
                </span>
                <span className="font-mono text-xs text-[#2563eb] bg-[#eff4ff] px-2 py-0.5 rounded border border-[#bfdbfe]">
                  {selectedWord.ipa}
                </span>
                <button
                  onClick={() => handlePlayWord(selectedWord.word)}
                  className={`p-1.5 rounded-full transition-all ${
                    isPlayingWord
                      ? 'bg-[#2563eb] text-white scale-110 shadow-sm'
                      : 'text-[#2563eb] hover:bg-[#dbeafe]'
                  }`}
                  title="Listen to correct pronunciation"
                >
                  <Volume2 className={`w-4 h-4 ${isPlayingWord ? 'animate-bounce' : ''}`} />
                </button>
              </div>

              {selectedWord.note && (
                <p className="text-xs text-[#64748b] mt-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-[#2563eb] shrink-0" />
                  <span>{selectedWord.note}</span>
                </p>
              )}
            </div>

            {/* Syllable Controls */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wider mr-1">
                Syllables:
              </span>
              {selectedWord.syllables.map((syl, sIdx) => {
                let badgeClass = 'bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]';
                if (syl.status === 'warning') {
                  badgeClass = 'bg-[#fffbeb] text-[#92400e] border-[#fde68a]';
                } else if (syl.status === 'critical') {
                  badgeClass = 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]';
                }

                const isCurrentlyPlaying = playingSyllable === syl.text;

                return (
                  <button
                    key={`${syl.text}-${sIdx}`}
                    onClick={() => handlePlaySyllable(syl.text)}
                    className={`h-7 px-2.5 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-transform active:scale-95 ${badgeClass} ${
                      isCurrentlyPlaying ? 'ring-2 ring-[#2563eb] scale-105' : ''
                    }`}
                    title={`Click to hear syllable "${syl.text}"`}
                  >
                    <span>{syl.text}</span>
                    <Volume2 className="w-3 h-3 opacity-70" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Spoken Drill & Master Action */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#e2e8f0]">
            <button
              onClick={handleTestPronunciation}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs ${
                isDrillingMic
                  ? 'bg-[#dc2626] text-white animate-pulse'
                  : 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{isDrillingMic ? 'Listening to you...' : 'Test My Pronunciation (Mic)'}</span>
            </button>

            <button
              onClick={() => handleMarkMastered(selectedWord.word)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                masteredWords.has(selectedWord.word)
                  ? 'bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0]'
                  : 'bg-white border border-[#e2e8f0] text-[#475569] hover:bg-[#f8f9ff]'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{masteredWords.has(selectedWord.word) ? 'Marked as Corrected' : 'Mark as Corrected'}</span>
            </button>
          </div>

          {drillFeedback && (
            <div className="p-2.5 rounded-xl bg-white border border-[#bfdbfe] text-xs font-medium text-[#1e40af] animate-in fade-in">
              {drillFeedback}
            </div>
          )}
        </div>
      )}

      {/* Add Custom Term Input */}
      <form onSubmit={handleAddCustom} className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={customWordInput}
          onChange={(e) => setCustomWordInput(e.target.value)}
          placeholder="Add custom word to inspect (e.g. kubernetes, sharding)..."
          className="flex-1 text-xs bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl px-3 py-2 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
        />
        <button
          type="submit"
          disabled={!customWordInput.trim()}
          className="px-3 py-2 rounded-xl bg-[#0f2942] hover:bg-[#2563eb] text-white text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Pedagogical Guidance Tip */}
      {tip && (
        <div className="flex items-start gap-2 text-xs text-[#475569] bg-[#eff4ff]/60 p-2.5 rounded-xl border border-[#dbeafe]">
          <span className="font-semibold text-[#2563eb] shrink-0">Pedagogical Advice:</span>
          <span>{tip}</span>
        </div>
      )}
    </div>
  );
};
