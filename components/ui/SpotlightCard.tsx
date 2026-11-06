// Service card surface: a quiet raised panel whose hairline brightens on hover.
// (Formerly drew a cursor-following glow; removed to keep the chrome calm.)
export default function SpotlightCard({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div
      className={`group relative overflow-hidden bg-ink border border-white/[0.06] rounded-[2px] transition-colors duration-200 ease-brand hover:border-white/20 ${className}`}
    >
      {children}
    </div>
  );
}
