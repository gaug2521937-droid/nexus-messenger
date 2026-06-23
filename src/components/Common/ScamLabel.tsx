interface ScamLabelProps {
  description?: string;
  compact?: boolean;
}

export function ScamLabel({ description, compact = false }: ScamLabelProps) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">
        ⚠️ SCAM
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-bold bg-red-500/20 text-red-400 border border-red-500/30">
        ⚠️ SCAM
      </span>
      {description && (
        <p className="text-xs text-red-400/80 px-1">{description}</p>
      )}
    </div>
  );
}
