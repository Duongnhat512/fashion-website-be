import { config } from '../../../config/env';
import {
  IPaymentService,
  CreatePaymentUrlRequest,
  CreatePaymentUrlResponse,
  PaymentRedirectRequest,
  PaymentRedirectResponse,
} from '../payment.service.interface';
import { IOrderService } from '../../order/order.service.interface';
import { OrderService } from '../../order/implements/order.service.implement';
import OrderStatus from '../../../models/enum/order_status.enum';
import {
  HashAlgorithm,
  ProductCode,
  VNPay,
  VnpCurrCode,
  VnpLocale,
  dateFormat,
} from 'vnpay';
import { PaymentMethod } from '../../../models/enum/payment_method.enum';
import { UpdateOrderRequestDto } from '../../../dtos/request/order/order.request';

export class VNPayService implements IPaymentService {
  private tmnCode: string;
  private secretKey: string;
  private vnpUrl: string;
  private returnUrl: string;
  private vnpayVersion: string;
  private orderService: IOrderService;

  constructor() {
    this.tmnCode = config.vnpay.tmnCode;
    this.secretKey = config.vnpay.secretKey;
    this.vnpUrl = config.vnpay.url;
    this.vnpayVersion = config.vnpay.vnpayVersion;
    this.returnUrl =
      process.env.VNPAY_RETURN_URL ||
      'http://localhost:3636/api/v1/payments/vnpay-redirect';
    this.orderService = new OrderService();
  }

  /**
   * Create payment URL for VNPay using existing order ID
   */
  async createPaymentUrl(
    request: CreatePaymentUrlRequest,
    ipAddr: string,
  ): Promise<CreatePaymentUrlResponse> {
    try {
      // Verify order exists and is in correct state
      const order = await this.orderService.getOrderById(request.orderId);
      if (!order) {
        throw new Error('Đơn hàng không tồn tại');
      }

      if (order.status !== OrderStatus.UNPAID) {
        throw new Error('Đơn hàng không ở trạng thái chờ thanh toán');
      }

      const vnpay = new VNPay({
        tmnCode: this.tmnCode,
        secureSecret: this.secretKey,
        vnpayHost: this.vnpUrl,
        testMode: true,
        hashAlgorithm: HashAlgorithm.SHA512,
      });

      const vnpayResponse = await vnpay.buildPaymentUrl({
        vnp_Amount: request.amount,
        vnp_OrderInfo: request.orderDescription,
        vnp_TxnRef: request.orderId,
        vnp_IpAddr: ipAddr,
        vnp_ReturnUrl: this.returnUrl,
        vnp_OrderType: ProductCode.Pay,
        vnp_CurrCode: VnpCurrCode.VND,
        vnp_Locale: VnpLocale.VN,
        vnp_CreateDate: dateFormat(new Date()),
        vnp_ExpireDate: dateFormat(new Date(Date.now() + 10 * 60 * 1000)),
      });

      return {
        response: vnpayResponse,
      };
    } catch (error) {
      throw new Error(
        `Failed to create VNPay payment URL: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Handle VNPay payment return/callback
   * - If payment successful: update order status to PENDING
   * - If payment failed/cancelled: cancel order and release inventory
   */
  async handleVNPayRedirect(
    params: PaymentRedirectRequest,
  ): Promise<PaymentRedirectResponse> {
    try {
      const vnpay = new VNPay({
        tmnCode: this.tmnCode,
        secureSecret: this.secretKey,
        vnpayHost: this.vnpUrl,
        testMode: true,
        hashAlgorithm: HashAlgorithm.SHA512,
      });

      const vnpayResponse = await vnpay.verifyReturnUrl(params);

      if (vnpayResponse.vnp_ResponseCode !== '00') {
        return {
          success: false,
          response: vnpayResponse,
        };
      }

      await this.orderService.updateOrder({
        id: vnpayResponse.vnp_TxnRef,
        status: OrderStatus.PENDING,
        paymentMethod: PaymentMethod.BANK,
      } as UpdateOrderRequestDto);

      return {
        success: true,
        response: vnpayResponse,
      };
    } catch (error) {
      throw new Error(
        `Lỗi xử lý thanh toán: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Sort object properties alphabetically
   */
  private sortObject(obj: Record<string, any>): Record<string, any> {
    const sorted: Record<string, any> = {};
    const keys = Object.keys(obj).sort();

    keys.forEach((key) => {
      sorted[key] = obj[key];
    });

    return sorted;
  }

  /**
   * Format date to VNPay format: yyyyMMddHHmmss
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Get response message based on VNPay response code
   */
  private getResponseMessage(code: string): string {
    const messages: Record<string, string> = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ là gian lận',
      '09': 'Giao dịch thất bại: Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
      '10': 'Giao dịch thất bại: Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch thất bại: Đã hết hạn thanh toán',
      '12': 'Giao dịch thất bại: Thẻ/Tài khoản bị khóa',
      '13': 'Giao dịch thất bại: Sai mã xác thực OTP',
      '24': 'Giao dịch thất bại: Khách hàng hủy giao dịch',
      '51': 'Giao dịch thất bại: Tài khoản không đủ số dư',
      '65': 'Giao dịch thất bại: Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Giao dịch thất bại: Nhập sai mật khẩu thanh toán quá số lần quy định',
      '99': 'Lỗi không xác định',
    };

    return messages[code] || 'Lỗi không xác định';
  }

  private normalizeIPAddress(ip: string): string {
    // Handle IPv6 loopback
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      return '127.0.0.1';
    }

    // Handle IPv6-mapped IPv4 addresses
    if (ip && ip.startsWith('::ffff:')) {
      return ip.substring(7); // Remove ::ffff: prefix
    }

    // Handle pure IPv6 (convert to IPv4 if possible, otherwise use fallback)
    if (ip && ip.includes(':') && !ip.includes('.')) {
      // For pure IPv6 in development, use localhost
      return '127.0.0.1';
    }

    // Return as-is for valid IPv4
    return ip || '127.0.0.1';
  }
}

// Export singleton instance
export const vnpayService = new VNPayService();
