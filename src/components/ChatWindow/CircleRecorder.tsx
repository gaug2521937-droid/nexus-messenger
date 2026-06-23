import { useState, useRef, useEffect } from 'react';

interface CircleRecorderProps {
  onSend: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

export function CircleRecorder({ onSend, onCancel }: CircleRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const MAX_DURATION = 60;

  useEffect(() => {
    initCamera();
    return () => cleanup();
  }, []);

  const initCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 300, height: 300, facingMode: 'user' },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setHasPermission(true);

      // Countdown
      let c = 3;
      const cd = setInterval(() => {
        c--;
        setCountdown(c);
        if (c === 0) {
          clearInterval(cd);
          startRecording(stream);
        }
      }, 1000);
    } catch {
      setHasPermission(false);
    }
  };

  const startRecording = (stream: MediaStream) => {
    try {
      const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.start(100);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration(d => {
          if (d + 1 >= MAX_DURATION) {
            handleSend();
            return MAX_DURATION;
          }
          return d + 1;
        });
      }, 1000);
    } catch {
      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
  };

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  const handleSend = () => {
    cleanup();
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.onstop = () => {
        const blob =
          chunksRef.current.length > 0
            ? new Blob(chunksRef.current, { type: 'video/webm' })
            : new Blob(['demo-video'], { type: 'video/webm' });
        onSend(blob, duration);
      };
      mr.stop();
    } else {
      const blob = new Blob(['demo-video'], { type: 'video/webm' });
      onSend(blob, duration);
    }
  };

  const progress = (duration / MAX_DURATION) * 100;
  const circumference = 2 * Math.PI * 58;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center gap-6">
      {/* Circle video container */}
      <div className="relative w-[140px] h-[140px]">
        {/* Progress ring */}
        <svg className="absolute inset-0" width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
          <circle
            cx="70"
            cy="70"
            r="58"
            fill="none"
            stroke="#6C63FF"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>

        {/* Video */}
        <div className="absolute inset-[10px] rounded-full overflow-hidden">
          {hasPermission === false ? (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center flex-col gap-2">
              <span className="text-4xl">📷</span>
              <span className="text-xs text-white/50 text-center px-2">Нет доступа к камере</span>
            </div>
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-cover scale-x-[-1]"
              muted
              playsInline
            />
          )}
        </div>

        {/* Countdown overlay */}
        {countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <span className="text-4xl font-black text-white">{countdown}</span>
          </div>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <div className="absolute top-2 right-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse block" />
          </div>
        )}
      </div>

      {/* Timer */}
      <div className="text-center">
        <div className="text-2xl font-mono font-bold text-white">{fmt(duration)}</div>
        <div className="text-xs text-white/30 mt-1">макс. {fmt(MAX_DURATION)}</div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-8">
        <button
          onClick={() => { cleanup(); onCancel(); }}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center group-hover:bg-red-500/20 group-hover:border-red-400/40 transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <span className="text-xs text-white/40">Отмена</span>
        </button>

        {isRecording && (
          <button
            onClick={handleSend}
            className="flex flex-col items-center gap-2 group"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-all"
              style={{ background: 'linear-gradient(135deg, #6C63FF, #8B5CF6)', boxShadow: '0 4px 20px rgba(108,99,255,0.5)' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22 11 13 2 9l20-7z" />
              </svg>
            </div>
            <span className="text-xs text-white/40">Отправить</span>
          </button>
        )}
      </div>
    </div>
  );
}
