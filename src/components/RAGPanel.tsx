import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

interface Props {
  onQuery: (question: string) => Promise<{ answer: string; sources_used?: string[] }>;
  currentPlayerName?: string | null;
}

const QUICK_QUESTIONS = [
  'Why is this player\'s price range high?',
  'Which teams are most likely to bid?',
  'What factors drive IPL player valuations?',
  'How does auction order affect prices?',
];

export default function RAGPanel({ onQuery, currentPlayerName }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (question: string) => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const res = await onQuery(q);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: res.answer, sources: res.sources_used ?? [] },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Failed to get a response. Check your GEMINI_API_KEY.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
          AI Research (RAG)
        </span>
        {currentPlayerName && (
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
            Context: {currentPlayerName}
          </span>
        )}
      </div>

      {/* Quick questions */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_QUESTIONS.map(q => (
          <button
            key={q}
            onClick={() => submit(q)}
            disabled={loading}
            className="text-[10px] px-2 py-1 rounded-full bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-slate-400 hover:text-slate-200 transition-all disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
        {messages.length === 0 && (
          <div className="text-center text-slate-600 text-xs py-4">
            Ask anything about IPL auction pricing, player valuations, or team strategy
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg p-2.5 text-xs ${
              m.role === 'user'
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200 ml-4'
                : 'bg-slate-800 border border-slate-700 text-slate-300 mr-4'
            }`}
          >
            {m.content}
            {m.sources && m.sources.length > 0 && (
              <div className="mt-1.5 text-[10px] text-slate-500">
                Sources: {m.sources.join(', ')}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 mr-4">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit(input)}
          placeholder="Ask about pricing, teams, strategy…"
          disabled={loading}
          className="flex-1 bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-3 py-2 placeholder-slate-500 focus:outline-none focus:border-amber-500 disabled:opacity-50"
        />
        <button
          onClick={() => submit(input)}
          disabled={!input.trim() || loading}
          className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-900 text-xs font-bold transition-all"
        >
          Ask
        </button>
      </div>
    </div>
  );
}
