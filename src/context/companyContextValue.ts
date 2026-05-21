import { createContext } from "react";
import type { Company } from "../types";
import type { CompanyInput } from "../data/companyRepository";

export type CompanyContextValue = {
  companies: Company[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  createCompany: (input: CompanyInput) => Promise<Company>;
  updateCompany: (companyId: number, input: CompanyInput) => Promise<Company>;
  deleteCompany: (companyId: number) => Promise<void>;
};

export const CompanyContext = createContext<CompanyContextValue | undefined>(undefined);
