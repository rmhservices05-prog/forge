import type { Dispatch } from "react";
import { pushAppToast } from "../components/toastBus";
import { partnerRepository } from "../data/partnerRepository";
import { PARTNER_ADDED, PARTNER_REMOVED, PARTNER_UPDATED, PARTNERS_LOADED, type PartnerAction } from "./partnerReducer";
import type { Partner, PartnerInsert, PartnerUpdate } from "../types/partner";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function toastError(error: unknown, fallback: string) {
  pushAppToast({
    intent: "danger",
    message: getErrorMessage(error, fallback),
  });
}

export function loadPartnersThunk() {
  return async (dispatch: Dispatch<PartnerAction>) => {
    try {
      const partners = await partnerRepository.listPartners();
      dispatch({ type: PARTNERS_LOADED, payload: partners });
      return partners;
    } catch (error) {
      toastError(error, "Unable to load partners");
      throw error;
    }
  };
}

export function addPartnerThunk(input: PartnerInsert) {
  return async (dispatch: Dispatch<PartnerAction>) => {
    try {
      const partner = await partnerRepository.createPartner(input);
      dispatch({ type: PARTNER_ADDED, payload: partner });
      return partner;
    } catch (error) {
      toastError(error, "Unable to add partner");
      throw error;
    }
  };
}

export function updatePartnerThunk(id: string, input: PartnerUpdate) {
  return async (dispatch: Dispatch<PartnerAction>) => {
    try {
      const partner = await partnerRepository.updatePartner(id, input);
      dispatch({ type: PARTNER_UPDATED, payload: partner });
      return partner;
    } catch (error) {
      toastError(error, "Unable to update partner");
      throw error;
    }
  };
}

export function removePartnerThunk(id: string) {
  return async (dispatch: Dispatch<PartnerAction>) => {
    try {
      await partnerRepository.deletePartner(id);
      dispatch({ type: PARTNER_REMOVED, payload: id });
    } catch (error) {
      toastError(error, "Unable to delete partner");
      throw error;
    }
  };
}

export type PartnerThunkResult<T> = Promise<T>;
export type PartnerThunkDispatch = Dispatch<PartnerAction>;
export type PartnerThunk<T> = (dispatch: Dispatch<PartnerAction>) => Promise<T>;
export type { Partner, PartnerInsert, PartnerUpdate };
