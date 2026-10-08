import React from 'react';
import { Mic, Rocket, Activity, Database, Layers, Award, Radio } from 'lucide-react';

export type ActiveTab = 'studio' | 'live_interview' | 'deploy' | 'langfuse' | 'rag' | 'techstack' | 'quiz';

interface HeaderProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  language: string;
  candidateName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onChangeTab,
  language,
  candidateName = 'Candidate'
}) => {
  const tabs = [
    { id: 'studio', label: 'Voice Studio', icon: Mic },
    { id: 'live_interview', label: 'Live AI Interview', icon: Radio },
    { id: 'deploy', label: 'Live Deploy Guide', icon: Rocket },
    { id: 'langfuse', label: 'Evaluation & Metrics', icon: Activity },
    { id: 'rag', label: 'Knowledge Base', icon: Database },
    { id: 'techstack', label: 'Architecture', icon: Layers },
    { id: 'quiz', label: 'Role Assessment', icon: Award },
  ];

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-[#e2e8f0]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f2942] text-white flex items-center justify-center shadow-md relative overflow-hidden group">
              <span className="font-display font-black text-lg tracking-wider text-[#38bdf8]">
                SC
              </span>
              <span className="absolute inset-0 bg-gradient-to-tr from-[#2563eb]/30 to-transparent pointer-events-none" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold font-display text-[#0f2942] tracking-tight">
                  Sonic Clarity
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#0051d5] border border-[#bfdbfe] text-[10px] font-mono font-bold">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] text-[#64748b] hidden sm:block">
                Voice AI Interview & Pedagogical Platform
              </p>
            </div>
          </div>

          {/* Active Candidate Session Badge */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#e2e8f0] text-xs shadow-2xs">
              <div className="w-5 h-5 rounded-full bg-[#0f2942] text-white flex items-center justify-center text-[10px] font-bold">
                {candidateName ? candidateName[0].toUpperCase() : 'C'}
              </div>
              <span className="font-semibold text-[#0f2942] hidden sm:inline">
                {candidateName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
              <span>Full Access</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 border-t border-[#e2e8f0]/60 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id as ActiveTab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#0f2942] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#0f2942] hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#38bdf8]' : 'text-[#64748b]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
