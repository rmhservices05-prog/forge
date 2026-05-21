import { createContext } from "react";
import type { Company, CompanyLog } from "../types";
import type { CompanyLogInput } from "../data/companyLogRepository";
import type { CompanyInput } from "../data/companyRepository";

export type CompanyContextValue = {
  companies: Company[];
  companyLogs: CompanyLog[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  createCompany: (input: CompanyInput) => Promise<Company>;
  updateCompany: (companyId: number, input: CompanyInput) => Promise<Company>;
  deleteCompany: (companyId: number) => Promise<void>;
  createCompanyLog: (input: CompanyLogInput) => Promise<CompanyLog>;
};

export const CompanyContext = createContext<CompanyContextValue | undefined>(undefined);
