import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

class CartItemRequestDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNotEmpty()
  @IsString()
  cartId: string;

  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsString()
  variantId: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}

export default CartItemRequestDto;
