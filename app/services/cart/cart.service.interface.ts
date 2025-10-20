import { DeleteResult } from 'typeorm';
import CreateCartRequestDto from '../../dtos/request/cart/cart.request';
import CartItemRequestDto from '../../dtos/request/cart/cart_item.request';
import Cart from '../../models/cart.model';
import CartItem from '../../models/cart_item.model';

export interface ICartService {
  createCart(createCartDto: CreateCartRequestDto): Promise<Cart | null>;
  findCartByUserId(userId: string): Promise<Cart>;
  findCartById(id: string): Promise<Cart>;
  addCartItem(cartItemData: CartItemRequestDto): Promise<CartItem | null>;
  removeCartItem(cartItem: CartItemRequestDto): Promise<DeleteResult | null>;
  updateCartItem(cartItem: CartItemRequestDto): Promise<CartItem | null>;
}
