export const TIBIA_MAP_MIN_X = 31744
export const TIBIA_MAP_MIN_Y = 30976
export const TIBIA_MAP_PIXEL_SIZE = 1792
export const TIBIA_MAP_PREVIEW_ZOOM = 2

export function get_tibia_floor_map_url(z: number): string {
  const floor = Math.max(0, Math.min(15, z))
  return `https://tibiamaps.github.io/tibia-map-data/floor-${String(floor).padStart(2, '0')}-map.png`
}

export function coords_to_map_pixel(x: number, y: number): { px: number; py: number } {
  return {
    px: x - TIBIA_MAP_MIN_X,
    py: y - TIBIA_MAP_MIN_Y,
  }
}

export function get_tibiamaps_external_url(x: number, y: number, z: number): string {
  return `https://tibiamaps.io/map#${x},${y},${z}:${TIBIA_MAP_PREVIEW_ZOOM}`
}

export function get_tibiawiki_map_url(x: number, y: number, z: number): string {
  return `https://www.tibiawiki.com.br/wiki/mapa#${x},${y},${z}:6:1`
}
