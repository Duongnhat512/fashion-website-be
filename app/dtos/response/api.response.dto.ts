import { BaseResponseDto, MetaDto, ValidationErrorDto } from './response.dto';

export class ApiResponse {
  static success<T>(message: string, data?: T): BaseResponseDto<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(
    message: string,
    errors?: ValidationErrorDto[],
  ): BaseResponseDto {
    return {
      success: false,
      message,
      errors,
    };
  }

  static validationError(errors: ValidationErrorDto[]): BaseResponseDto {
    return {
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors,
    };
  }

  static notFound(resource: string = 'Tài nguyên'): BaseResponseDto {
    return {
      success: false,
      message: `${resource} không tồn tại`,
    };
  }

  static unauthorized(
    message: string = 'Không có quyền truy cập',
  ): BaseResponseDto {
    return {
      success: false,
      message,
    };
  }

  static forbidden(message: string = 'Bị cấm truy cập'): BaseResponseDto {
    return {
      success: false,
      message,
    };
  }

  static conflict(message: string): BaseResponseDto {
    return {
      success: false,
      message,
    };
  }

  static serverError(
    message: string = 'Lỗi server, vui lòng thử lại sau',
  ): BaseResponseDto {
    return {
      success: false,
      message,
    };
  }
}
