// Hoard mark: a bold "H" letterform with an upward trend arrow crossing it.
// The H uses currentColor (adapts to its container); the arrow is always brand
// red, matching the wordmark artwork, regardless of what surface it sits on.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="4.3" y="3.5" width="3.2" height="17" rx="0.8" fill="currentColor" />
      <rect x="16.5" y="3.5" width="3.2" height="17" rx="0.8" fill="currentColor" />
      <rect x="4.3" y="10.4" width="15.4" height="3.2" rx="0.8" fill="currentColor" />
      <path
        d="M5.5 16.5L10.5 10.5L13.5 13L19 6.5"
        stroke="#B91C2C"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M15 6.5H19V10.5" stroke="#B91C2C" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
