import {
  VatReportResponseDto,
  CitReportResponseDto,
  PitReportResponseDto,
  AnnualFinancialReportDto,
} from '../../dtos/response/tax_report';

export interface ITaxReportService {
  /**
   * Generate VAT report for a specific period
   */
  generateVatReport(
    year: number,
    month?: number,
    quarter?: number,
    vatRate?: number,
  ): Promise<VatReportResponseDto>;

  /**
   * Generate CIT report (quarterly or annual)
   */
  generateCitReport(
    year: number,
    quarter?: number,
    isAnnual?: boolean,
  ): Promise<CitReportResponseDto>;

  /**
   * Generate PIT report for employees
   */
  generatePitReport(
    year: number,
    month?: number,
    quarter?: number,
  ): Promise<PitReportResponseDto>;

  /**
   * Generate annual financial statement
   */
  generateAnnualFinancialReport(
    year: number,
  ): Promise<AnnualFinancialReportDto>;
}
