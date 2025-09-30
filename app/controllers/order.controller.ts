import { Request, Response } from 'express';
import { OrderService } from '../services/implements/order.service.implement';
import { CreateOrderRequestDto } from '../dtos/request/order/order.request';
import { validate } from 'class-validator';
import { ApiResponse } from '../dtos/response/api.response.dto';
import { ValidationErrorDto } from '../dtos/response/response.dto';
import User from '../models/user.model';
import { Variant } from '../models/variant.model';
import { Product } from '../models/product.model';

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
        subTotal: req.body.subTotal,
        discount: req.body.discount,
        totalAmount: req.body.totalAmount,
        shippingFee: req.body.shippingFee,
      });

      createOrderDto.user = { id: req.body.user.id } as User;

      if (req.body.shippingAddress) {
        createOrderDto.shippingAddress = req.body.shippingAddress;
      }

      if (req.body.items && req.body.items.length > 0) {
        createOrderDto.items = req.body.items.map((item: any) => ({
          quantity: item.quantity,
          price: item.price,
          product: { id: item.product.id } as Product,
          variant: { id: item.variant.id } as Variant,
        }));
      }

      const errors = await validate(createOrderDto);

      if (errors.length > 0) {
        const validationErrors: ValidationErrorDto[] = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}),
        }));
        return res
          .status(400)
          .json(ApiResponse.error('Validation errors', validationErrors));
      }

      const order = await this.orderService.createOrder(createOrderDto);

      res.status(201).json(ApiResponse.success('Order created', order));
    } catch (error) {
      console.log('Error in createOrder:', error);
      res.status(500).json(ApiResponse.error('Internal server error'));
    }
  };

  updateOrder = async (req: Request, res: Response) => {
    try {
      const order = await this.orderService.updateOrder(req.body);
      res.status(200).json(ApiResponse.success('Order updated', order));
    } catch (error) {
      console.log(error);
      res.status(500).json(ApiResponse.error('Internal server error'));
    }
  };

  deleteOrder = async (req: Request, res: Response) => {
    try {
      await this.orderService.deleteOrder(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.log(error);
      res.status(500).json(ApiResponse.error('Internal server error'));
    }
  };

  getOrderById = async (req: Request, res: Response) => {
    try {
      const order = await this.orderService.getOrderById(req.params.id);
      res.status(200).json(ApiResponse.success('Get order by id', order));
    } catch (error) {
      console.log(error);
      res.status(500).json(ApiResponse.error('Internal server error'));
    }
  };

  getAllOrders = async (req: Request, res: Response) => {
    const { page = 1, limit = 10 } = req.query;
    const orders = await this.orderService.getAllOrders(
      Number(page),
      Number(limit),
    );
    res.status(200).json(ApiResponse.success('Get all orders', orders));
  };
}
