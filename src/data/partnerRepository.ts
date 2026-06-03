import { requireSupabase } from "../lib/supabase";
import type { Partner, PartnerInsert, PartnerUpdate } from "../types/partner";

type PartnerRow = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  current_role: string | null;
  profile_type: Partner["profile_type"];
  network_value: string | null;
  linkedin_url: string | null;
  email: string | null;
  outreach_status: Partner["outreach_status"];
  date_contacted: string | null;
  next_step: string | null;
  notes: string | null;
};

function mapPartner(row: PartnerRow): Partner {
  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    name: row.name,
    current_role: row.current_role,
    profile_type: row.profile_type,
    network_value: row.network_value,
    linkedin_url: row.linkedin_url,
    email: row.email,
    outreach_status: row.outreach_status,
    date_contacted: row.date_contacted,
    next_step: row.next_step,
    notes: row.notes,
  };
}

function toPartnerRow(input: PartnerInsert | PartnerUpdate) {
  return {
    name: input.name,
    current_role: input.current_role ?? null,
    profile_type: input.profile_type ?? null,
    network_value: input.network_value ?? null,
    linkedin_url: input.linkedin_url ?? null,
    email: input.email ?? null,
    outreach_status: input.outreach_status ?? "not_contacted",
    date_contacted: input.date_contacted ?? null,
    next_step: input.next_step ?? null,
    notes: input.notes ?? null,
    updated_at: new Date().toISOString(),
  };
}

export const partnerRepository = {
  async listPartners(): Promise<Partner[]> {
    const client = requireSupabase();
    const { data, error } = await client.from("partners").select("*").order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => mapPartner(row as PartnerRow));
  },

  async createPartner(input: PartnerInsert): Promise<Partner> {
    const client = requireSupabase();
    const { data, error } = await client.from("partners").insert(toPartnerRow(input)).select("*").single();

    if (error) {
      throw error;
    }

    return mapPartner(data as PartnerRow);
  },

  async updatePartner(id: string, input: PartnerUpdate): Promise<Partner> {
    const client = requireSupabase();
    const { data, error } = await client
      .from("partners")
      .update(toPartnerRow(input))
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapPartner(data as PartnerRow);
  },

  async deletePartner(id: string): Promise<void> {
    const client = requireSupabase();
    const { error } = await client.from("partners").delete().eq("id", id);

    if (error) {
      throw error;
    }
  },
};
