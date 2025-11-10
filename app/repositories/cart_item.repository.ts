import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { AppDataSource } from '../config/data_source';
import CartItem from '../models/cart_item.model';
import CartItemRequestDto from '../dtos/request/cart/cart_item.request';
import Cart from '../models/cart.model';
import { Product } from '../models/product.model';
import { Variant } from '../models/variant.model';

class CartItemRepository {
  private cartItemRepository: Repository<CartItem>;

  constructor() {
    this.cartItemRepository = AppDataSource.getRepository(CartItem);
  }

  createCartItem(cartItemData: CartItemRequestDto): Promise<CartItem | null> {
    return this.cartItemRepository.save({
      ...(cartItemData.id && { id: cartItemData.id }),
      cart: { id: cartItemData.cartId } as Cart,
      product: new Product(cartItemData.productId),
      variant: new Variant(cartItemData.variantId),
      quantity: cartItemData.quantity,
    });
  }

  updateCartItem(cartItem: CartItemRequestDto): Promise<CartItem> {
    return this.cartItemRepository.save({
      id: cartItem.id,
      quantity: cartItem.quantity,
      cart: { id: cartItem.cartId } as Cart,
      product: new Product(cartItem.productId),
      variant: new Variant(cartItem.variantId),
    });
  }

  removeCartItem(id: string): Promise<DeleteResult> {
    return this.cartItemRepository.delete(id);
  }

  getCartItem(cartItem: CartItemRequestDto): Promise<CartItem | null> {
    return this.cartItemRepository.findOne({
      where: {
        cart: { id: cartItem.cartId } as Cart,
        product: new Product(cartItem.productId),
        variant: new Variant(cartItem.variantId),
      },
    });
  }
}

export default CartItemRepository;
