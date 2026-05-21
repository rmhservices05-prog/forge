import type { User } from "../types";
import { requireSupabase } from "../lib/supabase";

export const DEFAULT_ORGANIZATION = {
  id: "forge-internal",
  name: "Forge Internal",
  slug: "forge-internal",
} as const;

type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
};

type ProfileRow = {
  user_id: string;
  organization_id: string;
  name: string;
  email: string;
  role: User["role"];
  created_at: string;
};

export type OrganizationProfile = {
  userId: string;
  organizationId: string;
  name: string;
  email: string;
  role: User["role"];
};

export type OrganizationInfo = {
  id: string;
  name: string;
  slug: string;
};

function mapProfile(row: ProfileRow): OrganizationProfile {
  return {
    userId: row.user_id,
    organizationId: row.organization_id,
    name: row.name,
    email: row.email,
    role: row.role,
  };
}

function mapOrganization(row: OrganizationRow): OrganizationInfo {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
  };
}

async function getProfileByUserId(userId: string): Promise<OrganizationProfile | null> {
  const client = requireSupabase();
  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapProfile(data as ProfileRow) : null;
}

export const organizationRepository = {
  async getCurrentProfile(userId: string): Promise<OrganizationProfile | null> {
    return getProfileByUserId(userId);
  },

  async waitForProfile(userId: string, timeoutMs = 5000): Promise<OrganizationProfile | null> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const profile = await getProfileByUserId(userId);
      if (profile) {
        return profile;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 250));
    }

    return null;
  },

  async getOrganization(organizationId: string): Promise<OrganizationInfo | null> {
    const client = requireSupabase();
    const { data, error } = await client
      .from("organizations")
      .select("*")
      .eq("id", organizationId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapOrganization(data as OrganizationRow) : null;
  },

  async listMembers(organizationId: string): Promise<User[]> {
    const client = requireSupabase();
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => {
      const profile = mapProfile(row as ProfileRow);
      return {
        id: profile.userId,
        name: profile.name,
        email: profile.email,
        role: profile.role,
      } satisfies User;
    });
  },
};
