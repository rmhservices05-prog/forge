import type { CompanyLog } from "../types";

const COMPANY_LOGS_STORAGE_KEY = "forge-company-logs";

type CompanyLogStorage = Record<string, CompanyLog[]>;

export type CompanyLogInput = {
  companyId: number;
  authorName: string;
  body: string;
  loggedOn: string;
};

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function readStorage(): CompanyLogStorage {
  if (typeof window === "undefined") {
    return {};
  }

  const storageHost = window as Window & { __forgeCompanyLogs?: string };
  let raw = "";

  try {
    const localStorageValue = window.localStorage?.getItem(COMPANY_LOGS_STORAGE_KEY);
    raw = localStorageValue ?? storageHost.__forgeCompanyLogs ?? "";
  } catch {
    raw = storageHost.__forgeCompanyLogs ?? "";
  }

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as CompanyLogStorage;
  } catch {
    return {};
  }
}

function writeStorage(storage: CompanyLogStorage) {
  if (typeof window === "undefined") {
    return;
  }

  const nextValue = JSON.stringify(storage);
  const storageHost = window as Window & { __forgeCompanyLogs?: string };

  try {
    if (window.localStorage) {
      window.localStorage.setItem(COMPANY_LOGS_STORAGE_KEY, nextValue);
      return;
    }
  } catch {
    // Fall through to the in-memory window store below.
  }

  storageHost.__forgeCompanyLogs = nextValue;
}

function sortCompanyLogs(logs: CompanyLog[]) {
  return [...logs].sort((left, right) => {
    if (left.loggedOn !== right.loggedOn) {
      return right.loggedOn.localeCompare(left.loggedOn);
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

export const companyLogRepository = {
  async listCompanyLogs(organizationId: string): Promise<CompanyLog[]> {
    const storage = readStorage();
    return sortCompanyLogs(storage[organizationId] ?? []);
  },

  async createCompanyLog(organizationId: string, input: CompanyLogInput): Promise<CompanyLog> {
    const storage = readStorage();
    const nextLog: CompanyLog = {
      id: createId("company-log"),
      companyId: input.companyId,
      authorName: input.authorName.trim(),
      body: input.body.trim(),
      loggedOn: input.loggedOn,
      createdAt: new Date().toISOString(),
    };

    storage[organizationId] = sortCompanyLogs([nextLog, ...(storage[organizationId] ?? [])]);
    writeStorage(storage);

    return nextLog;
  },
};
