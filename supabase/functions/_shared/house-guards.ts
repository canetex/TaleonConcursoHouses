export interface ApprovedHouseSnapshot {
  character_name: string;
  house_tibia_name: string;
  house_city: string;
  house_wiki_slug: string;
  screenshot_urls: string[];
}

export interface HouseUpdatePayload {
  character_name: string;
  house_tibia_name: string;
  house_city: string;
  house_wiki_slug: string;
  screenshot_urls: string[];
}

function screenshot_urls_changed(before: string[], after: string[]): boolean {
  if (before.length !== after.length) return true;
  const sorted_before = [...before].sort();
  const sorted_after = [...after].sort();
  return sorted_before.some((url, index) => url !== sorted_after[index]);
}

/** Casas aprovadas voltam a pending se campos vitais forem alterados (anti bait-and-switch). */
export function approved_house_vitals_changed(
  existing: ApprovedHouseSnapshot,
  payload: HouseUpdatePayload,
): boolean {
  if (existing.character_name !== payload.character_name) return true;
  if (existing.house_tibia_name !== payload.house_tibia_name) return true;
  if (existing.house_city !== payload.house_city) return true;
  if (existing.house_wiki_slug !== payload.house_wiki_slug) return true;
  if (screenshot_urls_changed(existing.screenshot_urls, payload.screenshot_urls)) return true;
  return false;
}

export function should_reset_approved_to_pending(
  status: string,
  existing: ApprovedHouseSnapshot | null,
  payload: HouseUpdatePayload,
): boolean {
  if (status !== "approved" || !existing) return false;
  return approved_house_vitals_changed(existing, payload);
}
