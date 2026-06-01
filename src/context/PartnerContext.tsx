import { useCallback, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import { addPartnerThunk, loadPartnersThunk, removePartnerThunk, updatePartnerThunk } from "../store/partnerActions";
import { initialPartnerState, partnerReducer } from "../store/partnerReducer";
import { PartnerContext, type PartnerContextValue } from "./partnerContextValue";

export function PartnerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(partnerReducer, initialPartnerState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshPartners = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await loadPartnersThunk()(dispatch);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load partners");
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    void refreshPartners();
  }, [refreshPartners]);

  const value = useMemo<PartnerContextValue>(
    () => ({
      partners: state.partners,
      loading,
      error,
      refreshPartners,
      async createPartner(input) {
        setError("");
        try {
          return await addPartnerThunk(input)(dispatch);
        } catch (createError) {
          setError(createError instanceof Error ? createError.message : "Unable to add partner");
          throw createError;
        }
      },
      async updatePartner(id, input) {
        setError("");
        try {
          return await updatePartnerThunk(id, input)(dispatch);
        } catch (updateError) {
          setError(updateError instanceof Error ? updateError.message : "Unable to update partner");
          throw updateError;
        }
      },
      async deletePartner(id) {
        setError("");
        try {
          await removePartnerThunk(id)(dispatch);
        } catch (deleteError) {
          setError(deleteError instanceof Error ? deleteError.message : "Unable to delete partner");
          throw deleteError;
        }
      },
    }),
    [dispatch, error, loading, refreshPartners, state.partners],
  );

  return <PartnerContext.Provider value={value}>{children}</PartnerContext.Provider>;
}
