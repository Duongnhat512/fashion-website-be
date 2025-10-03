import { ApiResponse } from '../dtos/response/api.response.dto';
import { NextFunction } from 'express';
import { Request, Response } from 'express';
import { OrderService } from '../services/implements/order.service.implement';
import { TokenPayloadDto } from '../dtos/response/auth/auth.response.dto';
import Role from '../models/enum/role.enum';

const orderService = new OrderService();

export const checkOrderOwnership = async (
  req: Request & { user: TokenPayloadDto },
  res: Response,
  next: NextFunction,
) => {
  try {
    const orderId = req.params.id;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!orderId || !userId) {
      return res
        .status(400)
        .json(ApiResponse.error('Thiếu thông tin cần thiết'));
    }

    if (userRole === Role.ADMIN) {
      return next();
    }

    const order = await orderService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json(ApiResponse.error('Không tìm thấy đơn hàng'));
    }

    if (order.user.id !== userId) {
      return res
        .status(403)
        .json(
          ApiResponse.forbidden('Bạn không có quyền thao tác đơn hàng này'),
        );
    }

    next();
  } catch (error) {
    res.status(500).json(ApiResponse.error('Lỗi server'));
  }
};
