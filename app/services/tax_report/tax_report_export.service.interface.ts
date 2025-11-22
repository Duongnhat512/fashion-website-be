import {
  VatReportResponseDto,
  CitReportResponseDto,
  PitReportResponseDto,
  AnnualFinancialReportDto,
} from '../../dtos/response/tax_report';

export interface ITaxReportExportService {
  /**
   * Export VAT report to PDF
   */
  exportVatReportToPDF(report: VatReportResponseDto): Promise<Buffer>;

  /**
   * Export VAT report to Excel
   */
  exportVatReportToExcel(report: VatReportResponseDto): Promise<Buffer>;

  /**
   * Export CIT report to PDF
   */
  exportCitReportToPDF(report: CitReportResponseDto): Promise<Buffer>;

  /**
   * Export CIT report to Excel
   */
  exportCitReportToExcel(report: CitReportResponseDto): Promise<Buffer>;

  /**
   * Export PIT report to PDF
   */
  exportPitReportToPDF(report: PitReportResponseDto): Promise<Buffer>;

  /**
   * Export PIT report to Excel
   */
  exportPitReportToExcel(report: PitReportResponseDto): Promise<Buffer>;

  /**
   * Export Annual Financial Report to PDF
   */
  exportFinancialReportToPDF(report: AnnualFinancialReportDto): Promise<Buffer>;

  /**
   * Export Annual Financial Report to Excel
   */
  exportFinancialReportToExcel(
    report: AnnualFinancialReportDto,
  ): Promise<Buffer>;
}
