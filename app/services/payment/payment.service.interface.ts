export interface CreatePaymentUrlRequest {
  amount: number;
  bankCode?: string;
  orderId: string;
  orderDescription: string;
  orderType: string;
  language?: string;
}

export interface CreatePaymentUrlResponse {
  response: any;
}

export interface PaymentReturnRequest {
  vnp_Amount: string;
  vnp_BankTranNo: string;
  vnp_CardType: string;
  vnp_OrderInfo: string;
  vnp_PayDate: string;
  vnp_ResponseCode: string;
  vnp_TmnCode: string;
  vnp_TransactionNo: string;
  vnp_TxnRef: string;
  vnp_SecureHash: string;
}

export interface PaymentReturnResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  amount?: number;
}

export interface PaymentRedirectRequest {
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo: string;
  vnp_CardType: string;
  vnp_OrderInfo: string;
  vnp_PayDate: string;
  vnp_ResponseCode: string;
  vnp_TmnCode: string;
  vnp_TransactionNo: string;
  vnp_TxnRef: string;
  vnp_SecureHash: string;
}

export interface PaymentRedirectResponse {
  success: boolean;
  response: any;
}

export interface IPaymentService {
  createPaymentUrl(
    request: CreatePaymentUrlRequest,
    ipAddr: string,
  ): Promise<CreatePaymentUrlResponse>;
  handleVNPayRedirect(
    params: PaymentRedirectRequest,
  ): Promise<PaymentRedirectResponse>;
}
