import { refreshBuffs } from "@/services/buffs";
import { callRpc } from "@/services/rpc";
import type { PublicMember, SquadRole } from "@/services/squads";
import { KARELA } from "@/styles/designSystem";

/** Guilds and badges (supabase/12_guilds.sql). */

export type GuildColor = "lime" | "teal" | "aqua" | "sky" | "orange" | "coral" | "gold";
export type GuildRole = "leader" | "co_leader" | "member";
export type BadgeId = "pioneer" | "century_walkers" | "vanguard_guild" | "bayanihan_heart" | "iron_streak";

export const GUILD_COLORS: Record<GuildColor, string> = {
  lime: KARELA.color.brand,
  teal: KARELA.color.brandDeep,
  aqua: KARELA.vibrant.neonTeal,
  sky: KARELA.vibrant.sky,
  orange: KARELA.color.civic,
  coral: KARELA.color.danger,
  gold: KARELA.color.gold,
};

export const guildColor = (c?: string | null) => GUILD_COLORS[(c as GuildColor) ?? "lime"] ?? KARELA.color.brand;

export interface GuildRules {
  found_xp: number;
  min_squad_members: number;
  max_squads: number;
  rename_days: number;
  century_km: number;
  bayanihan_reports: number;
  iron_streak_days: number;
  iron_streak_gems: number;
  pioneer_days: number;
}

export interface GuildListItem {
  id: string;
  name: string;
  color: GuildColor;
  squads: number;
  members: number;
  max_squads: number;
  xp: number;
  badges: BadgeId[];
  applied: boolean;
}

export interface GuildMember extends PublicMember {
  squad_id: string;
  squad_name: string;
  role: GuildRole;
}

export interface GuildState {
  rules: GuildRules;
  in_squad: boolean;
  squad_role?: SquadRole;
  squad_xp?: number;
  squad_members?: number;
  my_squad_id?: string;
  my_role?: GuildRole;
  application?: null | { guild_id: string; guild_name: string; sent_at: string };
  guild: null | {
    id: string;
    name: string;
    color: GuildColor;
    created_at: string;
    renamed_at: string | null;
    leader_id: string | null;
    xp: number;
    km_since_founding: number;
    verified_reports: number;
  };
  squads?: { id: string; name: string; members: number; xp: number; joined_at: string }[];
  members?: GuildMember[];
  applications?: { squad_id: string; name: string; members: number; xp: number; sent_at: string }[];
  week?: { km: number; reports: number; active_members: number };
  badges?: Partial<Record<BadgeId, string>>;
  buffs?: { xp_multiplier: number; gem_multiplier: number; map_theme: boolean };
}

const withBuffs = async <T>(p: Promise<T>) => {
  const r = await p;
  refreshBuffs();
  return r;
};

export const getMyGuild = () => callRpc<GuildState>("get_my_guild");
export const listGuilds = (search?: string) => callRpc<GuildListItem[]>("list_guilds", { p_search: search || null });
export const foundGuild = (name: string, color: GuildColor) =>
  withBuffs(callRpc<GuildState>("found_guild", { p_name: name, p_color: color }));
export const applyToGuild = (guildId: string) => callRpc<GuildState>("apply_to_guild", { p_guild: guildId });
export const cancelGuildApplication = () => callRpc<GuildState>("cancel_guild_application");
export const respondGuildApplication = (squadId: string, accept: boolean) =>
  callRpc<GuildState>("respond_guild_application", { p_squad: squadId, p_accept: accept });
export const leaveGuild = () => withBuffs(callRpc<GuildState>("leave_guild"));
export const removeGuildSquad = (squadId: string) => callRpc<GuildState>("remove_guild_squad", { p_squad: squadId });
export const setGuildRole = (userId: string, role: GuildRole) =>
  callRpc<GuildState>("set_guild_role", { p_user: userId, p_role: role });
export const updateGuild = (name: string | null, color: GuildColor | null) =>
  callRpc<GuildState>("update_guild", { p_name: name, p_color: color });

export interface BadgeInfo {
  id: BadgeId;
  name: string;
  goal: string;
  reward: string;
}

/** aboutkarela.md "Guild Badges & Permanent Buffs". */
export const BADGES: BadgeInfo[] = [
  { id: "pioneer", name: "Pioneer", goal: "Hold a landmark for the first time", reward: "+2% XP for every member for 30 days" },
  { id: "century_walkers", name: "Century Walkers", goal: "1,000 km together since the guild was founded", reward: "+5% Gems for every member, for good" },
  { id: "bayanihan_heart", name: "Bayanihan Heart", goal: "50 civic reports confirmed by neighbours", reward: "A guild map theme" },
  { id: "iron_streak", name: "Iron Streak", goal: "Every member on a 7-day streak at the same time", reward: "500 Gems shared among members" },
  { id: "vanguard_guild", name: "Vanguard Guild", goal: "10 members who are Vanguards", reward: "Faster report reviews (Vanguards come later)" },
];
