interface HouseMinimapProps {
  x: number
  y: number
  z: number
  house_name?: string
  wiki_url?: string | null
}

export function HouseMinimap({ x, y, z, house_name, wiki_url }: HouseMinimapProps) {
  const tibiawiki_map_url = `https://www.tibiawiki.com.br/wiki/mapa#${x},${y},${z}:6:1`
  const tibiamaps_url = `https://tibiamaps.io/map#${x},${y},${z}:2`

  return (
    <div className="rounded-xl border border-amber-800/30 overflow-hidden bg-tibia-dark/60">
      <div className="flex items-center justify-between px-3 py-2 border-b border-amber-800/20">
        <p className="text-xs text-amber-200/50">Localização no mapa</p>
        <span className="text-[10px] text-amber-200/40">
          X: {x} Y: {y} Z: {z}
        </span>
      </div>
      <div className="relative h-52 bg-black/30">
        <iframe
          title={house_name ? `Mapa de ${house_name}` : 'Mapa da casa'}
          src={tibiamaps_url}
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="flex gap-3 px-3 py-2 text-xs">
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
