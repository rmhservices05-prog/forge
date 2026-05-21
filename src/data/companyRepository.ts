import { initialCompanies } from "./companies";
import { requireSupabase } from "../lib/supabase";
import type { Company, CompanyStatus } from "../types";

type CompanyRow = {
  id: number;
  organization_id: string;
  name: string;
  industry: string;
  location: string;
  status: CompanyStatus;
  last_interaction: string;
  employee_range: string;
  logo_color: string;
  city: string;
  country: string;
  contact_address: string;
  website: string;
  contact_person: string;
  contact_email: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
};

export type CompanyInput = Pick<
  Company,
  | "name"
  | "industry"
  | "location"
  | "status"
  | "employeeRange"
  | "city"
  | "country"
  | "contactAddress"
  | "website"
  | "contactPerson"
  | "contactEmail"
  | "phoneNumber"
>;

function mapCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    location: row.location,
    status: row.status,
    lastInteraction: row.last_interaction,
    employeeRange: row.employee_range,
    logoColor: row.logo_color,
    city: row.city,
    country: row.country,
    contactAddress: row.contact_address,
    website: row.website,
    contactPerson: row.contact_person,
    contactEmail: row.contact_email,
    phoneNumber: row.phone_number,
  };
}

function toInsertRow(organizationId: string, company: Company | CompanyInput, index = 0) {
  const logoFallback = initialCompanies[index % initialCompanies.length]?.logoColor ?? "blue";

  return {
    organization_id: organizationId,
    name: company.name,
    industry: company.industry,
    location: company.location,
    status: company.status,
    last_interaction: "lastInteraction" in company ? company.lastInteraction : "Just now",
    employee_range: company.employeeRange,
    logo_color: "logoColor" in company ? company.logoColor : logoFallback,
    city: company.city,
    country: company.country,
    contact_address: company.contactAddress,
    website: company.website,
    contact_person: company.contactPerson,
    contact_email: company.contactEmail,
    phone_number: company.phoneNumber,
  };
}

async function ensureSeedCompanies(organizationId: string): Promise<void> {
  const client = requireSupabase();
  const { count, error } = await client
    .from("companies")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  if (error) {
    throw error;
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const rows = initialCompanies.map((company, index) => ({
    id: company.id,
    ...toInsertRow(organizationId, company, index),
  }));

  const { error: insertError } = await client.from("companies").insert(rows);

  if (insertError) {
    throw insertError;
  }
}

export const companyRepository = {
  async listCompanies(organizationId: string): Promise<Company[]> {
    await ensureSeedCompanies(organizationId);

    const client = requireSupabase();
    const { data, error } = await client
      .from("companies")
      .select("*")
      .eq("organization_id", organizationId)
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => mapCompany(row as CompanyRow));
  },

  async createCompany(organizationId: string, input: CompanyInput, nextIndex: number): Promise<Company> {
    const client = requireSupabase();
    const { data, error } = await client
      .from("companies")
      .insert(toInsertRow(organizationId, input, nextIndex))
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapCompany(data as CompanyRow);
  },

  async updateCompany(organizationId: string, companyId: number, input: CompanyInput): Promise<Company> {
    const client = requireSupabase();
    const { data, error } = await client
      .from("companies")
      .update({
        name: input.name,
        industry: input.industry,
        location: input.location,
        status: input.status,
        employee_range: input.employeeRange,
        city: input.city,
        country: input.country,
        contact_address: input.contactAddress,
        website: input.website,
        contact_person: input.contactPerson,
        contact_email: input.contactEmail,
        phone_number: input.phoneNumber,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId)
      .eq("id", companyId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return mapCompany(data as CompanyRow);
  },

  async deleteCompany(organizationId: string, companyId: number): Promise<void> {
    const client = requireSupabase();
    const { error } = await client
      .from("companies")
      .delete()
      .eq("organization_id", organizationId)
      .eq("id", companyId);

    if (error) {
      throw error;
    }
  },
};
