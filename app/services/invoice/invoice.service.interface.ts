import { OrderResponseDto } from '../../dtos/response/order/order.response';

export interface IInvoiceService {
  generateInvoicePDF(order: OrderResponseDto): Promise<Buffer>;
  generateInvoicePDFStream(order: OrderResponseDto): NodeJS.ReadableStream;
  generateBatchInvoicesPDF(orders: OrderResponseDto[]): Promise<Buffer>;
  generateBatchInvoicesPDFStream(
    orders: OrderResponseDto[],
  ): NodeJS.ReadableStream;
}
