// Collectfolio mark: a slab/card outline with an upward trend line, drawn as
// lucide-style strokes so it drops into the same `currentColor` usage as the
// icon it replaced (size + color controlled by the parent via className).
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="4" y="3" width="13" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M7 14.5L10 10.5L12.5 12.5L15.5 8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 8H15.5V10.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
