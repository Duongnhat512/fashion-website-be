import { BaseResponseDto } from './response.dto';

export class PaginationResponseDto<T> extends BaseResponseDto<T[]> {
  constructor(
    message: string,
    data: T[],
    total: number,
    page: number,
    limit: number,
  ) {
    super();
    this.success = true;
    this.message = message;
    this.data = data;
    this.meta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
