/**
 * Balance Sheet DTO
 * Represents the financial position at a specific point in time
 */
export class BalanceSheetDto {
  assets: {
    currentAssets: {
      cash: number; // Cash and bank deposits
      inventory: number; // Inventory value (from Inventory Model)
      receivables: number; // Accounts receivable (COD pending collection)
      shortTermInvestments: number; // Short-term investments
      otherCurrentAssets: number; // Other current assets
      totalCurrentAssets: number; // Total current assets
    };
    nonCurrentAssets: {
      fixedAssets: number; // Fixed assets (Machinery, equipment)
      longTermInvestments: number; // Long-term investments
      intangibleAssets: number; // Intangible assets
      otherNonCurrentAssets: number; // Other non-current assets
      totalNonCurrentAssets: number; // Total non-current assets
    };
    totalAssets: number; // Total assets (must equal totalResources)
  };

  resources: {
    liabilities: {
      shortTermDebt: {
        accountsPayable: number; // Accounts payable to suppliers
        taxPayable: number; // Taxes and amounts payable to State
        accruedExpenses: number; // Accrued expenses
        shortTermLoans: number; // Short-term loans
        otherShortTermLiabilities: number; // Other short-term liabilities
        totalShortTermDebt: number; // Total short-term debt
      };
      longTermDebt: {
        longTermLoans: number; // Long-term loans
        otherLongTermLiabilities: number; // Other long-term liabilities
        totalLongTermDebt: number; // Total long-term debt
      };
      totalLiabilities: number; // Total liabilities
    };
    equity: {
      ownerCapital: number; // Owner's invested capital
      retainedEarnings: number; // Retained earnings (undistributed after-tax profit)
      currentYearProfit: number; // Current year profit
      otherEquity: number; // Other equity items
      totalEquity: number; // Total equity
    };
    totalResources: number; // Total resources (must equal totalAssets)
  };
}

/**
 * Income Statement DTO
 * Represents the financial performance over a period
 */
export class IncomeStatementDto {
  // Revenue Section
  revenue: {
    salesRevenue: number; // Code 01: Sales revenue
    financialRevenue: number; // Financial revenue
    otherRevenue: number; // Other revenue
    totalRevenue: number; // Total revenue
  };

  // Deductions
  deductions: {
    salesReturns: number; // Sales returns
    discounts: number; // Discounts
    allowances: number; // Allowances
    totalDeductions: number; // Code 02: Total deductions
  };

  netRevenue: number; // Code 10: Net revenue (Revenue - Deductions)

  // Cost of Goods Sold
  costOfGoodsSold: number; // Code 11: Cost of goods sold

  grossProfit: number; // Code 20: Gross profit (Net Revenue - COGS)

  // Operating Expenses
  operatingExpenses: {
    sellingExpenses: number; // Selling expenses
    adminExpenses: number; // Administrative expenses
    totalOperatingExpenses: number; // Total operating expenses
  };

  operatingProfit: number; // Code 30: Operating profit (Gross Profit - Operating Expenses)

  // Other Income/Expenses
  otherProfit: {
    otherIncome: number; // Other income
    otherExpenses: number; // Other expenses
    netOtherProfit: number; // Code 40: Net other profit
  };

  profitBeforeTax: number; // Code 50: Profit before tax

  // Tax
  currentCit: number; // Code 51: Current Corporate Income Tax expense

  profitAfterTax: number; // Code 60: Profit after tax
}

/**
 * Annual Financial Report DTO
 * Complete financial statement for a fiscal year
 */
export class AnnualFinancialReportDto {
  fiscalYear: number;
  currency: string; // "VND"
  reportDate: string; // Report date (ISO string)
  preparedDate: string; // Date when report was prepared (ISO string)

  companyInfo: {
    name: string;
    taxCode: string;
    address: string;
    legalRepresentative?: string; // Legal representative name
  };

  balanceSheet: BalanceSheetDto;
  incomeStatement: IncomeStatementDto;

  // Additional notes or disclosures
  notes?: {
    accountingPolicies?: string; // Accounting policies
    significantEvents?: string; // Significant events during the period
    otherNotes?: string; // Other notes
  };
}

