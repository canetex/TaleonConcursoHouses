export type HouseStatus = 'pending' | 'approved' | 'rejected'
export type VoteType = 'match' | 'dislike'
export type ContestPhase = 'scheduled' | 'registration' | 'validation' | 'voting' | 'ended'

export interface ContestUser {
  id: string
  discord_id: string
  discord_username: string | null
  discord_avatar: string | null
  validated_character: string | null
  created_at: string
  updated_at: string
}

export interface House {
  id: string
  discord_user_id: string
  character_name: string
  location: string
  floor: string
  custom_name: string
  theme: string
  dummies_count: number
  hirelings_count: number
  screenshot_urls: string[]
  status: HouseStatus
  organizer_votes: number
  honorable_mention: boolean
  house_city: string | null
  house_tibia_name: string | null
  house_wiki_slug: string | null
  house_wiki_url: string | null
  house_type: 'house' | 'guildhall' | null
  map_x: number | null
  map_y: number | null
  map_z: number | null
  created_at: string
  updated_at: string
}

export interface HouseVote {
  id: string
  discord_user_id: string
  voter_character: string
  house_id: string
  vote_type: VoteType
  created_at: string
  updated_at: string
}

export interface LeaderboardEntry {
  id: string
  custom_name: string
  theme: string
  location: string
  character_name: string
  dummies_count: number
  hirelings_count: number
  organizer_votes: number
  honorable_mention: boolean
  screenshot_urls: string[]
  total_matches: number
  popular_points: number
  organizer_points: number
  utility_bonus: number
  total_points: number
}

export interface ContestDates {
  registration_start: string
  registration_end: string
  validation_end: string
  voting_end: string
}

export interface HouseRegistrationForm {
  character_name: string
  house_city: string
  house_tibia_name: string
  house_type: 'house' | 'guildhall'
  floor: string
  custom_name: string
  theme: string
  dummies_count: number
  hirelings_count: number
  screenshot_urls: string[]
}
