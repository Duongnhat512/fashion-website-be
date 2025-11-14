import { Request, Response } from 'express';
import { InvoiceService } from '../services/invoice/implements/invoice.service.implement';
import { OrderService } from '../services/order/implements/order.service.implement';
import { ApiResponse } from '../dtos/response/api.response.dto';
import { IInvoiceService } from '../services/invoice/invoice.service.interface';

export class InvoiceController {
  private readonly invoiceService: IInvoiceService;
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

  generateBatchInvoices = async (req: Request, res: Response) => {
    try {
      const { orderIds } = req.body;

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res
          .status(400)
          .json(ApiResponse.error('Vui lòng cung cấp danh sách mã đơn hàng'));
      }

      const orders = await Promise.all(
        orderIds.map((id: string) => this.orderService.getOrderById(id)),
      );

      const validOrders = orders.filter(
        (order) =>
          order &&
          (order.status === 'delivered' ||
            order.status === 'completed' ||
            order.status === 'shipping' ||
            order.status === 'pending'),
      );

      if (validOrders.length === 0) {
        return res
          .status(400)
          .json(
            ApiResponse.error(
              'Không có đơn hàng hợp lệ để tạo hóa đơn. Vui lòng kiểm tra lại trạng thái đơn hàng.',
            ),
          );
      }

      const pdfBuffer = await this.invoiceService.generateBatchInvoicesPDF(
        validOrders,
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="hoa-don-hang-loat-${Date.now()}.pdf"`,
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json(ApiResponse.error((error as Error).message));
    }
  };

  downloadBatchInvoices = async (req: Request, res: Response) => {
    try {
      const { orderIds } = req.body;

      if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res
          .status(400)
          .json(ApiResponse.error('Vui lòng cung cấp danh sách mã đơn hàng'));
      }

      const orders = await Promise.all(
        orderIds.map((id: string) => this.orderService.getOrderById(id)),
      );

      const validOrders = orders.filter(
        (order) =>
          order &&
          (order.status === 'delivered' ||
            order.status === 'completed' ||
            order.status === 'shipping' ||
            order.status === 'pending'),
      );

      if (validOrders.length === 0) {
        return res
          .status(400)
          .json(
            ApiResponse.error(
              'Không có đơn hàng hợp lệ để tạo hóa đơn. Vui lòng kiểm tra lại trạng thái đơn hàng.',
            ),
          );
      }

      const pdfStream =
        this.invoiceService.generateBatchInvoicesPDFStream(validOrders);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="hoa-don-hang-loat-${Date.now()}.pdf"`,
      );

      pdfStream.pipe(res);
    } catch (error) {
      res.status(500).json(ApiResponse.error((error as Error).message));
    }
  };
}
