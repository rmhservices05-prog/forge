import { useContext } from "react";
import { CompanyContext } from "../context/companyContextValue";

export function useCompanies() {
  const context = useContext(CompanyContext);

  if (!context) {
    throw new Error("useCompanies must be used inside CompanyProvider");
  }

  return context;
}
