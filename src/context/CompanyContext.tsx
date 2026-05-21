import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { companyRepository, type CompanyInput } from "../data/companyRepository";
import { useAuth } from "../hooks/useAuth";
import { CompanyContext, type CompanyContextValue } from "./companyContextValue";

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [companies, setCompanies] = useState<CompanyContextValue["companies"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!profile) {
      setCompanies([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const nextCompanies = await companyRepository.listCompanies(profile.organizationId);
      setCompanies(nextCompanies);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load companies");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<CompanyContextValue>(
    () => ({
      companies,
      loading,
      error,
      refresh,
      async createCompany(input: CompanyInput) {
        if (!profile) {
          throw new Error("You must be signed in to create a company.");
        }

        const company = await companyRepository.createCompany(profile.organizationId, input, companies.length);
        setCompanies((current) => [...current, company]);
        return company;
      },
      async updateCompany(companyId, input) {
        if (!profile) {
          throw new Error("You must be signed in to update a company.");
        }

        const company = await companyRepository.updateCompany(profile.organizationId, companyId, input);
        setCompanies((current) => current.map((item) => (item.id === companyId ? company : item)));
        return company;
      },
      async deleteCompany(companyId) {
        if (!profile) {
          throw new Error("You must be signed in to delete a company.");
        }

        await companyRepository.deleteCompany(profile.organizationId, companyId);
        setCompanies((current) => current.filter((item) => item.id !== companyId));
      },
    }),
    [companies, error, loading, profile, refresh],
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}
