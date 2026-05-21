import { createContext } from "react";
import type { User } from "../types";
import type { OrganizationInfo } from "../data/organizationRepository";

export type OrganizationContextValue = {
  organization: OrganizationInfo | null;
  users: User[];
  loading: boolean;
  error: string;
  getUserById: (userId: string) => User | undefined;
};

export const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);
