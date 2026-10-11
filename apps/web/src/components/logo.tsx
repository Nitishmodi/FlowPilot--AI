export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5 font-semibold tracking-tight">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <defs>
          <linearGradient id={`fp-mark-${size}`} x1="6" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c9c2ff" />
            <stop offset="0.55" stopColor="#8eb6ff" />
            <stop offset="1" stopColor="#8b7cff" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="#12162a" />
        <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke={`url(#fp-mark-${size})`} strokeOpacity="0.7" />
        <path className="mark-path" d="M7 22c4.2-10 13.8-10 18 0" fill="none" stroke={`url(#fp-mark-${size})`} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M16 8.5l1.2 3.4 3.4 1.1-3.4 1.1L16 17.5l-1.2-3.4-3.4-1.1 3.4-1.1L16 8.5z" fill={`url(#fp-mark-${size})`} />
      </svg>
      <span>
        FlowPilot
        <span className="ml-1 text-[0.72em] font-medium tracking-normal text-violet-200">AI</span>
      </span>
    </span>
  );
}
