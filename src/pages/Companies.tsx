import {
  Bell,
  CheckSquare,
  ChevronDown,
  CircleHelp,
  Filter,
  List,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  SortAsc,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CompanyLogoBadge } from "../components/CompanyLogoBadge";
import { type CompanyInput } from "../data/companyRepository";
import { useCompanies } from "../hooks/useCompanies";
import type { CompanyStatus } from "../types";

type CompanyView = "all" | "uk" | "eu" | "us";
type TableDensity = "comfortable" | "compact";

type CompanyFilters = {
  status: "" | CompanyStatus;
  industry: string;
  employeeRange: string;
};

const views: Array<{ id: CompanyView; label: string }> = [
  { id: "all", label: "All Companies" },
  { id: "uk", label: "UK Companies" },
  { id: "eu", label: "EU Companies" },
  { id: "us", label: "US Companies" },
];

const emptyCompanyInput: CompanyInput = {
  name: "",
  industry: "",
  location: "",
  status: "Prospect",
  employeeRange: "1-50",
  city: "",
  country: "",
  contactAddress: "",
  website: "",
  contactPerson: "",
  contactEmail: "",
  phoneNumber: "",
};

const emptyFilters: CompanyFilters = {
  status: "",
  industry: "",
  employeeRange: "",
};

const employeeRanges = ["1-50", "250 - 1k", "5K - 10K", "10K - 50K", "100K+"];
const statuses: CompanyStatus[] = ["Active", "Prospect", "Inactive"];
const industryOptions = ["Technology", "Banking", "Healthcare", "Retail", "Innovation", "Wellness", "E-Commerce", "Finance"];
const countryOptions = [
  "Australia",
  "Belgium",
  "Canada",
  "Denmark",
  "France",
  "Germany",
  "Indonesia",
  "Italy",
  "Thailand",
  "United Kingdom",
  "USA",
];
const euLocations = new Set(["Belgium", "Denmark", "France", "Germany", "Italy"]);

function employeeRangeClassName(range: string) {
  switch (range) {
    case "100K+":
      return "employee-purple";
    case "250 - 1k":
      return "employee-yellow";
    case "10K - 50K":
      return "employee-blue";
    case "5K - 10K":
      return "employee-green";
    default:
      return "employee-gray";
  }
}

export function Companies() {
  const navigate = useNavigate();
  const { companies, loading, error, createCompany, deleteCompany } = useCompanies();
  const [activeView, setActiveView] = useState<CompanyView>("all");
  const [query, setQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);
  const [filters, setFilters] = useState<CompanyFilters>(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [companyInput, setCompanyInput] = useState<CompanyInput>(emptyCompanyInput);
  const [submitted, setSubmitted] = useState(false);
  const [tableDensity, setTableDensity] = useState<TableDensity>("comfortable");
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
  const hasActiveFilters = Boolean(filters.status || filters.industry || filters.employeeRange);

  const visibleCompanies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return companies
      .filter((company) => {
        if (activeView === "us") {
          return company.location === "USA";
        }

        if (activeView === "uk") {
          return company.location === "United Kingdom";
        }

        if (activeView === "eu") {
          return euLocations.has(company.location);
        }

        return true;
      })
      .filter((company) => {
        if (filters.status && company.status !== filters.status) {
          return false;
        }

        if (filters.industry && company.industry !== filters.industry) {
          return false;
        }

        if (filters.employeeRange && company.employeeRange !== filters.employeeRange) {
          return false;
        }

        return true;
      })
      .filter((company) => {
        if (!normalizedQuery) {
          return true;
        }

        return [company.name, company.industry, company.location, company.status, company.employeeRange]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((first, second) => {
        if (!sortDirection) {
          return first.id - second.id;
        }

        const comparison = first.name.localeCompare(second.name);
        return sortDirection === "asc" ? comparison : -comparison;
      });
  }, [activeView, companies, filters, query, sortDirection]);

  const filterOptions = useMemo(
    () => ({
      industries: Array.from(new Set(companies.map((company) => company.industry))).sort(),
      employeeRanges: Array.from(new Set([...employeeRanges, ...companies.map((company) => company.employeeRange)])),
    }),
    [companies],
  );

  const formHasRequiredFields = companyInput.name.trim() && companyInput.industry.trim() && companyInput.location.trim();
  const allVisibleCompanyIds = visibleCompanies.map((company) => company.id);
  const allVisibleSelected = allVisibleCompanyIds.length > 0 && allVisibleCompanyIds.every((companyId) => selectedCompanyIds.includes(companyId));
  const hasSelectedCompanies = selectedCompanyIds.length > 0;

  useEffect(() => {
    const validIds = new Set(companies.map((company) => company.id));
    setSelectedCompanyIds((current) => current.filter((companyId) => validIds.has(companyId)));
  }, [companies]);

  function resetView() {
    setActiveView("all");
    setQuery("");
    setSortDirection(null);
    setFilters(emptyFilters);
  }

  function openAddCompany() {
    setCompanyInput(emptyCompanyInput);
    setSubmitted(false);
    setIsAddCompanyOpen(true);
  }

  async function handleAddCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);

    if (!formHasRequiredFields) {
      return;
    }

    try {
      await createCompany({
        name: companyInput.name.trim(),
        industry: companyInput.industry.trim(),
        location: companyInput.location.trim(),
        status: companyInput.status,
        employeeRange: companyInput.employeeRange,
        city: companyInput.location.trim(),
        country: companyInput.location.trim(),
        contactAddress: "",
        website: "",
        contactPerson: "",
        contactEmail: "",
        phoneNumber: "",
      });
      setActiveView("all");
      setQuery("");
      setCompanyInput(emptyCompanyInput);
      setSubmitted(false);
      setIsAddCompanyOpen(false);
    } catch {
      // Error is surfaced by the provider.
    }
  }

  function toggleCompanySelection(companyId: number) {
    setSelectedCompanyIds((current) => (current.includes(companyId) ? current.filter((id) => id !== companyId) : [...current, companyId]));
  }

  function toggleSelectAllVisibleCompanies() {
    setSelectedCompanyIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !allVisibleCompanyIds.includes(id));
      }

      const merged = new Set([...current, ...allVisibleCompanyIds]);
      return [...merged];
    });
  }

  async function deleteSelectedCompanies() {
    if (!hasSelectedCompanies) {
      return;
    }

    await Promise.all(selectedCompanyIds.map((companyId) => deleteCompany(companyId)));
    setSelectedCompanyIds([]);
  }

  function openCompanyProfile(companyId: number) {
    navigate(`/companies/${companyId}`);
  }

  if (loading) {
    return (
      <div className="centered-state">
        <h2>Loading companies...</h2>
        <p>Pulling your CRM records from Supabase.</p>
      </div>
    );
  }

  return (
    <div className="companies-page">
      {error ? <div className="inline-alert error">{error}</div> : null}
      <section className="companies-card" aria-label="Companies CRM list">
        <header className="companies-header">
          <div className="companies-title-row">
            <h2>Companies</h2>
            <button className="companies-ghost-icon" aria-label="Reset company view" onClick={resetView} type="button">
              <MoreHorizontal size={21} />
            </button>
          </div>

          <div className="companies-header-actions">
            <span className="companies-header-divider" aria-hidden="true" />
            <button className="companies-icon-button" aria-label="Notifications" title={`${visibleCompanies.length} companies in this view`} type="button">
              <Bell size={18} />
            </button>
            <button className="companies-icon-button" aria-label="Help" title="Search, filter, sort, add, or delete companies in this mock CRM view." type="button">
              <CircleHelp size={19} />
            </button>
            <button className="companies-primary-icon" aria-label="Create company" onClick={openAddCompany} type="button">
              <Plus size={22} />
            </button>
          </div>
        </header>

        <div className="companies-tabs-row">
          <div className="companies-tabs" role="tablist" aria-label="Company views">
            {views.map((view) => (
              <button
                aria-selected={activeView === view.id}
                className={activeView === view.id ? "active" : ""}
                key={view.id}
                onClick={() => setActiveView(view.id)}
                role="tab"
                type="button"
              >
                {view.label}
              </button>
            ))}
          </div>
          <button className="manage-views-button" onClick={resetView} type="button">
            <SlidersHorizontal size={17} />
            Manage Views
          </button>
        </div>

        <div className="companies-toolbar">
          <div className="companies-toolbar-left">
            <label className="companies-search">
              <Search size={20} />
              <input
                aria-label="Search companies"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search..."
                type="search"
                value={query}
              />
            </label>
            <button
              className="companies-toolbar-button"
              onClick={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
              type="button"
            >
              <SortAsc size={18} />
              Sort
            </button>
            <div className="companies-menu-wrap">
              <button
                aria-expanded={isFilterOpen}
                className={`companies-toolbar-button ${hasActiveFilters ? "is-active" : ""}`}
                onClick={() => setIsFilterOpen((current) => !current)}
                type="button"
              >
              <Filter size={18} />
                Filter
              </button>
              {isFilterOpen ? (
                <div className="companies-popover filter-popover">
                  <label>
                    Status
                    <select
                      onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as CompanyFilters["status"] }))}
                      value={filters.status}
                    >
                      <option value="">Any status</option>
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Industry
                    <select
                      onChange={(event) => setFilters((current) => ({ ...current, industry: event.target.value }))}
                      value={filters.industry}
                    >
                      <option value="">Any industry</option>
                      {filterOptions.industries.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Employee range
                    <select
                      onChange={(event) => setFilters((current) => ({ ...current, employeeRange: event.target.value }))}
                      value={filters.employeeRange}
                    >
                      <option value="">Any range</option>
                      {filterOptions.employeeRanges.map((range) => (
                        <option key={range} value={range}>
                          {range}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="companies-clear-button" onClick={() => setFilters(emptyFilters)} type="button">
                    Clear filters
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="companies-toolbar-right">
            <button
              className={`companies-toolbar-button ${isMultiSelectMode ? "is-active" : ""}`}
              onClick={() => {
                setIsMultiSelectMode((current) => !current);
                setSelectedCompanyIds([]);
              }}
              type="button"
            >
              {isMultiSelectMode ? <CheckSquare size={18} /> : <Square size={18} />}
              Multi Select
            </button>
            {isMultiSelectMode ? (
              <button
                className="companies-toolbar-button companies-danger-button"
                disabled={!hasSelectedCompanies}
                onClick={() => void deleteSelectedCompanies()}
                type="button"
              >
                <Trash2 size={17} />
                Delete Selected ({selectedCompanyIds.length})
              </button>
            ) : null}
            <div className="companies-menu-wrap">
              <button
                aria-expanded={isViewMenuOpen}
                className="companies-toolbar-button list-view-button"
                onClick={() => setIsViewMenuOpen((current) => !current)}
                type="button"
              >
                <List size={18} />
                {tableDensity === "comfortable" ? "List View" : "Compact View"}
                <ChevronDown size={16} />
              </button>
              {isViewMenuOpen ? (
                <div className="companies-popover view-popover">
                  <button
                    className={tableDensity === "comfortable" ? "selected" : ""}
                    onClick={() => {
                      setTableDensity("comfortable");
                      setIsViewMenuOpen(false);
                    }}
                    type="button"
                  >
                    List View
                    <span>Roomy rows for CRM scanning</span>
                  </button>
                  <button
                    className={tableDensity === "compact" ? "selected" : ""}
                    onClick={() => {
                      setTableDensity("compact");
                      setIsViewMenuOpen(false);
                    }}
                    type="button"
                  >
                    Compact View
                    <span>Fits more companies on screen</span>
                  </button>
                </div>
              ) : null}
            </div>
            <button className="companies-add-button" onClick={openAddCompany} type="button">
              <Plus size={19} />
              Add Company
            </button>
          </div>
        </div>

        <div className="companies-table-scroll">
          <table className={`companies-table ${tableDensity === "compact" ? "compact" : ""} ${isMultiSelectMode ? "is-multi-select" : ""}`}>
            <thead>
              <tr>
                <th>
                  {isMultiSelectMode ? (
                    <input
                      aria-label="Select all visible companies"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisibleCompanies}
                      type="checkbox"
                    />
                  ) : (
                    "#"
                  )}
                </th>
                <th>Company Name</th>
                <th>Industry</th>
                <th>Location</th>
                <th>Status</th>
                <th>Last Interaction</th>
                <th>Employee Range</th>
                <th aria-label="Add column">
                  <button className="companies-add-column-button" onClick={openAddCompany} type="button">
                    +
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {visibleCompanies.map((company) => (
                <tr
                  className="companies-clickable-row"
                  key={company.id}
                  onClick={() => {
                    if (!isMultiSelectMode) {
                      openCompanyProfile(company.id);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (!isMultiSelectMode && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      openCompanyProfile(company.id);
                    }
                  }}
                  tabIndex={isMultiSelectMode ? -1 : 0}
                >
                  <td>
                    {isMultiSelectMode ? (
                      <input
                        aria-label={`Select ${company.name}`}
                        checked={selectedCompanyIds.includes(company.id)}
                        onChange={() => toggleCompanySelection(company.id)}
                        onClick={(event) => event.stopPropagation()}
                        type="checkbox"
                      />
                    ) : (
                      company.id
                    )}
                  </td>
                  <td>
                    <div className="company-name-cell">
                      <CompanyLogoBadge
                        color={company.logoColor}
                        fallbackIconSize={15}
                        imageClassName="company-logo-image"
                        name={company.name}
                        website={company.website}
                        wrapperClassName="company-logo"
                      />
                      <strong>{company.name}</strong>
                    </div>
                  </td>
                  <td>{company.industry}</td>
                  <td>{company.location}</td>
                  <td>
                    <span className={`company-status status-${company.status.toLowerCase()}`}>{company.status}</span>
                  </td>
                  <td>{company.lastInteraction}</td>
                  <td>
                    <span className={`employee-badge ${employeeRangeClassName(company.employeeRange)}`}>{company.employeeRange}</span>
                  </td>
                  <td aria-label="Row actions">
                    {isMultiSelectMode ? null : (
                      <button
                        className="companies-row-action"
                        onClick={(event) => {
                          event.stopPropagation();
                          void deleteCompany(company.id);
                        }}
                        type="button"
                        aria-label={`Delete ${company.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!visibleCompanies.length ? (
                <tr>
                  <td className="companies-empty-cell" colSpan={8}>
                    <strong>No companies match this view</strong>
                    <span>Try clearing filters or add a new company to this CRM list.</span>
                    <div>
                      <button className="companies-toolbar-button" onClick={resetView} type="button">
                        Clear view
                      </button>
                      <button className="companies-add-button" onClick={openAddCompany} type="button">
                        <Plus size={17} />
                        Add Company
                      </button>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {isAddCompanyOpen ? (
        <div className="companies-modal-backdrop" role="presentation">
          <section className="companies-modal" aria-modal="true" role="dialog" aria-labelledby="add-company-title">
            <header>
              <div>
                <p className="eyebrow">CRM record</p>
                <h3 id="add-company-title">Add Company</h3>
              </div>
              <button className="companies-ghost-icon" aria-label="Close add company form" onClick={() => setIsAddCompanyOpen(false)} type="button">
                <X size={18} />
              </button>
            </header>

            <form className="companies-form" onSubmit={handleAddCompany}>
              <label>
                Company name
                <input
                  aria-invalid={submitted && !companyInput.name.trim()}
                  onChange={(event) => setCompanyInput((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Northstar Labs"
                  value={companyInput.name}
                />
              </label>

              <div className="companies-form-grid">
                <label>
                  Industry
                  <select
                    aria-invalid={submitted && !companyInput.industry.trim()}
                    onChange={(event) => setCompanyInput((current) => ({ ...current, industry: event.target.value }))}
                    value={companyInput.industry}
                  >
                    <option value="">Select an industry</option>
                    {industryOptions.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Location
                  <select
                    aria-invalid={submitted && !companyInput.location.trim()}
                    onChange={(event) => setCompanyInput((current) => ({ ...current, location: event.target.value }))}
                    value={companyInput.location}
                  >
                    <option value="">Select a country</option>
                    {countryOptions.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="companies-form-grid">
                <label>
                  Status
                  <select
                    onChange={(event) => setCompanyInput((current) => ({ ...current, status: event.target.value as CompanyStatus }))}
                    value={companyInput.status}
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Employee range
                  <select
                    onChange={(event) => setCompanyInput((current) => ({ ...current, employeeRange: event.target.value }))}
                    value={companyInput.employeeRange}
                  >
                    {employeeRanges.map((range) => (
                      <option key={range} value={range}>
                        {range}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {submitted && !formHasRequiredFields ? (
                <p className="form-error">Company name, industry, and location are required.</p>
              ) : null}

              <div className="companies-form-actions">
                <button className="companies-toolbar-button" onClick={() => setIsAddCompanyOpen(false)} type="button">
                  Cancel
                </button>
                <button className="companies-add-button" type="submit">
                  <Plus size={17} />
                  Add Company
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
