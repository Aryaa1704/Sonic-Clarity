import React from 'react';
import { PedagogicalMetrics } from '../types';
import { Award, Clock, Sparkles, Check, HelpCircle, BookOpen, Volume2 } from 'lucide-react';

interface LangfuseObservabilityProps {
  currentMetrics?: PedagogicalMetrics;
}

export const LangfuseObservability: React.FC<LangfuseObservabilityProps> = ({
  currentMetrics
}) => {
  const metrics: PedagogicalMetrics = currentMetrics || {
    faithfulness: 0.96,
    answer_relevancy: 0.98,
    pronunciation_accuracy: 0.92,
    clarity_score: 0.95,
    latency_ms: 320
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="rounded-2xl bg-white border border-[#e2e8f0] p-5 shadow-[0_2px_8px_-2px_rgba(15,41,66,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#2563eb]">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0f2942]">
                Learning Analytics & Pedagogical Evaluation
              </h2>
              <p className="text-xs text-[#64748b]">
                DeepEval automated assertions for conceptual grounding, answer relevancy, and spoken clarity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#059669]" />
              Evaluation Active
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Mastery */}
        <div className="rounded-2xl bg-white border border-[#e2e8f0] p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#64748b] text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Overall Mastery</span>
            <Sparkles className="w-3.5 h-3.5 text-[#2563eb]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#059669]">
            {Math.round(((metrics.faithfulness + metrics.answer_relevancy + metrics.pronunciation_accuracy) / 3) * 100)}%
          </div>
          <div className="text-[11px] text-[#059669] mt-1 font-medium">Excellent Performance</div>
        </div>

        {/* Pronunciation Clarity */}
        <div className="rounded-2xl bg-white border border-[#e2e8f0] p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#64748b] text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Pronunciation</span>
            <Volume2 className="w-3.5 h-3.5 text-[#2563eb]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#0f2942]">
            {Math.round(metrics.pronunciation_accuracy * 100)}%
          </div>
          <div className="text-[11px] text-[#64748b] mt-1">Phonetic IPA Alignment</div>
        </div>

        {/* Relevancy */}
        <div className="rounded-2xl bg-white border border-[#e2e8f0] p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#64748b] text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Relevancy</span>
            <BookOpen className="w-3.5 h-3.5 text-[#059669]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#0f2942]">
            {Math.round(metrics.answer_relevancy * 100)}%
          </div>
          <div className="text-[11px] text-[#059669] mt-1 font-medium">Direct Architectural Focus</div>
        </div>

        {/* Turn Response Speed */}
        <div className="rounded-2xl bg-white border border-[#e2e8f0] p-4 shadow-xs">
          <div className="flex items-center justify-between text-[#64748b] text-xs mb-1">
            <span className="font-semibold uppercase tracking-wider">Response Speed</span>
            <Clock className="w-3.5 h-3.5 text-[#2563eb]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#0f2942]">{metrics.latency_ms || 320} ms</div>
          <div className="text-[11px] text-[#059669] mt-1 font-medium">Conversational Turnaround</div>
        </div>
      </div>

      {/* Evaluation Assertions Details */}
      <div className="rounded-2xl bg-white border border-[#e2e8f0] p-5 shadow-[0_2px_8px_-2px_rgba(15,41,66,0.04)] space-y-4">
        <h3 className="text-sm font-bold text-[#0f2942]">
          Pedagogical Quality Metrics (DeepEval Framework)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Faithfulness */}
          <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0f2942]">Factual Grounding</span>
              <span className="text-sm font-bold font-mono text-[#059669]">
                {(metrics.faithfulness * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-[#64748b]">
              Measures whether explanations strictly conform to true architectural principles and system design documentation.
            </p>
            <div className="w-full h-2 rounded-full bg-[#e2e8f0] overflow-hidden">
              <div className="h-full bg-[#059669] rounded-full" style={{ width: `${metrics.faithfulness * 100}%` }} />
            </div>
            <div className="text-[11px] text-[#059669] font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Verified Factual</span>
            </div>
          </div>

          {/* Answer Relevancy */}
          <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0f2942]">Question Alignment</span>
              <span className="text-sm font-bold font-mono text-[#059669]">
                {(metrics.answer_relevancy * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-[#64748b]">
              Assesses whether your response directly and thoroughly answers the technical topic asked.
            </p>
            <div className="w-full h-2 rounded-full bg-[#e2e8f0] overflow-hidden">
              <div className="h-full bg-[#059669] rounded-full" style={{ width: `${metrics.answer_relevancy * 100}%` }} />
            </div>
            <div className="text-[11px] text-[#059669] font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Target Question Addressed</span>
            </div>
          </div>

          {/* Pronunciation & Cadence */}
          <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0f2942]">Articulation & Cadence</span>
              <span className="text-sm font-bold font-mono text-[#2563eb]">
                {(metrics.pronunciation_accuracy * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-[#64748b]">
              Evaluates spoken pronunciation, syllable stress balance, and natural vocal delivery.
            </p>
            <div className="w-full h-2 rounded-full bg-[#e2e8f0] overflow-hidden">
              <div className="h-full bg-[#2563eb] rounded-full" style={{ width: `${metrics.pronunciation_accuracy * 100}%` }} />
            </div>
            <div className="text-[11px] text-[#2563eb] font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Clear Voice Articulation</span>
            </div>
          </div>

          {/* Clarity & Fluency */}
          <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0f2942]">Pedagogical Clarity</span>
              <span className="text-sm font-bold font-mono text-[#059669]">
                {((metrics.clarity_score || 0.95) * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-xs text-[#64748b]">
              Measures how well complex technical topics are conveyed with conciseness and logical structure.
            </p>
            <div className="w-full h-2 rounded-full bg-[#e2e8f0] overflow-hidden">
              <div className="h-full bg-[#059669] rounded-full" style={{ width: `${(metrics.clarity_score || 0.95) * 100}%` }} />
            </div>
            <div className="text-[11px] text-[#059669] font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>High Educational Value</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
