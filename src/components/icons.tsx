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

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...props}>
      <path d="M6 12.5 10 16.5 18 8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function BookmarkIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" {...props}>
      <path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.6L6 20V5.5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
    </svg>
  )
}

export function CalendarPlusIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.4" />
      <path d="M8 3.5v3M16 3.5v3M3.5 9.5h17M12 12v5M9.5 14.5h5" strokeLinecap="round" />
    </svg>
  )
}

export function TvIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <rect x="3.5" y="6" width="17" height="12" rx="2.2" />
      <path d="M8 21h8M9 3.5l3 2.5 3-2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function GearIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** The Pitchside mark: corner flag on the corner arc. */
export function PitchsideMark({ size = 28, ...props }: IconProps & { size?: number }) {
  return (
    <svg viewBox="0 0 256 256" width={size} height={size} aria-hidden="true" {...props}>
      <rect width="256" height="256" rx="58" fill="#0E3C29" />
      <path d="M60 236 A96 96 0 0 1 156 140" fill="none" stroke="#FBF8F0" strokeWidth="9" strokeLinecap="round" />
      <path d="M96 236V44" stroke="#FBF8F0" strokeWidth="10" strokeLinecap="round" />
      <path d="M101 46 L214 82 L101 118 Z" fill="#E5A62E" />
    </svg>
  )
}
