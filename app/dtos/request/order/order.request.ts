import Address from '../../../models/address.model';
import User from '../../../models/user.model';
import OrderStatus from '../../../models/enum/order_status.enum';
import { OrderItem } from '../../../models/order_item.model';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemRequestDto } from './order_item.request';
import { PaymentMethod } from '../../../models/enum/payment_method.enum';
import { Voucher } from '../../../models/voucher.model';

// ... existing code ...

export class CreateOrderRequestDto {
  @IsObject({ message: 'Vui lòng cung cấp thông tin người dùng' })
  user: User;

  @IsEnum(OrderStatus, {
    message: 'Trạng thái đơn hàng không hợp lệ',
  })
  status: OrderStatus;

  @IsNumber({}, { message: 'Giảm giá phải là số' })
  @Min(0, { message: 'Giá giảm phải là số lớn hơn 0' })
  @Max(100, { message: 'Giá giảm phải là số nhỏ hơn 100' })
  discount: number;

  @IsBoolean({
    message: 'Phương thức thanh toán COD không hợp lệ',
  })
  isCOD: boolean;

  @IsNumber({}, { message: 'Phí vận chuyển phải là số' })
  @Min(0, { message: 'Phí vận chuyển phải là số lớn hơn 0' })
  shippingFee: number;

  @IsString({ message: 'ID địa chỉ phải là chuỗi hợp lệ' })
  @IsUUID('4', { message: 'ID địa chỉ phải là UUID hợp lệ' })
  addressId: string;

  address?: Address;

  @IsOptional()
  @IsArray({ message: 'Danh sách sản phẩm phải là một mảng các sản phẩm' })
  @Type(() => CreateOrderItemRequestDto)
  @ValidateNested({
    each: true,
    message:
      'Có sản phẩm trong đơn hàng không hợp lệ, vui lòng kiểm tra lại thông tin từng sản phẩm',
  })
  items: CreateOrderItemRequestDto[];

  subTotal?: number;
  totalAmount?: number;

  @IsOptional()
  @IsString({ message: 'Mã voucher phải là chuỗi hợp lệ' })
  voucherCode?: string;

  voucher?: Voucher;
}

export class UpdateOrderRequestDto {
  @IsString({ message: 'ID đơn hàng phải là chuỗi ký tự hợp lệ (UUID)' })
  id: string;

  @IsOptional()
  @IsEnum(OrderStatus, {
    message:
      'Trạng thái đơn hàng phải là một trong các giá trị: UNPAID, PAID, CANCELLED, SHIPPING, DELIVERED',
  })
  status: OrderStatus;

  @IsOptional()
  @IsNumber({}, { message: 'Tổng tiền phụ phải là số dương (ví dụ: 100000)' })
  subTotal: number;

  @IsOptional()
  @IsNumber(
    {},
    {
      message: 'Giảm giá phải là số từ 0 đến 100 (ví dụ: 10 nghĩa là giảm 10%)',
    },
  )
  discount: number;

  @IsOptional()
  @IsNumber({}, { message: 'Tổng tiền phải là số dương (ví dụ: 500000)' })
  totalAmount: number;

  @IsOptional()
  @IsNumber({}, { message: 'Phí vận chuyển phải là số dương (ví dụ: 30000)' })
  shippingFee: number;

  @IsOptional()
  @IsArray({ message: 'Danh sách sản phẩm phải là một mảng các sản phẩm' })
  @ValidateNested({
    each: true,
    message:
      'Có sản phẩm trong đơn hàng không hợp lệ, vui lòng kiểm tra lại thông tin từng sản phẩm',
  })
  items: OrderItem[];

  @IsOptional()
  @IsString({ message: 'ID địa chỉ phải là chuỗi hợp lệ' })
  @IsUUID('4', { message: 'ID địa chỉ phải là UUID hợp lệ' })
  addressId?: string;

  address?: Address;

  @IsOptional()
  @IsEnum(PaymentMethod, {
    message: 'Phương thức thanh toán không hợp lệ',
  })
  paymentMethod?: PaymentMethod;
}
