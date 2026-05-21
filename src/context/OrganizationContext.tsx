import { useEffect, useMemo, useState, type ReactNode } from "react";
import { organizationRepository } from "../data/organizationRepository";
import { useAuth } from "../hooks/useAuth";
import { OrganizationContext, type OrganizationContextValue } from "./organizationContextValue";

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [organization, setOrganization] = useState<OrganizationContextValue["organization"]>(null);
  const [users, setUsers] = useState<OrganizationContextValue["users"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile) {
      setOrganization(null);
      setUsers([]);
      setLoading(false);
      setError("");
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError("");

    void Promise.all([
      organizationRepository.getOrganization(profile.organizationId),
      organizationRepository.listMembers(profile.organizationId),
    ])
      .then(([nextOrganization, nextUsers]) => {
        if (!isMounted) {
          return;
        }

        setOrganization(nextOrganization);
        setUsers(nextUsers);
      })
      .catch((loadError) => {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load organization");
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [profile]);

  const value = useMemo<OrganizationContextValue>(
    () => ({
      organization,
      users,
      loading,
      error,
      getUserById(userId) {
        return users.find((user) => user.id === userId);
      },
    }),
    [error, loading, organization, users],
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}
