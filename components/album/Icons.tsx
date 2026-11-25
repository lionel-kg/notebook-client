import type { ReactNode } from 'react';

function Svg({ size = 18, children }: { size?: number; children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

type P = { size?: number };

export const IconPhoto = ({ size }: P) => (
  <Svg size={size}>
    <rect x="3" y="5" width="18" height="15" rx="2" />
    <circle cx="9" cy="11" r="2" />
    <path d="M21 17l-5-5-9 8" />
  </Svg>
);
export const IconCamera = ({ size }: P) => (
  <Svg size={size}>
    <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
    <circle cx="12" cy="13.5" r="3.5" />
  </Svg>
);
export const IconText = ({ size }: P) => (
  <Svg size={size}>
    <path d="M4 7V5h16v2" />
    <path d="M12 5v14" />
    <path d="M9 19h6" />
  </Svg>
);
export const IconPlus = ({ size }: P) => (
  <Svg size={size}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const IconUndo = ({ size }: P) => (
  <Svg size={size}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </Svg>
);
export const IconRedoRot = ({ size }: P) => (
  <Svg size={size}>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 4v5h-5" />
  </Svg>
);
export const IconCursor = ({ size }: P) => (
  <Svg size={size}>
    <path d="M5 3l14 8-6 2-2 6z" />
  </Svg>
);
export const IconBrush = ({ size }: P) => (
  <Svg size={size}>
    <path d="M16 3l5 5L8 21H3v-5z" />
    <path d="M13 6l5 5" />
  </Svg>
);
export const IconEraser = ({ size }: P) => (
  <Svg size={size}>
    <path d="M7 21h13" />
    <path d="M3.5 14.5l9-9a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8L11 19H7.5z" />
    <path d="M9 9l6 6" />
  </Svg>
);
export const IconHeart = ({ size }: P) => (
  <Svg size={size}>
    <path d="M12 20.5C6 16.5 3 13 3 9.5 3 6.5 5.5 4.5 8 4.5c1.8 0 3.2 1 4 2.3.8-1.3 2.2-2.3 4-2.3 2.5 0 5 2 5 5 0 3.5-3 7-9 11z" />
  </Svg>
);
export const IconPage = ({ size }: P) => (
  <Svg size={size}>
    <path d="M6 3h9l4 4v14H6z" />
    <path d="M14 3v5h5" />
  </Svg>
);
export const IconChevronLeft = ({ size }: P) => (
  <Svg size={size}>
    <path d="M15 18l-6-6 6-6" />
  </Svg>
);
export const IconChevronRight = ({ size }: P) => (
  <Svg size={size}>
    <path d="M9 18l6-6-6-6" />
  </Svg>
);
export const IconFrame = ({ size }: P) => (
  <Svg size={size}>
    <rect x="3" y="3" width="18" height="18" rx="1" />
    <rect x="7" y="7" width="10" height="10" />
  </Svg>
);
export const IconTrash = ({ size }: P) => (
  <Svg size={size}>
    <path d="M4 7h16" />
    <path d="M10 11v6M14 11v6" />
    <path d="M6 7l1 13h10l1-13" />
    <path d="M9 7V4h6v3" />
  </Svg>
);
export const IconBack = ({ size }: P) => (
  <Svg size={size}>
    <path d="M19 12H5" />
    <path d="M11 6l-6 6 6 6" />
  </Svg>
);
export const IconEye = ({ size }: P) => (
  <Svg size={size}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);
export const IconPencil = ({ size }: P) => (
  <Svg size={size}>
    <path d="M4 20h4L19 9l-4-4L4 16v4z" />
    <path d="M13.5 6.5l4 4" />
  </Svg>
);
export const IconClose = ({ size }: P) => (
  <Svg size={size}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
export const IconZoomIn = ({ size }: P) => (
  <Svg size={size}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4-4M8 11h6M11 8v6" />
  </Svg>
);
export const IconZoomOut = ({ size }: P) => (
  <Svg size={size}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4-4M8 11h6" />
  </Svg>
);
