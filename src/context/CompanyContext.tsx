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

        setError("");

        try {
          const company = await companyRepository.createCompany(profile.organizationId, input, companies.length);
          setCompanies((current) => [...current, company]);
          return company;
        } catch (createError) {
          setError(createError instanceof Error ? createError.message : "Unable to create company");
          throw createError;
        }
      },
      async updateCompany(companyId, input) {
        if (!profile) {
          throw new Error("You must be signed in to update a company.");
        }

        setError("");

        try {
          const company = await companyRepository.updateCompany(profile.organizationId, companyId, input);
          setCompanies((current) => current.map((item) => (item.id === companyId ? company : item)));
          return company;
        } catch (updateError) {
          setError(updateError instanceof Error ? updateError.message : "Unable to update company");
          throw updateError;
        }
      },
      async deleteCompany(companyId) {
        if (!profile) {
          throw new Error("You must be signed in to delete a company.");
        }

        setError("");

        try {
          await companyRepository.deleteCompany(profile.organizationId, companyId);
          setCompanies((current) => current.filter((item) => item.id !== companyId));
        } catch (deleteError) {
          setError(deleteError instanceof Error ? deleteError.message : "Unable to delete company");
          throw deleteError;
        }
      },
    }),
    [companies, error, loading, profile, refresh],
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}
