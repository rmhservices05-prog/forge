import type { Partner } from "../types/partner";

export type PartnerState = {
  partners: Partner[];
};

export const PARTNERS_LOADED = "PARTNERS_LOADED";
export const PARTNER_ADDED = "PARTNER_ADDED";
export const PARTNER_UPDATED = "PARTNER_UPDATED";
export const PARTNER_REMOVED = "PARTNER_REMOVED";

export type PartnerAction =
  | { type: typeof PARTNERS_LOADED; payload: Partner[] }
  | { type: typeof PARTNER_ADDED; payload: Partner }
  | { type: typeof PARTNER_UPDATED; payload: Partner }
  | { type: typeof PARTNER_REMOVED; payload: string };

export const initialPartnerState: PartnerState = {
  partners: [],
};

function sortPartners(partners: Partner[]) {
  return [...partners].sort((first, second) => second.updated_at.localeCompare(first.updated_at));
}

export function partnerReducer(state: PartnerState, action: PartnerAction): PartnerState {
  switch (action.type) {
    case PARTNERS_LOADED:
      return { partners: sortPartners(action.payload) };
    case PARTNER_ADDED:
      return { partners: sortPartners([action.payload, ...state.partners]) };
    case PARTNER_UPDATED:
      return {
        partners: sortPartners(state.partners.map((partner) => (partner.id === action.payload.id ? action.payload : partner))),
      };
    case PARTNER_REMOVED:
      return { partners: state.partners.filter((partner) => partner.id !== action.payload) };
    default:
      return state;
  }
}
