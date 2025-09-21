export class BaseResponseDto<T = any> {
  success!: boolean;
  message!: string;
  data?: T;
  errors?: ValidationErrorDto[];
  meta?: MetaDto;
}

export class ValidationErrorDto {
  field!: string;
  message!: string | string[];
}

export class MetaDto {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export class PaginationDto {
  page: number = 1;
  limit: number = 10;
  offset: number = 0;

  constructor(page?: number, limit?: number) {
    this.page = page && page > 0 ? page : 1;
    this.limit = limit && limit > 0 ? Math.min(limit, 100) : 10;
    this.offset = (this.page - 1) * this.limit;
  }
}

export class SuccessResponseDto<T = any> extends BaseResponseDto<T> {
  success = true;

  constructor(message: string, data?: T, meta?: MetaDto) {
    super();
    this.message = message;
    this.data = data;
    this.meta = meta;
  }
}

export class ErrorResponseDto extends BaseResponseDto {
  success = false;

  constructor(message: string, errors?: ValidationErrorDto[]) {
    super();
    this.message = message;
    this.errors = errors;
  }
}
