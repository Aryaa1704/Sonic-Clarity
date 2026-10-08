import React, { useState } from 'react';
import { RagDocument } from '../types';
import { INITIAL_RAG_DOCUMENTS } from '../data/mockData';
import { Database, Search, Plus, FileText, CheckCircle2, Cpu, Sparkles } from 'lucide-react';

interface RagExplorerProps {
  onSelectContextForChat?: (contextText: string) => void;
}

export const RagExplorer: React.FC<RagExplorerProps> = ({ onSelectContextForChat }) => {
  const [documents, setDocuments] = useState<RagDocument[]>(INITIAL_RAG_DOCUMENTS);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<RagDocument[] | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('System Design');

  const handleSearch = async () => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    // Simulate semantic vector embeddings + cosine distance calculation
    setTimeout(() => {
      const filtered = documents.map(doc => {
        const matchesQuery = doc.content.toLowerCase().includes(query.toLowerCase()) ||
                             doc.title.toLowerCase().includes(query.toLowerCase());
        const simScore = matchesQuery ? 0.93 : Math.max(0.65, 0.88 - Math.random() * 0.15);
        return { ...doc, embeddingScore: Number(simScore.toFixed(2)) };
      }).sort((a, b) => (b.embeddingScore || 0) - (a.embeddingScore || 0));

      setSearchResults(filtered);
      setIsSearching(false);
    }, 350);
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newDoc: RagDocument = {
      id: `doc-${Date.now()}`,
      title: newTitle,
      content: newContent,
      category: newCategory,
      chunksCount: Math.ceil(newContent.length / 300),
      embeddingScore: 0.95,
      source: `custom/${newTitle.toLowerCase().replace(/\s+/g, '_')}.md`
    };

    setDocuments([newDoc, ...documents]);
    setNewTitle('');
    setNewContent('');
    setShowAddModal(false);
  };

  const activeList = searchResults || documents;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-white border border-[#e2e8f0] p-5 shadow-[0_2px_8px_-2px_rgba(15,41,66,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#eff4ff] flex items-center justify-center text-[#2563eb]">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0f2942]">
                Domain Knowledge Base & Vector Retrieval
              </h2>
              <p className="text-xs text-[#64748b]">
                Powered by semantic document chunking and dense vector similarity indexing
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-[#2563eb] text-white text-xs font-semibold hover:bg-[#1d4ed8] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Ingest Document</span>
          </button>
        </div>

        {/* Vector Search Bar */}
        <div className="mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64748b] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Test semantic similarity search across ingested engineering docs (e.g. 'FastAPI WebSockets', 'Redis caching')..."
              className="w-full text-xs bg-[#f8f9ff] border border-[#e2e8f0] rounded-xl pl-10 pr-4 py-2.5 text-[#0f2942] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-2.5 rounded-xl bg-[#0f2942] text-white text-xs font-semibold hover:bg-[#1d4ed8] transition-colors shrink-0"
          >
            {isSearching ? 'Embedding...' : 'Vector Query'}
          </button>
        </div>
      </div>

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#e2e8f0] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-[#0f2942] mb-1">Ingest Knowledge Document</h3>
            <p className="text-xs text-[#64748b] mb-4">
              LlamaIndex will chunk this text into 512-token embeddings and store vectors in Chroma.
            </p>

            <form onSubmit={handleAddDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0f2942] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., PostgreSQL Sharding Strategies"
                  className="w-full text-xs border border-[#e2e8f0] rounded-lg p-2.5 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f2942] mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full text-xs border border-[#e2e8f0] rounded-lg p-2.5 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
                >
                  <option value="System Design">System Design</option>
                  <option value="AI Agent">AI Agent</option>
                  <option value="Database">Database</option>
                  <option value="Audio Pipeline">Audio Pipeline</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f2942] mb-1">Documentation Content</label>
                <textarea
                  required
                  rows={5}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste architectural specifications, technical guidelines, or interview questions..."
                  className="w-full text-xs border border-[#e2e8f0] rounded-lg p-2.5 text-[#0f2942] focus:ring-2 focus:ring-[#2563eb] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#64748b] hover:bg-[#f1f5f9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#2563eb] text-white text-xs font-semibold hover:bg-[#1d4ed8]"
                >
                  Ingest & Vectorize
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeList.map((doc) => (
          <div
            key={doc.id}
            className="rounded-2xl bg-white border border-[#e2e8f0] p-5 shadow-[0_2px_8px_-2px_rgba(15,41,66,0.04)] flex flex-col justify-between hover:border-[#38bdf8] transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-[#f0f9ff] text-[#0051d5] flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-bold text-[#0f2942]">{doc.title}</span>
                </div>
                {doc.embeddingScore !== undefined && (
                  <span className="px-2 py-0.5 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-[11px] font-mono font-bold shrink-0">
                    {Math.round(doc.embeddingScore * 100)}% match
                  </span>
                )}
              </div>

              <p className="text-xs text-[#475569] leading-relaxed line-clamp-3 mb-3">
                {doc.content}
              </p>
            </div>

            <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-[11px] text-[#64748b]">
              <div className="flex items-center gap-2 font-mono">
                <span>{doc.chunksCount} chunks</span>
                <span>•</span>
                <span>{doc.category}</span>
              </div>

              {onSelectContextForChat && (
                <button
                  onClick={() => onSelectContextForChat(doc.content)}
                  className="text-xs font-semibold text-[#2563eb] hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Use in Voice Turn</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
