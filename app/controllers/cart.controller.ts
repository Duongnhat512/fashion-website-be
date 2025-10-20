import CreateCartRequestDto from '../dtos/request/cart/cart.request';
import { ICartService } from '../services/cart/cart.service.interface';
import CartService from '../services/cart/implement/cart.service.implement';
import { ApiResponse } from '../dtos/response/api.response.dto';
import { Request, Response } from 'express';
import User from '../models/user.model';
import CartItemRequestDto from '../dtos/request/cart/cart_item.request';
import { IAuthService } from '../services/auth/auth.service.interface';
import { AuthService } from '../services/auth/implements/auth.service.implement';

class CartController {
  private readonly cartService: ICartService;
  private readonly authService: IAuthService;

  constructor() {
    this.cartService = new CartService();
    this.authService = new AuthService();
  }

  async createCart(req: Request, res: Response) {
    const { userId } = req.params;
    const createCartDto = new CreateCartRequestDto();
    createCartDto.user = { id: userId } as User;

    try {
      const cart = await this.cartService.createCart(createCartDto);
      res
        .status(201)
        .json(ApiResponse.success('Tạo giỏ hàng thành công', cart));
    } catch (error) {
      res.status(500).json(
        ApiResponse.error('Tạo giỏ hàng thất bại', [
          {
            field: 'error',
            message: error instanceof Error ? error.message : String(error),
          },
        ]),
      );
    }
  }

  async addCartItem(req: Request, res: Response) {
    const token = req.headers.authorization?.split(' ')[1];
    const decode = await this.authService.verifyAccessToken(token!);
    const addCartItemDto = new CartItemRequestDto();
    addCartItemDto.productId = req.body.productId;
    addCartItemDto.variantId = req.body.variantId;
    addCartItemDto.quantity = req.body.quantity;

    try {
      const cart = await this.cartService.findCartByUserId(decode.userId);
      if (!cart) {
        throw new Error('Cart not found');
      }
      addCartItemDto.cartId = cart.id;
      const cartItem = await this.cartService.addCartItem(addCartItemDto);
      res
        .status(201)
        .json(
          ApiResponse.success(
            'Thêm sản phẩm vào giỏ hàng thành công',
            cartItem,
          ),
        );
    } catch (error) {
      res.status(500).json(
        ApiResponse.error('Thêm sản phẩm vào giỏ hàng thất bại', [
          {
            field: 'error',
            message: error instanceof Error ? error.message : String(error),
          },
        ]),
      );
    }
  }

  async removeCartItem(req: Request, res: Response) {
    const token = req.headers.authorization?.split(' ')[1];
    const decode = await this.authService.verifyAccessToken(token!);
    const removeCartItemDto = new CartItemRequestDto();
    removeCartItemDto.productId = req.body.productId;
    removeCartItemDto.variantId = req.body.variantId;

    try {
      const cart = await this.cartService.findCartByUserId(decode.userId);
      if (!cart) {
        throw new Error('Cart not found');
      }
      removeCartItemDto.cartId = cart.id;
      const removedCartItem = await this.cartService.removeCartItem(
        removeCartItemDto,
      );
      res
        .status(200)
        .json(
          ApiResponse.success(
            'Xóa sản phẩm khỏi giỏ hàng thành công',
            removedCartItem,
          ),
        );
    } catch (error) {
      res.status(500).json(
        ApiResponse.error('Xóa sản phẩm khỏi giỏ hàng thất bại', [
          {
            field: 'error',
            message: error instanceof Error ? error.message : String(error),
          },
        ]),
      );
    }
  }

  async getCart(req: Request, res: Response) {
    const token = req.headers.authorization?.split(' ')[1];
    const decode = await this.authService.verifyAccessToken(token!);

    try {
      const cart = await this.cartService.findCartByUserId(decode.userId!);
      res
        .status(200)
        .json(ApiResponse.success('Lấy giỏ hàng thành công', cart));
    } catch (error) {
      res.status(500).json(
        ApiResponse.error('Lấy giỏ hàng thất bại', [
          {
            field: 'error',
            message: error instanceof Error ? error.message : String(error),
          },
        ]),
      );
    }
  }

  async updateCartItem(req: Request, res: Response) {
    const token = req.headers.authorization?.split(' ')[1];
    const decode = await this.authService.verifyAccessToken(token!);

    const updateCartItemDto = new CartItemRequestDto();
    updateCartItemDto.productId = req.body.productId;
    updateCartItemDto.variantId = req.body.variantId;
    updateCartItemDto.quantity = req.body.quantity;

    try {
      const cart = await this.cartService.findCartByUserId(decode.userId!);

      updateCartItemDto.cartId = cart.id;
      const updatedCartItem = await this.cartService.updateCartItem(
        updateCartItemDto,
      );

      res
        .status(200)
        .json(
          ApiResponse.success('Cập nhật giỏ hàng thành công', updatedCartItem),
        );
    } catch (error) {
      res.status(500).json(
        ApiResponse.error('Cập nhật giỏ hàng thất bại', [
          {
            field: 'error',
            message: error instanceof Error ? error.message : String(error),
          },
        ]),
      );
    }
  }
}

export default CartController;
