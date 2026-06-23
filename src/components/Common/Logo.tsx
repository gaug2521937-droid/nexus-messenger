

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  variant?: 'full' | 'icon';
}

export function Logo({ size = 40, showText = true, className = '', variant = 'full' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* NEXUS Logo Icon */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="nexus-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#6C63FF" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
          <linearGradient id="nexus-inner" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C4B5FD" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <filter id="nexus-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle cx="32" cy="32" r="30" fill="url(#nexus-grad)" />

        {/* Inner glow ring */}
        <circle
          cx="32"
          cy="32"
          r="27"
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />

        {/* N letter - stylized */}
        <g filter="url(#nexus-glow)">
          {/* Left vertical bar */}
          <rect x="14" y="16" width="7" height="32" rx="3.5" fill="white" />
          {/* Right vertical bar */}
          <rect x="43" y="16" width="7" height="32" rx="3.5" fill="white" />
          {/* Diagonal stroke */}
          <path
            d="M14 16 L50 48"
            stroke="white"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* Star/sparkle accent */}
        <circle cx="50" cy="14" r="4" fill="#F0ABFC" opacity="0.9" />
        <circle cx="50" cy="14" r="2" fill="white" />
      </svg>

      {showText && variant === 'full' && (
        <span
          className="font-black tracking-wide select-none"
          style={{
            fontSize: size * 0.55,
            background: 'linear-gradient(135deg, #8B5CF6, #6C63FF, #A855F7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '0.08em',
          }}
        >
          NEXUS
        </span>
      )}
    </div>
  );
}

export function LogoMini({ className = '' }: { className?: string }) {
  return <Logo size={32} showText={false} className={className} />;
}
