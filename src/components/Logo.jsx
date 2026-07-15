export default function Logo({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="31.5" fill="var(--surface-soft)" stroke="var(--gold-line)" />
      <path
        d="M33 14c-.9 0-1.7.7-1.7 1.7v18.9c0 .8-.4 1.4-1.1 1.7-1 .4-2 .5-2.9 1.4-1.3 1.3-1.3 3.4 0 4.7 1.3 1.3 3.4 1.3 4.7 0 .9-.9 1.2-2.1 1-3.2V22.6c2.9 1.1 5.7 3.6 5.7 8 0 .9.7 1.7 1.7 1.7.9 0 1.7-.8 1.7-1.7 0-6.9-4.8-10.5-7.4-11.8v-2.2c0-1-.8-1.7-1.7-1.7z"
        fill="var(--gold)"
      />
    </svg>
  )
}
