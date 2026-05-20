export type CompanyStatus = "Active" | "Prospect" | "Inactive";

export type Company = {
  id: number;
  name: string;
  industry: string;
  location: string;
  status: CompanyStatus;
  lastInteraction: string;
  employeeRange: string;
  logoColor: string;
};

export const initialCompanies: Company[] = [
  { id: 1, name: "Code Sphere", industry: "Technology", location: "Indonesia", status: "Active", lastInteraction: "About 2 hours ago", employeeRange: "100K+", logoColor: "purple" },
  { id: 2, name: "Capital Flow", industry: "Banking", location: "Denmark", status: "Prospect", lastInteraction: "2 days ago", employeeRange: "250 - 1k", logoColor: "blue" },
  { id: 3, name: "BioVita", industry: "Healthcare", location: "USA", status: "Active", lastInteraction: "About 7 hours ago", employeeRange: "10K - 50K", logoColor: "mint" },
  { id: 4, name: "Market Hive", industry: "Retail", location: "Germany", status: "Inactive", lastInteraction: "1 month ago", employeeRange: "5K - 10K", logoColor: "orange" },
  { id: 5, name: "Pixel Core", industry: "Innovation", location: "France", status: "Prospect", lastInteraction: "3 days ago", employeeRange: "100K+", logoColor: "violet" },
  { id: 6, name: "Wealth Edge", industry: "Banking", location: "United Kingdom", status: "Active", lastInteraction: "About 1 hour ago", employeeRange: "1-50", logoColor: "black" },
  { id: 7, name: "Care Bridge", industry: "Wellness", location: "Belgium", status: "Prospect", lastInteraction: "About 3 hours ago", employeeRange: "10K - 50K", logoColor: "emerald" },
  { id: 8, name: "Trend Haven", industry: "E-Commerce", location: "Canada", status: "Inactive", lastInteraction: "2 months ago", employeeRange: "100K+", logoColor: "charcoal" },
  { id: 9, name: "Fin Path", industry: "Finance", location: "Thailand", status: "Active", lastInteraction: "About 1 hour ago", employeeRange: "5K - 10K", logoColor: "gold" },
  { id: 10, name: "Data Forge", industry: "Technology", location: "United Kingdom", status: "Prospect", lastInteraction: "2 days ago", employeeRange: "1-50", logoColor: "sky" },
  { id: 11, name: "Pure Cart", industry: "Retail", location: "USA", status: "Active", lastInteraction: "About 4 hours ago", employeeRange: "10K - 50K", logoColor: "olive" },
  { id: 12, name: "Luminous Co", industry: "Finance", location: "Indonesia", status: "Prospect", lastInteraction: "About 2 hours ago", employeeRange: "100K+", logoColor: "forest" },
  { id: 13, name: "DealSphere", industry: "Technology", location: "Australia", status: "Inactive", lastInteraction: "1 month ago", employeeRange: "10K - 50K", logoColor: "slate" },
  { id: 14, name: "Eco Fund", industry: "Finance", location: "Italy", status: "Active", lastInteraction: "About 1 hour ago", employeeRange: "5K - 10K", logoColor: "purple" },
  { id: 15, name: "Inno Wave", industry: "Innovation", location: "Indonesia", status: "Active", lastInteraction: "About 2 hours ago", employeeRange: "100K+", logoColor: "pink" },
];

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
}
