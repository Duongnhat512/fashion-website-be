import { IsNumber, IsObject, Min } from 'class-validator';
import { Product } from '../../../models/product.model';
import { Variant } from '../../../models/variant.model';

export class CreateOrderItemRequestDto {
  @IsObject()
  product!: Product;

  @IsObject()
  variant!: Variant;

  @IsNumber({}, { message: 'Số lượng phải là số' })
  @Min(1, { message: 'Số lượng phải lớn hơn 0' })
  quantity!: number;

  @IsNumber({}, { message: 'Giá phải là số' })
  @Min(0, { message: 'Giá phải lớn hơn 0' })
  rate!: number;

  amount?: number;
}
