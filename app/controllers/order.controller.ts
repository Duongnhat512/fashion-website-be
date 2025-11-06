import { Request, Response } from 'express';
import { OrderService } from '../services/order/implements/order.service.implement';
import {
  CreateOrderRequestDto,
  UpdateOrderRequestDto,
} from '../dtos/request/order/order.request';
import { validate } from 'class-validator';
import { ApiResponse } from '../dtos/response/api.response.dto';
import { ValidationErrorDto } from '../dtos/response/response.dto';
import User from '../models/user.model';
import { Variant } from '../models/variant.model';
import { Product } from '../models/product.model';
import { CreateOrderShippingAddressRequestDto } from '../dtos/request/order/order_shipping_address.request';
import { CreateOrderItemRequestDto } from '../dtos/request/order/order_item.request';
import OrderStatus from '../models/enum/order_status.enum';

export class OrderController {
  private readonly orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  createOrder = async (req: Request, res: Response) => {
    try {
      const createOrderDto = new CreateOrderRequestDto();
      Object.assign(createOrderDto, {
        status: req.body.status,
        discount: req.body.discount,
        shippingFee: req.body.shippingFee,
        isCOD: req.body.isCOD,
      });

      createOrderDto.user = { id: req.body.user.id } as User;

      if (req.body.shippingAddress) {
        const shippingAddressDto = new CreateOrderShippingAddressRequestDto();
        Object.assign(shippingAddressDto, req.body.shippingAddress);
        createOrderDto.shippingAddress = shippingAddressDto;
      }

      if (req.body.items && req.body.items.length > 0) {
        createOrderDto.items = req.body.items.map(
          (item: CreateOrderItemRequestDto) => {
            const itemDto = new CreateOrderItemRequestDto();
            Object.assign(itemDto, {
              quantity: item.quantity,
              rate: item.rate,
              product: { id: item.product.id } as Product,
              variant: { id: item.variant.id } as Variant,
              amount: item.quantity * item.rate,
            });
            return itemDto;
          },
        );
      }

      const errors = await validate(createOrderDto);

      if (errors.length > 0) {
        const validationErrors: ValidationErrorDto[] = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}),
        }));
        return res
          .status(400)
          .json(ApiResponse.error('Lỗi xác thực', validationErrors));
      }

      const order = await this.orderService.createOrder(createOrderDto);

      res.status(201).json(ApiResponse.success('Tạo đơn hàng', order));
    } catch (error) {
      res.status(500).json(ApiResponse.error((error as Error).message));
    }
  };

  updateOrder = async (req: Request, res: Response) => {
    try {
      const updateOrderDto = new UpdateOrderRequestDto();
      Object.assign(updateOrderDto, req.body);

      const errors = await validate(updateOrderDto);
      if (errors.length > 0) {
        const validationErrors: ValidationErrorDto[] = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}),
        }));

        return res
          .status(400)
          .json(ApiResponse.error('Lỗi xác thực', validationErrors));
      }

      const order = await this.orderService.updateOrder(updateOrderDto);
      res.status(200).json(ApiResponse.success('Cập nhật đơn hàng', order));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Internal server error'));
    }
  };

  deleteOrder = async (req: Request, res: Response) => {
    try {
      const id = await this.orderService.deleteOrder(req.params.id);
      res.status(200).json(ApiResponse.success('Xóa đơn hàng', id));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Internal server error'));
    }
  };

  getOrderById = async (req: Request, res: Response) => {
    try {
      const order = await this.orderService.getOrderById(req.params.id);
      res.status(200).json(ApiResponse.success('Thông tin đơn hàng', order));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Internal server error'));
    }
  };

  getAllOrders = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const orders = await this.orderService.getAllOrders(
        Number(page),
        Number(limit),
      );
      res.status(200).json(ApiResponse.success('Danh sách đơn hàng', orders));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Internal server error'));
    }
  };

  cancelOrder = async (req: Request, res: Response) => {
    try {
      const order = await this.orderService.cancelOrder(req.params.id);
      res.status(200).json(ApiResponse.success('Đã hủy đơn hàng', order));
    } catch (error) {
      res.status(500).json(
        ApiResponse.error('Lỗi hủy đơn hàng', [
          {
            field: 'cancelOrder',
            message: 'Lỗi hủy đơn hàng',
          },
        ]),
      );
    }
  };

  markOrderAsDelivered = async (req: Request, res: Response) => {
    try {
      const order = await this.orderService.updateOrderStatus(
        req.params.id,
        OrderStatus.DELIVERED,
      );
      res
        .status(200)
        .json(
          ApiResponse.success('Xác nhận đơn hàng đã giao thành công', order),
        );
    } catch (error) {
      res.status(500).json(
        ApiResponse.error('Lỗi xác nhận đơn hàng', [
          {
            field: 'markOrderAsDelivered',
            message: 'Lỗi xác nhận đơn hàng',
          },
        ]),
      );
    }
  };

  markOrderReadyToShip = async (req: Request, res: Response) => {
    try {
      const order = await this.orderService.updateOrderStatus(
        req.params.id,
        OrderStatus.READY_TO_SHIP,
      );
      res.status(200).json(ApiResponse.success('Đã xác nhận đơn hàng', order));
    } catch (error) {
      res.status(500).json(
        ApiResponse.error('Lỗi xác nhận đơn hàng', [
          {
            field: 'markOrderReadyToShip',
            message: 'Lỗi xác nhận đơn hàng',
          },
        ]),
      );
    }
  };

  confirmOrderAsCompleted = async (req: Request, res: Response) => {
    try {
      const order = await this.orderService.updateOrderStatus(
        req.params.id,
        OrderStatus.COMPLETED,
      );
      res
        .status(200)
        .json(ApiResponse.success('Xác nhận đơn hàng đã hoàn thành', order));
    } catch (error) {
      res.status(500).json(ApiResponse.error((error as Error).message));
    }
  };

  markOrderAsShipping = async (req: Request, res: Response) => {
    try {
      const order = await this.orderService.updateOrderStatus(
        req.params.id,
        OrderStatus.SHIPPING,
      );
      res
        .status(200)
        .json(ApiResponse.success('Xác nhận đơn hàng đang vận chuyển', order));
    } catch (error) {
      res.status(500).json(ApiResponse.error((error as Error).message));
    }
  };

  getOrdersByUserId = async (req: Request, res: Response) => {
    try {
      const orders = await this.orderService.getOrdersByUserId(req.params.userId);
      res.status(200).json(ApiResponse.success('Danh sách đơn hàng', orders));
    } catch (error) {
      res.status(500).json(ApiResponse.error('Internal server error'));
    }
  };
}
