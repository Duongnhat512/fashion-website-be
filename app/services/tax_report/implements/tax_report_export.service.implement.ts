import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import path from 'path';
import { ITaxReportExportService } from '../tax_report_export.service.interface';
import {
  VatReportResponseDto,
  CitReportResponseDto,
  PitReportResponseDto,
  AnnualFinancialReportDto,
} from '../../../dtos/response/tax_report';

const FONT_REGULAR_PATH = path.join(
  process.cwd(),
  'public/assets/fonts/Roboto-Regular.ttf',
);
const FONT_BOLD_PATH = path.join(
  process.cwd(),
  'public/assets/fonts/Roboto-Bold.ttf',
);

export class TaxReportExportService implements ITaxReportExportService {
  async exportVatReportToPDF(report: VatReportResponseDto): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margins: { top: 40, bottom: 40, left: 40, right: 40 }, // Giảm margin chút
        size: 'A4',
        autoFirstPage: true,
      });

      doc.registerFont('Roboto', FONT_REGULAR_PATH);
      doc.registerFont('Roboto-Bold', FONT_BOLD_PATH);

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // --- Helper vẽ đường kẻ ngang ---
      const drawLine = (y: number) => {
        doc
          .moveTo(40, y)
          .lineTo(555, y) // A4 width ~595, margin 40 -> right ~555
          .strokeColor('#000000')
          .lineWidth(0.5)
          .stroke();
      };

      // --- Helper vẽ row ---
      const drawRow = (
        col1: string,
        col2: string,
        col3: string,
        col4: string,
        isBold = false,
        isItalic = false,
      ) => {
        const y = doc.y;
        const cellPadding = 5;
        const col1X = 40;
        const col2X = 80;
        const col3X = 350;
        const col4X = 450;
        const width1 = 40;
        const width2 = 270;
        const width3 = 100;
        const width4 = 105;

        // Check page break
        if (y + 20 > doc.page.height - 40) {
          doc.addPage();
          return drawRow(col1, col2, col3, col4, isBold, isItalic); // Redraw on new page
        }

        doc.font(isBold ? 'Roboto-Bold' : 'Roboto').fontSize(10);

        // Vẽ nội dung
        doc.text(col1, col1X + cellPadding, y + cellPadding, {
          width: width1 - 2 * cellPadding,
        });
        doc.text(col2, col2X + cellPadding, y + cellPadding, {
          width: width2 - 2 * cellPadding,
        });
        doc.text(col3, col3X + cellPadding, y + cellPadding, {
          width: width3 - 2 * cellPadding,
          align: 'right',
        });
        doc.text(col4, col4X + cellPadding, y + cellPadding, {
          width: width4 - 2 * cellPadding,
          align: 'right',
        });

        // Tính chiều cao lớn nhất của dòng này (do text wrap)
        const height1 = doc.heightOfString(col1, {
          width: width1 - 2 * cellPadding,
        });
        const height2 = doc.heightOfString(col2, {
          width: width2 - 2 * cellPadding,
        });
        const height = Math.max(height1, height2, 20) + 2 * cellPadding;

        // Vẽ khung
        // Đường dọc
        doc
          .moveTo(col1X, y)
          .lineTo(col1X, y + height)
          .stroke();
        doc
          .moveTo(col2X, y)
          .lineTo(col2X, y + height)
          .stroke();
        doc
          .moveTo(col3X, y)
          .lineTo(col3X, y + height)
          .stroke();
        doc
          .moveTo(col4X, y)
          .lineTo(col4X, y + height)
          .stroke();
        doc
          .moveTo(555, y)
          .lineTo(555, y + height)
          .stroke(); // Line cuối

        // Đường ngang dưới
        drawLine(y + height);

        // Move con trỏ xuống dưới dòng vừa vẽ
        doc.y = y + height;
      };

      // ========== HEADER ==========
      doc
        .font('Roboto-Bold')
        .fontSize(11)
        .text('CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM', { align: 'center' });
      doc.fontSize(10).text('Độc lập - Tự do - Hạnh phúc', { align: 'center' });
      doc.moveDown();
      doc
        .fontSize(12)
        .text('TỜ KHAI THUẾ GIÁ TRỊ GIA TĂNG (GTGT)', { align: 'center' });
      doc
        .font('Roboto')
        .fontSize(10)
        .text(
          '(Dành cho người nộp thuế khai thuế GTGT theo phương pháp khấu trừ)',
          { align: 'center' },
        );
      doc.text('Mẫu số: 01/GTGT', { align: 'center' });
      doc.moveDown();
      doc
        .font('Roboto')
        .fontSize(9)
        .text(
          'Ban hành kèm theo Thông tư số 28/2011/TT-BTC ngày 28/02/2011 của Bộ Tài chính',
          { align: 'center' },
        )
        .moveDown();

      // ========== THÔNG TIN KỲ TÍNH THUẾ ==========
      const periodText = report.reportPeriod.month
        ? `Tháng ${report.reportPeriod.month} năm ${report.reportPeriod.year}`
        : report.reportPeriod.quarter
        ? `Quý ${report.reportPeriod.quarter} năm ${report.reportPeriod.year}`
        : `Năm ${report.reportPeriod.year}`;

      doc.font('Roboto').fontSize(11);
      doc.text(`[01] Kỳ tính thuế: ${periodText}`);
      doc.text('[02] Lần đầu [ ]');
      doc.text('[03] Bổ sung lần thứ [ ]');
      doc.moveDown();

      // ========== THÔNG TIN NGƯỜI NỘP THUẾ ==========
      doc.text(`[04] Tên người nộp thuế: ${report.companyInfo.name}`);
      doc.text(`[05] Mã số thuế: ${report.companyInfo.taxCode}`);
      doc.text(`[06] Địa chỉ: ${report.companyInfo.address || ''}`);
      doc.text('[07] Quận/huyện:');
      doc.text('[08] Tỉnh/thành phố:');
      doc.text(`[09] Điện thoại: ${report.companyInfo.phone || ''}`);
      doc.text('[10] Fax:');
      doc.text(`[11] E-mail: ${report.companyInfo.email || ''}`);
      doc.moveDown();

      // ========== THÔNG TIN ĐẠI LÝ THUẾ ==========
      doc.text('[12] Tên đại lý thuế (nếu có):');
      doc.text('[13] Mã số thuế:');
      doc.text('[14] Địa chỉ:');
      doc.text('[15] Quận/huyện:');
      doc.text('[16] Tỉnh/thành phố:');
      doc.text('[17] Điện thoại:');
      doc.text('[18] Fax:');
      doc.text('[19] E-mail:');
      doc.text(
        '[20] Hợp đồng đại lý thuế: Số: ................ Ngày: ................',
      );
      doc.moveDown();

      // ========== BẢNG KÊ KHAI ==========
      doc.font('Roboto-Bold').fontSize(11).text('BẢNG KÊ KHAI');
      doc.moveDown(0.5);

      const headerY = doc.y;
      drawLine(headerY); // Kẻ đường trên cùng
      drawRow(
        'STT',
        'Chỉ tiêu',
        'Giá trị HHDV\n(chưa có thuế)',
        'Thuế GTGT',
        true,
      );

      // Nội dung bảng

      // A
      drawRow(
        'A',
        'Không phát sinh hoạt động mua, bán trong kỳ (đánh dấu "X")',
        '',
        '',
      );

      // B
      const vatCarried = report.taxSummary.vatCarriedForward || 0;
      drawRow(
        'B',
        'Thuế GTGT còn được khấu trừ kỳ trước chuyển sang',
        '',
        this.formatNumber(vatCarried),
      );

      // C
      drawRow(
        'C',
        'Kê khai thuế GTGT phải nộp Ngân sách nhà nước',
        '',
        '',
        true,
      );

      // I
      drawRow('I', 'Hàng hoá, dịch vụ (HHDV) mua vào trong kỳ', '', '', true);

      const inNet = report.inputVat.totalNetCost;
      const inVat = report.inputVat.totalVatDeductible;
      drawRow(
        '1',
        'Giá trị và thuế GTGT của hàng hoá, dịch vụ mua vào',
        this.formatNumber(inNet),
        this.formatNumber(inVat),
      );

      drawRow(
        '2',
        'Tổng số thuế GTGT được khấu trừ kỳ này',
        '',
        this.formatNumber(inVat),
      );

      // II
      drawRow('II', 'Hàng hoá, dịch vụ bán ra trong kỳ', '', '', true);

      // 1. Không chịu thuế
      drawRow('1', 'Hàng hóa, dịch vụ bán ra không chịu thuế GTGT', '0', '');

      // 2. Chịu thuế
      drawRow('2', 'Hàng hóa, dịch vụ bán ra chịu thuế GTGT', '', '');

      const outputByRate = report.outputVat.summaryByRate || [];
      const rate0 = outputByRate.find((r) => r.rate === 0) || {
        netValue: 0,
        vatAmount: 0,
      };
      const rate5 = outputByRate.find((r) => r.rate === 5) || {
        netValue: 0,
        vatAmount: 0,
      };
      const rate10 = outputByRate.find((r) => r.rate === 10) || {
        netValue: 0,
        vatAmount: 0,
      };

      // a. 0%
      drawRow(
        'a',
        'Hàng hoá, dịch vụ bán ra chịu thuế suất 0%',
        this.formatNumber(rate0.netValue),
        this.formatNumber(rate0.vatAmount),
      );

      // b. 5%
      drawRow(
        'b',
        'Hàng hoá, dịch vụ bán ra chịu thuế suất 5%',
        this.formatNumber(rate5.netValue),
        this.formatNumber(rate5.vatAmount),
      );

      // c. 10%
      drawRow(
        'c',
        'Hàng hoá, dịch vụ bán ra chịu thuế suất 10%',
        this.formatNumber(rate10.netValue),
        this.formatNumber(rate10.vatAmount),
      );

      // Tổng chịu thuế
      const totalTaxableNet = rate0.netValue + rate5.netValue + rate10.netValue;
      const totalTaxableVat =
        rate0.vatAmount + rate5.vatAmount + rate10.vatAmount;

      drawRow(
        '',
        'Tổng doanh thu HHDV bán ra chịu thuế',
        this.formatNumber(totalTaxableNet),
        '',
        true,
      );

      drawRow(
        '',
        'Tổng thuế GTGT HHDV bán ra',
        '',
        this.formatNumber(totalTaxableVat),
        true,
      );

      // 3. Tổng doanh thu
      const outNet = report.outputVat.totalNetRevenue;
      const outVat = report.outputVat.totalVatAmount;
      drawRow(
        '3',
        'Tổng doanh thu và thuế GTGT của HHDV bán ra',
        this.formatNumber(outNet),
        this.formatNumber(outVat),
        true,
      );

      // III. Thuế phát sinh
      const vatArising = outVat - inVat;
      drawRow(
        'III',
        'Thuế GTGT phát sinh trong kỳ',
        '',
        this.formatNumber(vatArising),
        true,
      );

      // IV. Điều chỉnh tăng, giảm thuế GTGT của các kỳ trước
      const adjustmentIncrease = report.taxSummary.vatAdjustment?.increase || 0;
      const adjustmentDecrease = report.taxSummary.vatAdjustment?.decrease || 0;
      drawRow(
        'IV',
        'Điều chỉnh tăng, giảm thuế GTGT của các kỳ trước',
        '',
        '',
        true,
      );
      drawRow(
        '1',
        'Điều chỉnh tăng thuế GTGT của các kỳ trước',
        '',
        this.formatNumber(adjustmentIncrease),
      );
      drawRow(
        '2',
        'Điều chỉnh giảm thuế GTGT của các kỳ trước',
        '',
        this.formatNumber(adjustmentDecrease),
      );

      // V. Tổng số thuế GTGT đã nộp
      const vatPaid = 0; // Cần lấy từ dữ liệu thực tế
      drawRow(
        'V',
        'Tổng số thuế GTGT đã nộp của doanh thu kinh doanh xây dựng, lắp đặt, bán hàng vãng lai ngoại tỉnh',
        '',
        this.formatNumber(vatPaid),
        true,
      );

      // VI. Xác định nghĩa vụ thuế GTGT phải nộp trong kỳ
      drawRow(
        'VI',
        'Xác định nghĩa vụ thuế GTGT phải nộp trong kỳ:',
        '',
        '',
        true,
      );

      // 1. Thuế GTGT phải nộp của hoạt động SXKD trong kỳ
      const vatPayableSXKD =
        vatArising -
        vatCarried +
        adjustmentIncrease -
        adjustmentDecrease -
        vatPaid;
      const vatPayableSXKDValue = vatPayableSXKD > 0 ? vatPayableSXKD : 0;
      drawRow(
        '1',
        'Thuế GTGT phải nộp của hoạt động SXKD trong kỳ',
        '',
        this.formatNumber(vatPayableSXKDValue),
      );

      // 2. Thuế GTGT mua vào của dự án đầu tư được bù trừ
      const vatOffset = 0; // Cần lấy từ dữ liệu thực tế
      drawRow(
        '2',
        'Thuế GTGT mua vào của dự án đầu tư được bù trừ',
        '',
        this.formatNumber(vatOffset),
      );

      // 3. Thuế GTGT còn phải nộp trong kỳ
      const vatRemainingPayable = vatPayableSXKDValue - vatOffset;
      drawRow(
        '3',
        'Thuế GTGT còn phải nộp trong kỳ',
        '',
        this.formatNumber(vatRemainingPayable),
      );

      // 4. Thuế GTGT chưa khấu trừ hết kỳ này
      const vatNotDeducted = vatPayableSXKD < 0 ? Math.abs(vatPayableSXKD) : 0;
      drawRow(
        '4',
        'Thuế GTGT chưa khấu trừ hết kỳ này',
        '',
        this.formatNumber(vatNotDeducted),
      );

      // 4.1. Thuế GTGT đề nghị hoàn
      const vatRequestRefund = 0; // Cần lấy từ dữ liệu thực tế
      drawRow(
        '4.1',
        'Thuế GTGT đề nghị hoàn',
        '',
        this.formatNumber(vatRequestRefund),
      );

      // 4.2. Thuế GTGT còn được khấu trừ chuyển kỳ sau
      const vatCarryForwardNext = vatNotDeducted - vatRequestRefund;
      drawRow(
        '4.2',
        'Thuế GTGT còn được khấu trừ chuyển kỳ sau',
        '',
        this.formatNumber(vatCarryForwardNext),
      );

      doc.moveDown(2);

      // ========== CAM ĐOAN ==========
      doc
        .font('Roboto')
        .fontSize(10)
        .text(
          'Tôi cam đoan số liệu khai trên là đúng và chịu trách nhiệm trước pháp luật về những số liệu đã khai.',
          50,
          doc.y - 10,
        );
      doc.moveDown();

      const signY = doc.y;
      if (signY > doc.page.height - 150) {
        doc.addPage();
      }

      doc.font('Roboto-Bold').text('NHÂN VIÊN ĐẠI LÝ THUẾ', 50, doc.y, {
        width: 200,
        align: 'center',
      });
      doc
        .font('Roboto-Bold')
        .text(
          'NGƯỜI NỘP THUẾ hoặc\nĐẠI DIỆN HỢP PHÁP CỦA NGƯỜI NỘP THUẾ',
          300,
          doc.y - 10,
          { width: 250, align: 'center' },
        );

      doc
        .font('Roboto')
        .text(
          'Họ và tên:...........................................',
          50,
          doc.y + 30,
        );
      doc.text('Chứng chỉ hành nghề số:...................', 50, doc.y + 15);

      doc.text(
        'Ký, ghi rõ họ tên; chức vụ và đóng dấu (nếu có)',
        300,
        doc.y - 30,
        { width: 250, align: 'center' },
      );

      doc.end();
    });
  }

  async exportVatReportToExcel(report: VatReportResponseDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('To Khai Thue GTGT');

    // ========== HEADER ==========
    sheet.addRow(['CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM']);
    sheet.addRow(['Độc lập - Tự do - Hạnh phúc']);
    sheet.addRow([]);
    sheet.addRow(['TỜ KHAI THUẾ GIÁ TRỊ GIA TĂNG (GTGT)']);
    sheet.addRow([
      '(Dành cho người nộp thuế khai thuế GTGT theo phương pháp khấu trừ)',
    ]);
    sheet.addRow(['Mẫu số: 01/GTGT']);
    sheet.addRow([
      'Ban hành kèm theo Thông tư số 28/2011/TT-BTC ngày 28/02/2011 của Bộ Tài chính',
    ]);
    sheet.addRow([]);

    // ========== THÔNG TIN KỲ TÍNH THUẾ ==========
    const periodText = report.reportPeriod.month
      ? `Tháng ${report.reportPeriod.month} năm ${report.reportPeriod.year}`
      : report.reportPeriod.quarter
      ? `Quý ${report.reportPeriod.quarter} năm ${report.reportPeriod.year}`
      : `Năm ${report.reportPeriod.year}`;

    sheet.addRow(['[01] Kỳ tính thuế:', periodText]);
    sheet.addRow(['[02] Lần đầu [ ]']);
    sheet.addRow(['[03] Bổ sung lần thứ [ ]']);
    sheet.addRow([]);

    // ========== THÔNG TIN NGƯỜI NỘP THUẾ ==========
    sheet.addRow(['[04] Tên người nộp thuế:', report.companyInfo.name]);
    sheet.addRow(['[05] Mã số thuế:', report.companyInfo.taxCode]);
    sheet.addRow(['[06] Địa chỉ:', report.companyInfo.address || '']);
    sheet.addRow(['[07] Quận/huyện:', '']); // Cần bổ sung vào DTO
    sheet.addRow(['[08] Tỉnh/thành phố:', '']); // Cần bổ sung vào DTO
    sheet.addRow(['[09] Điện thoại:', report.companyInfo.phone || '']);
    sheet.addRow(['[10] Fax:', '']); // Cần bổ sung vào DTO
    sheet.addRow(['[11] E-mail:', report.companyInfo.email || '']);
    sheet.addRow([]);

    // ========== THÔNG TIN ĐẠI LÝ THUẾ (NẾU CÓ) ==========
    sheet.addRow(['[12] Tên đại lý thuế (nếu có):', '']);
    sheet.addRow(['[13] Mã số thuế:', '']);
    sheet.addRow(['[14] Địa chỉ:', '']);
    sheet.addRow(['[15] Quận/huyện:', '']);
    sheet.addRow(['[16] Tỉnh/thành phố:', '']);
    sheet.addRow(['[17] Điện thoại:', '']);
    sheet.addRow(['[18] Fax:', '']);
    sheet.addRow(['[19] E-mail:', '']);
    sheet.addRow(['[20] Hợp đồng đại lý thuế: Số:', 'Ngày:', '']);
    sheet.addRow([]);

    // ========== BẢNG KÊ KHAI ==========
    sheet.addRow([
      'STT',
      'Chỉ tiêu',
      'Giá trị HHDV (chưa có thuế GTGT)',
      'Thuế GTGT',
    ]);
    sheet.addRow(['', '', '(đồng Việt Nam)', '(đồng Việt Nam)']);

    // A. Không phát sinh hoạt động
    sheet.addRow([
      'A',
      'Không phát sinh hoạt động mua, bán trong kỳ (đánh dấu "X")',
      '',
      '',
    ]);

    // B. Thuế GTGT còn được khấu trừ kỳ trước
    const vatCarriedForward = report.taxSummary.vatCarriedForward || 0;
    sheet.addRow([
      'B',
      'Thuế GTGT còn được khấu trừ kỳ trước chuyển sang',
      '',
      this.formatNumber(vatCarriedForward),
    ]);

    // C. Kê khai thuế GTGT phải nộp
    sheet.addRow([
      'C',
      'Kê khai thuế GTGT phải nộp Ngân sách nhà nước',
      '',
      '',
    ]);

    // I. Hàng hóa, dịch vụ mua vào
    sheet.addRow(['I', 'Hàng hoá, dịch vụ (HHDV) mua vào trong kỳ', '', '']);

    // 1. Giá trị và thuế GTGT của HHDV mua vào
    const inputNetValue = report.inputVat.totalNetCost;
    const inputVatAmount = report.inputVat.totalVatDeductible;
    sheet.addRow([
      '1',
      'Giá trị và thuế GTGT của hàng hoá, dịch vụ mua vào',
      this.formatNumber(inputNetValue),
      this.formatNumber(inputVatAmount),
    ]);

    // 2. Tổng số thuế GTGT được khấu trừ kỳ này
    sheet.addRow([
      '2',
      'Tổng số thuế GTGT được khấu trừ kỳ này',
      '',
      this.formatNumber(inputVatAmount),
    ]);

    // II. Hàng hóa, dịch vụ bán ra
    sheet.addRow(['II', 'Hàng hoá, dịch vụ bán ra trong kỳ', '', '']);

    // 1. HHDV bán ra không chịu thuế GTGT
    const nonTaxableRevenue = 0; // Cần tính từ dữ liệu thực tế
    sheet.addRow([
      '1',
      'Hàng hóa, dịch vụ bán ra không chịu thuế GTGT',
      this.formatNumber(nonTaxableRevenue),
      '',
    ]);

    // 2. HHDV bán ra chịu thuế GTGT
    sheet.addRow(['2', 'Hàng hóa, dịch vụ bán ra chịu thuế GTGT', '', '']);

    // Tính toán theo từng mức thuế suất
    const outputByRate = report.outputVat.summaryByRate || [];
    const rate0 = outputByRate.find((r) => r.rate === 0) || {
      netValue: 0,
      vatAmount: 0,
    };
    const rate5 = outputByRate.find((r) => r.rate === 5) || {
      netValue: 0,
      vatAmount: 0,
    };
    const rate10 = outputByRate.find((r) => r.rate === 10) || {
      netValue: 0,
      vatAmount: 0,
    };

    // a. Thuế suất 0%
    sheet.addRow([
      'a',
      'Hàng hoá, dịch vụ bán ra chịu thuế suất 0%',
      this.formatNumber(rate0.netValue),
      this.formatNumber(rate0.vatAmount),
    ]);

    // b. Thuế suất 5%
    sheet.addRow([
      'b',
      'Hàng hoá, dịch vụ bán ra chịu thuế suất 5%',
      this.formatNumber(rate5.netValue),
      this.formatNumber(rate5.vatAmount),
    ]);

    // c. Thuế suất 10%
    sheet.addRow([
      'c',
      'Hàng hoá, dịch vụ bán ra chịu thuế suất 10%',
      this.formatNumber(rate10.netValue),
      this.formatNumber(rate10.vatAmount),
    ]);

    // Tổng giá trị và thuế GTGT bán ra chịu thuế
    const totalTaxableNetValue =
      rate0.netValue + rate5.netValue + rate10.netValue;
    const totalTaxableVat =
      rate0.vatAmount + rate5.vatAmount + rate10.vatAmount;
    sheet.addRow(['', 'Tổng', this.formatNumber(totalTaxableNetValue), '']);
    sheet.addRow(['', 'Tổng', '', this.formatNumber(totalTaxableVat)]);

    // 3. Tổng doanh thu và thuế GTGT của HHDV bán ra
    const totalOutputNetValue = report.outputVat.totalNetRevenue;
    const totalOutputVat = report.outputVat.totalVatAmount;
    sheet.addRow([
      '3',
      'Tổng doanh thu và thuế GTGT của HHDV bán ra',
      this.formatNumber(totalOutputNetValue),
      this.formatNumber(totalOutputVat),
    ]);

    // III. Thuế GTGT phát sinh trong kỳ
    const vatArising = totalOutputVat - inputVatAmount;
    sheet.addRow([
      'III',
      'Thuế GTGT phát sinh trong kỳ',
      '',
      this.formatNumber(vatArising),
    ]);

    // IV. Điều chỉnh tăng, giảm thuế GTGT của các kỳ trước
    sheet.addRow([
      'IV',
      'Điều chỉnh tăng, giảm thuế GTGT của các kỳ trước',
      '',
      '',
    ]);
    const adjustmentIncrease = report.taxSummary.vatAdjustment?.increase || 0;
    const adjustmentDecrease = report.taxSummary.vatAdjustment?.decrease || 0;
    sheet.addRow([
      '1',
      'Điều chỉnh tăng thuế GTGT của các kỳ trước',
      '',
      this.formatNumber(adjustmentIncrease),
    ]);
    sheet.addRow([
      '2',
      'Điều chỉnh giảm thuế GTGT của các kỳ trước',
      '',
      this.formatNumber(adjustmentDecrease),
    ]);

    // V. Tổng số thuế GTGT đã nộp
    const vatPaid = 0; // Cần lấy từ dữ liệu thực tế
    sheet.addRow([
      'V',
      'Tổng số thuế GTGT đã nộp của doanh thu kinh doanh xây dựng, lắp đặt, bán hàng vãng lai ngoại tỉnh',
      '',
      this.formatNumber(vatPaid),
    ]);

    // VI. Xác định nghĩa vụ thuế GTGT phải nộp trong kỳ
    sheet.addRow([
      'VI',
      'Xác định nghĩa vụ thuế GTGT phải nộp trong kỳ:',
      '',
      '',
    ]);

    // 1. Thuế GTGT phải nộp của hoạt động SXKD trong kỳ
    const vatPayableSXKD =
      vatArising -
      vatCarriedForward +
      adjustmentIncrease -
      adjustmentDecrease -
      vatPaid;
    const vatPayableSXKDValue = vatPayableSXKD > 0 ? vatPayableSXKD : 0;
    sheet.addRow([
      '1',
      'Thuế GTGT phải nộp của hoạt động SXKD trong kỳ',
      '',
      this.formatNumber(vatPayableSXKDValue),
    ]);

    // 2. Thuế GTGT mua vào của dự án đầu tư được bù trừ
    const vatOffset = 0; // Cần lấy từ dữ liệu thực tế
    sheet.addRow([
      '2',
      'Thuế GTGT mua vào của dự án đầu tư được bù trừ',
      '',
      this.formatNumber(vatOffset),
    ]);

    // 3. Thuế GTGT còn phải nộp trong kỳ
    const vatRemainingPayable = vatPayableSXKDValue - vatOffset;
    sheet.addRow([
      '3',
      'Thuế GTGT còn phải nộp trong kỳ',
      '',
      this.formatNumber(vatRemainingPayable),
    ]);

    // 4. Thuế GTGT chưa khấu trừ hết kỳ này
    const vatNotDeducted = vatPayableSXKD < 0 ? Math.abs(vatPayableSXKD) : 0;
    sheet.addRow([
      '4',
      'Thuế GTGT chưa khấu trừ hết kỳ này',
      '',
      this.formatNumber(vatNotDeducted),
    ]);

    // 4.1. Thuế GTGT đề nghị hoàn
    const vatRequestRefund = 0; // Cần lấy từ dữ liệu thực tế
    sheet.addRow([
      '4.1',
      'Thuế GTGT đề nghị hoàn',
      '',
      this.formatNumber(vatRequestRefund),
    ]);

    // 4.2. Thuế GTGT còn được khấu trừ chuyển kỳ sau
    const vatCarryForwardNext = vatNotDeducted - vatRequestRefund;
    sheet.addRow([
      '4.2',
      'Thuế GTGT còn được khấu trừ chuyển kỳ sau',
      '',
      this.formatNumber(vatCarryForwardNext),
    ]);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportCitReportToPDF(report: CitReportResponseDto): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      doc.registerFont('Roboto', FONT_REGULAR_PATH);
      doc.registerFont('Roboto-Bold', FONT_BOLD_PATH);

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc
        .font('Roboto-Bold')
        .fontSize(16)
        .text('BÁO CÁO THUẾ THU NHẬP DOANH NGHIỆP (TNDN)', { align: 'center' });
      doc.moveDown();

      doc.font('Roboto').fontSize(12);
      doc.text(
        `Doanh thu bán hàng: ${this.formatCurrency(
          report.revenue.salesRevenue,
        )}`,
      );
      doc.text(
        `Chi phí được trừ: ${this.formatCurrency(
          report.expenses.totalDeductibleExpenses,
        )}`,
      );
      doc.text(
        `Lợi nhuận trước thuế: ${this.formatCurrency(
          report.taxCalculation.profitBeforeTax,
        )}`,
      );
      doc.text(
        `Thuế TNDN phải nộp: ${this.formatCurrency(
          report.taxCalculation.citAmount,
        )}`,
      );

      doc.end();
    });
  }

  async exportCitReportToExcel(report: CitReportResponseDto): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Bao Cao TNDN');

    sheet.addRow(['BÁO CÁO THUẾ TNDN']);
    sheet.addRow([`Năm: ${report.period.year}`]);
    sheet.addRow([]);

    sheet.addRow(['Chỉ tiêu', 'Số tiền']);
    sheet.addRow(['Doanh thu', report.revenue.totalRevenue]);
    sheet.addRow(['Chi phí', report.expenses.totalDeductibleExpenses]);
    sheet.addRow([
      'Lợi nhuận trước thuế',
      report.taxCalculation.profitBeforeTax,
    ]);
    sheet.addRow(['Thuế TNDN phải nộp', report.taxCalculation.citAmount]);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportPitReportToPDF(report: PitReportResponseDto): Promise<Buffer> {
    return Buffer.from('Not implemented');
  }

  async exportPitReportToExcel(report: PitReportResponseDto): Promise<Buffer> {
    return Buffer.from('Not implemented');
  }

  async exportFinancialReportToPDF(
    report: AnnualFinancialReportDto,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      doc.registerFont('Roboto', FONT_REGULAR_PATH);
      doc.registerFont('Roboto-Bold', FONT_BOLD_PATH);

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc
        .font('Roboto-Bold')
        .fontSize(16)
        .text('BÁO CÁO TÀI CHÍNH NĂM', { align: 'center' });
      doc.moveDown();

      doc.text('I. BẢNG CÂN ĐỐI KẾ TOÁN');
      doc.font('Roboto').fontSize(12);
      doc.text(
        `Tổng tài sản: ${this.formatCurrency(
          report.balanceSheet.assets.totalAssets,
        )}`,
      );
      doc.text(
        `Tổng nguồn vốn: ${this.formatCurrency(
          report.balanceSheet.resources.totalResources,
        )}`,
      );
      doc.moveDown();

      doc.font('Roboto-Bold').text('II. KẾT QUẢ KINH DOANH');
      doc.font('Roboto');
      doc.text(
        `Doanh thu thuần: ${this.formatCurrency(
          report.incomeStatement.netRevenue,
        )}`,
      );
      doc.text(
        `Lợi nhuận sau thuế: ${this.formatCurrency(
          report.incomeStatement.profitAfterTax,
        )}`,
      );

      doc.end();
    });
  }

  async exportFinancialReportToExcel(
    report: AnnualFinancialReportDto,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('BCTC');
    sheet.addRow(['BÁO CÁO TÀI CHÍNH NĂM ' + report.fiscalYear]);
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(Math.round(value));
  }

  /**
   * Vẽ viền cho bảng kê khai
   */
  private drawTableBorder(
    doc: PDFKit.PDFDocument,
    x: number,
    y: number,
    width: number,
    height: number,
    col1Width: number,
    col2Width: number,
    col3Width: number,
    col4Width: number,
    tableTop: number,
    tableBottom: number,
  ): void {
    const lineWidth = 0.5;
    const endX = x + width;
    const endY = y + height;

    // Vẽ viền ngoài
    doc
      .lineWidth(lineWidth)
      .moveTo(x, y)
      .lineTo(endX, y) // Top border
      .moveTo(x, endY)
      .lineTo(endX, endY) // Bottom border
      .moveTo(x, y)
      .lineTo(x, endY) // Left border
      .moveTo(endX, y)
      .lineTo(endX, endY) // Right border
      .stroke();

    // Vẽ đường phân cách cột (dọc)
    const col1End = x + col1Width;
    const col2End = col1End + col2Width;
    const col3End = col2End + col3Width;

    doc
      .moveTo(col1End, y)
      .lineTo(col1End, endY) // Cột 1-2
      .moveTo(col2End, y)
      .lineTo(col2End, endY) // Cột 2-3
      .moveTo(col3End, y)
      .lineTo(col3End, endY) // Cột 3-4
      .stroke();

    // Vẽ đường ngang sau header (sau dòng tiêu đề)
    const headerBottom = tableTop + 20;
    doc.moveTo(x, headerBottom).lineTo(endX, headerBottom).stroke();
  }
}
