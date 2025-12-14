import PDFDocument from 'pdfkit';
import { IInvoiceService } from '../invoice.service.interface';
import { OrderResponseDto } from '../../../dtos/response/order/order.response';
import { PassThrough } from 'stream';
import path from 'path';
import { config } from '../../../config/env';

const FONT_REGULAR_PATH = path.join(
  process.cwd(),
  'public/assets/fonts/Roboto-Regular.ttf',
);
const FONT_BOLD_PATH = path.join(
  process.cwd(),
  'public/assets/fonts/Roboto-Bold.ttf',
);

export class InvoiceService implements IInvoiceService {
  async generateInvoicePDF(order: OrderResponseDto): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margins: { top: 50, bottom: 0, left: 50, right: 50 },
        size: 'A4',
      });

      doc.registerFont('Roboto', FONT_REGULAR_PATH);
      doc.registerFont('Roboto-Bold', FONT_BOLD_PATH);

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.generateInvoiceContent(doc, order);
      doc.end();
    });
  }

  generateInvoicePDFStream(order: OrderResponseDto): NodeJS.ReadableStream {
    const doc = new PDFDocument({
      margins: { top: 50, bottom: 0, left: 50, right: 50 },
      size: 'A4',
    });
    const stream = new PassThrough();

    doc.registerFont('Roboto', FONT_REGULAR_PATH);
    doc.registerFont('Roboto-Bold', FONT_BOLD_PATH);

    doc.pipe(stream);
    this.generateInvoiceContent(doc, order);
    doc.end();

    return stream;
  }

  async generateBatchInvoicesPDF(orders: OrderResponseDto[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        margins: { top: 50, bottom: 0, left: 50, right: 50 },
        size: 'A4',
      });

      doc.registerFont('Roboto', FONT_REGULAR_PATH);
      doc.registerFont('Roboto-Bold', FONT_BOLD_PATH);

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      orders.forEach((order, index) => {
        if (index > 0) {
          doc.addPage();
        }
        this.generateInvoiceContent(doc, order);
      });

      doc.end();
    });
  }

  generateBatchInvoicesPDFStream(
    orders: OrderResponseDto[],
  ): NodeJS.ReadableStream {
    const doc = new PDFDocument({
      margins: { top: 50, bottom: 0, left: 50, right: 50 },
      size: 'A4',
    });
    const stream = new PassThrough();

    doc.registerFont('Roboto', FONT_REGULAR_PATH);
    doc.registerFont('Roboto-Bold', FONT_BOLD_PATH);

    doc.pipe(stream);

    orders.forEach((order, index) => {
      if (index > 0) {
        doc.addPage();
      }
      this.generateInvoiceContent(doc, order);
    });

    doc.end();

    return stream;
  }

  private generateInvoiceContent(
    doc: typeof PDFDocument,
    order: OrderResponseDto,
  ): void {
    doc
      .fontSize(24)
      .font('Roboto-Bold')
      .text('HÓA ĐƠN ĐIỆN TỬ', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(10)
      .font('Roboto')
      .text(config.companyInfo.name, { align: 'center' })
      .text(`Địa chỉ: ${config.companyInfo.address}`, { align: 'center' })
      .text(
        `Điện thoại: ${config.companyInfo.phone} | Email: ${config.companyInfo.email}`,
        {
          align: 'center',
        },
      )
      .moveDown(1);

    doc
      .fontSize(12)
      .font('Roboto-Bold')
      .text(`Mã đơn hàng: ${order.id}`, { continued: false })
      .font('Roboto')
      .text(`Ngày tạo: ${this.formatDate(order.createdAt)}`, { align: 'right' })
      .moveDown(0.5);

    doc
      .fontSize(14)
      .font('Roboto-Bold')
      .text('Thông tin khách hàng', { underline: true })
      .moveDown(0.3);

    doc
      .fontSize(11)
      .font('Roboto')
      .text(`Tên khách hàng: ${order.user.fullname}`)
      .text(`Email: ${order.user.email}`)
      .text(`Số điện thoại: ${order.user.phone || 'N/A'}`)
      .moveDown(0.5);

    if (order.address) {
      doc
        .fontSize(14)
        .font('Roboto-Bold')
        .text('Địa chỉ giao hàng', { underline: true })
        .moveDown(0.3);

      doc
        .fontSize(11)
        .font('Roboto')
        .text(`Người nhận: ${order.address.fullName}`)
        .text(`Số điện thoại: ${order.address.phone}`)
        .text(`Địa chỉ: ${order.address.fullAddress}`)
        .text(
          `${order.address.ward}, ${order.address.district}, ${order.address.city}`,
        )
        .moveDown(0.5);
    }

    doc
      .fontSize(14)
      .font('Roboto-Bold')
      .text('Chi tiết đơn hàng', { underline: true })
      .moveDown(0.5);

    const tableTop = doc.y;
    const itemHeight = 30;
    const tableLeft = 50;
    const tableWidth = 500;

    doc
      .fontSize(10)
      .font('Roboto-Bold')
      .text('STT', tableLeft, tableTop, { width: 30 })
      .text('Sản phẩm', tableLeft + 40, tableTop, { width: 200 })
      .text('Số lượng', tableLeft + 250, tableTop, {
        width: 60,
        align: 'center',
      })
      .text('Đơn giá', tableLeft + 320, tableTop, {
        width: 80,
        align: 'right',
      })
      .text('Thành tiền', tableLeft + 410, tableTop, {
        width: 90,
        align: 'right',
      });

    let yPosition = tableTop + 20;
    order.items.forEach((item, index) => {
      const productName = item.product?.name || 'N/A';
      let variantInfo = '';
      if (item.variant) {
        const colorName = item.variant.color?.name || '';
        const size = item.variant.size || '';
        if (colorName || size) {
          variantInfo = `(${colorName}${colorName && size ? ', ' : ''}${
            size ? `Size: ${size}` : ''
          })`;
        }
      }
      const fullProductName = `${productName} ${variantInfo}`.trim();

      doc
        .fontSize(9)
        .font('Roboto')
        .text(`${index + 1}`, tableLeft, yPosition, { width: 30 })
        .text(fullProductName, tableLeft + 40, yPosition, {
          width: 200,
          ellipsis: true,
        })
        .text(`${item.quantity}`, tableLeft + 250, yPosition, {
          width: 60,
          align: 'center',
        })
        .text(this.formatCurrency(item.rate), tableLeft + 320, yPosition, {
          width: 80,
          align: 'right',
        })
        .text(this.formatCurrency(item.amount), tableLeft + 410, yPosition, {
          width: 90,
          align: 'right',
        });

      yPosition += itemHeight;
    });

    const summaryY = yPosition + 10;
    doc
      .fontSize(11)
      .font('Roboto')
      .text('Tạm tính:', tableLeft + 320, summaryY, {
        width: 80,
        align: 'right',
      })
      .text(this.formatCurrency(order.subTotal), tableLeft + 410, summaryY, {
        width: 90,
        align: 'right',
      });

    if (order.discount > 0) {
      doc
        .text(`Giảm giá:`, tableLeft + 320, summaryY + 20, {
          width: 80,
          align: 'right',
        })
        .text(
          this.formatCurrency(order.discount),
          tableLeft + 410,
          summaryY + 20,
          {
            width: 90,
            align: 'right',
          },
        );
    }

    doc
      .text('Phí vận chuyển:', tableLeft + 320, summaryY + 40, {
        width: 80,
        align: 'right',
      })
      .text(
        this.formatCurrency(order.shippingFee),
        tableLeft + 410,
        summaryY + 40,
        {
          width: 90,
          align: 'right',
        },
      );

    doc
      .fontSize(12)
      .font('Roboto-Bold')
      .text('Tổng cộng:', tableLeft + 320, summaryY + 60, {
        width: 80,
        align: 'right',
      })
      .text(
        this.formatCurrency(order.totalAmount),
        tableLeft + 410,
        summaryY + 60,
        {
          width: 90,
          align: 'right',
        },
      );

    const pageHeight = doc.page.height;
    const pageWidth = doc.page.width;

    doc
      .moveDown(1.5)
      .fontSize(11)
      .font('Roboto')
      .text('Phương thức thanh toán:', tableLeft + 220, summaryY + 80, {
        width: 180,
        align: 'right',
      })
      .text(
        order.isCOD ? 'COD' : 'Chuyển khoản',
        tableLeft + 410,
        summaryY + 80,
        {
          width: 90,
          align: 'right',
        },
      );

    doc
      .text('Trạng thái:', tableLeft + 220, summaryY + 100, {
        width: 180,
        align: 'right',
      })
      .text(this.getStatusText(order.status), tableLeft + 410, summaryY + 100, {
        width: 90,
        align: 'right',
      });

    const currentY = doc.y;
    const marginBottom = 50;

    const footerY = Math.max(currentY + 30, pageHeight - marginBottom);

    doc
      .fontSize(9)
      .font('Roboto')
      .text(
        'Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của chúng tôi!',
        150,
        footerY,
        {
          width: pageWidth - 100,
          align: 'center',
        },
      )
      .text('Hóa đơn này được tạo tự động bởi hệ thống.', 150, footerY + 15, {
        width: pageWidth - 100,
        align: 'center',
      });
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  }

  private getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      unpaid: 'Chưa thanh toán',
      pending: 'Đang chờ xử lý',
      ready_to_ship: 'Sẵn sàng giao hàng',
      shipping: 'Đang giao hàng',
      delivered: 'Đã giao hàng',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };
    return statusMap[status] || status;
  }
}
