import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Partner, Clause5Status, OutreachStatus, ProfileType } from "../types/partner";

export type PartnerFormValues = {
  name: string;
  current_role: string;
  profile_type: ProfileType | "";
  network_value: string;
  linkedin_url: string;
  email: string;
  outreach_status: OutreachStatus;
  date_contacted: string;
  clause_5_clear: Clause5Status;
  next_step: string;
  notes: string;
};

const profileOptions: Array<{ value: ProfileType; label: string }> = [
  { value: "ex_prime_bd", label: "Prime/Tier-1 BD" },
  { value: "ex_military", label: "Ex-Military" },
  { value: "uxv_drone_sector", label: "UxV/Drone" },
  { value: "ecosystem_connector", label: "Ecosystem" },
  { value: "nato_allied", label: "NATO/Allied" },
  { value: "other", label: "Other" },
];

const outreachOptions: Array<{ value: OutreachStatus; label: string }> = [
  { value: "not_contacted", label: "Not Contacted" },
  { value: "message_sent", label: "Message Sent" },
  { value: "replied", label: "Replied" },
  { value: "call_scheduled", label: "Call Scheduled" },
  { value: "agreement_sent", label: "Agreement Sent" },
  { value: "signed", label: "Signed" },
  { value: "declined", label: "Declined" },
];

type PartnerDialogProps = {
  isOpen: boolean;
  mode: "add" | "edit";
  partner: Partner | null;
  onClose: () => void;
  onSave: (values: PartnerFormValues) => Promise<void>;
};

const emptyForm: PartnerFormValues = {
  name: "",
  current_role: "",
  profile_type: "",
  network_value: "",
  linkedin_url: "",
  email: "",
  outreach_status: "not_contacted",
  date_contacted: "",
  clause_5_clear: "tbc",
  next_step: "",
  notes: "",
};

function partnerToFormValues(partner: Partner | null): PartnerFormValues {
  if (!partner) {
    return emptyForm;
  }

  return {
    name: partner.name,
    current_role: partner.current_role ?? "",
    profile_type: partner.profile_type ?? "",
    network_value: partner.network_value ?? "",
    linkedin_url: partner.linkedin_url ?? "",
    email: partner.email ?? "",
    outreach_status: partner.outreach_status,
    date_contacted: partner.date_contacted ?? "",
    clause_5_clear: partner.clause_5_clear,
    next_step: partner.next_step ?? "",
    notes: partner.notes ?? "",
  };
}

export function PartnerDialog({ isOpen, mode, partner, onClose, onSave }: PartnerDialogProps) {
  const initialValues = useMemo(() => partnerToFormValues(partner), [partner]);
  const [values, setValues] = useState<PartnerFormValues>(initialValues);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValues(partnerToFormValues(partner));
      setSubmitting(false);
    }
  }, [isOpen, partner]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.name.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSave(values);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="partner-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        aria-modal="true"
        className="partner-dialog"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="partner-dialog-header">
          <div>
            <p className="eyebrow partner-dialog-eyebrow">Industry Partner</p>
            <h3>{mode === "add" ? "Add Partner" : "Edit Partner"}</h3>
          </div>
          <button aria-label="Close dialog" className="partner-dialog-close" onClick={onClose} type="button">
            ×
          </button>
        </header>

        <form className="partner-dialog-form" onSubmit={(event) => void handleSubmit(event)}>
          <div className="partner-form-grid">
            <label className="partner-form-field">
              <span>Name</span>
              <input
                required
                value={values.name}
                onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
                type="text"
              />
            </label>
            <label className="partner-form-field">
              <span>Current Role</span>
              <input
                value={values.current_role}
                onChange={(event) => setValues((current) => ({ ...current, current_role: event.target.value }))}
                type="text"
              />
            </label>
            <label className="partner-form-field">
              <span>Profile Type</span>
              <select
                value={values.profile_type}
                onChange={(event) =>
                  setValues((current) => ({ ...current, profile_type: event.target.value as ProfileType | "" }))
                }
              >
                <option value="">Select profile type</option>
                {profileOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="partner-form-field partner-form-field-full">
              <span>Key Network Value</span>
              <textarea
                rows={2}
                value={values.network_value}
                onChange={(event) => setValues((current) => ({ ...current, network_value: event.target.value }))}
              />
            </label>
            <label className="partner-form-field">
              <span>LinkedIn URL</span>
              <input
                value={values.linkedin_url}
                onChange={(event) => setValues((current) => ({ ...current, linkedin_url: event.target.value }))}
                type="url"
              />
            </label>
            <label className="partner-form-field">
              <span>Email</span>
              <input
                value={values.email}
                onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
                type="email"
              />
            </label>
            <label className="partner-form-field">
              <span>Outreach Status</span>
              <select
                value={values.outreach_status}
                onChange={(event) =>
                  setValues((current) => ({ ...current, outreach_status: event.target.value as OutreachStatus }))
                }
              >
                {outreachOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="partner-form-field">
              <span>Date Contacted</span>
              <input
                value={values.date_contacted}
                onChange={(event) => setValues((current) => ({ ...current, date_contacted: event.target.value }))}
                type="date"
              />
            </label>
            <label className="partner-form-field">
              <span>Clause 5 Clear</span>
              <select
                value={values.clause_5_clear}
                onChange={(event) =>
                  setValues((current) => ({ ...current, clause_5_clear: event.target.value as Clause5Status }))
                }
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="tbc">TBC</option>
              </select>
            </label>
            <label className="partner-form-field partner-form-field-full">
              <span>Next Step</span>
              <input
                value={values.next_step}
                onChange={(event) => setValues((current) => ({ ...current, next_step: event.target.value }))}
                type="text"
              />
            </label>
            <label className="partner-form-field partner-form-field-full">
              <span>Notes</span>
              <textarea
                rows={3}
                value={values.notes}
                onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))}
              />
            </label>
          </div>

          <footer className="partner-dialog-footer">
            <button className="partner-dialog-secondary" disabled={submitting} onClick={onClose} type="button">
              Cancel
            </button>
            <button className="partner-dialog-primary" disabled={submitting} type="submit">
              Save
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
