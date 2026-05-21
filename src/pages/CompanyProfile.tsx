import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CircleHelp,
  FileText,
  History,
  MinusCircle,
  PencilLine,
  PlusCircle,
  Save,
  UserRound,
  X,
} from "lucide-react";
import { type ReactNode, useEffect, useId, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { CompanyLogoBadge } from "../components/CompanyLogoBadge";
import type { CompanyInput } from "../data/companyRepository";
import { useAuth } from "../hooks/useAuth";
import { useCompanies } from "../hooks/useCompanies";
import type { CompanyLog } from "../types";

export function CompanyProfile() {
  const { companyId } = useParams();
  const { profile } = useAuth();
  const { companies, companyLogs, loading, error, updateCompany, createCompanyLog } = useCompanies();
  const company = useMemo(() => companies.find((item) => String(item.id) === companyId), [companies, companyId]);
  const logs = useMemo(
    () => companyLogs.filter((item) => String(item.companyId) === companyId),
    [companyId, companyLogs],
  );
  const [companyDetails, setCompanyDetails] = useState({
    companyName: "",
    city: "",
    country: "",
    contactAddress: "",
    website: "",
  });
  const [draftCompanyDetails, setDraftCompanyDetails] = useState(companyDetails);
  const [isEditingCompanyDetails, setIsEditingCompanyDetails] = useState(false);
  const [companyDetailsError, setCompanyDetailsError] = useState("");
  const [companyDetailsMessage, setCompanyDetailsMessage] = useState("");
  const [isSavingCompanyDetails, setIsSavingCompanyDetails] = useState(false);
  const [contactDetails, setContactDetails] = useState({
    contactPerson: "",
    email: "",
    phoneNumber: "",
  });
  const [draftContactDetails, setDraftContactDetails] = useState(contactDetails);
  const [isEditingContactDetails, setIsEditingContactDetails] = useState(false);
  const [draftLogBody, setDraftLogBody] = useState("");
  const [draftLogDate, setDraftLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [logError, setLogError] = useState("");
  const [logMessage, setLogMessage] = useState("");
  const [isSavingLog, setIsSavingLog] = useState(false);

  useEffect(() => {
    if (!company) {
      return;
    }

    const nextCompanyDetails = {
      companyName: company.name,
      city: company.city,
      country: company.country,
      contactAddress: company.contactAddress,
      website: company.website,
    };
    const nextContactDetails = {
      contactPerson: company.contactPerson,
      email: company.contactEmail,
      phoneNumber: company.phoneNumber,
    };

    setCompanyDetails(nextCompanyDetails);
    setDraftCompanyDetails(nextCompanyDetails);
    setContactDetails(nextContactDetails);
    setDraftContactDetails(nextContactDetails);
    setCompanyDetailsError("");
    setCompanyDetailsMessage("");
    setDraftLogBody("");
    setDraftLogDate(new Date().toISOString().slice(0, 10));
    setLogError("");
    setLogMessage("");
  }, [company]);

  if (loading) {
    return (
      <div className="centered-state">
        <h2>Loading company...</h2>
        <p>Fetching the latest company record from Supabase.</p>
      </div>
    );
  }

  if (!company) {
    return <Navigate to="/companies" replace />;
  }

  const currentCompany = company;

  async function saveCompany(nextValues: CompanyInput) {
    return updateCompany(currentCompany.id, nextValues);
  }

  const startEditingCompanyDetails = () => {
    setDraftCompanyDetails(companyDetails);
    setCompanyDetailsError("");
    setCompanyDetailsMessage("");
    setIsEditingCompanyDetails(true);
  };

  const cancelEditingCompanyDetails = () => {
    setDraftCompanyDetails(companyDetails);
    setCompanyDetailsError("");
    setIsEditingCompanyDetails(false);
  };

  const saveCompanyDetails = async () => {
    const trimmedCompanyName = draftCompanyDetails.companyName.trim();

    if (!trimmedCompanyName) {
      setCompanyDetailsError("Company name is required.");
      return;
    }

    setIsSavingCompanyDetails(true);
    setCompanyDetailsError("");
    setCompanyDetailsMessage("");

    try {
      const updatedCompany = await saveCompany({
        name: trimmedCompanyName,
        industry: currentCompany.industry,
        location: currentCompany.location,
        status: currentCompany.status,
        employeeRange: currentCompany.employeeRange,
        city: draftCompanyDetails.city.trim(),
        country: draftCompanyDetails.country.trim(),
        contactAddress: draftCompanyDetails.contactAddress.trim(),
        website: draftCompanyDetails.website.trim(),
        contactPerson: contactDetails.contactPerson.trim(),
        contactEmail: contactDetails.email.trim(),
        phoneNumber: contactDetails.phoneNumber.trim(),
      });
      const nextCompanyDetails = {
        companyName: updatedCompany.name,
        city: updatedCompany.city,
        country: updatedCompany.country,
        contactAddress: updatedCompany.contactAddress,
        website: updatedCompany.website,
      };

      setCompanyDetails(nextCompanyDetails);
      setDraftCompanyDetails(nextCompanyDetails);
      setCompanyDetailsMessage("Company details saved.");
      setIsEditingCompanyDetails(false);
    } catch {
      // Error state is surfaced by the company provider.
    } finally {
      setIsSavingCompanyDetails(false);
    }
  };

  const startEditingContactDetails = () => {
    setDraftContactDetails(contactDetails);
    setIsEditingContactDetails(true);
  };

  const cancelEditingContactDetails = () => {
    setDraftContactDetails(contactDetails);
    setIsEditingContactDetails(false);
  };

  const saveContactDetails = async () => {
    await saveCompany({
      name: companyDetails.companyName.trim(),
      industry: currentCompany.industry,
      location: currentCompany.location,
      status: currentCompany.status,
      employeeRange: currentCompany.employeeRange,
      city: companyDetails.city.trim(),
      country: companyDetails.country.trim(),
      contactAddress: companyDetails.contactAddress.trim(),
      website: companyDetails.website.trim(),
      contactPerson: draftContactDetails.contactPerson.trim(),
      contactEmail: draftContactDetails.email.trim(),
      phoneNumber: draftContactDetails.phoneNumber.trim(),
    });
    setContactDetails(draftContactDetails);
    setIsEditingContactDetails(false);
  };

  const saveLog = async () => {
    const trimmedBody = draftLogBody.trim();

    if (!trimmedBody) {
      setLogError("Log details are required.");
      return;
    }

    if (!draftLogDate) {
      setLogError("Choose a log date.");
      return;
    }

    setIsSavingLog(true);
    setLogError("");
    setLogMessage("");

    try {
      await createCompanyLog({
        companyId: currentCompany.id,
        authorName: profile?.name ?? "Forge User",
        body: trimmedBody,
        loggedOn: draftLogDate,
      });
      setDraftLogBody("");
      setDraftLogDate(new Date().toISOString().slice(0, 10));
      setLogMessage("Log added.");
    } catch {
      // Error state is surfaced by the company provider.
    } finally {
      setIsSavingLog(false);
    }
  };

  return (
    <div className="company-profile-page">
      {error ? <div className="inline-alert error">{error}</div> : null}
      <div className="company-profile-shell">
        <nav className="company-profile-breadcrumb" aria-label="Breadcrumb">
          <Link to="/companies">
            <ArrowLeft size={15} />
            Companies
          </Link>
          <span>/</span>
          <span>Company profile</span>
        </nav>

        <header className="company-profile-header">
          <CompanyLogoBadge
            color={currentCompany.logoColor}
            fallbackIconSize={34}
            imageClassName="company-profile-logo-image"
            name={companyDetails.companyName || currentCompany.name}
            website={companyDetails.website}
            wrapperClassName="company-profile-logo"
          />

          <div className="company-profile-title-block">
            <div className="company-profile-title-row">
              <h2>{companyDetails.companyName || currentCompany.name}</h2>
              <CheckCircle2 size={20} aria-label="Verified profile" />
            </div>
            <div className="company-profile-actions" aria-label="Company actions">
              <button type="button">
                <PlusCircle size={16} />
                Create task
              </button>
            </div>
          </div>
        </header>

        <div className="company-profile-layout">
          <aside className="company-profile-details" aria-label="Company record details">
            <DetailCard title="Company details" icon={<Building2 size={18} />}>
              <div className="detail-card-edit-actions">
                {isEditingCompanyDetails ? (
                  <>
                    <button
                      type="button"
                      className="detail-card-edit-button save"
                      disabled={isSavingCompanyDetails}
                      onClick={() => void saveCompanyDetails()}
                    >
                      <Save size={14} />
                      {isSavingCompanyDetails ? "Saving..." : "Save"}
                    </button>
                    <button type="button" className="detail-card-edit-button cancel" onClick={cancelEditingCompanyDetails}>
                      <X size={14} />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button type="button" className="detail-card-edit-button" onClick={startEditingCompanyDetails}>
                    <PencilLine size={14} />
                    Edit
                  </button>
                )}
              </div>
              {companyDetailsError ? <p className="form-error">{companyDetailsError}</p> : null}
              {companyDetailsMessage ? <p className="form-success">{companyDetailsMessage}</p> : null}
              <EditableDetailRow
                label="Company Name"
                value={isEditingCompanyDetails ? draftCompanyDetails.companyName : companyDetails.companyName}
                isEditing={isEditingCompanyDetails}
                onChange={(value) => setDraftCompanyDetails((current) => ({ ...current, companyName: value }))}
                required
              />
              <EditableDetailRow
                label="City"
                value={isEditingCompanyDetails ? draftCompanyDetails.city : companyDetails.city}
                isEditing={isEditingCompanyDetails}
                onChange={(value) => setDraftCompanyDetails((current) => ({ ...current, city: value }))}
              />
              <EditableDetailRow
                label="Country"
                value={isEditingCompanyDetails ? draftCompanyDetails.country : companyDetails.country}
                isEditing={isEditingCompanyDetails}
                onChange={(value) => setDraftCompanyDetails((current) => ({ ...current, country: value }))}
              />
              <EditableDetailRow
                label="Contact Address"
                value={isEditingCompanyDetails ? draftCompanyDetails.contactAddress : companyDetails.contactAddress}
                isEditing={isEditingCompanyDetails}
                onChange={(value) => setDraftCompanyDetails((current) => ({ ...current, contactAddress: value }))}
              />
              <EditableDetailRow
                label="Website"
                value={isEditingCompanyDetails ? draftCompanyDetails.website : companyDetails.website}
                isEditing={isEditingCompanyDetails}
                onChange={(value) => setDraftCompanyDetails((current) => ({ ...current, website: value }))}
                valueType="website"
              />
            </DetailCard>

            <DetailCard title="Contact details" icon={<UserRound size={18} />}>
              <div className="detail-card-edit-actions">
                {isEditingContactDetails ? (
                  <>
                    <button type="button" className="detail-card-edit-button save" onClick={() => void saveContactDetails()}>
                      <Save size={14} />
                      Save
                    </button>
                    <button type="button" className="detail-card-edit-button cancel" onClick={cancelEditingContactDetails}>
                      <X size={14} />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button type="button" className="detail-card-edit-button" onClick={startEditingContactDetails}>
                    <PencilLine size={14} />
                    Edit
                  </button>
                )}
              </div>
              <EditableDetailRow
                label="Contact Person"
                value={isEditingContactDetails ? draftContactDetails.contactPerson : contactDetails.contactPerson}
                isEditing={isEditingContactDetails}
                onChange={(value) => setDraftContactDetails((current) => ({ ...current, contactPerson: value }))}
              />
              <EditableDetailRow
                label="Email"
                value={isEditingContactDetails ? draftContactDetails.email : contactDetails.email}
                isEditing={isEditingContactDetails}
                onChange={(value) => setDraftContactDetails((current) => ({ ...current, email: value }))}
                valueType="email"
              />
              <EditableDetailRow
                label="Phone Number"
                value={isEditingContactDetails ? draftContactDetails.phoneNumber : contactDetails.phoneNumber}
                isEditing={isEditingContactDetails}
                onChange={(value) => setDraftContactDetails((current) => ({ ...current, phoneNumber: value }))}
              />
            </DetailCard>
          </aside>

          <main className="company-profile-main">
            <div className="company-profile-tabs" role="tablist" aria-label="Company profile sections">
              <button aria-selected className="active" role="tab" type="button">
                <FileText size={17} />
                Overview
              </button>
            </div>

            <section className="company-tab-panel overview" aria-live="polite">
              <OverviewPanel
                companyName={companyDetails.companyName || currentCompany.name}
                draftDate={draftLogDate}
                draftMessage={draftLogBody}
                error={logError}
                infoMessage={logMessage}
                isSaving={isSavingLog}
                logs={logs}
                onDateChange={setDraftLogDate}
                onMessageChange={setDraftLogBody}
                onSubmit={() => void saveLog()}
              />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ children, icon, title }: { children: ReactNode; icon: ReactNode; title: string }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const sectionId = useId();

  return (
    <section className="company-detail-card">
      <header>
        <div>
          {icon}
          <h3>{title}</h3>
        </div>
        <button
          type="button"
          className="detail-card-toggle"
          aria-expanded={isExpanded}
          aria-controls={sectionId}
          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${title}`}
          onClick={() => setIsExpanded((value) => !value)}
        >
          {isExpanded ? <MinusCircle size={18} /> : <PlusCircle size={18} />}
        </button>
      </header>
      {isExpanded ? (
        <div id={sectionId} className="company-detail-card-body">
          {children}
        </div>
      ) : null}
    </section>
  );
}

function EditableDetailRow({
  isEditing,
  label,
  onChange,
  required = false,
  value,
  valueType = "text",
}: {
  isEditing: boolean;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
  valueType?: "email" | "text" | "website";
}) {
  const trimmedValue = value.trim();
  let href: string | null = null;

  if (valueType === "website" && trimmedValue) {
    href = trimmedValue.includes("://") ? trimmedValue : `https://${trimmedValue}`;
  }

  if (valueType === "email" && trimmedValue) {
    href = `mailto:${trimmedValue}`;
  }

  return (
    <div className="company-detail-row">
      <span>{label}</span>
      {isEditing ? (
        <input
          type="text"
          className="company-detail-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={`${label} value`}
          required={required}
        />
      ) : href ? (
        <a className="company-detail-link" href={href} target={valueType === "website" ? "_blank" : undefined} rel={valueType === "website" ? "noreferrer" : undefined}>
          {value}
        </a>
      ) : (
        <strong>{value}</strong>
      )}
    </div>
  );
}

function formatLoggedOnDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function formatCreatedAtDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function OverviewPanel({
  companyName,
  draftDate,
  draftMessage,
  error,
  infoMessage,
  isSaving,
  logs,
  onDateChange,
  onMessageChange,
  onSubmit,
}: {
  companyName: string;
  draftDate: string;
  draftMessage: string;
  error: string;
  infoMessage: string;
  isSaving: boolean;
  logs: CompanyLog[];
  onDateChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="company-overview-panel">
      <section className="company-log-composer">
        <div className="company-log-composer-header">
          <div>
            <span className="company-log-eyebrow">Overview</span>
            <h3>{companyName} relationship log</h3>
          </div>
          <div className="company-log-date-field">
            <label htmlFor="company-log-date">Log date</label>
            <input id="company-log-date" type="date" value={draftDate} onChange={(event) => onDateChange(event.target.value)} />
          </div>
        </div>

        <label className="company-log-message-field" htmlFor="company-log-message">
          <span>Add log</span>
          <textarea
            id="company-log-message"
            rows={4}
            value={draftMessage}
            onChange={(event) => onMessageChange(event.target.value)}
            placeholder="Capture a meeting note, next step, blocker, or account update."
          />
        </label>

        <div className="company-log-composer-footer">
          <div className="company-log-feedback" aria-live="polite">
            {error ? <p className="form-error">{error}</p> : null}
            {infoMessage ? <p className="form-success">{infoMessage}</p> : null}
          </div>
          <button type="button" className="company-log-submit-button" disabled={isSaving} onClick={onSubmit}>
            <History size={16} />
            {isSaving ? "Saving..." : "Add log"}
          </button>
        </div>
      </section>

      {logs.length ? (
        <section className="company-log-list-section">
          <div className="history-header">
            <h3>Recent logs</h3>
            <span>{logs.length} {logs.length === 1 ? "entry" : "entries"}</span>
          </div>
          <div className="company-log-list">
            {logs.map((log) => (
              <article className="company-log-item" key={log.id}>
                <div className="company-log-item-date">
                  <strong>{formatLoggedOnDate(log.loggedOn)}</strong>
                  <span>Logged by {log.authorName}</span>
                </div>
                <div className="company-log-item-body">
                  <p>{log.body}</p>
                  <time dateTime={log.createdAt}>Added {formatCreatedAtDate(log.createdAt)}</time>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <div className="company-overview-empty">
          <CircleHelp size={28} />
          <h3>No logs yet</h3>
          <p>Add the first dated update so account context, open actions, and relationship history stay visible on this profile.</p>
        </div>
      )}
    </div>
  );
}
