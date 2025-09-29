import { Request, Response } from 'express';
import { OrderService } from '../services/implements/order.service.implement';

export class OrderController {
  private readonly orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  async createOrder(req: Request, res: Response) {
    const order = await this.orderService.createOrder(req.body);
    res.status(201).json(order);
  }

  async updateOrder(req: Request, res: Response) {
    const order = await this.orderService.updateOrder(req.body);
    res.status(200).json(order);
  }

  async deleteOrder(req: Request, res: Response) {
    await this.orderService.deleteOrder(req.params.id);
    res.status(204).send();
  }

  async getOrderById(req: Request, res: Response) {
    const order = await this.orderService.getOrderById(req.params.id);
    res.status(200).json(order);
  }

  async getAllOrders(req: Request, res: Response) {
    const { page = 1, limit = 10 } = req.query;
    const orders = await this.orderService.getAllOrders(
      Number(page),
      Number(limit),
    );
    res.status(200).json(orders);
  }
}
