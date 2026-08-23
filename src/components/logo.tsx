// Hoard mark: a treasure chest with two playing cards peeking out the top.
// Chest and cards are fixed brand colors (not currentColor) since the mark is
// inherently multi-color. On a navy surface (the sidebar) pass `tone="reversed"`
// so the chest body becomes a light outline instead of navy-on-navy.
export function LogoMark({ className, tone = "default" }: { className?: string; tone?: "default" | "reversed" }) {
  const chestFill = tone === "reversed" ? "none" : "#0B132B";
  const chestStroke = tone === "reversed" ? "#F2F2F2" : "#0B132B";

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* left (white) card */}
      <g transform="rotate(-16 9 8)">
        <rect x="6" y="3" width="6" height="9" rx="1" fill="#F2F2F2" stroke="#0B132B" strokeWidth="0.6" />
        <path
          d="M9 6.1l.55 1.12 1.24.18-.9.87.21 1.23L9 8.9l-1.1.6.21-1.23-.9-.87 1.24-.18L9 6.1z"
          fill="#0B132B"
        />
      </g>
      {/* right (red) card */}
      <g transform="rotate(14 15 7)">
        <rect x="12" y="2.3" width="6" height="9" rx="1" fill="#B91C2C" stroke="#0B132B" strokeWidth="0.6" />
        <path
          d="M15 5.4l.55 1.12 1.24.18-.9.87.21 1.23L15 8.2l-1.1.6.21-1.23-.9-.87 1.24-.18L15 5.4z"
          fill="#F2F2F2"
        />
      </g>
      {/* chest lid */}
      <path
        d="M3.2 13.5C3.2 9.9 6.7 7 12 7s8.8 2.9 8.8 6.5"
        fill={chestFill}
        stroke={chestStroke}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* chest base */}
      <rect x="2.6" y="13" width="18.8" height="7.6" rx="1.8" fill={chestFill} stroke={chestStroke} strokeWidth="1.4" />
      {/* lock */}
      <circle cx="12" cy="16.6" r="1.15" fill={tone === "reversed" ? "#F2F2F2" : "#F2F2F2"} />
      <rect x="11.35" y="17.1" width="1.3" height="1.6" rx="0.3" fill={tone === "reversed" ? "#F2F2F2" : "#F2F2F2"} />
    </svg>
  );
}
