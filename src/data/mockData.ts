import { TechStackItem, RagDocument, VoiceOption, ChatMessage } from '../types';

export const TECH_STACK_MATRIX: TechStackItem[] = [
  {
    layer: 'Frontend',
    technology: 'React + TypeScript + Vite',
    kyu: 'Fast, clean, interview-friendly',
    category: 'frontend',
    role: 'Client-side SPA with lightning-fast HMR, strict type safety, and modular component hierarchy.',
    codeSnippet: `// src/main.tsx
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);`,
    status: 'ACTIVE'
  },
  {
    layer: 'UI',
    technology: 'Tailwind CSS',
    kyu: 'Quickly professional UI',
    category: 'frontend',
    role: 'Utility-first styling with bespoke design tokens for Sonic Clarity maritime blues and cyan accents.',
    codeSnippet: `@import "tailwindcss";
/* Sonic Clarity Pedagogical Theme */
:root {
  --primary: #0F2942;
  --secondary: #2563EB;
  --tertiary: #38BDF8;
}`,
    status: 'ACTIVE'
  },
  {
    layer: 'Backend',
    technology: 'Python + FastAPI',
    kyu: 'AI/ML + async APIs ke liye best fit',
    category: 'backend',
    role: 'High-throughput async ASGI web framework with Starlette routing and native coroutine streaming.',
    codeSnippet: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Voice Pedagogical Engine")

@app.post("/api/v1/voice/turn")
async def process_voice_turn(turn: VoiceTurnRequest):
    agent_output = await agent_pipeline.ainvoke(turn.dict())
    return agent_output`,
    status: 'ACTIVE'
  },
  {
    layer: 'AI Agent',
    technology: 'Stateful Agent Engine',
    kyu: 'Stateful agent + tool calling + workflows',
    category: 'ai',
    role: 'Cyclic stateful graph orchestrating tool execution, conversational memory checkpointers, and conditional edge routing.',
    codeSnippet: `from core.graph import StateGraph, START, END
from typing import TypedDict

class AgentState(TypedDict):
    messages: list[dict]
    phonetic_scores: dict
    retrieved_chunks: list[str]

workflow = StateGraph(AgentState)
workflow.add_node("rag_retrieval", retrieve_knowledge)
workflow.add_node("agent_reasoning", call_reasoning_model)
workflow.add_edge(START, "rag_retrieval")
workflow.add_edge("rag_retrieval", "agent_reasoning")
workflow.add_edge("agent_reasoning", END)
app = workflow.compile()`,
    status: 'ACTIVE'
  },
  {
    layer: 'LLM',
    technology: 'Conversational AI Engine',
    kyu: 'Strong multilingual capability + low latency',
    category: 'ai',
    role: 'Multimodal foundation model providing low-latency reasoning, phonetics analysis, and natural dialogue synthesis.',
    codeSnippet: `import { generateContent } from './ai';

const response = await generateContent({
    prompt: 'Analyze user pronunciation clarity and answer pedagogical question.'
});`,
    status: 'ACTIVE'
  },
  {
    layer: 'STT',
    technology: 'Deepgram',
    kyu: 'Fast speech recognition + streaming support',
    category: 'audio',
    role: 'Nova-2 Speech-to-Text streaming WebSocket engine with sub-200ms latency, word-level timestamps, and acoustic confidence.',
    codeSnippet: `from deepgram import DeepgramClient, LiveTranscriptionEvents

deepgram = DeepgramClient()
dg_connection = deepgram.listen.websocket.v("1")

def on_message(self, result, **kwargs):
    sentence = result.channel.alternatives[0].transcript
    print(f"Deepgram Live Transcript: {sentence}")`,
    status: 'ACTIVE'
  },
  {
    layer: 'TTS',
    technology: 'ElevenLabs',
    kyu: 'Natural conversational voice',
    category: 'audio',
    role: 'Ultra-low latency conversational voice synthesis streaming 24kHz audio with affective prosody and emotional cadence.',
    codeSnippet: `from elevenlabs.client import ElevenLabs

client = ElevenLabs()
audio_stream = client.generate(
    text="Welcome to your system architecture interview.",
    voice="Rachel",
    model="eleven_turbo_v2_5",
    stream=True
)`,
    status: 'ACTIVE'
  },
  {
    layer: 'RAG',
    technology: 'LlamaIndex + Chroma',
    kyu: 'Document ingestion/retrieval',
    category: 'ai',
    role: 'Semantic search pipeline indexing PDF architecture specs and engineering documents into vector embeddings.',
    codeSnippet: `from llama_index.core import VectorStoreIndex
import chromadb

chroma_client = chromadb.PersistentClient(path="./chroma_db")
chroma_collection = chroma_client.get_or_create_collection("tech_specs")
index = VectorStoreIndex.from_documents(documents, vector_store=chroma_collection)`,
    status: 'ACTIVE'
  },
  {
    layer: 'Embeddings',
    technology: 'Dense Vector Embeddings',
    kyu: 'High-dimensional semantic vectors for fast retrieval',
    category: 'ai',
    role: 'Dense semantic embeddings matching domain vocabulary for fast vector distance calculations.',
    codeSnippet: `from core.embeddings import embed_content
 
embedding = embed_content(
    contents="FastAPI async worker architecture"
)`,
    status: 'ACTIVE'
  },
  {
    layer: 'Database',
    technology: 'PostgreSQL',
    kyu: 'Users, chats, quizzes, progress etc.',
    category: 'data',
    role: 'ACID-compliant relational database storing user profiles, chat turns, quiz progress, and session metadata.',
    codeSnippet: `CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic VARCHAR(100),
    pronunciation_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`,
    status: 'ACTIVE'
  },
  {
    layer: 'ORM',
    technology: 'SQLAlchemy',
    kyu: 'Mature Python ORM',
    category: 'data',
    role: 'Declarative Python ORM with async session support and transactional integrity.',
    codeSnippet: `from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import declarative_base, Mapped, mapped_column

Base = declarative_base()

class ChatTurn(Base):
    __tablename__ = "chat_turns"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_speech: Mapped[str]
    ai_response: Mapped[str]`,
    status: 'ACTIVE'
  },
  {
    layer: 'Migrations',
    technology: 'Alembic',
    kyu: 'Production DB migrations',
    category: 'data',
    role: 'Version-controlled database schema migrations tracking revisions across staging and production.',
    codeSnippet: `# alembic/versions/001_initial_schema.py
def upgrade() -> None:
    op.create_table(
        'quiz_results',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('accuracy', sa.Float(), nullable=False)
    )`,
    status: 'ACTIVE'
  },
  {
    layer: 'Cache / Rate limit',
    technology: 'Redis',
    kyu: 'Fast state + rate limiting',
    category: 'backend',
    role: 'In-memory cache for conversational state checkpoints, session state caching, and token bucket rate limits.',
    codeSnippet: `import redis.asyncio as redis

# Sliding window rate limit
r = redis.from_url("redis://redis-server:6379")
await r.setex("rate_limit_key", 60, current_count + 1)`,
    status: 'ACTIVE'
  },
  {
    layer: 'Background jobs',
    technology: 'Celery + Redis',
    kyu: 'PDF processing / async workloads',
    category: 'backend',
    role: 'Distributed task queue offloading heavy document parsing, vector indexing, and audio waveform generation.',
    codeSnippet: `from celery import Celery

celery_app = Celery("tasks", broker="redis://redis-server:6379/0")

@celery_app.task
def process_pdf_document(pdf_bytes: bytes, doc_id: str):
    chunks = parse_and_chunk_pdf(pdf_bytes)
    embed_and_store_chroma(chunks, doc_id)`,
    status: 'ACTIVE'
  },
  {
    layer: 'Auth',
    technology: 'JWT + Argon2/bcrypt',
    kyu: 'Secure authentication',
    category: 'backend',
    role: 'Cryptographic authentication using Argon2 password hashing and stateless HMAC-SHA256 JWT bearer tokens.',
    codeSnippet: `from passlib.context import CryptContext
from jose import jwt

pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")
token = jwt.encode({"sub": "learner_account", "role": "learner"}, "SECRET", algorithm="HS256")`,
    status: 'ACTIVE'
  },
  {
    layer: 'Validation',
    technology: 'Pydantic',
    kyu: 'FastAPI-native validation',
    category: 'backend',
    role: 'Runtime data validation and strict serialization with Pydantic v2 Rust core performance.',
    codeSnippet: `from pydantic import BaseModel, Field

class VoiceEvaluationInput(BaseModel):
    transcript: str = Field(min_length=1)
    duration_seconds: float = Field(gt=0)
    audio_sample_rate: int = 24000`,
    status: 'ACTIVE'
  },
  {
    layer: 'Testing',
    technology: 'Pytest',
    kyu: 'Backend/AI pipeline testing',
    category: 'eval',
    role: 'Asynchronous test suite verifying API route status codes, Celery task triggers, and DB queries.',
    codeSnippet: `import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_voice_turn_flow(async_client: AsyncClient):
    res = await async_client.post("/api/v1/voice/turn", json={"text": "hello"})
    assert res.status_code == 200`,
    status: 'ACTIVE'
  },
  {
    layer: 'Frontend testing',
    technology: 'Vitest + React Testing Library',
    kyu: 'React testing',
    category: 'frontend',
    role: 'Unit and component testing for AudioVisualizer rendering, PronunciationInspector, and HUD state.',
    codeSnippet: `import { render, screen } from '@testing-library/react';
import { PronunciationInspector } from './PronunciationInspector';

test('renders syllable breakdown with correct status', () => {
  render(<PronunciationInspector word="architecture" />);
  expect(screen.getByText('ar')).toBeInTheDocument();
});`,
    status: 'ACTIVE'
  },
  {
    layer: 'Evaluation',
    technology: 'DeepEval + custom evaluators',
    kyu: 'LLM/RAG evaluation',
    category: 'eval',
    role: 'Automated pedagogical unit testing measuring Faithfulness, Answer Relevancy, Hallucination, and Pronunciation Score.',
    codeSnippet: `from deepeval.metrics import FaithfulnessMetric
from deepeval.test_case import LLMTestCase

metric = FaithfulnessMetric(threshold=0.8)
test_case = LLMTestCase(input=query, actual_output=response, retrieval_context=contexts)
metric.measure(test_case)`,
    status: 'ACTIVE'
  },
  {
    layer: 'Observability',
    technology: 'Langfuse',
    kyu: 'LLM traces, latency, tokens, evaluations',
    category: 'eval',
    role: 'Comprehensive LLM tracing dashboard recording latency waterfalls, token usage breakdown, and score histories.',
    codeSnippet: `from langfuse import Langfuse

langfuse = Langfuse()
trace = langfuse.trace(name="voice_dialogue_turn")
generation = trace.generation(
    model="voice-audio-coach-v2",
    prompt=prompt,
    output=reply
)`,
    status: 'ACTIVE'
  },
  {
    layer: 'Containerization',
    technology: 'Docker + Docker Compose',
    kyu: 'Reproducible environment',
    category: 'devops',
    role: 'Multi-stage Docker images running FastAPI, PostgreSQL, Redis, Celery worker, and Vite client.',
    codeSnippet: `version: '3.8'
services:
  api:
    build: .
    ports: ["8000:8000"]
    depends_on: [postgres, redis]
  postgres:
    image: postgres:16-alpine
  redis:
    image: redis:7-alpine`,
    status: 'ACTIVE'
  },
  {
    layer: 'Deployment',
    technology: 'Vercel + Render/Railway',
    kyu: 'Simple portfolio deployment',
    category: 'devops',
    role: 'Static edge distribution on Vercel with auto SSL, pairing with containerized FastAPI services on Render.',
    codeSnippet: `# vercel.json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ]
}`,
    status: 'ACTIVE'
  },
  {
    layer: 'Version control',
    technology: 'Git + GitHub',
    kyu: 'Required',
    category: 'devops',
    role: 'Git trunk-based workflow with GitHub Actions CI/CD checking Pytest, Vitest, and Docker builds.',
    codeSnippet: `name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  test-and-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test && pytest`,
    status: 'ACTIVE'
  }
];

export const INITIAL_RAG_DOCUMENTS: RagDocument[] = [
  {
    id: 'doc-01',
    title: 'FastAPI High-Concurrency Async Architecture',
    content: 'FastAPI uses Python async/await syntax over Starlette ASGI. Non-blocking I/O allows thousands of concurrent WebSockets for Deepgram STT and ElevenLabs TTS audio streaming without thread pool exhaustion.',
    category: 'Backend',
    chunksCount: 8,
    embeddingScore: 0.94,
    source: 'system_design/fastapi_concurrency.md'
  },
  {
    id: 'doc-02',
    title: 'Stateful Cycles & Distributed Checkpointing',
    content: 'Cyclic state machines with memory checkpointers preserve conversational turns and pedagogical state across distributed worker restarts.',
    category: 'AI Agent',
    chunksCount: 12,
    embeddingScore: 0.91,
    source: 'ai_specs/state_machine.md'
  },
  {
    id: 'doc-03',
    title: 'Deepgram Nova-2 vs Whisper Streaming Latency',
    content: 'Deepgram Nova-2 utilizes streaming end-to-end transformers with sub-180ms latency. Compared to batched Whisper models, Nova-2 allows real-time phoneme correction mid-sentence.',
    category: 'Audio Pipeline',
    chunksCount: 6,
    embeddingScore: 0.89,
    source: 'audio_benchmarks/stt_comparison.md'
  },
  {
    id: 'doc-04',
    title: 'Vector Store & Dense Semantic Embeddings',
    content: 'LlamaIndex chunks incoming documents into 512 tokens with 64 token overlap. Vectors are embedded into dense semantic representations and retrieved using HNSW cosine index.',
    category: 'RAG & Embeddings',
    chunksCount: 10,
    embeddingScore: 0.88,
    source: 'knowledge_base/vector_retrieval.md'
  }
];

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'rachel', name: 'Rachel', provider: 'ElevenLabs', accent: 'American English', tone: 'Warm, Pedagogical Tutor', gender: 'female' },
  { id: 'adam', name: 'Adam', provider: 'ElevenLabs', accent: 'American English', tone: 'Technical Architect Lead', gender: 'male' },
  { id: 'nicole', name: 'Nicole', provider: 'ElevenLabs', accent: 'British English', tone: 'Precise, Phonetic Specialist', gender: 'female' },
  { id: 'kyu', name: 'Kyu', provider: 'ElevenLabs', accent: 'Multilingual / Hinglish', tone: 'Empathetic Bilingual Coach', gender: 'female' },
  { id: 'zephyr', name: 'Zephyr', provider: 'Neural TTS', accent: 'Natural Neutral', tone: 'Calm & Intellectual', gender: 'male' }
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-init-1',
    sender: 'agent',
    text: "Welcome to Sonic Clarity! I'm your interactive Voice AI interview and language coach. Press the microphone button below to speak, or select any question to begin.",
    timestamp: 'Just now',
    phonetics: [
      { word: 'architecture', ipa: '/ˈɑːrkɪtɛktʃər/', syllables: [{ text: 'ar', status: 'correct' }, { text: 'chi', status: 'correct' }, { text: 'tec', status: 'correct' }, { text: 'ture', status: 'correct' }], note: 'Stress on the first syllable' },
      { word: 'asynchronous', ipa: '/eɪˈsɪŋkrənəs/', syllables: [{ text: 'a', status: 'correct' }, { text: 'syn', status: 'correct' }, { text: 'chro', status: 'correct' }, { text: 'nous', status: 'correct' }], note: 'Accent on second syllable' }
    ],
    pedagogicalTip: 'Tip: Tap the mic button in the bottom HUD and start speaking naturally.',
    eval_metrics: {
      faithfulness: 0.98,
      answer_relevancy: 0.99,
      pronunciation_accuracy: 0.96,
      clarity_score: 0.97,
      latency_ms: 320
    }
  }
];

export const SAMPLE_PROMPTS = [
  "How does FastAPI handle asynchronous WebSockets compared to Django?",
  "Explain how stateful workflows manage cyclic execution with checkpointers.",
  "Why is streaming STT preferred for real-time conversational voice agents?",
  "How do we evaluate RAG hallucination using automated evaluation metrics?",
  "Pronounce and drill: 'Asynchronous microservice orchestration with PostgreSQL'."
];
