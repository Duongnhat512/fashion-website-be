import { OrderResponseDto } from '../../dtos/response/order/order.response';

export interface IInvoiceService {
  generateInvoicePDF(order: OrderResponseDto): Promise<Buffer>;
  generateInvoicePDFStream(order: OrderResponseDto): NodeJS.ReadableStream;
}
