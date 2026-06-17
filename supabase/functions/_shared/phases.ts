import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

export interface ContestDates {
  registration_start: string;
  registration_end: string;
  validation_end: string;
  voting_end: string;
}

export type ContestPhase = "scheduled" | "registration" | "validation" | "voting" | "ended";

export async function load_contest_dates(supabase: SupabaseClient): Promise<ContestDates | null> {
  const { data, error } = await supabase.from("contest_config").select("key, value");
  if (error || !data?.length) return null;
  const map = Object.fromEntries(data.map((row) => [row.key, row.value]));
  if (!map.registration_start || !map.registration_end || !map.validation_end || !map.voting_end) {
    return null;
  }
  return {
    registration_start: map.registration_start,
    registration_end: map.registration_end,
    validation_end: map.validation_end,
    voting_end: map.voting_end,
  };
}

export function get_current_phase(dates: ContestDates, now = new Date()): ContestPhase {
  const registration_start = new Date(dates.registration_start);
  const registration_end = new Date(dates.registration_end);
  const validation_end = new Date(dates.validation_end);
  const voting_end = new Date(dates.voting_end);

  if (now < registration_start) return "scheduled";
  if (now < registration_end) return "registration";
  if (now < validation_end) return "validation";
  if (now < voting_end) return "voting";
  return "ended";
}

export async function assert_registration_open(supabase: SupabaseClient): Promise<void> {
  const dates = await load_contest_dates(supabase);
  if (!dates) throw new Error("Configuração do concurso indisponível");

  const now = new Date();
  const registration_start = new Date(dates.registration_start);
  const registration_end = new Date(dates.registration_end);

  if (now < registration_start) {
    throw new Error("O período de inscrições ainda não abriu");
  }
  if (now >= registration_end) {
    throw new Error("O período de inscrições está encerrado");
  }
}

export async function assert_voting_open(supabase: SupabaseClient): Promise<void> {
  const dates = await load_contest_dates(supabase);
  if (!dates) throw new Error("Configuração do concurso indisponível");
  if (get_current_phase(dates) !== "voting") {
    throw new Error("A votação não está aberta");
  }
}

export async function load_admin_ids(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase
    .from("contest_config")
    .select("value")
    .eq("key", "admin_discord_ids")
    .maybeSingle();
  if (!data?.value) return [];
  return data.value.split(",").map((id: string) => id.trim()).filter(Boolean);
}
