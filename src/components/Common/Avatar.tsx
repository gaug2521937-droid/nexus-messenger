interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  online?: boolean;
  isPremium?: boolean;
  liveEmoji?: string;
  className?: string;
  onClick?: () => void;
}

const COLORS: [string, string][] = [
  ['#6C63FF', '#8B5CF6'],
  ['#EC4899', '#F43F5E'],
  ['#10B981', '#059669'],
  ['#F59E0B', '#D97706'],
  ['#3B82F6', '#2563EB'],
  ['#8B5CF6', '#7C3AED'],
  ['#14B8A6', '#0D9488'],
  ['#EF4444', '#DC2626'],
];

function getColorPair(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  src,
  name,
  size = 40,
  online,
  isPremium,
  liveEmoji,
  className = '',
  onClick,
}: AvatarProps) {
  const [color1, color2] = getColorPair(name);
  const initials = getInitials(name);
  const fontSize = size * 0.36;
  const onlineSize = Math.max(10, size * 0.25);

  return (
    <div
      className={`relative inline-flex flex-shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      style={{ width: size, height: size }}
    >
      {/* Avatar image or initials */}
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center select-none"
        style={{
          background: src ? undefined : `linear-gradient(135deg, ${color1}, ${color2})`,
          boxShadow: isPremium ? `0 0 0 2px #6C63FF, 0 0 8px rgba(108,99,255,0.4)` : undefined,
        }}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span
            className="font-bold text-white leading-none"
            style={{ fontSize }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Live emoji */}
      {liveEmoji && (
        <span
          className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-[#0A0A0F] border border-[#1A1A2E]"
          style={{ width: size * 0.4, height: size * 0.4, fontSize: size * 0.22 }}
        >
          {liveEmoji}
        </span>
      )}

      {/* Online indicator */}
      {online !== undefined && !liveEmoji && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-[#0A0A0F]"
          style={{
            width: onlineSize,
            height: onlineSize,
            backgroundColor: online ? '#10B981' : '#6B7280',
          }}
        />
      )}

      {/* Premium badge */}
      {isPremium && size > 40 && (
        <span
          className="absolute -top-1 -right-1 text-yellow-400 text-xs"
          style={{ fontSize: size * 0.18 }}
        >
          ⭐
        </span>
      )}
    </div>
  );
}
