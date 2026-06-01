import { createContext } from "react";
import type { Partner, PartnerInsert, PartnerUpdate } from "../types/partner";

export type PartnerContextValue = {
  partners: Partner[];
  loading: boolean;
  error: string;
  refreshPartners: () => Promise<void>;
  createPartner: (input: PartnerInsert) => Promise<Partner>;
  updatePartner: (id: string, input: PartnerUpdate) => Promise<Partner>;
  deletePartner: (id: string) => Promise<void>;
};

export const PartnerContext = createContext<PartnerContextValue | undefined>(undefined);
