import { useEffect, useRef, useState } from 'react';

interface VoiceWaveProps {
  isRecording?: boolean;
  compact?: boolean;
}

export function VoiceWave({ isRecording = false, compact = false }: VoiceWaveProps) {
  const count = compact ? 20 : 40;
  const makeDefaultBars = (n: number) =>
    Array.from({ length: n }, (_: unknown, i: number) => (i % 3 === 0 ? 0.6 : i % 2 === 0 ? 0.4 : 0.2));
  const [bars, setBars] = useState<number[]>(() => makeDefaultBars(count));
  const animRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  useEffect(() => {
    if (!isRecording) {
      setBars(Array.from({ length: count }, (_: unknown, i: number) => (i % 3 === 0 ? 0.6 : i % 2 === 0 ? 0.4 : 0.2)));
      return;
    }
    const animate = () => {
      setBars(Array.from({ length: count }, () => Math.random() * 0.9 + 0.1));
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isRecording, count]);

  const maxHeight = compact ? 24 : 40;
  const barWidth = compact ? 2 : 3;
  const gap = compact ? 1 : 2;
  const totalWidth = count * (barWidth + gap) - gap;

  return (
    <svg width={totalWidth} height={maxHeight} viewBox={`0 0 ${totalWidth} ${maxHeight}`} className="overflow-visible">
      {bars.map((h, i) => {
        const barHeight = Math.max(2, h * maxHeight);
        const x = i * (barWidth + gap);
        const y = (maxHeight - barHeight) / 2;
        return (
          <rect key={i} x={x} y={y} width={barWidth} height={barHeight} rx={barWidth / 2}
            fill={isRecording ? '#6C63FF' : 'rgba(108,99,255,0.5)'}
          />
        );
      })}
    </svg>
  );
}

interface PlaybackWaveProps {
  isPlaying: boolean;
  progress: number;
  bars: number[];
  onSeek: (progress: number) => void;
}

export function PlaybackWave({ isPlaying, progress, bars, onSeek }: PlaybackWaveProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const barCount = bars.length || 40;
  const maxHeight = 36;
  const barWidth = 3;
  const gap = 2;
  const totalWidth = barCount * (barWidth + gap) - gap;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    onSeek(Math.max(0, Math.min(1, x / rect.width)));
  };

  return (
    <svg ref={svgRef} width={totalWidth} height={maxHeight} viewBox={`0 0 ${totalWidth} ${maxHeight}`}
      onClick={handleClick} className="cursor-pointer overflow-visible">
      {bars.map((h, i) => {
        const barHeight = Math.max(3, h * maxHeight);
        const x = i * (barWidth + gap);
        const y = (maxHeight - barHeight) / 2;
        const isPlayed = i / barCount < progress;
        return (
          <rect key={i} x={x} y={y} width={barWidth} height={barHeight} rx={1.5}
            fill={isPlayed ? '#6C63FF' : 'rgba(255,255,255,0.2)'}
          />
        );
      })}
      {isPlaying && (
        <line x1={progress * totalWidth} y1={0} x2={progress * totalWidth} y2={maxHeight}
          stroke="#6C63FF" strokeWidth="1.5" opacity="0.8" />
      )}
    </svg>
  );
}
