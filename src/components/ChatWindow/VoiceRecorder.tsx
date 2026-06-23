import { useState, useRef, useEffect } from 'react';
import { VoiceWave } from './VoiceWave';
import { transcribeAudio } from '../../services/groqAI';

interface VoiceRecorderProps {
  onSend: (blob: Blob, duration: number, voiceText?: string) => void;
  onCancel: () => void;
}

export function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(true);
  const [duration, setDuration] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startRecording();
    return () => stopEverything();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.start(100);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    } catch {
      // Simulate recording without mic
      setIsRecording(true);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    }
  };

  const stopEverything = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const handleSend = async () => {
    stopEverything();
    setIsProcessing(true);
    
    await new Promise(r => setTimeout(r, 300));
    
    let blob: Blob;
    if (chunksRef.current.length > 0) {
      blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    } else {
      // Create a minimal audio blob for demo
      blob = new Blob(['demo-audio'], { type: 'audio/webm' });
    }

    // Try to transcribe
    let voiceText: string | undefined;
    if (blob.size > 100) {
      try {
        voiceText = await transcribeAudio(blob);
      } catch {
        voiceText = undefined;
      }
    }

    setIsProcessing(false);
    onSend(blob, duration, voiceText);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-[#1A1A2E] rounded-2xl border border-white/8">
      {/* Cancel */}
      <button
        onClick={() => { stopEverything(); onCancel(); }}
        className="p-2 rounded-xl hover:bg-red-500/20 text-red-400 transition-all flex-shrink-0"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Wave visualization */}
      <div className="flex-1 flex items-center gap-3">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse"
          style={{ backgroundColor: '#EF4444' }}
        />
        <div className="flex-1 overflow-hidden">
          <VoiceWave isRecording={isRecording} compact />
        </div>
        <span className="text-sm font-mono text-white/60 flex-shrink-0">{fmt(duration)}</span>
      </div>

      {/* Lock button */}
      <button
        onClick={() => setIsLocked(!isLocked)}
        className={`p-2 rounded-xl transition-all flex-shrink-0 ${
          isLocked ? 'bg-yellow-500/20 text-yellow-400' : 'hover:bg-white/5 text-white/30'
        }`}
      >
        🔒
      </button>

      {/* Send / Processing */}
      <button
        onClick={handleSend}
        disabled={isProcessing || duration === 0}
        className="p-2.5 rounded-xl flex-shrink-0 transition-all hover:scale-110 disabled:opacity-50"
        style={{ background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)' }}
      >
        {isProcessing ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22 11 13 2 9l20-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}
