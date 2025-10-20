import { DeleteResult } from 'typeorm';
import CreateCartRequestDto from '../../../dtos/request/cart/cart.request';
import CartItemRequestDto from '../../../dtos/request/cart/cart_item.request';
import Cart from '../../../models/cart.model';
import CartRepository from '../../../repositories/cart.repository';
import CartItemRepository from '../../../repositories/cart_item.repository';
import { ICartService } from '../cart.service.interface';
import CartItem from '../../../models/cart_item.model';

class CartService implements ICartService {
  private readonly cartRepository: CartRepository;
  private readonly cartItemRepository: CartItemRepository;

  constructor() {
    this.cartRepository = new CartRepository();
    this.cartItemRepository = new CartItemRepository();
  }

  async addCartItem(
    cartItemData: CartItemRequestDto,
  ): Promise<CartItem | null> {
    try {
      const cartItem = await this.cartItemRepository.getCartItem(cartItemData);
      if (cartItem) {
        cartItemData.id = cartItem.id;
        cartItemData.quantity += cartItem.quantity;
      }

      const addedItem = await this.cartItemRepository.createCartItem(
        cartItemData,
      );

      return addedItem;
    } catch (error) {
      throw new Error('Lỗi khi thêm sản phẩm vào giỏ hàng');
    }
  }

  async removeCartItem(
    cartItemData: CartItemRequestDto,
  ): Promise<DeleteResult> {
    try {
      const cartItem = await this.cartItemRepository.getCartItem(cartItemData);

      if (!cartItem) {
        throw new Error('Sản phẩm không tồn tại trong giỏ hàng');
      }
      const result = await this.cartItemRepository.removeCartItem(cartItem.id);
      if (result.affected === 0) {
        throw new Error('Sản phẩm không tồn tại trong giỏ hàng');
      }
      return result;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : 'Lỗi khi xóa sản phẩm khỏi giỏ hàng',
      );
    }
  }

  async findCartByUserId(userId: string): Promise<Cart> {
    const cart = await this.cartRepository.findCartByUserId(userId);
    if (!cart) {
      throw new Error('Giỏ hàng không tồn tại');
    }
    return cart;
  }
  async findCartById(id: string): Promise<Cart> {
    const cart = await this.cartRepository.findCartById(id);
    if (!cart) {
      throw new Error('Giỏ hàng không tồn tại');
    }
    return cart;
  }

  async createCart(createCartDto: CreateCartRequestDto): Promise<Cart | null> {
    const cart = await this.cartRepository.createCart(createCartDto);
    if (!cart) {
      throw new Error('Lỗi khi tạo giỏ hàng');
    }
    return cart;
  }

  async updateCartItem(
    cartItemData: CartItemRequestDto,
  ): Promise<CartItem | null> {
    const cartItem = await this.cartItemRepository.getCartItem(cartItemData);
    if (!cartItem) {
      throw new Error('Sản phẩm không tồn tại trong giỏ hàng');
    }

    cartItemData.id = cartItem.id;
    const updatedCartItem = await this.cartItemRepository.updateCartItem(
      cartItemData,
    );

    if (!updatedCartItem) {
      throw new Error('Lỗi khi cập nhật sản phẩm trong giỏ hàng');
    }

    updatedCartItem.quantity = cartItemData.quantity;

    return updatedCartItem;
  }
}

export default CartService;
