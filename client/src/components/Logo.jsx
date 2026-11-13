/**
 * Brand mark: two overlapping speech bubbles (a conversation between people),
 * the front one carrying three dots for "many voices". Same artwork as public/favicon.svg.
 */
export default function Logo({ size = 36, showText = true, className = '' }) {
  return (
    <span className={`logo ${className}`}>
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        <path
          d="M24 4h12a8 8 0 0 1 8 8v4a8 8 0 0 1-6 7.75V30l-6.5-6H24a8 8 0 0 1-8-8v-4a8 8 0 0 1 8-8z"
          fill="var(--green-200)"
        />
        <path
          d="M12 12h14a8 8 0 0 1 8 8v6a8 8 0 0 1-8 8H17l-7.5 7v-7.3A8 8 0 0 1 4 26v-6a8 8 0 0 1 8-8z"
          fill="var(--green-600)"
          stroke="var(--surface)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="23" r="2.2" fill="#fff" />
        <circle cx="19" cy="23" r="2.2" fill="#fff" />
        <circle cx="26" cy="23" r="2.2" fill="#fff" />
      </svg>
      {showText && (
        <span className="logo-text">
          Community<b>Discussion</b>
        </span>
      )}
    </span>
  );
}
