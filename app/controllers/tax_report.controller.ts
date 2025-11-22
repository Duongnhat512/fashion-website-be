import { Request, Response } from 'express';
import { TaxReportService } from '../services/tax_report/implements/tax_report.service.implement';
import { TaxReportExportService } from '../services/tax_report/implements/tax_report_export.service.implement';
import { ApiResponse } from '../dtos/response/api.response.dto';

export class TaxReportController {
  private taxReportService: TaxReportService;
  private taxReportExportService: TaxReportExportService;

  constructor() {
    this.taxReportService = new TaxReportService();
    this.taxReportExportService = new TaxReportExportService();
  }

  // VAT Report
  getVatReport = async (req: Request, res: Response) => {
    try {
      const { month, quarter, year } = req.query;
      if (!year) {
        return res.status(400).json(ApiResponse.error('Year is required'));
      }

      const report = await this.taxReportService.generateVatReport(
        Number(year),
        month ? Number(month) : undefined,
        quarter ? Number(quarter) : undefined,
      );

      return res.status(200).json(ApiResponse.success('VAT Report', report));
    } catch (error) {
      return res.status(500).json(ApiResponse.error((error as Error).message));
    }
  };

  exportVatReport = async (req: Request, res: Response) => {
    try {
      const { month, quarter, year, format } = req.query;
      if (!year) {
        return res.status(400).json(ApiResponse.error('Year is required'));
      }

      const report = await this.taxReportService.generateVatReport(
        Number(year),
        month ? Number(month) : undefined,
        quarter ? Number(quarter) : undefined,
      );

      let buffer: Buffer;
      let filename: string;
      let contentType: string;

      if (format === 'excel') {
        buffer = await this.taxReportExportService.exportVatReportToExcel(
          report,
        );
        // Đổi tên file theo mẫu tờ khai
        filename = `To_Khai_Thue_GTGT_${year}${
          month ? `_Thang${month}` : quarter ? `_Quy${quarter}` : ''
        }.xlsx`;
        contentType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        buffer = await this.taxReportExportService.exportVatReportToPDF(report);
        filename = `To_Khai_Thue_GTGT_${year}${
          month ? `_Thang${month}` : quarter ? `_Quy${quarter}` : ''
        }.pdf`;
        contentType = 'application/pdf';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(buffer);
    } catch (error) {
      return res.status(500).json(ApiResponse.error((error as Error).message));
    }
  };

  // CIT Report
  getCitReport = async (req: Request, res: Response) => {
    try {
      const { quarter, year } = req.query;
      if (!year) {
        return res.status(400).json(ApiResponse.error('Year is required'));
      }

      const report = await this.taxReportService.generateCitReport(
        Number(year),
        quarter ? Number(quarter) : undefined,
      );

      return res.status(200).json(ApiResponse.success('CIT Report', report));
    } catch (error) {
      return res.status(500).json(ApiResponse.error((error as Error).message));
    }
  };

  exportCitReport = async (req: Request, res: Response) => {
    try {
      const { quarter, year, format } = req.query;
      if (!year) {
        return res.status(400).json(ApiResponse.error('Year is required'));
      }

      const report = await this.taxReportService.generateCitReport(
        Number(year),
        quarter ? Number(quarter) : undefined,
      );

      let buffer: Buffer;
      let filename: string;
      let contentType: string;

      if (format === 'excel') {
        buffer = await this.taxReportExportService.exportCitReportToExcel(
          report,
        );
        filename = `CIT_Report_${year}.xlsx`;
        contentType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        buffer = await this.taxReportExportService.exportCitReportToPDF(report);
        filename = `CIT_Report_${year}.pdf`;
        contentType = 'application/pdf';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(buffer);
    } catch (error) {
      return res.status(500).json(ApiResponse.error((error as Error).message));
    }
  };

  // Financial Report
  getFinancialReport = async (req: Request, res: Response) => {
    try {
      const { year } = req.query;
      if (!year) {
        return res.status(400).json(ApiResponse.error('Year is required'));
      }

      const report = await this.taxReportService.generateAnnualFinancialReport(
        Number(year),
      );

      return res
        .status(200)
        .json(ApiResponse.success('Financial Report', report));
    } catch (error) {
      return res.status(500).json(ApiResponse.error((error as Error).message));
    }
  };

  exportFinancialReport = async (req: Request, res: Response) => {
    try {
      const { year, format } = req.query;
      if (!year) {
        return res.status(400).json(ApiResponse.error('Year is required'));
      }

      const report = await this.taxReportService.generateAnnualFinancialReport(
        Number(year),
      );

      let buffer: Buffer;
      let filename: string;
      let contentType: string;

      if (format === 'excel') {
        buffer = await this.taxReportExportService.exportFinancialReportToExcel(
          report,
        );
        filename = `Financial_Report_${year}.xlsx`;
        contentType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        buffer = await this.taxReportExportService.exportFinancialReportToPDF(
          report,
        );
        filename = `Financial_Report_${year}.pdf`;
        contentType = 'application/pdf';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(buffer);
    } catch (error) {
      return res.status(500).json(ApiResponse.error((error as Error).message));
    }
  };
}
