interface VerifiedBadgeProps {
  size?: number;
  label?: string;
}

export function VerifiedBadge({ size = 16, label }: VerifiedBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1"
      title="Официальный канал"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="11" fill="#6C63FF" />
        <path
          d="M7 12.5L10.5 16L17 9"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label && (
        <span className="text-xs text-[#6C63FF] font-medium">{label}</span>
      )}
    </span>
  );
}
