import { Request, Response } from 'express';
import { InvoiceService } from '../services/invoice/implements/invoice.service.implement';
import { OrderService } from '../services/order/implements/order.service.implement';
import { ApiResponse } from '../dtos/response/api.response.dto';

export class InvoiceController {
  private readonly invoiceService: InvoiceService;
  private readonly orderService: OrderService;

  constructor() {
    this.invoiceService = new InvoiceService();
    this.orderService = new OrderService();
  }

  generateInvoice = async (req: Request, res: Response) => {
    try {
      const orderId = req.params.id;
      const order = await this.orderService.getOrderById(orderId);

      if (!order) {
        return res
          .status(404)
          .json(ApiResponse.error('Không tìm thấy đơn hàng'));
      }

      // Check if order is completed or delivered
      if (
        order.status !== 'delivered' &&
        order.status !== 'completed' &&
        order.status !== 'shipping' &&
        order.status !== 'pending'
      ) {
        return res
          .status(400)
          .json(
            ApiResponse.error('Trạng thái hóa đơn không hợp lệ để tạo hóa đơn'),
          );
      }

      const pdfBuffer = await this.invoiceService.generateInvoicePDF(order);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="hoa-don-${order.id}.pdf"`,
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json(ApiResponse.error((error as Error).message));
    }
  };

  downloadInvoice = async (req: Request, res: Response) => {
    try {
      const orderId = req.params.id;
      const order = await this.orderService.getOrderById(orderId);

      if (!order) {
        return res
          .status(404)
          .json(ApiResponse.error('Không tìm thấy đơn hàng'));
      }

      // Check if order is completed or delivered
      if (
        order.status !== 'delivered' &&
        order.status !== 'completed' &&
        order.status !== 'shipping' &&
        order.status !== 'pending'
      ) {
        return res
          .status(400)
          .json(
            ApiResponse.error('Trạng thái hóa đơn không hợp lệ để tạo hóa đơn'),
          );
      }

      const pdfStream = this.invoiceService.generateInvoicePDFStream(order);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="hoa-don-${order.id}.pdf"`,
      );

      pdfStream.pipe(res);
    } catch (error) {
      res.status(500).json(ApiResponse.error((error as Error).message));
    }
  };
}
