import { IsObject, IsString } from 'class-validator';
import { Order } from '../../../models/order.model';

export class CreateOrderShippingAddressRequestDto {
  @IsString()
  fullName!: string;

  @IsString()
  phone!: string;

  @IsString()
  fullAddress!: string;

  @IsString()
  city!: string;

  @IsString()
  district!: string;

  @IsString()
  ward!: string;
}
