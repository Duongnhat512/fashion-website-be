import { CreateVoucherRequestDto, UpdateVoucherRequestDto, VoucherQueryDto } from '../../dtos/request/voucher/voucher.request';
import { PaginatedVoucherResponseDto, VoucherResponseDto } from '../../dtos/response/voucher/voucher.response';
import { Voucher } from '../../models/voucher.model';

export interface IVoucherService {
  create(
    dto: CreateVoucherRequestDto,
    createdBy?: string,
  ): Promise<VoucherResponseDto>;
  update(id: string, dto: UpdateVoucherRequestDto): Promise<VoucherResponseDto>;
  delete(id: string): Promise<string>;
  getById(id: string): Promise<VoucherResponseDto>;
  list(query: VoucherQueryDto): Promise<PaginatedVoucherResponseDto>;
  toggle(id: string, isActive: boolean): Promise<VoucherResponseDto>;
  validateVoucherForOrder(
    code: string,
    userId: string,
    orderValue: number,
  ): Promise<Voucher>;
  markVoucherAsUsed(voucherId: string, userId: string): Promise<void>;
}

