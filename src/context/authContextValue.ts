import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { OrganizationProfile } from "../data/organizationRepository";

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: OrganizationProfile | null;
  loading: boolean;
  error: string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
