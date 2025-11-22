import { ITaxReportService } from '../tax_report.service.interface';
import { TaxReportRepository } from '../../../repositories/tax_report.repository';
import {
  VatReportResponseDto,
  VatInvoiceDetailDto,
  CitReportResponseDto,
  PitReportResponseDto,
  AnnualFinancialReportDto,
  BalanceSheetDto,
  IncomeStatementDto,
} from '../../../dtos/response/tax_report';
import OrderStatus from '../../../models/enum/order_status.enum';
import { PaymentMethod } from '../../../models/enum/payment_method.enum';

export class TaxReportService implements ITaxReportService {
  private readonly taxReportRepository: TaxReportRepository;

  constructor() {
    this.taxReportRepository = new TaxReportRepository();
  }

  /**
   * Calculate date range for period
   */
  private getDateRange(
    year: number,
    month?: number,
    quarter?: number,
  ): { startDate: Date; endDate: Date } {
    let startDate: Date;
    let endDate: Date;

    if (month) {
      // Monthly report
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59, 999);
    } else if (quarter) {
      // Quarterly report
      const quarterStartMonth = (quarter - 1) * 3;
      startDate = new Date(year, quarterStartMonth, 1);
      endDate = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999);
    } else {
      // Annual report
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    }

    return { startDate, endDate };
  }

  /**
   * Generate VAT report
   */
  async generateVatReport(
    year: number,
    month?: number,
    quarter?: number,
    vatRate: number = 10, // Default VAT rate 10%
  ): Promise<VatReportResponseDto> {
    const { startDate, endDate } = this.getDateRange(year, month, quarter);

    // Get output VAT (sales)
    const orders = await this.taxReportRepository.getOrdersForVatReport(
      startDate,
      endDate,
    );

    // Get input VAT (purchases)
    const stockEntries =
      await this.taxReportRepository.getStockEntriesForVatReport(
        startDate,
        endDate,
      );

    // Process output VAT details
    const outputVatDetails: VatInvoiceDetailDto[] = orders.map((order) => {
      // Calculate net value (excluding VAT)
      const netValue = order.subTotal / (1 + vatRate / 100);
      const vatAmount = order.subTotal - netValue;

      return {
        invoiceSerial: 'HD', // Cần lấy từ cấu hình
        invoiceNumber: order.orderId,
        invoiceDate: order.orderDate.toISOString(),
        partnerName: order.customerName,
        partnerTaxCode: order.customerTaxCode || '',
        itemName: order.items.map((i) => i.productName).join(', '),
        netValue: netValue,
        vatRate: vatRate,
        vatAmount: vatAmount,
        totalValue: order.totalAmount,
        status: order.status as OrderStatus,
      };
    });

    // Process input VAT details
    const inputVatDetails: VatInvoiceDetailDto[] = stockEntries.map((entry) => {
      // Calculate net value (excluding VAT)
      const netValue = entry.totalCost / (1 + vatRate / 100);
      const vatAmount = entry.totalCost - netValue;

      return {
        invoiceSerial: 'PN', // Phiếu nhập
        invoiceNumber: entry.stockEntryId,
        invoiceDate: entry.entryDate.toISOString(),
        partnerName: entry.supplierName || 'N/A',
        partnerTaxCode: entry.supplierTaxCode || '',
        itemName: entry.items.map((i) => i.productName).join(', '),
        netValue: netValue,
        vatRate: vatRate,
        vatAmount: vatAmount,
        totalValue: entry.totalCost,
        status: entry.status,
      };
    });

    // Calculate totals
    const totalNetRevenue = outputVatDetails.reduce(
      (sum, item) => sum + item.netValue,
      0,
    );
    const totalOutputVat = outputVatDetails.reduce(
      (sum, item) => sum + item.vatAmount,
      0,
    );

    const totalNetCost = inputVatDetails.reduce(
      (sum, item) => sum + item.netValue,
      0,
    );
    const totalInputVat = inputVatDetails.reduce(
      (sum, item) => sum + item.vatAmount,
      0,
    );

    // Group by VAT rate
    const outputByRate = this.groupByVatRate(outputVatDetails);
    const inputByRate = this.groupByVatRate(inputVatDetails);

    // Calculate VAT payable
    const vatPayable = totalOutputVat - totalInputVat;

    return {
      reportPeriod: {
        month,
        quarter,
        year,
      },
      companyInfo: {
        name: 'Công ty TNHH Thời Trang', // Cần lấy từ cấu hình
        taxCode: '0123456789', // Cần lấy từ cấu hình
        address: '123 Đường ABC, Quận XYZ, TP.HCM',
        phone: '0123 456 789',
        email: 'info@fashion.com',
      },
      outputVat: {
        details: outputVatDetails,
        totalNetRevenue,
        totalVatAmount: totalOutputVat,
        summaryByRate: outputByRate,
      },
      inputVat: {
        details: inputVatDetails,
        totalNetCost,
        totalVatDeductible: totalInputVat,
        summaryByRate: inputByRate,
      },
      taxSummary: {
        vatPayable: vatPayable > 0 ? vatPayable : 0,
        isNegative: vatPayable < 0,
        vatCarriedForward: vatPayable < 0 ? Math.abs(vatPayable) : undefined,
      },
    };
  }

  /**
   * Group VAT details by rate
   */
  private groupByVatRate(
    details: VatInvoiceDetailDto[],
  ): Array<{ rate: number; netValue: number; vatAmount: number }> {
    const grouped = new Map<number, { netValue: number; vatAmount: number }>();

    details.forEach((item) => {
      const existing = grouped.get(item.vatRate) || {
        netValue: 0,
        vatAmount: 0,
      };
      existing.netValue += item.netValue;
      existing.vatAmount += item.vatAmount;
      grouped.set(item.vatRate, existing);
    });

    return Array.from(grouped.entries()).map(([rate, values]) => ({
      rate,
      ...values,
    }));
  }

  /**
   * Generate CIT report
   */
  async generateCitReport(
    year: number,
    quarter?: number,
    isAnnual: boolean = false,
  ): Promise<CitReportResponseDto> {
    const { startDate, endDate } = this.getDateRange(year, quarter);

    // Get revenue
    const revenueData = await this.taxReportRepository.getRevenueForCitReport(
      startDate,
      endDate,
    );

    // Get cost of goods sold
    const costOfGoodsSold = await this.taxReportRepository.getCostOfGoodsSold(
      startDate,
      endDate,
    );

    // Calculate profit before tax
    const profitBeforeTax = revenueData.salesRevenue - costOfGoodsSold;

    // Tax rate (usually 20% for most businesses)
    const taxRate = 0.2;
    const taxableIncome = Math.max(0, profitBeforeTax); // No negative taxable income
    const citAmount = taxableIncome * taxRate;

    return {
      period: {
        quarter,
        year,
        fromDate: startDate.toISOString(),
        toDate: endDate.toISOString(),
        isAnnual: isAnnual || !quarter,
      },
      companyInfo: {
        name: 'Công ty TNHH Thời Trang',
        taxCode: '0123456789',
        businessSector: 'Bán lẻ quần áo, thời trang',
        sectorPercentage: 100,
      },
      revenue: {
        salesRevenue: revenueData.salesRevenue,
        financialRevenue: 0, // Cần bổ sung nếu có
        otherIncome: 0, // Cần bổ sung nếu có
        totalRevenue: revenueData.salesRevenue,
      },
      expenses: {
        costOfGoodsSold,
        sellingExpenses: 0, // Cần bổ sung từ các chi phí marketing, shipping
        adminExpenses: 0, // Cần bổ sung từ chi phí quản lý
        financialExpenses: 0, // Cần bổ sung nếu có
        otherExpenses: 0, // Cần bổ sung nếu có
        totalDeductibleExpenses: costOfGoodsSold,
      },
      taxCalculation: {
        profitBeforeTax,
        carryForwardLoss: 0, // Cần tính từ các năm trước
        taxableIncome,
        taxRate: taxRate * 100, // Convert to percentage
        citAmount,
      },
    };
  }

  /**
   * Generate PIT report
   */
  async generatePitReport(
    year: number,
    month?: number,
    quarter?: number,
  ): Promise<PitReportResponseDto> {
    // Tạm thời trả về empty report vì chưa có model Employee
    // Cần tạo model Employee hoặc mở rộng User model
    return {
      period: {
        month,
        quarter,
        year,
        fromDate: this.getDateRange(
          year,
          month,
          quarter,
        ).startDate.toISOString(),
        toDate: this.getDateRange(year, month, quarter).endDate.toISOString(),
      },
      companyInfo: {
        name: 'Công ty TNHH Thời Trang',
        taxCode: '0123456789',
      },
      details: [],
      summary: {
        totalEmployees: 0,
        totalIncomePaid: 0,
        totalTaxWithheld: 0,
        averageTaxRate: 0,
      },
    };
  }

  /**
   * Generate annual financial report
   */
  async generateAnnualFinancialReport(
    year: number,
  ): Promise<AnnualFinancialReportDto> {
    const { startDate, endDate } = this.getDateRange(year);

    // Get revenue and expenses for income statement
    const revenueData = await this.taxReportRepository.getRevenueForCitReport(
      startDate,
      endDate,
    );
    const costOfGoodsSold = await this.taxReportRepository.getCostOfGoodsSold(
      startDate,
      endDate,
    );

    // Get balance sheet data
    const inventoryValue = await this.taxReportRepository.getInventoryValue();
    const accountsReceivable =
      await this.taxReportRepository.getAccountsReceivable();
    const taxPayable = await this.taxReportRepository.getTaxPayable();

    // Calculate income statement
    const netRevenue = revenueData.salesRevenue;
    const grossProfit = netRevenue - costOfGoodsSold;
    const operatingProfit = grossProfit; // Simplified (no operating expenses tracked yet)
    const profitBeforeTax = operatingProfit;
    const currentCit = profitBeforeTax * 0.2; // 20% tax rate
    const profitAfterTax = profitBeforeTax - currentCit;

    // Get cash (tiền mặt từ các đơn hàng đã hoàn thành thanh toán bằng tiền mặt)
    const cash = await this.taxReportRepository.getCash(
      PaymentMethod.CASH,
      startDate,
      endDate,
    );

    // Get bank deposits (tiền gửi ngân hàng từ các đơn hàng đã thanh toán qua ngân hàng)
    const bankDeposits = await this.taxReportRepository.getBankDeposits(
      startDate,
      endDate,
    );

    // Total cash and cash equivalents = cash + bank deposits
    const totalCash = cash + bankDeposits;

    // Build balance sheet
    const balanceSheet: BalanceSheetDto = {
      assets: {
        currentAssets: {
          cash: totalCash, // Tổng tiền mặt và tiền gửi ngân hàng
          inventory: inventoryValue,
          receivables: accountsReceivable,
          shortTermInvestments: 0,
          otherCurrentAssets: 0,
          totalCurrentAssets: totalCash + inventoryValue + accountsReceivable,
        },
        nonCurrentAssets: {
          fixedAssets: 0, // Cần query từ fixed assets records
          longTermInvestments: 0,
          intangibleAssets: 0,
          otherNonCurrentAssets: 0,
          totalNonCurrentAssets: 0,
        },
        totalAssets: totalCash + inventoryValue + accountsReceivable,
      },
      resources: {
        liabilities: {
          shortTermDebt: {
            accountsPayable: 0, // Cần query từ supplier payments
            taxPayable: taxPayable.vatPayable + taxPayable.citPayable,
            accruedExpenses: 0,
            shortTermLoans: 0,
            otherShortTermLiabilities: 0,
            totalShortTermDebt: taxPayable.vatPayable + taxPayable.citPayable,
          },
          longTermDebt: {
            longTermLoans: 0,
            otherLongTermLiabilities: 0,
            totalLongTermDebt: 0,
          },
          totalLiabilities: taxPayable.vatPayable + taxPayable.citPayable,
        },
        equity: {
          ownerCapital: 0, // Cần lấy từ cấu hình hoặc database
          retainedEarnings: profitAfterTax, // Simplified
          currentYearProfit: profitAfterTax,
          otherEquity: 0,
          totalEquity: profitAfterTax,
        },
        totalResources:
          taxPayable.vatPayable + taxPayable.citPayable + profitAfterTax,
      },
    };

    // Build income statement
    const incomeStatement: IncomeStatementDto = {
      revenue: {
        salesRevenue: revenueData.salesRevenue,
        financialRevenue: 0,
        otherRevenue: 0,
        totalRevenue: revenueData.salesRevenue,
      },
      deductions: {
        salesReturns: 0,
        discounts: 0,
        allowances: 0,
        totalDeductions: 0,
      },
      netRevenue,
      costOfGoodsSold,
      grossProfit,
      operatingExpenses: {
        sellingExpenses: 0,
        adminExpenses: 0,
        totalOperatingExpenses: 0,
      },
      operatingProfit,
      otherProfit: {
        otherIncome: 0,
        otherExpenses: 0,
        netOtherProfit: 0,
      },
      profitBeforeTax,
      currentCit,
      profitAfterTax,
    };

    return {
      fiscalYear: year,
      currency: 'VND',
      reportDate: endDate.toISOString(),
      preparedDate: new Date().toISOString(),
      companyInfo: {
        name: 'Công ty TNHH Thời Trang',
        taxCode: '0123456789',
        address: '123 Đường ABC, Quận XYZ, TP.HCM',
        legalRepresentative: 'Nguyễn Văn A',
      },
      balanceSheet,
      incomeStatement,
    };
  }
}
