import { Voucher } from '../../../models/voucher.model';

export class VoucherResponseDto {
  id: string;
  code: string;
  title?: string | null;
  description?: string | null;
  discountPercentage: number;
  maxDiscountValue?: number | null;
  minOrderValue: number;
  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  usedCount: number;
  isActive: boolean;
  isStackable: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PaginatedVoucherResponseDto {
  data: VoucherResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export const toVoucherResponseDto = (
  voucher: Voucher,
): VoucherResponseDto => ({
  id: voucher.id,
  code: voucher.code,
  title: voucher.title,
  description: voucher.description,
  discountPercentage: voucher.discountPercentage,
  maxDiscountValue: voucher.maxDiscountValue ?? null,
  minOrderValue: voucher.minOrderValue,
  usageLimit: voucher.usageLimit ?? null,
  usageLimitPerUser: voucher.usageLimitPerUser ?? null,
  usedCount: voucher.usedCount,
  isActive: voucher.isActive,
  isStackable: voucher.isStackable,
  startDate: voucher.startDate ?? null,
  endDate: voucher.endDate ?? null,
  createdAt: voucher.createdAt,
  updatedAt: voucher.updatedAt,
});

