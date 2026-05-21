import { describe, expect, it } from "vitest";
import { companyRepositoryTestUtils } from "./companyRepository";

describe("companyRepositoryTestUtils.getNextCompanyIdFromRows", () => {
  it("continues after seeded company ids", () => {
    expect(
      companyRepositoryTestUtils.getNextCompanyIdFromRows([
        { id: 1 },
        { id: 15 },
      ]),
    ).toBe(16);
  });

  it("ignores empty rows when calculating the next id", () => {
    expect(
      companyRepositoryTestUtils.getNextCompanyIdFromRows([
        null,
        undefined,
        { id: 4 },
      ]),
    ).toBe(5);
  });
});

describe("companyRepositoryTestUtils.shouldSeedCompanies", () => {
  it("seeds only when the organization has never been initialized", () => {
    expect(companyRepositoryTestUtils.shouldSeedCompanies(0, false)).toBe(true);
  });

  it("does not reseed an org that was intentionally cleared", () => {
    expect(companyRepositoryTestUtils.shouldSeedCompanies(0, true)).toBe(false);
  });

  it("does not seed when companies already exist", () => {
    expect(companyRepositoryTestUtils.shouldSeedCompanies(3, false)).toBe(false);
  });
});
