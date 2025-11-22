/**
 * Corporate Income Tax (CIT) Report Response DTO
 * Used for quarterly provisional tax and annual finalization
 */
export class CitReportResponseDto {
  period: {
    quarter?: number; // 1-4 for quarterly, undefined for annual
    year: number;
    fromDate: string; // ISO date string
    toDate: string; // ISO date string
    isAnnual: boolean; // True for annual finalization
  };

  companyInfo: {
    name: string;
    taxCode: string;
    businessSector?: string; // Main business sector
    sectorPercentage?: number; // Percentage of revenue from main sector
  };

  // Revenue Section
  revenue: {
    salesRevenue: number; // Sales revenue (from completed Orders)
    financialRevenue: number; // Financial revenue
    otherIncome: number; // Other income
    totalRevenue: number; // Total revenue
  };

  // Expenses Section
  expenses: {
    costOfGoodsSold: number; // Cost of goods sold (from Inventory/StockEntry)
    sellingExpenses: number; // Selling expenses (Marketing, Shipping support...)
    adminExpenses: number; // Administrative expenses (Salary, utilities, server rental...)
    financialExpenses: number; // Financial expenses (Interest, bank fees...)
    otherExpenses: number; // Other expenses
    totalDeductibleExpenses: number; // Total deductible expenses
    nonDeductibleExpenses?: number; // Non-deductible expenses
  };

  // Tax Calculation
  taxCalculation: {
    profitBeforeTax: number; // Profit before tax (Revenue - Expenses)
    carryForwardLoss: number; // Loss carried forward from previous years (if any)
    taxableIncome: number; // Taxable income
    taxRate: number; // Tax rate (usually 20%)
    citAmount: number; // CIT payable
    adjustments?: {
      increase: number; // Adjustments increasing profit
      decrease: number; // Adjustments decreasing profit
    };
  };

  // For checking 80% rule of quarterly provisional payments
  annualTracking?: {
    accumulatedPaid: number; // Amount already paid provisionally in the year
    estimatedAnnualTax: number; // Estimated annual tax
    remainingPayable: number; // Remaining amount to pay
    minimumRequired: number; // Minimum 80% of annual tax
    isCompliant: boolean; // True if accumulated >= 80% of estimated
  };
}

