import { Repository } from 'typeorm';
import Cart from '../models/cart.model';
import { AppDataSource } from '../config/data_source';
import CreateCartRequestDto from '../dtos/request/cart/cart.request';

class CartRepository {
  private cartRepository: Repository<Cart>;

  constructor() {
    this.cartRepository = AppDataSource.getRepository(Cart);
  }

  createCart(createCartDto: CreateCartRequestDto): Promise<Cart> {
    const cart = this.cartRepository.create({ user: createCartDto.user });
    return this.cartRepository.save(cart);
  }

  findCartByUserId(userId: string): Promise<Cart | null> {
    return this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: {
        user: true,
        cartItems: {
          product: true,
          variant: {
            color: true,
          },
        },
      },
    });
  }

  findCartById(id: string): Promise<Cart | null> {
    return this.cartRepository.findOne({
      where: { id },
      relations: {
        user: true,
        cartItems: {
          product: true,
          variant: {
            color: true,
          },
        },
      },
    });
  }

  updateCart(cart: Cart) {
    return this.cartRepository.update(cart.id, cart);
  }
}

export default CartRepository;
