import React, { useState } from 'react';
import { TECH_STACK_MATRIX } from '../data/mockData';
import { TechStackItem } from '../types';
import { Layers, Code2, CheckCircle2, Copy, Check, ChevronDown, ChevronUp, Cpu, Server, Shield, Sparkles } from 'lucide-react';

export const TechStackMatrix: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const categories = [
    { id: 'all', label: 'All Technologies (23)' },
    { id: 'frontend', label: 'Frontend & UI' },
    { id: 'backend', label: 'Backend & Async' },
    { id: 'ai', label: 'AI Agent & LLM' },
    { id: 'audio', label: 'STT & TTS Audio' },
    { id: 'data', label: 'Database & ORM' },
    { id: 'eval', label: 'Testing & Observability' },
    { id: 'devops', label: 'DevOps & Deployment' }
  ];

  const filteredItems = TECH_STACK_MATRIX.filter((item) => {
    if (selectedCategory === 'all') return true;
    return item.category === selectedCategory;
  });

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-white border border-[#e2e8f0] p-5 shadow-[0_2px_8px_-2px_rgba(15,41,66,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#2563eb]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0f2942]">
                Full-Stack Architecture & Technology Matrix
              </h2>
              <p className="text-xs text-[#64748b]">
                Complete breakdown of the 23 technologies powering the Sonic Clarity voice engine & rationale (&quot;Kyu&quot;)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-xs font-semibold flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
              All 23 Layers Online
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 mt-4 border-t border-[#e2e8f0] no-scrollbar">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                selectedCategory === c.id
                  ? 'bg-[#0f2942] text-white shadow-xs'
                  : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table View */}
      <div className="rounded-2xl bg-white border border-[#e2e8f0] shadow-[0_2px_8px_-2px_rgba(15,41,66,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8f9ff] border-b border-[#e2e8f0] text-xs font-bold uppercase tracking-wider text-[#0f2942]">
                <th className="py-3 px-4 w-40">Layer</th>
                <th className="py-3 px-4 w-60">Technology</th>
                <th className="py-3 px-4">Kyu (Rationale / Why Chosen)</th>
                <th className="py-3 px-4 w-28 text-center">Integration</th>
                <th className="py-3 px-4 w-24 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] text-xs">
              {filteredItems.map((item, idx) => {
                const isExpanded = expandedIndex === idx;
                return (
                  <React.Fragment key={`${item.layer}-${idx}`}>
                    <tr
                      onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                      className="hover:bg-[#f8f9ff] cursor-pointer transition-colors"
                    >
                      {/* Layer */}
                      <td className="py-3.5 px-4 font-bold text-[#0f2942] whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                          {item.layer}
                        </span>
                      </td>

                      {/* Technology */}
                      <td className="py-3.5 px-4 font-bold font-mono text-[#0051d5] whitespace-nowrap">
                        {item.technology}
                      </td>

                      {/* Kyu */}
                      <td className="py-3.5 px-4 text-[#475569] font-medium leading-relaxed">
                        {item.kyu}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-[10px] font-mono font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                          ACTIVE
                        </span>
                      </td>

                      {/* Chevron */}
                      <td className="py-3.5 px-4 text-right text-[#64748b]">
                        <button className="p-1 rounded-md hover:bg-[#e2e8f0]">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Drawer */}
                    {isExpanded && (
                      <tr className="bg-[#f8f9ff]/80">
                        <td colSpan={5} className="p-5 border-t border-[#e2e8f0]">
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            {/* Role description */}
                            <div className="lg:col-span-5 space-y-3">
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0f2942] mb-1">
                                  Architectural Role & Function
                                </h4>
                                <p className="text-xs text-[#475569] leading-relaxed">
                                  {item.role}
                                </p>
                              </div>

                              <div className="p-3 rounded-xl bg-white border border-[#e2e8f0] text-xs text-[#64748b] space-y-1 font-mono">
                                <div className="flex justify-between">
                                  <span>Layer Type:</span>
                                  <span className="text-[#0f2942] font-semibold uppercase">{item.category}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Status:</span>
                                  <span className="text-[#059669] font-semibold">Production Ready</span>
                                </div>
                              </div>
                            </div>

                            {/* Code snippet */}
                            <div className="lg:col-span-7 rounded-xl bg-[#001428] text-white p-4 font-mono text-xs relative">
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[11px] text-[#7991af]">
                                <span>Implementation Snippet</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyCode(item.codeSnippet, idx);
                                  }}
                                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[#38bdf8] flex items-center gap-1"
                                >
                                  {copiedIndex === idx ? (
                                    <Check className="w-3 h-3 text-[#059669]" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                  <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                                </button>
                              </div>
                              <pre className="overflow-x-auto text-[#d1e4ff] leading-relaxed max-h-48">
                                <code>{item.codeSnippet}</code>
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
