import { HOUSE_IMAGE_PLACEHOLDER_URL } from '../lib/images'

interface HouseImagePlaceholderProps {
  label: string
  subtitle?: string
  className?: string
}

export function HouseImagePlaceholder({ label, subtitle, className }: HouseImagePlaceholderProps) {
  return (
    <div
      className={`relative overflow-hidden ${className ?? 'w-full h-full min-h-[240px]'}`}
      role="img"
      aria-label={label}
    >
      <img
        src={HOUSE_IMAGE_PLACEHOLDER_URL}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-lg brightness-[0.55] saturate-90"
      />
      <div className="absolute inset-0 bg-brand-black/45" />
      <div className="relative z-10 flex h-full min-h-[inherit] flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-lg sm:text-xl font-semibold text-brand-cream text-balance drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
          {label}
        </p>
        {subtitle && (
          <p className="text-sm text-brand-smoke/90 italic text-balance drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}
