import { CreateVoucherRequestDto, UpdateVoucherRequestDto, VoucherQueryDto } from '../../../dtos/request/voucher/voucher.request';
import {
  PaginatedVoucherResponseDto,
  VoucherResponseDto,
} from '../../../dtos/response/voucher/voucher.response';
import { Voucher } from '../../../models/voucher.model';
import { VoucherRepository } from '../../../repositories/voucher.repository';
import { IVoucherService } from '../voucher.service.interface';

export class VoucherService implements IVoucherService {
  private readonly repository: VoucherRepository;

  constructor() {
    this.repository = new VoucherRepository();
  }

  create(
    dto: CreateVoucherRequestDto,
    createdBy?: string,
  ): Promise<VoucherResponseDto> {
    return this.repository.create(dto, createdBy);
  }

  update(
    id: string,
    dto: UpdateVoucherRequestDto,
  ): Promise<VoucherResponseDto> {
    return this.repository.update(id, dto);
  }

  delete(id: string): Promise<string> {
    return this.repository.delete(id);
  }

  getById(id: string): Promise<VoucherResponseDto> {
    return this.repository.getById(id);
  }

  list(query: VoucherQueryDto): Promise<PaginatedVoucherResponseDto> {
    return this.repository.list(query);
  }

  toggle(id: string, isActive: boolean): Promise<VoucherResponseDto> {
    return this.repository.toggleActive(id, isActive);
  }

  async validateVoucherForOrder(
    code: string,
    userId: string,
    orderValue: number,
  ): Promise<Voucher> {
    const voucher = await this.repository.findActiveVoucherByCode(code);
    if (!voucher) {
      throw new Error('Voucher không hợp lệ hoặc đã hết hạn');
    }
    if (orderValue < voucher.minOrderValue) {
      throw new Error('Đơn hàng chưa đạt giá trị tối thiểu để áp dụng voucher');
    }
    if (voucher.usageLimitPerUser) {
      const usageCount = await this.repository.getUsageCount(
        voucher.id,
        userId,
      );
      if (usageCount >= voucher.usageLimitPerUser) {
        throw new Error('Bạn đã sử dụng voucher này tối đa số lần cho phép');
      }
    }
    return voucher;
  }

  markVoucherAsUsed(voucherId: string, userId: string): Promise<void> {
    return this.repository.incrementUsage(voucherId, userId);
  }
}

