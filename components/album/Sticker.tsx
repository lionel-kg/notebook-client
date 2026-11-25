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
    case 'suitcase':
      return (
        <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
          <path d="M27 18 V12 a4 4 0 0 1 4 -4 h10 a4 4 0 0 1 4 4 V18" fill="none" stroke="#ffffff" strokeWidth="10" strokeLinecap="round" />
          <path d="M27 18 V12 a4 4 0 0 1 4 -4 h10 a4 4 0 0 1 4 4 V18" fill="none" stroke="#7a4a2a" strokeWidth="4" strokeLinecap="round" />
          <rect x="8" y="18" width="56" height="44" rx="8" fill="#e58a3a" stroke="#ffffff" strokeWidth="6" paintOrder="stroke" />
          <rect x="20" y="18" width="6" height="44" fill="#b8642a" />
          <rect x="46" y="18" width="6" height="44" fill="#b8642a" />
          <circle cx="58" cy="27" r="3" fill="#f6c143" />
        </svg>
      );
    case 'palm':
      return (
        <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
          <ellipse cx="36" cy="60" rx="28" ry="9" fill="#f0d39a" stroke="#ffffff" strokeWidth="6" paintOrder="stroke" />
          <path d="M36 60 C 38 46 37 34 33 24" fill="none" stroke="#ffffff" strokeWidth="11" strokeLinecap="round" />
          <path d="M36 60 C 38 46 37 34 33 24" fill="none" stroke="#9a6a3a" strokeWidth="5" strokeLinecap="round" />
          <g fill="#3f9a5c" stroke="#ffffff" strokeWidth="5" strokeLinejoin="round" paintOrder="stroke">
            <path d="M33 24 C 24 14 12 16 7 24 C 16 21 24 22 33 24 Z" />
            <path d="M33 24 C 40 12 54 11 62 19 C 52 18 42 20 33 24 Z" />
            <path d="M33 24 C 30 14 34 6 42 4 C 38 11 35 17 33 24 Z" />
            <path d="M33 24 C 44 22 55 28 58 38 C 50 31 42 27 33 24 Z" />
          </g>
        </svg>
      );
    case 'pin':
      return (
        <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
          <path d="M36 66 C 22 48 14 38 14 27 a22 22 0 0 1 44 0 C 58 38 50 48 36 66 Z" fill="#d9454b" stroke="#ffffff" strokeWidth="6" strokeLinejoin="round" paintOrder="stroke" />
          <circle cx="36" cy="27" r="9" fill="#ffffff" />
        </svg>
      );
    case 'ticket':
      return (
        <svg className={className} viewBox="0 0 120 64" aria-hidden="true">
          <path d="M8 6 H112 a4 4 0 0 1 4 4 V24 a8 8 0 0 0 0 16 V54 a4 4 0 0 1 -4 4 H8 a4 4 0 0 1 -4 -4 V40 a8 8 0 0 0 0 -16 V10 a4 4 0 0 1 4 -4 Z" fill="#f6c968" stroke="#ffffff" strokeWidth="5" strokeLinejoin="round" paintOrder="stroke" />
          <line x1="86" y1="12" x2="86" y2="52" stroke="#b5832a" strokeWidth="2" strokeDasharray="4 4" />
          <text x="46" y="38" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="15" fontWeight="700" letterSpacing="2" fill="#7a5214">
            BILLET
          </text>
          <text x="101" y="37" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="11" fontWeight="700" fill="#7a5214">
            Nº1
          </text>
        </svg>
      );
    case 'compass':
      return (
        <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
          <circle cx="36" cy="36" r="29" fill="#f5eddc" stroke="#ffffff" strokeWidth="6" paintOrder="stroke" />
          <circle cx="36" cy="36" r="29" fill="none" stroke="#3a5f8a" strokeWidth="4" />
          <path d="M36 13 L42 36 L36 59 L30 36 Z" fill="#3a5f8a" />
          <path d="M36 13 L42 36 L30 36 Z" fill="#d9454b" />
          <circle cx="36" cy="36" r="3.5" fill="#f5eddc" stroke="#3a5f8a" strokeWidth="2" />
        </svg>
      );
    case 'mountain':
      return (
        <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
          <circle cx="54" cy="18" r="9" fill="#f6c143" stroke="#ffffff" strokeWidth="5" paintOrder="stroke" />
          <path d="M4 62 L26 22 L40 44 L48 32 L68 62 Z" fill="#5c7fa3" stroke="#ffffff" strokeWidth="6" strokeLinejoin="round" paintOrder="stroke" />
          <path d="M26 22 L33 35 L29 33 L25 37 L20 32 Z" fill="#ffffff" />
          <path d="M48 32 L53 40 L49 39 L45 42 L43 38 Z" fill="#ffffff" />
        </svg>
      );
    case 'wave':
      return (
        <svg className={className} viewBox="0 0 100 50" aria-hidden="true">
          <path d="M4 44 C 10 18 34 6 54 12 C 70 17 74 32 62 36 C 54 39 50 30 56 26 C 44 24 36 34 40 44 Z" fill="#3f8fc9" stroke="#ffffff" strokeWidth="6" strokeLinejoin="round" paintOrder="stroke" />
          <path d="M40 44 C 58 46 80 44 96 44" fill="none" stroke="#ffffff" strokeWidth="9" strokeLinecap="round" />
          <path d="M40 44 C 58 46 80 44 96 44" fill="none" stroke="#7cc0e8" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'icecream':
      return (
        <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
          <path d="M22 34 L36 68 L50 34 Z" fill="#e0b070" stroke="#ffffff" strokeWidth="6" strokeLinejoin="round" paintOrder="stroke" />
          <path d="M27 40 L44 52 M31 50 L41 40" stroke="#b8803e" strokeWidth="2" />
          <circle cx="29" cy="28" r="11" fill="#f4a6bd" stroke="#ffffff" strokeWidth="5" paintOrder="stroke" />
          <circle cx="44" cy="28" r="11" fill="#f8e2a8" stroke="#ffffff" strokeWidth="5" paintOrder="stroke" />
          <circle cx="36" cy="16" r="11" fill="#9fd3b0" stroke="#ffffff" strokeWidth="5" paintOrder="stroke" />
          <circle cx="36" cy="5" r="3.5" fill="#d9454b" />
        </svg>
      );
    case 'coffee':
      return (
        <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
          <path d="M28 8 C 24 13 32 16 28 22 M40 8 C 36 13 44 16 40 22" fill="none" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
          <path d="M28 8 C 24 13 32 16 28 22 M40 8 C 36 13 44 16 40 22" fill="none" stroke="#b9a48d" strokeWidth="3" strokeLinecap="round" />
          <path d="M52 34 a9 9 0 0 1 0 18" fill="none" stroke="#ffffff" strokeWidth="11" />
          <path d="M52 34 a9 9 0 0 1 0 18" fill="none" stroke="#c96f4a" strokeWidth="5" />
          <path d="M12 28 H56 V48 a16 16 0 0 1 -16 16 H28 a16 16 0 0 1 -16 -16 Z" fill="#c96f4a" stroke="#ffffff" strokeWidth="6" strokeLinejoin="round" paintOrder="stroke" />
          <path d="M18 40 C 26 44 36 36 50 40" fill="none" stroke="#f5eddc" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'moon':
      return (
        <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
          <path d="M44 8 A28 28 0 1 0 64 50 A22 22 0 0 1 44 8 Z" fill="#f2d16b" stroke="#ffffff" strokeWidth="6" strokeLinejoin="round" paintOrder="stroke" />
          <path d="M60 14 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" fill="#f2d16b" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" paintOrder="stroke" />
          <circle cx="26" cy="38" r="3" fill="#e2b94a" />
          <circle cx="34" cy="52" r="2" fill="#e2b94a" />
        </svg>
      );
    case 'cloud':
      return (
        <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
          <path d="M18 54 a12 12 0 0 1 -1 -24 a15 15 0 0 1 28 -6 a11 11 0 0 1 16 10 a10 10 0 0 1 -3 20 Z" fill="#cfe4f5" stroke="#ffffff" strokeWidth="6" strokeLinejoin="round" paintOrder="stroke" />
          <circle cx="28" cy="42" r="2" fill="#5c7fa3" />
          <circle cx="42" cy="42" r="2" fill="#5c7fa3" />
          <path d="M31 47 Q35 50 39 47" fill="none" stroke="#5c7fa3" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'rainbow':
      return (
        <svg className={className} viewBox="0 0 96 60" aria-hidden="true">
          <path d="M8 56 a40 40 0 0 1 80 0" fill="none" stroke="#ffffff" strokeWidth="34" />
          <path d="M12 56 a36 36 0 0 1 72 0" fill="none" stroke="#e0565b" strokeWidth="7" />
          <path d="M19 56 a29 29 0 0 1 58 0" fill="none" stroke="#f2a93b" strokeWidth="7" />
          <path d="M26 56 a22 22 0 0 1 44 0" fill="none" stroke="#f6d143" strokeWidth="7" />
          <path d="M33 56 a15 15 0 0 1 30 0" fill="none" stroke="#5cae7a" strokeWidth="7" />
          <path d="M40 56 a8 8 0 0 1 16 0" fill="none" stroke="#4a7bbf" strokeWidth="7" />
        </svg>
      );
    case 'butterfly':
      return (
        <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
          <g fill="#9b7fd1" stroke="#ffffff" strokeWidth="5" strokeLinejoin="round" paintOrder="stroke">
            <path d="M36 34 C 26 14 6 12 8 26 C 9 36 22 38 36 36 Z" />
            <path d="M36 34 C 46 14 66 12 64 26 C 63 36 50 38 36 36 Z" />
            <path d="M36 38 C 24 40 14 48 20 58 C 26 64 34 52 36 40 Z" />
            <path d="M36 38 C 48 40 58 48 52 58 C 46 64 38 52 36 40 Z" />
          </g>
          <circle cx="20" cy="26" r="4" fill="#f4b6c2" />
          <circle cx="52" cy="26" r="4" fill="#f4b6c2" />
          <rect x="33.5" y="24" width="5" height="30" rx="2.5" fill="#3d2f22" />
          <path d="M35 25 C 33 18 29 15 26 14 M37 25 C 39 18 43 15 46 14" fill="none" stroke="#3d2f22" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'sparkle':
      return (
        <svg className={className} viewBox="0 0 72 72" aria-hidden="true">
          <g fill="#f6c143" stroke="#ffffff" strokeWidth="5" strokeLinejoin="round" paintOrder="stroke">
            <path d="M30 8 C 32 24 36 28 52 30 C 36 32 32 36 30 52 C 28 36 24 32 8 30 C 24 28 28 24 30 8 Z" />
            <path d="M54 42 C 55 50 57 52 65 53 C 57 54 55 56 54 64 C 53 56 51 54 43 53 C 51 52 53 50 54 42 Z" />
          </g>
        </svg>
      );
    case 'souvenir':
      return (
        <svg className={className} viewBox="0 0 132 46" aria-hidden="true">
          <rect x="3" y="3" width="126" height="40" rx="6" fill="#bfe0cf" stroke="#ffffff" strokeWidth="5" paintOrder="stroke" />
          <text x="66" y="31" textAnchor="middle" fontFamily="var(--font-hand), Caveat, cursive" fontSize="27" fontWeight="700" fill="#24463a">
            souvenir
          </text>
        </svg>
      );
    case 'bisous':
      return (
        <svg className={className} viewBox="0 0 112 46" aria-hidden="true">
          <rect x="3" y="3" width="106" height="40" rx="20" fill="#d9454b" stroke="#ffffff" strokeWidth="5" paintOrder="stroke" />
          <text x="56" y="31" textAnchor="middle" fontFamily="var(--font-hand), Caveat, cursive" fontSize="27" fontWeight="700" fill="#ffffff">
            bisous
          </text>
        </svg>
      );
  }
}
