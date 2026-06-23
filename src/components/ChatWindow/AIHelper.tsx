import { useState } from 'react';
import { improveText } from '../../services/groqAI';

interface AIHelperProps {
  text: string;
  onResult: (result: string) => void;
  onClose: () => void;
}

type Mode = 'fix' | 'translate' | 'improve';

export function AIHelper({ text, onResult, onClose }: AIHelperProps) {
  const [loading, setLoading] = useState<Mode | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handle = async (mode: Mode) => {
    setLoading(mode);
    setResult(null);
    try {
      const r = await improveText(text, mode);
      setResult(r);
    } catch {
      setResult('Ошибка обработки');
    } finally {
      setLoading(null);
    }
  };

  const actions = [
    { key: 'fix' as Mode, icon: '✏️', label: 'Исправить' },
    { key: 'translate' as Mode, icon: '🌍', label: 'Перевести' },
    { key: 'improve' as Mode, icon: '✨', label: 'Улучшить' },
  ];

  return (
    <div className="absolute bottom-full right-0 mb-2 bg-[#1A1A2E] border border-[#6C63FF]/30 rounded-2xl shadow-2xl p-4 min-w-[260px] max-w-[340px] z-30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[#6C63FF]">🤖</span>
          <span className="text-sm font-semibold text-white">ИИ Помощник</span>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg">×</button>
      </div>

      {/* Original text preview */}
      <div className="mb-3 px-3 py-2 rounded-xl bg-white/5 text-xs text-white/50 line-clamp-2">
        {text}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-3">
        {actions.map(a => (
          <button
            key={a.key}
            onClick={() => handle(a.key)}
            disabled={!!loading}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
              loading === a.key
                ? 'bg-[#6C63FF]/20 text-[#6C63FF]'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            } disabled:opacity-50`}
          >
            {loading === a.key ? (
              <span className="w-4 h-4 border-2 border-[#6C63FF]/30 border-t-[#6C63FF] rounded-full animate-spin" />
            ) : (
              <span className="text-base">{a.icon}</span>
            )}
            <span>{a.label}</span>
          </button>
        ))}
      </div>

      {/* Result */}
      {result && (
        <div className="border-t border-white/8 pt-3">
          <p className="text-xs text-white/70 leading-relaxed mb-3">{result}</p>
          <div className="flex gap-2">
            <button
              onClick={() => { onResult(result); onClose(); }}
              className="flex-1 py-2 rounded-xl bg-[#6C63FF] text-white text-xs font-semibold"
            >
              Применить
            </button>
            <button
              onClick={() => setResult(null)}
              className="flex-1 py-2 rounded-xl bg-white/5 text-white/50 text-xs"
            >
              Отклонить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
