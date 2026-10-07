import React, { useState } from 'react';
import { Award, CheckCircle, XCircle, ArrowRight, RotateCcw, Volume2, Sparkles, Briefcase, FileText, RefreshCw, Check, BookOpen } from 'lucide-react';
import { speechHandler } from '../utils/speech';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  phoneticPracticeWord: string;
}

const DEFAULT_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: 'Why is LangGraph chosen over simple linear chains for this technical interview platform?',
    options: [
      'It supports cyclic state graphs, TypedDict memory persistence, and tool execution loops.',
      'It is written in C++ and runs faster than any other framework.',
      'It only works with static rule-based chatbots.',
      'It replaces the need for any database or checkpointer.'
    ],
    correctIndex: 0,
    explanation: 'LangGraph allows stateful agent workflows with cyclic loops, tool calling, and persistence via Redis/Postgres checkpointers.',
    phoneticPracticeWord: 'orchestration'
  },
  {
    id: 2,
    question: 'How do you handle 1 million concurrent users on a high-throughput API architecture?',
    options: [
      'Horizontal scaling with load balancers, multi-layer Redis caching, DB read replicas, and Celery worker queues.',
      'Upgrading a single machine CPU to 128 cores without any load balancer.',
      'Storing all user sessions inside local text files on the disk.',
      'Disabling all database indexes and using synchronous sleeps.'
    ],
    correctIndex: 0,
    explanation: 'Horizontal scaling behind load balancers with in-memory Redis caching and asynchronous queues prevents database bottlenecks.',
    phoneticPracticeWord: 'scalability'
  },
  {
    id: 3,
    question: 'In the RAG pipeline, which technology pair is used for semantic document ingestion and retrieval?',
    options: [
      'LlamaIndex for chunking + Chroma for vector storage with Gemini Embeddings.',
      'SQLite for full-text search without vectors.',
      'Celery for vector distance calculation.',
      'Alembic for chunking PDF documents.'
    ],
    correctIndex: 0,
    explanation: 'LlamaIndex handles document ingestion and hierarchical chunking, while ChromaDB persists 768-dimensional Gemini embeddings.',
    phoneticPracticeWord: 'embeddings'
  },
  {
    id: 4,
    question: 'Which framework is used for automated pedagogical evaluations (Faithfulness & Relevancy) of LLM answers?',
    options: [
      'DeepEval with custom evaluators + Langfuse tracing.',
      'PostgreSQL triggers.',
      'Argon2 password hashing.',
      'Docker Compose.'
    ],
    correctIndex: 0,
    explanation: 'DeepEval runs automated pedagogical assertions like FaithfulnessMetric and AnswerRelevancyMetric logged into Langfuse.',
    phoneticPracticeWord: 'evaluation'
  }
];

const PRESET_JDS = [
  {
    title: 'Full-Stack AI Software Engineer',
    requirements: 'React 19, TypeScript, FastAPI, LangGraph, Multi-Model Gemini, PostgreSQL, Docker, Redis caching, System Design for 1M+ requests.'
  },
  {
    title: 'Python Backend & Async Architect',
    requirements: 'FastAPI async coroutines, SQLAlchemy 2.0, Alembic migrations, Redis rate limiting, Celery background worker queues, JWT + Argon2 auth.'
  },
  {
    title: 'AI Agent & RAG Specialist',
    requirements: 'LangGraph state machines, cyclic graph routing, LlamaIndex vector retrieval, ChromaDB embeddings, DeepEval evaluation metrics.'
  },
  {
    title: 'Distributed Systems & Cloud Engineer',
    requirements: 'Horizontal scaling, Nginx load balancing, database read replicas, sharding, Docker Compose multi-container deployments.'
  }
];

export const QuizView: React.FC = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(DEFAULT_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Custom JD Generation State
  const [showJdEditor, setShowJdEditor] = useState(false);
  const [targetRole, setTargetRole] = useState('Full-Stack AI Software Engineer');
  const [jobDescription, setJobDescription] = useState('');
  const [isGeneratingJd, setIsGeneratingJd] = useState(false);
  const [activeJdTitle, setActiveJdTitle] = useState<string | null>(null);

  const currentQ = questions[currentIndex] || questions[0];

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    if (idx === currentQ.correctIndex) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  const handleSpeakQuestion = () => {
    speechHandler.speak(currentQ.question);
  };

  const handleSpeakWord = (word: string) => {
    speechHandler.speak(word);
  };

  // Generate Questions Tailored to User's Job Description
  const handleGenerateJdQuiz = async (e?: React.FormEvent, customRole?: string, customJd?: string) => {
    if (e) e.preventDefault();
    setIsGeneratingJd(true);

    const effectiveRole = customRole || targetRole;
    const effectiveJd = customJd !== undefined ? customJd : jobDescription;

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: effectiveRole,
          jobDescription: effectiveJd.trim() || undefined
        })
      });

      if (!res.ok) {
        throw new Error('Failed to generate tailored quiz');
      }

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setActiveJdTitle(data.role);
        setCurrentIndex(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setScore(0);
        setIsFinished(false);
        setShowJdEditor(false);
      }
    } catch (err) {
      console.warn('Error generating dynamic JD questions:', err);
    } finally {
      setIsGeneratingJd(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-white border border-[#e2e8f0] p-5 shadow-[0_2px_8px_-2px_rgba(15,41,66,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#2563eb]">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#0f2942]">Interview Assessment Quiz</h2>
              {activeJdTitle && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#eff4ff] text-[#2563eb] border border-[#bfdbfe]">
                  JD Tailored
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748b]">
              {activeJdTitle
                ? `Customized questions for: ${activeJdTitle}`
                : 'Targeted technical & architectural questions matching your Job Description'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowJdEditor(!showJdEditor)}
            className="px-3 py-1.5 rounded-xl bg-[#0f2942] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Briefcase className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Customize for My JD</span>
          </button>
          <div className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[#f1f5f9] text-[#0f2942]">
            {currentIndex + 1} / {questions.length}
          </div>
        </div>
      </div>

      {/* Quick JD Presets */}
      <div className="p-4 rounded-2xl bg-white border border-[#e2e8f0] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-[#2563eb]" />
            Quick JD Roles (Click to auto-generate questions):
          </span>
          {isGeneratingJd && (
            <span className="text-xs font-semibold text-[#2563eb] flex items-center gap-1 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Generating questions...
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRESET_JDS.map((preset, idx) => (
            <button
              key={idx}
              disabled={isGeneratingJd}
              onClick={() => {
                setTargetRole(preset.title);
                setJobDescription(preset.requirements);
                handleGenerateJdQuiz(undefined, preset.title, preset.requirements);
              }}
              className="p-2.5 rounded-xl border border-[#e2e8f0] hover:border-[#2563eb] hover:bg-[#eff4ff] text-left transition-colors group shadow-2xs"
            >
              <div className="text-xs font-bold text-[#0f2942] group-hover:text-[#2563eb] flex items-center justify-between">
                <span>{preset.title}</span>
                <Sparkles className="w-3 h-3 text-[#38bdf8] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[11px] text-[#64748b] truncate mt-0.5">{preset.requirements}</div>
            </button>
          ))}
        </div>
      </div>

      {/* JD Customization Drawer */}
      {showJdEditor && (
        <form onSubmit={(e) => handleGenerateJdQuiz(e)} className="p-5 rounded-2xl bg-white border-2 border-[#2563eb] shadow-md space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f2942] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#2563eb]" />
              Paste or Edit Your Target Job Description (JD)
            </h3>
            <button
              type="button"
              onClick={() => setShowJdEditor(false)}
              className="text-xs text-[#64748b] hover:text-[#0f2942]"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0f2942] mb-1">Target Job Role / Position</label>
            <input
              type="text"
              required
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Full-Stack AI Engineer, Python Backend Specialist"
              className="w-full text-xs border border-[#e2e8f0] rounded-xl p-2.5 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none bg-[#f8f9ff]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0f2942] mb-1">Paste Job Description (JD) / Requirements</label>
            <textarea
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste requirements from your job description (e.g. 'Must have experience with FastAPI, Redis caching, LangGraph agent workflows, PostgreSQL, Docker, and handling high concurrent traffic')..."
              className="w-full text-xs border border-[#e2e8f0] rounded-xl p-2.5 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none bg-[#f8f9ff]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              disabled={isGeneratingJd}
              className="px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-xs"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingJd ? 'animate-spin' : ''}`} />
              <span>{isGeneratingJd ? 'Generating Tailored Questions...' : 'Generate Questions from My JD'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Main Question Card */}
      {!isFinished ? (
        <div className="rounded-2xl bg-white border border-[#e2e8f0] p-6 shadow-[0_2px_8px_-2px_rgba(15,41,66,0.04)] space-y-5">
          {/* Question Text */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="text-base sm:text-lg font-bold text-[#0f2942] leading-snug">
                {currentQ.question}
              </h3>
              <button
                onClick={handleSpeakQuestion}
                className="p-1.5 rounded-lg text-[#2563eb] hover:bg-[#eff4ff] transition-colors shrink-0"
                title="Speak question (TTS)"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#64748b] mt-1">
              <span>Phonetics Practice Term:</span>
              <button
                onClick={() => handleSpeakWord(currentQ.phoneticPracticeWord)}
                className="px-2 py-0.5 rounded bg-[#eff4ff] text-[#2563eb] font-mono font-medium hover:bg-[#dbeafe] flex items-center gap-1"
              >
                <span>&quot;{currentQ.phoneticPracticeWord}&quot;</span>
                <Volume2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {currentQ.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === currentQ.correctIndex;

              let btnClass = 'bg-[#f8f9ff] border-[#e2e8f0] text-[#0f2942] hover:bg-[#eff4ff]';
              if (isAnswered) {
                if (isCorrect) {
                  btnClass = 'bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46] font-semibold';
                } else if (isSelected) {
                  btnClass = 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]';
                } else {
                  btnClass = 'bg-[#f8f9ff] opacity-60 border-[#e2e8f0] text-[#64748b]';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={isAnswered}
                  className={`w-full p-4 rounded-xl text-xs sm:text-sm text-left border transition-all flex items-start justify-between gap-3 ${btnClass}`}
                >
                  <span>{opt}</span>
                  {isAnswered && isCorrect && (
                    <CheckCircle className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <XCircle className="w-4 h-4 text-[#dc2626] shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Banner */}
          {isAnswered && (
            <div className="p-4 rounded-xl bg-[#eff4ff] border border-[#bfdbfe] text-xs text-[#1e40af] space-y-1">
              <span className="font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Technical Rationale:
              </span>
              <p>{currentQ.explanation}</p>
            </div>
          )}

          {/* Next Button */}
          {isAnswered && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-[#2563eb] text-white text-xs font-semibold hover:bg-[#1d4ed8] transition-colors flex items-center gap-2 shadow-xs"
              >
                <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Results Screen */
        <div className="rounded-2xl bg-white border border-[#e2e8f0] p-8 shadow-[0_2px_8px_-2px_rgba(15,41,66,0.04)] text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#059669] mx-auto flex items-center justify-center">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-[#0f2942]">Interview Assessment Complete!</h3>
            <p className="text-xs text-[#64748b] mt-1">
              {activeJdTitle && <span>Role: <strong>{activeJdTitle}</strong> • </span>}
              You scored {score} out of {questions.length} ({Math.round((score / questions.length) * 100)}%)
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] max-w-sm mx-auto text-xs text-[#475569]">
            {score === questions.length
              ? 'Outstanding performance! You showed complete command over the technical requirements of this position.'
              : 'Great work! Review the LangGraph state machine, Redis checkpointers, and RAG ingestion concepts to reinforce your readiness.'}
          </div>

          <button
            onClick={handleRestart}
            className="px-5 py-2.5 rounded-xl bg-[#0f2942] text-white text-xs font-semibold hover:bg-[#1d4ed8] transition-colors inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retake Assessment</span>
          </button>
        </div>
      )}
    </div>
  );
};
