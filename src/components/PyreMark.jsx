export default function PyreMark({ size = 16 }) {
  return (
    <svg width={size} height={(size * 56) / 52} viewBox="0 0 52 56" aria-hidden="true" focusable="false">
      <path d="M26 4 L48 50 L4 50 Z" fill="#F04A22" />
      <path d="M26 24 L37 50 L15 50 Z" fill="var(--bg)" />
    </svg>
  )
}
