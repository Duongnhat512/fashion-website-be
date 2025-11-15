import { Request, Response } from 'express';
import { vnpayService } from '../services/payment/implements/vnpay.service.implement';
import { OrderService } from '../services/order/implements/order.service.implement';
import { ApiResponse } from '../dtos/response/api.response.dto';
import OrderStatus from '../models/enum/order_status.enum';

export class PaymentController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  /**
   * Step 1: Create order with UNPAID status
   * Step 2: Create payment URL
   */
  createPaymentUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        orderId,
        amount,
        bankCode,
        orderDescription,
        orderType,
        language,
      } = req.body;

      // FIX: Better IP address extraction
      const ipAddr = this.getClientIP(req);

      // Verify order exists
      const order = await this.orderService.getOrderById(orderId);
      if (!order) {
        res.status(404).json(ApiResponse.error('Không tìm thấy đơn hàng'));
        return;
      }

      if (order.isCOD) {
        res
          .status(400)
          .json(ApiResponse.error('Đơn hàng không hỗ trợ thanh toán online'));
        return;
      }

      if (order.status !== OrderStatus.UNPAID) {
        res
          .status(400)
          .json(
            ApiResponse.error('Đơn hàng không ở trạng thái chờ thanh toán'),
          );
        return;
      }

      // Create payment URL
      const result = await vnpayService.createPaymentUrl(
        {
          orderId,
          amount,
          bankCode,
          orderDescription,
          orderType,
          language,
        },
        ipAddr,
      );

      res
        .status(200)
        .json(ApiResponse.success('Tạo link thanh toán thành công', result));
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.error(
            `Lỗi khi tạo link thanh toán: ${
              error instanceof Error ? error.message : 'Lỗi không xác định'
            }`,
          ),
        );
    }
  };

  /**
   * Extract client IP address properly
   */
  private getClientIP(req: Request): string {
    // Check for forwarded IP (from proxy/load balancer)
    const forwarded = req.headers['x-forwarded-for'] as string;
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      return forwarded.split(',')[0].trim();
    }

    // Check for real IP (from proxy)
    const realIP = req.headers['x-real-ip'] as string;
    if (realIP) {
      return realIP;
    }

    // Check for client IP
    const clientIP = req.headers['x-client-ip'] as string;
    if (clientIP) {
      return clientIP;
    }

    // Fallback to connection remote address
    let remoteAddr =
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection as any).socket?.remoteAddress;

    // Handle IPv6 loopback
    if (remoteAddr === '::1' || remoteAddr === '::ffff:127.0.0.1') {
      return '127.0.0.1';
    }

    // Handle IPv6-mapped IPv4 addresses
    if (remoteAddr && remoteAddr.startsWith('::ffff:')) {
      return remoteAddr.substring(7); // Remove ::ffff: prefix
    }

    // Default fallback
    return remoteAddr || '127.0.0.1';
  }

  /**
   * VNPay callback handler
   */
  handleVNPayRedirect = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await vnpayService.handleVNPayRedirect(req.query as any);

      if (result.success) {
        // Redirect to success page with order info
        const successUrl = `${
          process.env.FRONTEND_URL || 'http://localhost:3000'
        }/payment/success?orderId=${result.response.vnp_TxnRef}&amount=${
          result.response.vnp_Amount
        }`;
        res.redirect(successUrl);
      } else {
        // Redirect to failure page with error message
        const failureUrl = `${
          process.env.FRONTEND_URL || 'http://localhost:3000'
        }/payment/failure?message=${encodeURIComponent(
          result.response.message,
        )}&orderId=${req.query.vnp_TxnRef}`;
        res.redirect(failureUrl);
      }
    } catch (error) {
      // Redirect to error page
      const errorUrl = `${
        process.env.FRONTEND_URL || 'http://localhost:3000'
      }/payment/error?message=${encodeURIComponent('Lỗi xử lý thanh toán')}`;
      res.redirect(errorUrl);
    }
  };
}
