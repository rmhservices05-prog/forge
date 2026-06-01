import { ArrowDownUp, Edit2, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { PartnerDialog, type PartnerFormValues } from "../components/PartnerDialog";
import { PartnerSummaryBar } from "../components/PartnerSummaryBar";
import { pushAppToast } from "../components/toastBus";
import { usePartners } from "../hooks/usePartners";
import type { Partner, Clause5Status, OutreachStatus, ProfileType } from "../types/partner";

type SortKey = "updated_at" | "name" | "outreach_status" | "date_contacted" | "clause_5_clear";
type SortDirection = "asc" | "desc";
type FilterValue = "all" | OutreachStatus;

const outreachStatusLabels: Record<OutreachStatus, string> = {
  not_contacted: "Not Contacted",
  message_sent: "Message Sent",
  replied: "Replied",
  call_scheduled: "Call Scheduled",
  agreement_sent: "Agreement Sent",
  signed: "Signed",
  declined: "Declined",
};

const profileTypeLabels: Record<NonNullable<ProfileType>, string> = {
  ex_prime_bd: "Prime/Tier-1 BD",
  ex_military: "Ex-Military",
  uxv_drone_sector: "UxV/Drone",
  ecosystem_connector: "Ecosystem",
  nato_allied: "NATO/Allied",
  other: "Other",
};

const clause5Labels: Record<Clause5Status, string> = {
  yes: "Clear",
  no: "Blocked",
  tbc: "TBC",
};

const statusOptions: Array<{ value: FilterValue; label: string }> = [
  { value: "all", label: "All" },
  { value: "not_contacted", label: "Not Contacted" },
  { value: "message_sent", label: "Message Sent" },
  { value: "replied", label: "Replied" },
  { value: "call_scheduled", label: "Call Scheduled" },
  { value: "agreement_sent", label: "Agreement Sent" },
  { value: "signed", label: "Signed" },
  { value: "declined", label: "Declined" },
];

const outreachStatusOptions = statusOptions.slice(1) as Array<{ value: OutreachStatus; label: string }>;

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return dateFormatter.format(parsed);
}

function textOrDash(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
}

function getProfileIntent(profileType: ProfileType | null) {
  switch (profileType) {
    case "ex_prime_bd":
    case "nato_allied":
      return "primary";
    case "ex_military":
      return "success";
    case "uxv_drone_sector":
      return "warning";
    default:
      return "none";
  }
}

function getStatusIntent(status: OutreachStatus) {
  switch (status) {
    case "message_sent":
    case "agreement_sent":
      return "primary";
    case "replied":
    case "signed":
      return "success";
    case "call_scheduled":
      return "warning";
    case "declined":
      return "danger";
    case "not_contacted":
    default:
      return "none";
  }
}

function getClauseIntent(status: Clause5Status) {
  switch (status) {
    case "yes":
      return "success";
    case "no":
      return "danger";
    case "tbc":
      return "warning";
  }
}

function compareMaybeDate(left: string | null, right: string | null, direction: SortDirection) {
  const leftTime = left ? new Date(left).getTime() : direction === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  const rightTime = right ? new Date(right).getTime() : direction === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  return direction === "asc" ? leftTime - rightTime : rightTime - leftTime;
}

function compareText(left: string, right: string, direction: SortDirection) {
  const comparison = left.localeCompare(right);
  return direction === "asc" ? comparison : -comparison;
}

function toPartnerPayload(values: PartnerFormValues) {
  return {
    name: values.name.trim(),
    current_role: values.current_role.trim() || null,
    profile_type: values.profile_type || null,
    network_value: values.network_value.trim() || null,
    linkedin_url: values.linkedin_url.trim() || null,
    email: values.email.trim() || null,
    outreach_status: values.outreach_status,
    date_contacted: values.date_contacted || null,
    clause_5_clear: values.clause_5_clear,
    next_step: values.next_step.trim() || null,
    notes: values.notes.trim() || null,
  };
}

export function PartnerPipeline() {
  const { partners, loading, error, createPartner, updatePartner, deletePartner } = usePartners();
  const [filter, setFilter] = useState<FilterValue>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);

  const statusCounts = useMemo(
    () =>
      outreachStatusOptions
        .map((option) => ({
          status: option.value,
          label: option.label,
          count: partners.filter((partner) => partner.outreach_status === option.value).length,
        })),
    [partners],
  );

  const filteredPartners = useMemo(() => {
    const visible = filter === "all" ? partners : partners.filter((partner) => partner.outreach_status === filter);

    return [...visible].sort((left, right) => {
      if (sortKey === "name") {
        return compareText(left.name, right.name, sortDirection);
      }

      if (sortKey === "outreach_status") {
        return compareText(outreachStatusLabels[left.outreach_status], outreachStatusLabels[right.outreach_status], sortDirection);
      }

      if (sortKey === "date_contacted") {
        return compareMaybeDate(left.date_contacted, right.date_contacted, sortDirection);
      }

      if (sortKey === "clause_5_clear") {
        return compareText(clause5Labels[left.clause_5_clear], clause5Labels[right.clause_5_clear], sortDirection);
      }

      return compareMaybeDate(left.updated_at, right.updated_at, sortDirection);
    });
  }, [filter, partners, sortDirection, sortKey]);

  const clause5TbcCount = useMemo(
    () => partners.filter((partner) => partner.clause_5_clear === "tbc").length,
    [partners],
  );

  function openAddPartner() {
    setEditingPartner(null);
    setIsDialogOpen(true);
  }

  function openEditPartner(partner: Partner) {
    setEditingPartner(partner);
    setIsDialogOpen(true);
  }

  function closeDialog() {
    setIsDialogOpen(false);
    setEditingPartner(null);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((currentDirection) => (currentDirection === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection(key === "updated_at" ? "desc" : "asc");
    }
  }

  async function handleSave(values: PartnerFormValues) {
    const payload = toPartnerPayload(values);

    if (!payload.name) {
      return;
    }

    if (editingPartner) {
      await updatePartner(editingPartner.id, payload);
      pushAppToast({ intent: "success", message: "Partner updated" });
    } else {
      await createPartner(payload);
      pushAppToast({ intent: "success", message: "Partner added" });
    }

    closeDialog();
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    await deletePartner(deleteTarget.id);
    pushAppToast({ intent: "success", message: "Partner deleted" });
    setDeleteTarget(null);
  }

  if (loading) {
    return (
      <div className="page-stack">
        <div className="centered-state compact-empty">
          <h2>Loading partners...</h2>
          <p>Pulling your partner pipeline from Supabase.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack partners-page">
      <header className="page-header partners-header">
        <div>
          <p className="eyebrow">Partner pipeline</p>
          <h2>Industry Partners</h2>
          <span>External industry introducers tracked for outreach, agreements, and introductions.</span>
        </div>
        <button className="primary-button partners-add-button" onClick={openAddPartner} type="button">
          <Plus size={17} />
          Add Partner
        </button>
      </header>

      {error ? <div className="partners-inline-error">{error}</div> : null}

      <PartnerSummaryBar
        clause5TbcCount={clause5TbcCount}
        statusCounts={statusCounts}
        total={partners.length}
      />

      <section className="panel partners-panel">
        <div className="partners-filter-row" role="tablist" aria-label="Filter partners by outreach status">
          {statusOptions.map((option) => (
            <button
              aria-selected={filter === option.value}
              className={filter === option.value ? "active" : ""}
              key={option.value}
              onClick={() => setFilter(option.value)}
              role="tab"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>

        {filteredPartners.length ? (
          <div className="partners-table-shell" aria-label="Industry partners table">
            <table className="partners-table">
              <thead>
                <tr>
                  <th style={{ width: 180 }}>
                    <button className="partners-sort-button" onClick={() => toggleSort("name")} type="button">
                      Name
                      <ArrowDownUp size={14} />
                    </button>
                  </th>
                  <th style={{ width: 220 }}>Role</th>
                  <th style={{ width: 140 }}>Profile</th>
                  <th style={{ width: 240 }}>Network Value</th>
                  <th style={{ width: 130 }}>
                    <button className="partners-sort-button" onClick={() => toggleSort("outreach_status")} type="button">
                      Status
                      <ArrowDownUp size={14} />
                    </button>
                  </th>
                  <th style={{ width: 110 }}>
                    <button className="partners-sort-button" onClick={() => toggleSort("date_contacted")} type="button">
                      Contacted
                      <ArrowDownUp size={14} />
                    </button>
                  </th>
                  <th style={{ width: 90 }}>
                    <button className="partners-sort-button" onClick={() => toggleSort("clause_5_clear")} type="button">
                      Clause 5
                      <ArrowDownUp size={14} />
                    </button>
                  </th>
                  <th style={{ width: 200 }}>Next Step</th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPartners.map((partner) => (
                  <tr key={partner.id}>
                    <td>
                      <button className="partner-name-button" onClick={() => openEditPartner(partner)} type="button">
                        {partner.name}
                      </button>
                    </td>
                    <td title={partner.current_role ?? ""}>{textOrDash(partner.current_role)}</td>
                    <td>
                      {partner.profile_type ? (
                        <span className={`partner-tag intent-${getProfileIntent(partner.profile_type)} minimal`}>
                          {profileTypeLabels[partner.profile_type]}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td title={partner.network_value ?? ""}>{textOrDash(partner.network_value)}</td>
                    <td>
                      <span className={`partner-tag intent-${getStatusIntent(partner.outreach_status)} minimal`}>
                        {outreachStatusLabels[partner.outreach_status]}
                      </span>
                    </td>
                    <td>{formatDate(partner.date_contacted)}</td>
                    <td>
                      <span className={`partner-tag intent-${getClauseIntent(partner.clause_5_clear)} minimal`}>
                        {clause5Labels[partner.clause_5_clear]}
                      </span>
                    </td>
                    <td title={partner.next_step ?? ""}>{textOrDash(partner.next_step)}</td>
                    <td>
                      <div className="partner-row-actions">
                        <button aria-label={`Edit ${partner.name}`} onClick={() => openEditPartner(partner)} type="button">
                          <Edit2 size={15} />
                        </button>
                        <button
                          aria-label={`Delete ${partner.name}`}
                          onClick={() => setDeleteTarget(partner)}
                          type="button"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <section className="partners-empty-state" aria-label="No partners state">
            <p>No partners added yet</p>
            <button className="primary-button partners-add-button" onClick={openAddPartner} type="button">
              <Plus size={17} />
              Add Partner
            </button>
          </section>
        )}
      </section>

      <PartnerDialog
        isOpen={isDialogOpen}
        mode={editingPartner ? "edit" : "add"}
        onClose={closeDialog}
        onSave={(values) => handleSave(values)}
        partner={editingPartner}
      />

      {deleteTarget ? (
        <div className="partner-alert-backdrop" role="presentation" onMouseDown={() => setDeleteTarget(null)}>
          <div
            aria-modal="true"
            className="partner-alert"
            role="alertdialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h3>Delete {deleteTarget.name}?</h3>
            <p>This cannot be undone.</p>
            <div className="partner-alert-actions">
              <button className="partner-dialog-secondary" onClick={() => setDeleteTarget(null)} type="button">
                Cancel
              </button>
              <button className="partner-dialog-danger" onClick={() => void confirmDelete()} type="button">
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
