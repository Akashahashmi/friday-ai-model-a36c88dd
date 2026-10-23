import type { AssistantState } from "@/lib/friday/types";

/** Original SVG helmet avatar. Animations are driven purely by data-state (see styles.css). */
export function Helmet({ state, animate, muted }: { state: AssistantState; animate: boolean; muted: boolean }) {
  return (
    <div className="helmet relative w-44 sm:w-60" data-state={state} data-reduced={!animate} aria-hidden="true">
      <div className="helmet-halo" />
      <div className="helmet-ring" />
      <svg viewBox="0 0 200 240" className="helmet-svg relative w-full">
        <defs>
          <linearGradient id="h-red" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="oklch(0.62 0.21 25)" />
            <stop offset="0.5" stopColor="oklch(0.45 0.18 22)" />
            <stop offset="1" stopColor="oklch(0.28 0.11 20)" />
          </linearGradient>
          <linearGradient id="h-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="oklch(0.9 0.12 90)" />
            <stop offset="0.5" stopColor="oklch(0.74 0.13 80)" />
            <stop offset="1" stopColor="oklch(0.55 0.11 70)" />
          </linearGradient>
          <linearGradient id="h-dark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="oklch(0.22 0.03 255)" />
            <stop offset="1" stopColor="oklch(0.12 0.02 255)" />
          </linearGradient>
          <radialGradient id="h-core">
            <stop offset="0" stopColor="oklch(0.98 0.03 210)" />
            <stop offset="0.5" stopColor="oklch(0.85 0.15 205)" />
            <stop offset="1" stopColor="oklch(0.85 0.15 205 / 0)" />
          </radialGradient>
          <linearGradient id="h-sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="white" stopOpacity="0" />
            <stop offset="0.5" stopColor="white" stopOpacity="0.35" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <clipPath id="h-clip">
            <path d="M100 8 C150 8 182 42 184 96 L180 150 C176 186 150 214 122 230 L100 236 L78 230 C50 214 24 186 20 150 L16 96 C18 42 50 8 100 8Z" />
          </clipPath>
        </defs>
        {/* outer shell */}
        <path className="helmet-outline" d="M100 8 C150 8 182 42 184 96 L180 150 C176 186 150 214 122 230 L100 236 L78 230 C50 214 24 186 20 150 L16 96 C18 42 50 8 100 8Z" fill="url(#h-red)" stroke="oklch(0.85 0.15 205 / 0.5)" strokeWidth="1.5" />
        <g clipPath="url(#h-clip)">
          {/* gold faceplate */}
          <path d="M100 52 C128 52 150 66 156 92 L154 140 C150 170 132 192 116 204 L100 210 L84 204 C68 192 50 170 46 140 L44 92 C50 66 72 52 100 52Z" fill="url(#h-gold)" />
          {/* dark visor band */}
          <path d="M50 104 L88 112 L100 118 L112 112 L150 104 L148 126 L112 134 L100 138 L88 134 L52 126Z" fill="url(#h-dark)" />
          {/* eyes */}
          <path className="helmet-eye" d="M58 112 L88 118 L86 126 L60 121Z" />
          <path className="helmet-eye" d="M142 112 L112 118 L114 126 L140 121Z" />
          {/* mouth slits */}
          <path d="M80 176 L120 176 M84 184 L116 184" stroke="oklch(0.2 0.03 255)" strokeWidth="2.5" strokeLinecap="round" />
          {/* panel lines */}
          <path d="M100 8 L100 52 M44 92 L18 86 M156 92 L182 86 M60 200 L46 168 M140 200 L154 168" stroke="oklch(0.2 0.05 20 / 0.7)" strokeWidth="1.5" fill="none" />
          {/* energy core */}
          <circle className="helmet-core-glow" cx="100" cy="156" r="16" fill="url(#h-core)" />
          <circle className="helmet-core" cx="100" cy="156" r="6" fill="oklch(0.97 0.04 210)" />
          <circle className="helmet-core-ring" cx="100" cy="156" r="10" fill="none" stroke="oklch(0.85 0.15 205)" strokeWidth="1.2" strokeDasharray="4 3" />
          {/* light sweep / scan */}
          <rect className="helmet-sweep" x="-80" y="0" width="60" height="240" fill="url(#h-sweep)" />
          <rect className="helmet-scan" x="0" y="0" width="200" height="3" fill="oklch(0.85 0.15 205 / 0.6)" />
        </g>
      </svg>
      {muted && (
        <span className="absolute right-1 top-2 rounded-full border border-warn/50 bg-background/80 px-2 py-0.5 font-mono text-[10px] text-warn">MUTED</span>
      )}
    </div>
  );
}
