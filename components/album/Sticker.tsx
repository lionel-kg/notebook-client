import type { StickerKind } from './types';

/** Dessin vectoriel d'un sticker (identique au design d'origine). */
export function StickerArt({ kind, className }: { kind: StickerKind; className?: string }) {
  switch (kind) {
    case 'heart':
      return (
        <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
          <path d="M36 61 C 13 45 7 33 11 23 C 15 12 29 11 36 23 C 43 11 57 12 61 23 C 65 33 59 45 36 61 Z" fill="#e0565b" stroke="#ffffff" strokeWidth="6" strokeLinejoin="round" paintOrder="stroke" />
          <ellipse cx="24" cy="25" rx="5" ry="3.5" fill="#ffffff" opacity=".5" transform="rotate(-30 24 25)" />
        </svg>
      );
    case 'plane':
      return (
        <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
          <path d="M7 36 L64 11 L49 61 L36 45 Z" fill="#4a7bbf" stroke="#ffffff" strokeWidth="6" strokeLinejoin="round" paintOrder="stroke" />
          <path d="M64 11 L36 45 L34 58" fill="none" stroke="#2d5a96" strokeWidth="2.4" strokeLinejoin="round" />
        </svg>
      );
    case 'sun':
      return (
        <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
          <circle cx="36" cy="36" r="34" fill="#ffffff" />
          <g stroke="#f2a93b" strokeWidth="4.5" strokeLinecap="round">
            <line x1="56" y1="36" x2="64" y2="36" />
            <line x1="50.1" y1="50.1" x2="55.8" y2="55.8" />
            <line x1="36" y1="56" x2="36" y2="64" />
            <line x1="21.9" y1="50.1" x2="16.2" y2="55.8" />
            <line x1="16" y1="36" x2="8" y2="36" />
            <line x1="21.9" y1="21.9" x2="16.2" y2="16.2" />
            <line x1="36" y1="16" x2="36" y2="8" />
            <line x1="50.1" y1="21.9" x2="55.8" y2="16.2" />
          </g>
          <circle cx="36" cy="36" r="14" fill="#f6c143" />
          <path d="M30 39 Q36 44 42 39" fill="none" stroke="#9a5a12" strokeWidth="2" strokeLinecap="round" />
          <circle cx="31.5" cy="33" r="1.6" fill="#9a5a12" />
          <circle cx="40.5" cy="33" r="1.6" fill="#9a5a12" />
        </svg>
      );
    case 'star':
      return (
        <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
          <polygon points="36,7 43.6,26.5 64.5,27.7 48.4,41 53.6,61.3 36,50 18.4,61.3 23.6,41 7.5,27.7 28.4,26.5" fill="#e9b949" stroke="#ffffff" strokeWidth="6" strokeLinejoin="round" paintOrder="stroke" />
        </svg>
      );
    case 'camera':
      return (
        <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
          <rect x="5" y="14" width="62" height="48" rx="10" fill="#ffffff" />
          <rect x="22" y="12" width="18" height="10" rx="3" fill="#2f7474" />
          <rect x="9" y="20" width="54" height="38" rx="7" fill="#3b8b8b" />
          <circle cx="36" cy="39" r="13" fill="#f5eddc" />
          <circle cx="36" cy="39" r="8" fill="#24575a" />
          <circle cx="33" cy="36" r="2.2" fill="#ffffff" opacity=".7" />
          <circle cx="55" cy="27" r="3" fill="#f6c143" />
        </svg>
      );
    case 'flower':
      return (
        <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
          <g fill="#ffffff">
            <circle cx="36" cy="21" r="14.5" />
            <circle cx="50.3" cy="31.4" r="14.5" />
            <circle cx="44.8" cy="48.1" r="14.5" />
            <circle cx="27.2" cy="48.1" r="14.5" />
            <circle cx="21.7" cy="31.4" r="14.5" />
          </g>
          <g fill="#f29bb8">
            <circle cx="36" cy="21" r="11" />
            <circle cx="50.3" cy="31.4" r="11" />
            <circle cx="44.8" cy="48.1" r="11" />
            <circle cx="27.2" cy="48.1" r="11" />
            <circle cx="21.7" cy="31.4" r="11" />
          </g>
          <circle cx="36" cy="36" r="9" fill="#f6c143" />
        </svg>
      );
    case 'post':
      return (
        <svg className={className} viewBox="0 0 64 78" aria-hidden="true">
          <rect x="4" y="4" width="56" height="70" fill="#ffffff" stroke="#ffffff" strokeWidth="7" strokeDasharray="0 7" strokeLinecap="round" />
          <rect x="9" y="9" width="46" height="60" fill="#8fb6a0" />
          <path d="M32 44 C 24 38 21 33 23 29 C 25 25 30 25 32 29 C 34 25 39 25 41 29 C 43 33 40 38 32 44 Z" fill="#ffffff" />
          <text x="32" y="62" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="7" fontWeight="700" letterSpacing="1" fill="#24463a">
            PAR AVION
          </text>
        </svg>
      );
    case 'love':
      return (
        <svg className={className} viewBox="0 0 132 46" aria-hidden="true">
          <rect x="3" y="3" width="126" height="40" rx="20" fill="#f4b6c2" stroke="#ffffff" strokeWidth="5" paintOrder="stroke" />
          <text x="66" y="31" textAnchor="middle" fontFamily="var(--font-hand), Caveat, cursive" fontSize="27" fontWeight="700" fill="#7a2238">
            je t&apos;aime
          </text>
        </svg>
      );
    case 'tag':
      return (
        <svg className={className} viewBox="0 0 140 46" aria-hidden="true">
          <path d="M20 4 H134 a4 4 0 0 1 4 4 V38 a4 4 0 0 1 -4 4 H20 L4 23 Z" fill="#d9b98c" stroke="#ffffff" strokeWidth="5" strokeLinejoin="round" paintOrder="stroke" />
          <circle cx="20" cy="23" r="4" fill="#fbf8f2" />
          <text x="82" y="30" textAnchor="middle" fontFamily="var(--font-hand), Caveat, cursive" fontSize="21" fontWeight="700" fill="#5b3b1c">
            on y retourne ?
          </text>
        </svg>
      );
    case 'tape':
      return (
        <svg className={className} viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true">
          <rect x="0" y="0" width="120" height="32" fill="#f2a7b3" opacity=".8" />
          <g fill="#ffffff" opacity=".35">
            {[6, 22, 38, 54, 70, 86, 102].map((x) => (
              <rect key={x} x={x} y="0" width="8" height="32" />
            ))}
          </g>
        </svg>
      );
  }
}
