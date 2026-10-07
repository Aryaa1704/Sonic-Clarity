import React, { useState } from 'react';
import { GitBranch, Play, CheckCircle2, ArrowRight, Layers, Database, Cpu, Volume2, ShieldCheck, Zap } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  technology: string;
  category: 'input' | 'retrieval' | 'agent' | 'llm' | 'eval' | 'output';
  description: string;
  inputState: string[];
  outputState: string[];
  code: string;
}

const GRAPH_NODES: GraphNode[] = [
  {
    id: 'stt_ingest',
    label: 'STT Audio Ingestion',
    technology: 'Deepgram Nova-2',
    category: 'input',
    description: 'Streams live microphone audio buffer via WebSocket, extracts word-level timestamps and acoustic confidence.',
    inputState: ['raw_pcm_audio', 'sample_rate_24khz'],
    outputState: ['transcript_text', 'word_timestamps', 'acoustic_confidence'],
    code: `async def stt_audio_ingest(state: AgentState):
    transcript = await deepgram_ws.transcribe(state["raw_pcm_audio"])
    return {"transcript_text": transcript.text, "acoustic_confidence": transcript.confidence}`
  },
  {
    id: 'rag_retrieval',
    label: 'RAG Context Retrieval',
    technology: 'LlamaIndex + Chroma',
    category: 'retrieval',
    description: 'Generates Gemini embeddings for user utterance, queries ChromaDB vector index with cosine similarity.',
    inputState: ['transcript_text', 'active_topic'],
    outputState: ['retrieved_chunks', 'vector_similarity_score'],
    code: `async def rag_retrieval(state: AgentState):
    query_vector = await gemini_embed(state["transcript_text"])
    chunks = chroma_collection.query(query_embeddings=[query_vector], n_results=3)
    return {"retrieved_chunks": chunks["documents"][0]}`
  },
  {
    id: 'agent_router',
    label: 'Stateful Agent Router',
    technology: 'LangGraph v0.2',
    category: 'agent',
    description: 'Cyclic state machine evaluating user intent, conversation history, and routing to specialized tools.',
    inputState: ['conversation_history', 'transcript_text', 'retrieved_chunks'],
    outputState: ['target_tool', 'pedagogical_intent', 'memory_checkpoint_id'],
    code: `def route_next_step(state: AgentState) -> Literal["phonetics_eval", "gemini_synthesis"]:
    if "pronounce" in state["transcript_text"].lower():
        return "phonetics_eval"
    return "gemini_synthesis"`
  },
  {
    id: 'gemini_inference',
    label: 'Foundation LLM Reasoning',
    technology: 'Gemini 3.8 Flash',
    category: 'llm',
    description: 'Synthesizes spoken-friendly pedagogical answers, handles multilingual idioms and Technical Socratic guidance.',
    inputState: ['retrieved_chunks', 'conversation_history', 'system_prompt'],
    outputState: ['ai_text_response', 'pedagogical_tip'],
    code: `async def gemini_inference(state: AgentState):
    prompt = build_pedagogical_prompt(state)
    response = await ai.models.generate_content(
        model="gemini-3.8-flash",
        contents=prompt
    )
    return {"ai_text_response": response.text}`
  },
  {
    id: 'phonetics_eval',
    label: 'Pronunciation & Syllable Analyzer',
    technology: 'Phonetic NLP Parser',
    category: 'eval',
    description: 'Deconstructs spoken terminology into IPA phoneme syllables, calculates stress cadence, marks mispronunciations.',
    inputState: ['ai_text_response', 'transcript_text'],
    outputState: ['phonetic_breakdown', 'pronunciation_score'],
    code: `def analyze_phonetics(state: AgentState):
    syllables = ipa_parser.decompose(state["ai_text_response"])
    score = calculate_acoustic_match(state["transcript_text"], syllables)
    return {"phonetic_breakdown": syllables, "pronunciation_score": score}`
  },
  {
    id: 'deepeval_node',
    label: 'Automated Evaluation Unit',
    technology: 'DeepEval + Langfuse',
    category: 'eval',
    description: 'Calculates live Faithfulness, Answer Relevancy, and Hallucination scores before audio delivery.',
    inputState: ['ai_text_response', 'retrieved_chunks', 'transcript_text'],
    outputState: ['faithfulness_score', 'relevancy_score', 'hallucination_score'],
    code: `def deepeval_scorer(state: AgentState):
    test_case = LLMTestCase(input=state["transcript_text"], actual_output=state["ai_text_response"])
    faithfulness = FaithfulnessMetric().measure(test_case)
    return {"faithfulness_score": faithfulness.score}`
  },
  {
    id: 'tts_streaming',
    label: 'Conversational Voice Synthesis',
    technology: 'ElevenLabs Turbo v2.5',
    category: 'output',
    description: 'Generates ultra-low-latency 24kHz conversational audio stream with natural prosody and emotional cadence.',
    inputState: ['ai_text_response', 'voice_persona', 'speech_rate'],
    outputState: ['streamed_audio_chunks', 'end_of_turn'],
    code: `async def tts_streaming(state: AgentState):
    async for chunk in elevenlabs.stream(state["ai_text_response"]):
        await websocket.send_bytes(chunk)
    return {"end_of_turn": True}`
  }
];

export const LangGraphView: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('agent_router');
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const selectedNode = GRAPH_NODES.find((n) => n.id === selectedNodeId) || GRAPH_NODES[2];

  const handleRunSimulation = () => {
    setIsSimulating(true);
    let step = 0;
    const interval = setInterval(() => {
      if (step < GRAPH_NODES.length) {
        setActiveStepIndex(step);
        setSelectedNodeId(GRAPH_NODES[step].id);
        step++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 1100);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl bg-white border border-[#e2e8f0] p-5 shadow-[0_2px_8px_-2px_rgba(15,41,66,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#2563eb]">
                <GitBranch className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#0f2942]">
                  LangGraph Stateful Multi-Agent Architecture
                </h2>
                <p className="text-xs text-[#64748b]">
                  Stateful cyclic graph with TypedDict memory, Redis checkpointers, and tool invocation nodes
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              isSimulating
                ? 'bg-[#dbeafe] text-[#2563eb] cursor-wait'
                : 'bg-[#2563eb] text-white hover:bg-[#1d4ed8] shadow-xs'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Running Graph Execution...' : 'Simulate Turn Execution'}</span>
          </button>
        </div>
      </div>

      {/* Visual Workflow Graph Pipeline */}
      <div className="rounded-2xl bg-white border border-[#e2e8f0] p-6 shadow-[0_2px_8px_-2px_rgba(15,41,66,0.04)] overflow-x-auto">
        <div className="flex items-center justify-between min-w-[760px] relative py-4">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-[#e2e8f0] -translate-y-1/2 z-0" />

          {GRAPH_NODES.map((node, idx) => {
            const isSelected = node.id === selectedNodeId;
            const isPulsing = activeStepIndex === idx;

            return (
              <div key={node.id} className="relative z-10 flex flex-col items-center">
                <button
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                    isPulsing
                      ? 'bg-[#38bdf8] text-white ring-4 ring-[#38bdf8]/30 scale-110 shadow-lg'
                      : isSelected
                      ? 'bg-[#0f2942] text-white ring-2 ring-[#2563eb] scale-105 shadow-md'
                      : 'bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#2563eb] hover:text-[#2563eb]'
                  }`}
                  title={node.label}
                >
                  {node.category === 'input' && <Zap className="w-5 h-5" />}
                  {node.category === 'retrieval' && <Database className="w-5 h-5" />}
                  {node.category === 'agent' && <GitBranch className="w-5 h-5" />}
                  {node.category === 'llm' && <Cpu className="w-5 h-5" />}
                  {node.category === 'eval' && <ShieldCheck className="w-5 h-5" />}
                  {node.category === 'output' && <Volume2 className="w-5 h-5" />}
                </button>

                <div className="text-center mt-2 w-24">
                  <div className={`text-[11px] font-bold leading-tight ${isSelected ? 'text-[#2563eb]' : 'text-[#0f2942]'}`}>
                    {node.label}
                  </div>
                  <div className="text-[10px] text-[#64748b] font-mono mt-0.5 truncate">
                    {node.technology}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Metadata & State schema */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-[#e2e8f0] p-5 shadow-[0_2px_8px_-2px_rgba(15,41,66,0.04)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#2563eb] bg-[#eff4ff] px-2 py-0.5 rounded">
                Node ID: {selectedNode.id}
              </span>
              <h3 className="text-base font-bold text-[#0f2942] mt-1">{selectedNode.label}</h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#f1f5f9] text-[#475569] font-mono">
              {selectedNode.technology}
            </span>
          </div>

          <p className="text-xs text-[#475569] leading-relaxed">
            {selectedNode.description}
          </p>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#2563eb]" />
              Input State Schema (TypedDict keys)
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {selectedNode.inputState.map((key) => (
                <span
                  key={key}
                  className="px-2 py-1 rounded bg-[#eff4ff] text-[#2563eb] font-mono text-[11px] font-medium"
                >
                  +{key}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
              Output State Mutations
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {selectedNode.outputState.map((key) => (
                <span
                  key={key}
                  className="px-2 py-1 rounded bg-[#ecfdf5] text-[#065f46] font-mono text-[11px] font-medium"
                >
                  → {key}
                </span>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#f8f9ff] border border-[#e2e8f0] text-xs text-[#64748b] space-y-1">
            <div className="flex justify-between">
              <span>Checkpoint Storage:</span>
              <span className="font-mono text-[#059669] font-medium">In-Memory Checkpoint Memory</span>
            </div>
            <div className="flex justify-between">
              <span>State Persistence:</span>
              <span className="font-mono text-[#0f2942]">Active Conversational State</span>
            </div>
          </div>
        </div>

        {/* Right: Python Source Code */}
        <div className="lg:col-span-7 rounded-2xl bg-[#001428] border border-[#0f2942] p-5 text-white shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#dc2626]" />
                <span className="w-3 h-3 rounded-full bg-[#d97706]" />
                <span className="w-3 h-3 rounded-full bg-[#059669]" />
                <span className="text-xs font-mono text-[#7991af] ml-2">
                  app/agent/nodes/{selectedNode.id}.py
                </span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-[#38bdf8]">
                Python 3.12 / LangGraph
              </span>
            </div>

            <pre className="text-xs font-mono text-[#d1e4ff] overflow-x-auto p-2 leading-relaxed">
              <code>{selectedNode.code}</code>
            </pre>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#7991af]">
            <span>FastAPI async worker ready</span>
            <span className="text-[#38bdf8] font-mono">Latency SLA: &lt; 250ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
