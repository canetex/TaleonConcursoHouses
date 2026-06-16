import { supabase } from './supabase'

export interface HouseCoords {
  x: number
  y: number
  z: number
}

export async function fetch_house_coords(wiki_slug: string): Promise<HouseCoords | null> {
  const { data, error } = await supabase.functions.invoke('house-wiki-coords', {
    body: { wiki_slug },
  })

  if (error || !data?.coords) return null
  return data.coords as HouseCoords
}
