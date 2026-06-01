import { useContext } from "react";
import { PartnerContext } from "../context/partnerContextValue";

export function usePartners() {
  const context = useContext(PartnerContext);

  if (!context) {
    throw new Error("usePartners must be used inside PartnerProvider");
  }

  return context;
}
