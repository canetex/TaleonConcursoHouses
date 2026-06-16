export function get_house_permalink(house_id: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://canetex.github.io'
  return `${origin}${base}/house/${house_id}`
}
