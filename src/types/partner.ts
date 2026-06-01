export type ProfileType =
  | "ex_prime_bd"
  | "ex_military"
  | "uxv_drone_sector"
  | "ecosystem_connector"
  | "nato_allied"
  | "other";

export type OutreachStatus =
  | "not_contacted"
  | "message_sent"
  | "replied"
  | "call_scheduled"
  | "agreement_sent"
  | "signed"
  | "declined";

export type Clause5Status = "yes" | "no" | "tbc";

export interface Partner {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  current_role: string | null;
  profile_type: ProfileType | null;
  network_value: string | null;
  linkedin_url: string | null;
  email: string | null;
  outreach_status: OutreachStatus;
  date_contacted: string | null;
  clause_5_clear: Clause5Status;
  next_step: string | null;
  notes: string | null;
}

export type PartnerInsert = Omit<Partner, "id" | "created_at" | "updated_at">;
export type PartnerUpdate = Partial<PartnerInsert>;
