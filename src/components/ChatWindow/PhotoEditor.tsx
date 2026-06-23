import { useState, useRef, useEffect } from 'react';

interface PhotoEditorProps {
  imageUrl: string;
  onSend: (editedDataUrl: string, caption: string) => void;
  onCancel: () => void;
}

const COLORS = ['#FFFFFF', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#000000'];

export function PhotoEditor({ imageUrl, onSend, onCancel }: PhotoEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'pen' | 'text' | 'crop'>('pen');
  const [color, setColor] = useState('#FFFFFF');
  const [lineWidth, setLineWidth] = useState(4);
  const [caption, setCaption] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const maxW = Math.min(600, window.innerWidth - 48);
      const maxH = Math.min(500, window.innerHeight - 250);
      let { width, height } = img;
      if (width > maxW) { height = (height * maxW) / width; width = maxW; }
      if (height > maxH) { width = (width * maxH) / height; height = maxH; }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'text') {
      const pos = getPos(e);
      setTextPos(pos);
      setShowTextInput(true);
      return;
    }
    setIsDrawing(true);
    lastPosRef.current = getPos(e);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool !== 'pen') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPosRef.current = pos;
  };

  const stopDraw = () => setIsDrawing(false);

  const addText = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !textInput.trim()) { setShowTextInput(false); return; }
    ctx.font = `bold ${24}px Inter, sans-serif`;
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(textInput, textPos.x, textPos.y);
    ctx.shadowBlur = 0;
    setTextInput('');
    setShowTextInput(false);
  };

  const handleSend = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onSend(dataUrl, caption);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <button
          onClick={onCancel}
          className="p-2 rounded-xl hover:bg-white/5 text-white/60 hover:text-white transition-all"
        >
          ← Назад
        </button>
        <h2 className="font-semibold text-white text-sm">Редактор фото</h2>
        <button
          onClick={handleSend}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' }}
        >
          Отправить
        </button>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4 relative">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full rounded-xl shadow-2xl"
          style={{ cursor: tool === 'pen' ? 'crosshair' : tool === 'text' ? 'text' : 'default' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
        />

        {/* Text input overlay */}
        {showTextInput && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-4 flex flex-col gap-3 min-w-[240px]">
              <input
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addText()}
                placeholder="Введите текст..."
                className="bg-transparent text-white text-base outline-none border-b border-white/20 pb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={addText} className="flex-1 py-2 rounded-xl bg-[#6C63FF] text-white text-sm font-semibold">
                  Добавить
                </button>
                <button onClick={() => setShowTextInput(false)} className="flex-1 py-2 rounded-xl bg-white/10 text-white/60 text-sm">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tools */}
      <div className="flex flex-col gap-3 px-4 py-4 bg-[#0F0F1A] border-t border-white/5">
        {/* Tool buttons */}
        <div className="flex items-center gap-2 justify-center">
          {[
            { key: 'pen' as const, icon: '✏️', label: 'Рисовать' },
            { key: 'text' as const, icon: '🔤', label: 'Текст' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTool(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm transition-all ${
                tool === t.key
                  ? 'bg-[#6C63FF]/20 text-[#6C63FF] border border-[#6C63FF]/30'
                  : 'text-white/40 hover:text-white/70 border border-transparent hover:bg-white/5'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}

          {/* Line width */}
          {tool === 'pen' && (
            <div className="flex items-center gap-2 ml-4">
              <span className="text-xs text-white/30">Толщина</span>
              <input
                type="range"
                min="1"
                max="20"
                value={lineWidth}
                onChange={e => setLineWidth(Number(e.target.value))}
                className="w-20 accent-[#6C63FF]"
              />
              <span className="text-xs text-white/40 w-4">{lineWidth}</span>
            </div>
          )}
        </div>

        {/* Color picker */}
        <div className="flex items-center gap-2 justify-center">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                color === c ? 'border-white scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Caption */}
        <input
          type="text"
          placeholder="Добавить подпись..."
          value={caption}
          onChange={e => setCaption(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#6C63FF]/30 transition-all"
        />
      </div>
    </div>
  );
}
