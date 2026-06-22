import { AlertTriangle, Clipboard, Download, FileText, Info, Package, Percent } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

type PlatformType = "UAV" | "UGV" | "USV" | "UUV" | "eVTOL" | "Cargo UAS" | "Other";
type LicenceTerm = 1 | 3 | 5;
type IntegrationPackage = "None" | "PoC" | "Pilot" | "Operational OEM";
type HardwareStage = "Prototype/demo" | "Field-ready module" | "OEM embedded chip";
type ApprovalStatus = "Draft" | "Commercial review" | "CEO approval required";
type CommissionBasis = "Total contract value" | "Software revenue only" | "Software + hardware only" | "Software + hardware + integration" | "Recurring revenue only";

type Inputs = {
  opportunityName: string;
  platformType: PlatformType;
  platformValue: number;
  endpoints: number;
  groundStations: number;
  licenceTerm: LicenceTerm;
  integrationPackage: IntegrationPackage;
  integrationOverride: number;
  hardwareStage: HardwareStage;
  hardwareCogs: number;
  annualSupportPercentage: number;
  strategicDiscountPercentage: number;
  minimumAnnualUplift: number;
  cpiUpliftOverride: number | "";
  approvalStatus: ApprovalStatus;
  partnerIntroduced: boolean;
  partnerName: string;
  partnerCommissionPercentage: number;
  commissionBasis: CommissionBasis;
  commissionDuration: number;
};

type Assumptions = {
  hardSoftwareFloor: number;
  groundStationLicence: number;
  supportGrossMargin: number;
  softwareGrossMargin: number;
  integrationGrossMargin: number;
  prototypeHardwarePrice: number;
  fieldHardwarePrice: number;
  oemMarginSmall: number;
  oemMarginMedium: number;
  oemMarginLarge: number;
  oemMarginProgramme: number;
};

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  currency: "GBP",
  maximumFractionDigits: 0,
  style: "currency",
});

const percentFormatter = new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 1,
  style: "percent",
});

const defaultInputs: Inputs = {
  opportunityName: "Lineage Pilot - Example OEM",
  platformType: "UAV",
  platformValue: 100000,
  endpoints: 50,
  groundStations: 1,
  licenceTerm: 3,
  integrationPackage: "Pilot",
  integrationOverride: 150000,
  hardwareStage: "Field-ready module",
  hardwareCogs: 800,
  annualSupportPercentage: 20,
  strategicDiscountPercentage: 0,
  minimumAnnualUplift: 5,
  cpiUpliftOverride: "",
  approvalStatus: "Commercial review",
  partnerIntroduced: true,
  partnerName: "Industry partner",
  partnerCommissionPercentage: 10,
  commissionBasis: "Total contract value",
  commissionDuration: 2,
};

const defaultAssumptions: Assumptions = {
  hardSoftwareFloor: 3500,
  groundStationLicence: 10000,
  supportGrossMargin: 80,
  softwareGrossMargin: 95,
  integrationGrossMargin: 60,
  prototypeHardwarePrice: 3000,
  fieldHardwarePrice: 1500,
  oemMarginSmall: 70,
  oemMarginMedium: 60,
  oemMarginLarge: 50,
  oemMarginProgramme: 40,
};

const platformTypes: PlatformType[] = ["UAV", "UGV", "USV", "UUV", "eVTOL", "Cargo UAS", "Other"];
const integrationPackages: IntegrationPackage[] = ["None", "PoC", "Pilot", "Operational OEM"];
const hardwareStages: HardwareStage[] = ["Prototype/demo", "Field-ready module", "OEM embedded chip"];
const commissionBases: CommissionBasis[] = [
  "Total contract value",
  "Software revenue only",
  "Software + hardware only",
  "Software + hardware + integration",
  "Recurring revenue only",
];

function formatCurrency(value: number) {
  return currencyFormatter.format(Math.round(value || 0));
}

function formatPercent(value: number) {
  return percentFormatter.format((value || 0) / 100);
}

function getPlatformAnchor(platformValue: number) {
  const tiers = [
    { name: "Attritable / low-cost", min: 0, max: 25000, floor: 5000, rate: 0.25, cap: 7500, review: "" },
    { name: "Tactical small", min: 25001, max: 100000, floor: 5500, rate: 0.1, cap: 10000, review: "" },
    { name: "Mid-tier professional / ISR", min: 100001, max: 500000, floor: 7500, rate: 0.05, cap: 20000, review: "" },
    { name: "High-value", min: 500001, max: 2000000, floor: 15000, rate: 0.025, cap: 35000, review: "" },
    { name: "Strategic / programme", min: 2000001, max: Number.POSITIVE_INFINITY, floor: 35000, rate: 0.01, cap: 75000, review: "Custom review required" },
  ];
  const tier = tiers.find((candidate) => platformValue >= candidate.min && platformValue <= candidate.max) ?? tiers[0];
  const valueDriven = platformValue * tier.rate;
  const anchored = Math.min(Math.max(tier.floor, valueDriven), tier.cap);
  const driver = anchored === tier.floor ? "floor-driven" : anchored === tier.cap ? "cap-driven" : "value-driven";

  return { ...tier, anchored, driver, effectivePercent: platformValue > 0 ? (anchored / platformValue) * 100 : 0 };
}

function getVolumeBand(endpoints: number) {
  if (endpoints <= 10) return { label: "1 to 10", multiplier: 1, approval: "", custom: false };
  if (endpoints <= 50) return { label: "11 to 50", multiplier: 0.67, approval: "", custom: false };
  if (endpoints <= 250) return { label: "51 to 250", multiplier: 0.47, approval: "", custom: false };
  if (endpoints <= 1000) return { label: "251 to 1,000", multiplier: 0.35, approval: "Commercial review required", custom: true };
  if (endpoints <= 5000) return { label: "1,001 to 5,000", multiplier: 0.25, approval: "CEO approval required", custom: true };
  return { label: "5,001+", multiplier: 0.2, approval: "Custom programme pricing required", custom: true };
}

function getIntegrationValue(input: Inputs) {
  if (input.integrationPackage === "None") return 0;
  if (input.integrationPackage === "PoC") return 50000;
  if (input.integrationPackage === "Pilot") return 150000;
  return input.integrationOverride;
}

function getHardware(input: Inputs, assumptions: Assumptions) {
  if (input.hardwareStage === "Prototype/demo") {
    return { price: assumptions.prototypeHardwarePrice, grossMargin: Math.max(0, (assumptions.prototypeHardwarePrice - input.hardwareCogs) / assumptions.prototypeHardwarePrice) };
  }
  if (input.hardwareStage === "Field-ready module") {
    return { price: assumptions.fieldHardwarePrice, grossMargin: Math.max(0, (assumptions.fieldHardwarePrice - input.hardwareCogs) / assumptions.fieldHardwarePrice) };
  }

  const margin = input.endpoints <= 10 ? assumptions.oemMarginSmall : input.endpoints <= 50 ? assumptions.oemMarginMedium : input.endpoints <= 250 ? assumptions.oemMarginLarge : assumptions.oemMarginProgramme;
  return { price: input.hardwareCogs / (1 - margin / 100), grossMargin: margin / 100 };
}

function getCommissionBase(
  basis: CommissionBasis,
  recurringSoftware: number,
  recurringGroundStation: number,
  recurringSupport: number,
  hardwareRevenue: number,
  integrationRevenue: number,
) {
  if (basis === "Software revenue only") return recurringSoftware;
  if (basis === "Software + hardware only") return recurringSoftware + hardwareRevenue;
  if (basis === "Software + hardware + integration") return recurringSoftware + hardwareRevenue + integrationRevenue;
  if (basis === "Recurring revenue only") return recurringSoftware + recurringGroundStation + recurringSupport;
  return recurringSoftware + recurringGroundStation + recurringSupport + hardwareRevenue + integrationRevenue;
}

function calculateModel(input: Inputs, assumptions: Assumptions) {
  const platform = getPlatformAnchor(input.platformValue);
  const volume = getVolumeBand(input.endpoints);
  const discountedPrice = platform.anchored * volume.multiplier * (1 - input.strategicDiscountPercentage / 100);
  const belowFloor = discountedPrice < assumptions.hardSoftwareFloor;
  const endpointSoftwarePrice = belowFloor && input.approvalStatus !== "CEO approval required" ? assumptions.hardSoftwareFloor : discountedPrice;
  const hardware = getHardware(input, assumptions);
  const hardwareRevenue = hardware.price * input.endpoints;
  const integrationRevenue = getIntegrationValue(input);
  const supportRevenue = integrationRevenue * (input.annualSupportPercentage / 100);
  const annualSoftwareRevenue = endpointSoftwarePrice * input.endpoints;
  const groundStationRevenue = assumptions.groundStationLicence * input.groundStations;
  const annualRecurringRevenue = annualSoftwareRevenue + groundStationRevenue + supportRevenue;
  const uplift = Math.max(input.minimumAnnualUplift, Number(input.cpiUpliftOverride) || 0);
  const partnerRate = input.partnerIntroduced ? input.partnerCommissionPercentage / 100 : 0;

  const yearlyRows = Array.from({ length: input.licenceTerm }, (_, index) => {
    const upliftMultiplier = Math.pow(1 + uplift / 100, index);
    const software = annualSoftwareRevenue * upliftMultiplier;
    const groundStation = groundStationRevenue * upliftMultiplier;
    const support = supportRevenue * upliftMultiplier;
    const recurring = software + groundStation + support;
    const hardwareInYear = index === 0 ? hardwareRevenue : 0;
    const integration = index === 0 ? integrationRevenue : 0;
    const grossRevenue = recurring + hardwareInYear + integration;
    const commissionBase = input.partnerIntroduced && index < input.commissionDuration ? getCommissionBase(input.commissionBasis, software, groundStation, support, hardwareInYear, integration) : 0;
    const commission = commissionBase * partnerRate;

    return { year: index + 1, software, groundStation, support, hardware: hardwareInYear, integration, recurring, grossRevenue, commission, netRevenue: grossRevenue - commission };
  });

  const totalContractValue = yearlyRows.reduce((sum, row) => sum + row.grossRevenue, 0);
  const totalPartnerCommission = yearlyRows.reduce((sum, row) => sum + row.commission, 0);
  const grossProfitBeforeCommission =
    yearlyRows.reduce((sum, row) => sum + row.software * (assumptions.softwareGrossMargin / 100), 0) +
    yearlyRows.reduce((sum, row) => sum + row.groundStation * (assumptions.softwareGrossMargin / 100), 0) +
    yearlyRows.reduce((sum, row) => sum + row.support * (assumptions.supportGrossMargin / 100), 0) +
    hardwareRevenue * hardware.grossMargin +
    integrationRevenue * (assumptions.integrationGrossMargin / 100);
  const grossProfitAfterCommission = grossProfitBeforeCommission - totalPartnerCommission;
  const grossMarginBeforeCommission = totalContractValue > 0 ? (grossProfitBeforeCommission / totalContractValue) * 100 : 0;
  const grossMarginAfterCommission = totalContractValue > 0 ? (grossProfitAfterCommission / totalContractValue) * 100 : 0;
  const year1 = yearlyRows[0];
  const warnings = [
    belowFloor && input.approvalStatus !== "CEO approval required" ? "Software floor applied." : "",
    input.endpoints > 250 ? "Custom OEM licence required." : "",
    volume.approval,
    hardwareRevenue > annualSoftwareRevenue ? "Hardware is dominating the deal. Check pricing structure." : "",
    input.platformValue > 500000 && platform.effectivePercent < 2 ? "Potential underpricing." : "",
    input.platformValue <= 25000 && platform.effectivePercent > 50 ? "Cost-exchange risk. Consider fleet licence." : "",
    totalPartnerCommission > grossProfitBeforeCommission * 0.15 ? "Partner fee materially impacts deal profitability." : "",
    platform.review,
  ].filter(Boolean);

  return {
    annualRecurringRevenue,
    annualSoftwareRevenue,
    endpointSoftwarePrice,
    grossMarginAfterCommission,
    grossMarginBeforeCommission,
    hardware,
    hardwareRevenue,
    integrationRevenue,
    platform,
    supportRevenue,
    totalContractValue,
    totalPartnerCommission,
    volume,
    warnings,
    year1,
    yearlyRows,
  };
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="simple-calc-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Product() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [assumptions, setAssumptions] = useState(defaultAssumptions);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const model = useMemo(() => calculateModel(inputs, assumptions), [inputs, assumptions]);
  const quoteSummary = [
    `${inputs.opportunityName}`,
    `Recommended software: ${formatCurrency(model.endpointSoftwarePrice)} per endpoint / year`,
    `Year 1: ${formatCurrency(model.year1.grossRevenue)}`,
    `${inputs.licenceTerm}-year TCV: ${formatCurrency(model.totalContractValue)}`,
    `Partner payout: ${formatCurrency(model.totalPartnerCommission)}`,
    `Gross margin after partner fee: ${formatPercent(model.grossMarginAfterCommission)}`,
  ].join("\n");

  function updateInput<K extends keyof Inputs>(key: K, value: Inputs[K]) {
    setInputs((current) => ({ ...current, [key]: value }));
  }

  function updateAssumption<K extends keyof Assumptions>(key: K, value: Assumptions[K]) {
    setAssumptions((current) => ({ ...current, [key]: value }));
  }

  function exportCsv() {
    const rows = [
      ["Metric", "Value"],
      ["Per endpoint annual software", Math.round(model.endpointSoftwarePrice)],
      ["Year 1 revenue", Math.round(model.year1.grossRevenue)],
      [`${inputs.licenceTerm}-year TCV`, Math.round(model.totalContractValue)],
      ["Partner commission", Math.round(model.totalPartnerCommission)],
      ["Gross margin after commission", model.grossMarginAfterCommission.toFixed(1)],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${inputs.opportunityName || "lineage-pricing-model"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="simple-calc-page">
      <header className="simple-calc-header">
        <div>
          <p className="eyebrow">Lineage commercial model</p>
          <h2>Pricing calculator</h2>
          <span>Enter the basics, then use the result as the commercial starting point.</span>
        </div>
        <div className="simple-calc-actions">
          <button className="secondary-button" onClick={() => window.print()} type="button">
            <FileText size={16} />
            PDF
          </button>
          <button className="secondary-button" onClick={exportCsv} type="button">
            <Download size={16} />
            CSV
          </button>
          <button className="primary-button" onClick={() => void navigator.clipboard.writeText(quoteSummary)} type="button">
            <Clipboard size={16} />
            Copy
          </button>
        </div>
      </header>

      <main className="simple-calc-layout">
        <section className="simple-calc-inputs">
          <div className="simple-calc-card">
            <div className="simple-calc-card-header">
              <Package size={18} />
              <h3>1. Basic deal details</h3>
            </div>
            <Field label="Opportunity name">
              <input value={inputs.opportunityName} onChange={(event) => updateInput("opportunityName", event.target.value)} />
            </Field>
            <div className="simple-calc-grid">
              <Field label="Platform type">
                <select value={inputs.platformType} onChange={(event) => updateInput("platformType", event.target.value as PlatformType)}>
                  {platformTypes.map((type) => <option key={type}>{type}</option>)}
                </select>
              </Field>
              <Field label="Licence term">
                <select value={inputs.licenceTerm} onChange={(event) => updateInput("licenceTerm", Number(event.target.value) as LicenceTerm)}>
                  <option value={1}>1 year</option>
                  <option value={3}>3 years</option>
                  <option value={5}>5 years</option>
                </select>
              </Field>
            </div>
            <div className="simple-calc-grid">
              <Field label="Platform value">
                <input min={0} step={1000} type="number" value={inputs.platformValue} onChange={(event) => updateInput("platformValue", Number(event.target.value))} />
              </Field>
              <Field label="Protected endpoints">
                <input min={1} type="number" value={inputs.endpoints} onChange={(event) => updateInput("endpoints", Number(event.target.value))} />
              </Field>
              <Field label="Ground stations">
                <input min={0} type="number" value={inputs.groundStations} onChange={(event) => updateInput("groundStations", Number(event.target.value))} />
              </Field>
            </div>
          </div>

          <div className="simple-calc-card">
            <div className="simple-calc-card-header">
              <Info size={18} />
              <h3>2. Commercial options</h3>
            </div>
            <div className="simple-calc-grid">
              <Field label="Integration package">
                <select value={inputs.integrationPackage} onChange={(event) => updateInput("integrationPackage", event.target.value as IntegrationPackage)}>
                  {integrationPackages.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Hardware stage">
                <select value={inputs.hardwareStage} onChange={(event) => updateInput("hardwareStage", event.target.value as HardwareStage)}>
                  {hardwareStages.map((stage) => <option key={stage}>{stage}</option>)}
                </select>
              </Field>
              <Field label="Hardware COGS">
                <input min={0} step={50} type="number" value={inputs.hardwareCogs} onChange={(event) => updateInput("hardwareCogs", Number(event.target.value))} />
              </Field>
            </div>
            {inputs.integrationPackage === "Operational OEM" ? (
              <Field label="Operational OEM integration value">
                <input min={200000} step={25000} type="number" value={inputs.integrationOverride} onChange={(event) => updateInput("integrationOverride", Number(event.target.value))} />
              </Field>
            ) : null}
          </div>

          <div className="simple-calc-card">
            <div className="simple-calc-card-header">
              <Percent size={18} />
              <h3>3. Partner introduction</h3>
            </div>
            <label className="simple-calc-toggle">
              <span>Customer introduced by partner</span>
              <input checked={inputs.partnerIntroduced} type="checkbox" onChange={(event) => updateInput("partnerIntroduced", event.target.checked)} />
            </label>
            {inputs.partnerIntroduced ? (
              <>
                <div className="simple-calc-grid">
                  <Field label="Partner name">
                    <input value={inputs.partnerName} onChange={(event) => updateInput("partnerName", event.target.value)} />
                  </Field>
                  <Field label="Commission %">
                    <input min={0} max={40} type="number" value={inputs.partnerCommissionPercentage} onChange={(event) => updateInput("partnerCommissionPercentage", Number(event.target.value))} />
                  </Field>
                  <Field label="Commission duration">
                    <select value={inputs.commissionDuration} onChange={(event) => updateInput("commissionDuration", Number(event.target.value))}>
                      <option value={1}>1 year</option>
                      <option value={2}>2 years</option>
                      <option value={3}>3 years</option>
                      <option value={inputs.licenceTerm}>Contract term</option>
                    </select>
                  </Field>
                </div>
                <Field label="Commission basis">
                  <select value={inputs.commissionBasis} onChange={(event) => updateInput("commissionBasis", event.target.value as CommissionBasis)}>
                    {commissionBases.map((basis) => <option key={basis}>{basis}</option>)}
                  </select>
                </Field>
              </>
            ) : null}
          </div>

          <details className="simple-calc-card simple-calc-advanced" open={showAdvanced} onToggle={(event) => setShowAdvanced(event.currentTarget.open)}>
            <summary>Advanced assumptions</summary>
            <div className="simple-calc-grid">
              <Field label="Strategic discount %">
                <input min={0} max={70} type="number" value={inputs.strategicDiscountPercentage} onChange={(event) => updateInput("strategicDiscountPercentage", Number(event.target.value))} />
              </Field>
              <Field label="Support %">
                <input min={0} max={60} type="number" value={inputs.annualSupportPercentage} onChange={(event) => updateInput("annualSupportPercentage", Number(event.target.value))} />
              </Field>
              <Field label="Minimum uplift %">
                <input min={0} max={20} type="number" value={inputs.minimumAnnualUplift} onChange={(event) => updateInput("minimumAnnualUplift", Number(event.target.value))} />
              </Field>
              <Field label="CPI override %">
                <input min={0} max={20} placeholder="Optional" type="number" value={inputs.cpiUpliftOverride} onChange={(event) => updateInput("cpiUpliftOverride", event.target.value === "" ? "" : Number(event.target.value))} />
              </Field>
              <Field label="Approval status">
                <select value={inputs.approvalStatus} onChange={(event) => updateInput("approvalStatus", event.target.value as ApprovalStatus)}>
                  <option>Draft</option>
                  <option>Commercial review</option>
                  <option>CEO approval required</option>
                </select>
              </Field>
              <Field label="Software floor">
                <input min={0} step={250} type="number" value={assumptions.hardSoftwareFloor} onChange={(event) => updateAssumption("hardSoftwareFloor", Number(event.target.value))} />
              </Field>
              <Field label="Ground station licence">
                <input min={7000} max={35000} step={500} type="number" value={assumptions.groundStationLicence} onChange={(event) => updateAssumption("groundStationLicence", Number(event.target.value))} />
              </Field>
            </div>
          </details>
        </section>

        <aside className="simple-calc-results">
          <section className="simple-calc-result-hero">
            <span>Recommended annual software licence</span>
            <strong>{formatCurrency(model.endpointSoftwarePrice)}</strong>
            <p>per protected endpoint</p>
          </section>

          <section className="simple-calc-results-grid">
            <article>
              <span>Year 1 total</span>
              <strong>{formatCurrency(model.year1.grossRevenue)}</strong>
            </article>
            <article>
              <span>{inputs.licenceTerm}-year total</span>
              <strong>{formatCurrency(model.totalContractValue)}</strong>
            </article>
            <article>
              <span>ARR</span>
              <strong>{formatCurrency(model.annualRecurringRevenue)}</strong>
            </article>
            <article>
              <span>Gross margin after partner</span>
              <strong>{formatPercent(model.grossMarginAfterCommission)}</strong>
            </article>
          </section>

          {model.warnings.length ? (
            <section className="simple-calc-alerts">
              <AlertTriangle size={17} />
              <div>
                {model.warnings.map((warning) => <span key={warning}>{warning}</span>)}
              </div>
            </section>
          ) : null}

          <section className="simple-calc-card">
            <h3>Simple breakdown</h3>
            <div className="simple-calc-breakdown">
              <div>
                <span>Software</span>
                <strong>{formatCurrency(model.annualSoftwareRevenue)}</strong>
              </div>
              <div>
                <span>Hardware</span>
                <strong>{formatCurrency(model.hardwareRevenue)}</strong>
              </div>
              <div>
                <span>Integration</span>
                <strong>{formatCurrency(model.integrationRevenue)}</strong>
              </div>
              <div>
                <span>Support</span>
                <strong>{formatCurrency(model.supportRevenue)}</strong>
              </div>
              <div>
                <span>Partner payout</span>
                <strong>{formatCurrency(model.totalPartnerCommission)}</strong>
              </div>
            </div>
          </section>

          <section className="simple-calc-card">
            <h3>How it was calculated</h3>
            <ol className="simple-calc-logic">
              <li>Platform anchor: {formatCurrency(model.platform.anchored)} ({model.platform.driver})</li>
              <li>Volume band: {model.volume.label}, {model.volume.multiplier.toFixed(2)}x multiplier</li>
              <li>Final endpoint price: {formatCurrency(model.endpointSoftwarePrice)}</li>
              <li>Partner commission: {inputs.partnerIntroduced ? `${formatPercent(inputs.partnerCommissionPercentage)} for ${inputs.commissionDuration} year${inputs.commissionDuration === 1 ? "" : "s"}` : "not applied"}</li>
            </ol>
          </section>

          <section className="simple-calc-card">
            <h3>Multi-year view</h3>
            <div className="simple-calc-years">
              {model.yearlyRows.map((row) => (
                <div key={row.year}>
                  <span>Year {row.year}</span>
                  <strong>{formatCurrency(row.grossRevenue)}</strong>
                  <small>Net after partner: {formatCurrency(row.netRevenue)}</small>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}
