import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data_source';
import { Voucher } from '../models/voucher.model';
import { VoucherUsage } from '../models/voucher_usage.model';
import {
  CreateVoucherRequestDto,
  UpdateVoucherRequestDto,
  VoucherQueryDto,
} from '../dtos/request/voucher/voucher.request';
import {
  PaginatedVoucherResponseDto,
  VoucherResponseDto,
  toVoucherResponseDto,
} from '../dtos/response/voucher/voucher.response';
import User from '../models/user.model';

export class VoucherRepository {
  private readonly voucherRepo: Repository<Voucher>;
  private readonly usageRepo: Repository<VoucherUsage>;

  constructor() {
    this.voucherRepo = AppDataSource.getRepository(Voucher);
    this.usageRepo = AppDataSource.getRepository(VoucherUsage);
  }

  private normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  }

  async create(
    dto: CreateVoucherRequestDto,
    createdBy?: string,
  ): Promise<VoucherResponseDto> {
    const normalizedCode = this.normalizeCode(dto.code);
    const existing = await this.voucherRepo.findOne({
      where: { code: normalizedCode },
    });
    if (existing) {
      throw new Error('Mã voucher đã tồn tại');
    }

    if (dto.startDate && dto.endDate) {
      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);
      if (start >= end) {
        throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
      }
    }

    const voucher = this.voucherRepo.create({
      code: normalizedCode,
      title: dto.title,
      description: dto.description,
      discountPercentage: dto.discountPercentage,
      maxDiscountValue: dto.maxDiscountValue,
      minOrderValue: dto.minOrderValue ?? 0,
      usageLimit: dto.usageLimit,
      usageLimitPerUser: dto.usageLimitPerUser,
      isActive: dto.isActive ?? true,
      isStackable: dto.isStackable ?? false,
      startDate: dto.startDate,
      endDate: dto.endDate,
      createdBy,
    });

    const saved = await this.voucherRepo.save(voucher);
    return toVoucherResponseDto(saved);
  }

  async update(
    id: string,
    dto: UpdateVoucherRequestDto,
  ): Promise<VoucherResponseDto> {
    const existing = await this.voucherRepo.findOne({ where: { id } });
    if (!existing) {
      throw new Error('Voucher không tồn tại');
    }

    if (dto.startDate && dto.endDate) {
      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);
      if (start >= end) {
        throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
      }
    }

    Object.assign(existing, {
      title: dto.title ?? existing.title,
      description: dto.description ?? existing.description,
      discountPercentage: dto.discountPercentage ?? existing.discountPercentage,
      maxDiscountValue:
        dto.maxDiscountValue !== undefined
          ? dto.maxDiscountValue
          : existing.maxDiscountValue,
      minOrderValue:
        dto.minOrderValue !== undefined
          ? dto.minOrderValue
          : existing.minOrderValue,
      usageLimit:
        dto.usageLimit !== undefined ? dto.usageLimit : existing.usageLimit,
      usageLimitPerUser:
        dto.usageLimitPerUser !== undefined
          ? dto.usageLimitPerUser
          : existing.usageLimitPerUser,
      isActive: dto.isActive ?? existing.isActive,
      isStackable: dto.isStackable ?? existing.isStackable,
      startDate: dto.startDate ? new Date(dto.startDate) : existing.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : existing.endDate,
    });

    const saved = await this.voucherRepo.save(existing);
    return toVoucherResponseDto(saved);
  }

  async delete(id: string): Promise<string> {
    const result = await this.voucherRepo.delete(id);
    if (result.affected === 0) {
      throw new Error('Voucher không tồn tại');
    }
    return id;
  }

  async getById(id: string): Promise<VoucherResponseDto> {
    const voucher = await this.voucherRepo.findOne({ where: { id } });
    if (!voucher) {
      throw new Error('Voucher không tồn tại');
    }
    return toVoucherResponseDto(voucher);
  }

  async getByCode(code: string): Promise<Voucher | null> {
    return this.voucherRepo.findOne({
      where: { code: this.normalizeCode(code) },
    });
  }

  async findActiveVoucherByCode(code: string): Promise<Voucher | null> {
    const voucher = await this.voucherRepo.findOne({
      where: {
        code: this.normalizeCode(code),
        isActive: true,
      },
    });
    if (!voucher) return null;

    const now = new Date();
    if (voucher.startDate && now < voucher.startDate) {
      return null;
    }
    if (voucher.endDate && now > voucher.endDate) {
      return null;
    }
    if (voucher.usageLimit && voucher.usedCount >= voucher.usageLimit) {
      return null;
    }
    return voucher;
  }

  async list(params: VoucherQueryDto): Promise<PaginatedVoucherResponseDto> {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 10;
    const qb = this.voucherRepo.createQueryBuilder('voucher');

    if (params.search) {
      qb.andWhere(
        '(voucher.code ILIKE :search OR voucher.title ILIKE :search)',
        {
          search: `%${params.search}%`,
        },
      );
    }

    if (params.isActive !== undefined) {
      qb.andWhere('voucher.isActive = :isActive', {
        isActive: params.isActive,
      });
    }

    if (!params.includeExpired) {
      qb.andWhere('(voucher.endDate IS NULL OR voucher.endDate >= :now)', {
        now: new Date(),
      });
    }

    qb.orderBy('voucher.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map(toVoucherResponseDto),
      total,
      page,
      limit,
    };
  }

  async toggleActive(
    id: string,
    isActive: boolean,
  ): Promise<VoucherResponseDto> {
    const voucher = await this.voucherRepo.findOne({ where: { id } });
    if (!voucher) {
      throw new Error('Voucher không tồn tại');
    }
    voucher.isActive = isActive;
    const saved = await this.voucherRepo.save(voucher);
    return toVoucherResponseDto(saved);
  }

  async incrementUsage(voucherId: string, userId: string): Promise<void> {
    await this.voucherRepo.increment({ id: voucherId }, 'usedCount', 1);

    let usage = await this.usageRepo.findOne({
      where: {
        voucher: { id: voucherId },
        user: { id: userId },
      },
    });

    if (!usage) {
      usage = this.usageRepo.create({
        voucher: { id: voucherId } as Voucher,
        user: { id: userId } as User,
        usageCount: 0,
      });
    }

    usage.usageCount += 1;
    await this.usageRepo.save(usage);
  }

  async getUsageCount(voucherId: string, userId: string): Promise<number> {
    const usage = await this.usageRepo.findOne({
      where: {
        voucher: { id: voucherId },
        user: { id: userId },
      },
    });
    return usage?.usageCount ?? 0;
  }
}
