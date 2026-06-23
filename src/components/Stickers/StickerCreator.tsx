import { useState, useRef, useEffect } from 'react';
import { useStickerStore } from '../../store/stickerStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface StickerCreatorProps {
  onClose: () => void;
}

const EMOJI_OPTIONS = ['😊', '😂', '❤️', '🔥', '👍', '🎉', '😎', '🤔', '🌟', '💎', '🦋', '🌈'];

export function StickerCreator({ onClose }: StickerCreatorProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');
  const [packName, setPackName] = useState('Мои стикеры');
  const [step, setStep] = useState<'upload' | 'crop' | 'finish'>('upload');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { createPack, addStickerToPack, packs, getUserPacks, addPackToUser } = useStickerStore();
  const { currentAccount } = useAuthStore();

  const userId = currentAccount?.id || '';

  useEffect(() => {
    if (imageUrl && step === 'crop') {
      drawImage();
    }
  }, [imageUrl, step]);

  const drawImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const size = 200;
      canvas.width = size;
      canvas.height = size;
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      ctx.clearRect(0, 0, size, size);
      // Clip to circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      ctx.restore();
      // Add emoji
      if (selectedEmoji) {
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(selectedEmoji, size - 5, size - 5);
      }
    };
    img.src = imageUrl;
  };

  useEffect(() => {
    if (step === 'crop') drawImage();
  }, [selectedEmoji]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Только изображения');
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setStep('crop');
  };

  const handleCreate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/webp', 0.9);

    // Find or create user pack
    const userPacks = getUserPacks(userId);
    let targetPack = userPacks.find(p => p.name === packName);

    if (!targetPack) {
      if (!currentAccount?.isPremium && packs.filter(p => p.createdBy === userId).length >= 1) {
        toast.error('Создание нескольких наборов — только для Премиум');
        return;
      }
      targetPack = createPack(packName, userId, false);
    }

    addStickerToPack(targetPack.id, {
      url: dataUrl,
      emoji: selectedEmoji || undefined,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    });

    addPackToUser(userId, targetPack.id);

    toast.success('Стикер создан!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#1A1A2E] border border-white/10 rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
          <h2 className="font-semibold text-white text-sm">Создание стикера</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/70 text-xl">×</button>
        </div>

        <div className="p-4 space-y-4">
          {step === 'upload' && (
            <div
              className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-white/10 cursor-pointer hover:border-[#6C63FF]/40 transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="text-4xl">📷</span>
              <p className="text-sm text-white/50">Нажми чтобы загрузить фото</p>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {step === 'crop' && (
            <>
              {/* Preview */}
              <div className="flex justify-center">
                <div className="rounded-full overflow-hidden border-2 border-[#6C63FF]/30">
                  <canvas ref={canvasRef} className="w-[140px] h-[140px]" />
                </div>
              </div>

              {/* Emoji selector */}
              <div>
                <p className="text-xs text-white/40 mb-2">Эмодзи-метка (опционально)</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedEmoji('')}
                    className={`w-8 h-8 rounded-xl text-xs flex items-center justify-center border transition-all ${
                      !selectedEmoji ? 'border-[#6C63FF] bg-[#6C63FF]/20' : 'border-white/10 hover:bg-white/5'
                    }`}
                  >
                    ✕
                  </button>
                  {EMOJI_OPTIONS.map(e => (
                    <button
                      key={e}
                      onClick={() => setSelectedEmoji(e)}
                      className={`w-8 h-8 rounded-xl text-lg flex items-center justify-center border transition-all hover:scale-110 ${
                        selectedEmoji === e ? 'border-[#6C63FF] bg-[#6C63FF]/20' : 'border-white/10 hover:bg-white/5'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pack name */}
              <div>
                <p className="text-xs text-white/40 mb-1.5">Набор стикеров</p>
                <input
                  type="text"
                  value={packName}
                  onChange={e => setPackName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-white text-sm focus:outline-none focus:border-[#6C63FF]/30"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep('upload')}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm"
                >
                  Назад
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 py-2.5 rounded-xl bg-[#6C63FF] text-white text-sm font-semibold"
                >
                  Создать стикер
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
