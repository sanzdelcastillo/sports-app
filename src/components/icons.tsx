import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export function GlobeIcon({ accent = 'cyan', ...props }: IconProps & { accent?: 'cyan' | 'orange' }) {
  const a = accent === 'orange' ? '#FF7A18' : '#00E5FF'
  const b = accent === 'orange' ? '#FF3B30' : '#007BFF'
  return (
    <svg viewBox="0 0 36 36" fill="none" aria-hidden="true" {...props}>
      <rect width="36" height="36" rx="10" fill="#0B121A" />
      <circle cx="18" cy="18" r="9.2" stroke={`url(#g-${accent})`} strokeWidth="2" />
      <ellipse cx="18" cy="18" rx="4.1" ry="9.2" stroke={`url(#g-${accent})`} strokeWidth="1.5" />
      <path
        d="M9 18h18M10.6 13.6h14.8M10.6 22.4h14.8"
        stroke={`url(#g-${accent})`}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id={`g-${accent}`} x1="8" y1="8" x2="28" y2="28">
          <stop stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.4" />
      <path d="M8 3.5v3M16 3.5v3M3.5 9.5h17" />
    </svg>
  )
}

export function NewsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <rect x="4" y="4.5" width="16" height="15" rx="2" />
      <path d="M8 9h8M8 12.5h8M8 16h5" />
    </svg>
  )
}

export function ClockIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 8v4.4l2.8 1.8" strokeLinecap="round" />
    </svg>
  )
}

export function AlertIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <path d="M12 4.5 20.4 19H3.6L12 4.5Z" />
      <path d="M12 10v4.2M12 16.8v.3" strokeLinecap="round" />
    </svg>
  )
}

export function UserIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <circle cx="12" cy="8.4" r="3.1" />
      <path d="M5.6 18.6c1.3-2.6 3.5-3.9 6.4-3.9s5.1 1.3 6.4 3.9" strokeLinecap="round" />
    </svg>
  )
}

export function ExternalIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M14 6h4v4M18 6l-7 7" strokeLinecap="round" />
      <path d="M16 13.5V17a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 6 17V10A1.5 1.5 0 0 1 7.5 8.5H11" />
    </svg>
  )
}
