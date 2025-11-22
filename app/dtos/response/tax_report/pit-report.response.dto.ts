/**
 * Personal Income Tax (PIT) Employee Detail DTO
 */
export class EmployeePitDetailDto {
  employeeId: number;
  fullName: string;
  taxCode: string; // Personal tax code
  idCard: string; // ID card/CCCD number

  income: {
    grossSalary: number; // Total taxable income
    bonus: number; // Bonus
    overtime: number; // Overtime pay
    allowances: number; // Various allowances
    taxExemptIncome: number; // Tax-exempt income (lunch, hazardous allowance...)
    totalIncome: number; // Total income
  };

  deductions: {
    personalDeduction: number; // Personal deduction (11,000,000 VND)
    dependentDeduction: number; // Dependent deduction (4,400,000 x number of dependents)
    insurance: number; // Mandatory insurance (Social, Health, Unemployment)
    totalDeductions: number; // Total deductions
  };

  taxResult: {
    assessableIncome: number; // Assessable income (Income - Deductions)
    taxAmount: number; // PIT amount to be withheld
    progressiveTaxBreakdown?: {
      bracket: number; // Tax bracket
      taxableAmount: number; // Amount in this bracket
      taxRate: number; // Tax rate for this bracket
      taxAmount: number; // Tax amount for this bracket
    }[];
  };
}

/**
 * Personal Income Tax (PIT) Report Response DTO
 */
export class PitReportResponseDto {
  period: {
    month?: number;
    quarter?: number;
    year: number;
    fromDate: string; // ISO date string
    toDate: string; // ISO date string
  };

  companyInfo: {
    name: string;
    taxCode: string;
  };

  details: EmployeePitDetailDto[];

  summary: {
    totalEmployees: number;
    totalIncomePaid: number; // Total income paid
    totalTaxWithheld: number; // Total tax withheld
    averageTaxRate: number; // Average tax rate
  };
}

