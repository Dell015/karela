import { callRpc } from "@/services/rpc";

/** Squads and the Collective Shield (supabase/11_squads.sql). */

export type SquadRole = "leader" | "co_leader" | "member";

export interface PublicMember {
  user_id: string;
  display_name: string | null;
  username: string | null;
  profile_picture: string | null;
  frame: string[] | null;
  level: number;
  streak: number;
  /** ran (or is protected) today */
  covered_today: boolean;
}

export interface SquadMember extends PublicMember {
  role: SquadRole;
  joined_at: string;
  xp_contributed: number;
}

export interface JoinRequest extends PublicMember {
  sent_at: string;
}

export interface ShieldPool {
  target_id: string;
  collected: number;
  completed: boolean;
  my_gems: number;
  helpers: number;
}

export interface SquadRules {
  min_level: number;
  min_members: number;
  max_members: number;
  max_pending: number;
  rename_days: number;
  rejoin_hours: number;
  shield_cost: number;
  shield_opens: string;
}

export interface SquadState {
  rules: SquadRules;
  squad: null | {
    id: string;
    name: string;
    created_at: string;
    renamed_at: string | null;
    members_can_invite: boolean;
    invite_code: string | null;
    xp: number;
  };
  my_role?: SquadRole;
  my_level?: number;
  members?: SquadMember[];
  requests?: JoinRequest[];
  shields?: ShieldPool[];
  shield_window_open?: boolean;
  pending_request?: null | { squad_id: string; squad_name: string; sent_at: string };
}

export interface SquadPreview {
  id: string;
  name: string;
  members: number;
  max_members: number;
  xp: number;
}

export const getMySquad = () => callRpc<SquadState>("get_my_squad");
export const previewSquad = (code: string) => callRpc<SquadPreview>("preview_squad", { p_code: code });
export const createSquad = (name: string) => callRpc<SquadState>("create_squad", { p_name: name });
export const requestJoinSquad = (code: string) => callRpc<SquadState>("request_join_squad", { p_code: code });
export const cancelJoinRequest = () => callRpc<SquadState>("cancel_join_request");
export const respondJoinRequest = (userId: string, accept: boolean) =>
  callRpc<SquadState>("respond_join_request", { p_user: userId, p_accept: accept });
export const leaveSquad = () => callRpc<SquadState>("leave_squad");
export const removeSquadMember = (userId: string) => callRpc<SquadState>("remove_squad_member", { p_user: userId });
export const setSquadRole = (userId: string, role: SquadRole) =>
  callRpc<SquadState>("set_squad_role", { p_user: userId, p_role: role });
export const updateSquad = (name: string | null, membersCanInvite: boolean | null) =>
  callRpc<SquadState>("update_squad", { p_name: name, p_members_can_invite: membersCanInvite });
export const newSquadCode = () => callRpc<SquadState>("new_squad_code");
export const disbandSquad = () => callRpc<SquadState>("disband_squad");
export const contributeShield = (targetId: string, gems: number) =>
  callRpc<SquadState>("contribute_shield", { p_target: targetId, p_gems: gems });

export const ROLE_LABEL: Record<SquadRole, string> = {
  leader: "Leader",
  co_leader: "Co-leader",
  member: "Member",
};

export const memberName = (m: Pick<PublicMember, "display_name" | "username">) =>
  m.display_name || (m.username ? `@${m.username}` : "Karela runner");

/** At risk: has a streak, nothing done today. */
export const isAtRisk = (m: PublicMember) => m.streak > 0 && !m.covered_today;
