import type { ReactNode } from 'react'

export const TALEON_SAN_URL = 'https://san.taleon.online/'
export const THE_CRUSTY_PROFILE_URL =
  'https://san.taleon.online/characterprofile.php?name=The%20Crusty'
export const TIBIAWIKI_BASE_URL = 'https://www.tibiawiki.com.br/wiki/'

const external_link_class = 'hover:underline'

export function taleon_character_url(character_name: string): string {
  return `https://san.taleon.online/characterprofile.php?name=${encodeURIComponent(character_name)}`
}

export function tibiawiki_house_url(wiki_slug: string): string {
  return `${TIBIAWIKI_BASE_URL}${encodeURIComponent(wiki_slug)}`
}

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

export function CharacterProfileLink({
  character_name,
  className = '',
  children,
}: {
  character_name: string
  className?: string
  children?: ReactNode
}) {
  return (
    <a
      href={taleon_character_url(character_name)}
      target="_blank"
      rel="noopener noreferrer"
      className={`${external_link_class} ${className}`.trim()}
    >
      {children ?? character_name}
    </a>
  )
}

export function TibiaWikiHouseLink({
  wiki_slug,
  house_name,
  className = '',
  children,
}: {
  wiki_slug: string
  house_name?: string
  className?: string
  children?: ReactNode
}) {
  return (
    <a
      href={tibiawiki_house_url(wiki_slug)}
      target="_blank"
      rel="noopener noreferrer"
      className={`${external_link_class} ${className}`.trim()}
    >
      {children ?? house_name ?? wiki_slug.replace(/_/g, ' ')}
    </a>
  )
}
