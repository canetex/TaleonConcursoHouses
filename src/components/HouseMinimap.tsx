import {
  coords_to_map_pixel,
  get_tibia_floor_map_url,
  get_tibiawiki_map_url,
  get_tibiamaps_external_url,
  TIBIA_MAP_PIXEL_SIZE,
  TIBIA_MAP_PREVIEW_ZOOM,
} from '../lib/tibia-map'

interface HouseMinimapProps {
  x: number
  y: number
  z: number
  house_name?: string
  wiki_url?: string | null
}

export function HouseMinimap({ x, y, z, house_name, wiki_url }: HouseMinimapProps) {
  const { px, py } = coords_to_map_pixel(x, y)
  const floor_map_url = get_tibia_floor_map_url(z)
  const tibiawiki_map_url = get_tibiawiki_map_url(x, y, z)
  const tibiamaps_url = get_tibiamaps_external_url(x, y, z)
  const map_scale = TIBIA_MAP_PREVIEW_ZOOM
  const map_size = TIBIA_MAP_PIXEL_SIZE * map_scale

  return (
    <div className="rounded-xl border border-amber-800/30 overflow-hidden bg-tibia-dark/60">
      <div className="flex items-center justify-between px-3 py-2 border-b border-amber-800/20">
        <p className="text-xs text-amber-200/50">Localização no mapa</p>
        <span className="text-[10px] text-amber-200/40">
          X: {x} Y: {y} Z: {z}
        </span>
      </div>
      <div
        className="relative h-52 overflow-hidden bg-[#1a1814] isolate"
        aria-label={house_name ? `Mapa de ${house_name}` : 'Mapa da casa'}
      >
        <img
          src={floor_map_url}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute max-w-none pointer-events-none select-none"
          style={{
            width: map_size,
            height: map_size,
            left: `calc(50% - ${px * map_scale}px)`,
            top: `calc(50% - ${py * map_scale}px)`,
          }}
        />
        <span
          className="absolute left-1/2 top-1/2 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 ring-2 ring-white shadow-md"
          aria-hidden
        />
      </div>
      <div className="flex flex-wrap gap-3 px-3 py-2 text-xs">
        <a
          href={tibiamaps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-tibia-gold hover:underline"
        >
          Abrir no TibiaMaps
        </a>
        <a
          href={tibiawiki_map_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-tibia-gold hover:underline"
        >
          Ver no Tibia Wiki
        </a>
        {wiki_url && (
          <a
            href={wiki_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-200/60 hover:underline"
          >
            Página da casa
          </a>
        )}
      </div>
    </div>
  )
}
