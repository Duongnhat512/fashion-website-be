import OrderStatus from '../../../models/enum/order_status.enum';

/**
 * VAT Invoice Detail DTO
 * Used for both input VAT (purchases) and output VAT (sales)
 */
export class VatInvoiceDetailDto {
  invoiceSerial: string; // Invoice template code/serial
  invoiceNumber: string; // Invoice number
  invoiceDate: string; // Invoice date (ISO string)
  partnerName: string; // Customer name (Output) or Supplier name (Input)
  partnerTaxCode: string; // Partner tax code
  itemName: string; // Main goods/service name
  netValue: number; // Revenue/Cost excluding VAT
  vatRate: number; // VAT rate (0, 5, 8, 10)
  vatAmount: number; // VAT amount
  totalValue: number; // Total payment amount
  status: OrderStatus | string; // Invoice status
}

/**
 * VAT Report Response DTO
 * Contains output VAT (sales) and input VAT (purchases) details
 */
export class VatReportResponseDto {
  reportPeriod: {
    month?: number;
    quarter?: number;
    year: number;
  };

  companyInfo: {
    name: string;
    taxCode: string;
    address?: string;
    phone?: string;
    email?: string;
  };

  // Output VAT - Sales (from Orders)
  outputVat: {
    details: VatInvoiceDetailDto[];
    totalNetRevenue: number; // Total revenue excluding VAT
    totalVatAmount: number; // Total output VAT
    summaryByRate: {
      rate: number;
      netValue: number;
      vatAmount: number;
    }[];
  };

  // Input VAT - Purchases (from StockEntries)
  inputVat: {
    details: VatInvoiceDetailDto[];
    totalNetCost: number; // Total purchase value excluding VAT
    totalVatDeductible: number; // Total input VAT deductible
    summaryByRate: {
      rate: number;
      netValue: number;
      vatAmount: number;
    }[];
  };

  // Tax Summary
  taxSummary: {
    vatPayable: number; // VAT payable (Output - Input)
    isNegative: boolean; // True if deductible to next period (Input > Output)
    vatCarriedForward?: number; // VAT carried forward from previous period
    vatAdjustment?: {
      increase: number; // Adjustment increase
      decrease: number; // Adjustment decrease
    };
  };
}

