import type { ReactNode } from 'react'

export const TALEON_SAN_URL = 'https://san.taleon.online/'
export const THE_CRUSTY_PROFILE_URL =
  'https://san.taleon.online/characterprofile.php?name=The%20Crusty'

const external_link_class = 'hover:underline'

export function TaleonSanLink({
  className = '',
  children,
}: {
  className?: string
  children?: ReactNode
}) {
  return (
    <a
      href={TALEON_SAN_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`${external_link_class} ${className}`.trim()}
    >
      {children ?? 'Taleon — San'}
    </a>
  )
}

export function TheCrustyLink({
  className = '',
  children,
}: {
  className?: string
  children?: ReactNode
}) {
  return (
    <a
      href={THE_CRUSTY_PROFILE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`${external_link_class} ${className}`.trim()}
    >
      {children ?? 'The Crusty'}
    </a>
  )
}
