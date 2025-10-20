import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import User from '../../../models/user.model';
import CartItemRequestDto from './cart_item.request';
import { Type } from 'class-transformer';

class CreateCartRequestDto {
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => User)
  user: User;

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => CartItemRequestDto)
  cartItems: CartItemRequestDto;
}

export default CreateCartRequestDto;
