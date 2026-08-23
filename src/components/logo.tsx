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
      <rect x="3" y="2" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M7 15L10.5 10.5L13 12.5L17 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 7H17V10.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
