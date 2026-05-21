import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { companyLogRepository, type CompanyLogInput } from "../data/companyLogRepository";
import { companyRepository, type CompanyInput } from "../data/companyRepository";
import { useAuth } from "../hooks/useAuth";
import { CompanyContext, type CompanyContextValue } from "./companyContextValue";

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [companies, setCompanies] = useState<CompanyContextValue["companies"]>([]);
  const [companyLogs, setCompanyLogs] = useState<CompanyContextValue["companyLogs"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!profile) {
      setCompanies([]);
      setCompanyLogs([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [nextCompanies, nextCompanyLogs] = await Promise.all([
        companyRepository.listCompanies(profile.organizationId),
        companyLogRepository.listCompanyLogs(profile.organizationId),
      ]);
      setCompanies(nextCompanies);
      setCompanyLogs(nextCompanyLogs);
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
      companyLogs,
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
      async createCompanyLog(input: CompanyLogInput) {
        if (!profile) {
          throw new Error("You must be signed in to add a company log.");
        }

        setError("");

        try {
          const companyLog = await companyLogRepository.createCompanyLog(profile.organizationId, input);
          setCompanyLogs((current) => {
            const nextLogs = [companyLog, ...current];
            return nextLogs.sort((left, right) => {
              if (left.loggedOn !== right.loggedOn) {
                return right.loggedOn.localeCompare(left.loggedOn);
              }

              return right.createdAt.localeCompare(left.createdAt);
            });
          });
          return companyLog;
        } catch (createError) {
          setError(createError instanceof Error ? createError.message : "Unable to create company log");
          throw createError;
        }
      },
    }),
    [companies, companyLogs, error, loading, profile, refresh],
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}
