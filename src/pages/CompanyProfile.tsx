import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CircleHelp,
  PencilLine,
  FileText,
  MinusCircle,
  PlusCircle,
  Save,
  X,
  UserRound,
} from "lucide-react";
import { type ReactNode } from "react";
import { useEffect, useId, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { initials, initialCompanies } from "../data/companies";

function resolveWebsiteDomain(website: string) {
  const trimmed = website.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const normalized = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    const parsed = new URL(normalized);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function getCompanyLogoUrl(website: string) {
  const domain = resolveWebsiteDomain(website);
  if (!domain) {
    return null;
  }

  return `https://logo.clearbit.com/${domain}`;
}

export function CompanyProfile() {
  const { companyId } = useParams();
  const company = useMemo(() => initialCompanies.find((item) => String(item.id) === companyId), [companyId]);
  const [companyDetails, setCompanyDetails] = useState({
    companyName: "",
    city: "Paris",
    country: "France",
    contactAddress: "174 Quai de Jemmapes",
    website: "bb.agency",
  });
  const [draftCompanyDetails, setDraftCompanyDetails] = useState(companyDetails);
  const [isEditingCompanyDetails, setIsEditingCompanyDetails] = useState(false);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(getCompanyLogoUrl(companyDetails.website));
  const [hasLogoLoadError, setHasLogoLoadError] = useState(false);
  const [contactDetails, setContactDetails] = useState({
    contactPerson: "Ana Belic",
    email: "ana@bb.agency",
    phoneNumber: "+385 99 7691 238",
  });
  const [draftContactDetails, setDraftContactDetails] = useState(contactDetails);
  const [isEditingContactDetails, setIsEditingContactDetails] = useState(false);

  useEffect(() => {
    if (!company) {
      return;
    }

    setCompanyDetails((current) => ({ ...current, companyName: company.name }));
    setDraftCompanyDetails((current) => ({ ...current, companyName: company.name }));
  }, [company]);

  if (!company) {
    return <Navigate to="/companies" replace />;
  }

  const startEditingCompanyDetails = () => {
    setDraftCompanyDetails(companyDetails);
    setIsEditingCompanyDetails(true);
  };

  const cancelEditingCompanyDetails = () => {
    setDraftCompanyDetails(companyDetails);
    setIsEditingCompanyDetails(false);
  };

  const saveCompanyDetails = () => {
    setCompanyDetails(draftCompanyDetails);
    setCompanyLogoUrl(getCompanyLogoUrl(draftCompanyDetails.website));
    setHasLogoLoadError(false);
    setIsEditingCompanyDetails(false);
  };

  const startEditingContactDetails = () => {
    setDraftContactDetails(contactDetails);
    setIsEditingContactDetails(true);
  };

  const cancelEditingContactDetails = () => {
    setDraftContactDetails(contactDetails);
    setIsEditingContactDetails(false);
  };

  const saveContactDetails = () => {
    setContactDetails(draftContactDetails);
    setIsEditingContactDetails(false);
  };

  return (
    <div className="company-profile-page">
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
          <span className={`company-profile-logo logo-${company.logoColor}`} aria-hidden="true">
            {companyLogoUrl && !hasLogoLoadError ? (
              <img src={companyLogoUrl} alt={`${companyDetails.companyName} logo`} className="company-profile-logo-image" onError={() => setHasLogoLoadError(true)} />
            ) : (
              <>
                <Building2 size={34} />
                <span>{initials(companyDetails.companyName || company.name)}</span>
              </>
            )}
          </span>

          <div className="company-profile-title-block">
            <div className="company-profile-title-row">
              <h2>{company.name}</h2>
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
                    <button type="button" className="detail-card-edit-button save" onClick={saveCompanyDetails}>
                      <Save size={14} />
                      Save
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
              <EditableDetailRow
                label="Company Name"
                value={isEditingCompanyDetails ? draftCompanyDetails.companyName : companyDetails.companyName}
                isEditing={isEditingCompanyDetails}
                onChange={(value) => setDraftCompanyDetails((current) => ({ ...current, companyName: value }))}
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
              />
            </DetailCard>

            <DetailCard title="Contact details" icon={<UserRound size={18} />}>
              <div className="detail-card-edit-actions">
                {isEditingContactDetails ? (
                  <>
                    <button type="button" className="detail-card-edit-button save" onClick={saveContactDetails}>
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
              <OverviewPanel companyName={company.name} />
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="company-detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EditableDetailRow({
  isEditing,
  label,
  onChange,
  value,
}: {
  isEditing: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
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
        />
      ) : (
        <strong>{value}</strong>
      )}
    </div>
  );
}

function OverviewPanel({ companyName }: { companyName: string }) {
  return (
    <div className="company-overview-empty">
      <CircleHelp size={28} />
      <h3>{companyName} overview</h3>
      <p>Key account summary, open opportunities, and relationship notes can live here when the record is connected to live CRM data.</p>
    </div>
  );
}
