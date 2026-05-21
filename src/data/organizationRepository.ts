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

function deriveName(email: string): string {
  const localPart = email.split("@")[0] ?? "Forge User";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ") || "Forge User";
}

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

export const organizationRepository = {
  async ensureMembership(userId: string, email: string): Promise<OrganizationProfile> {
    const client = requireSupabase();

    const { error: organizationError } = await client.from("organizations").upsert(DEFAULT_ORGANIZATION);
    if (organizationError) {
      throw organizationError;
    }

    const profileRow: ProfileRow = {
      user_id: userId,
      organization_id: DEFAULT_ORGANIZATION.id,
      name: deriveName(email),
      email,
      role: "Operator",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from("profiles")
      .upsert(profileRow)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapProfile(data as ProfileRow);
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
