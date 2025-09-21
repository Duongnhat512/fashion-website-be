import { NextFunction, Request, Response } from 'express';
import { ApiResponse } from '../dtos/response/api.response.dto';
import { TokenPayloadDto } from '../dtos/response/auth/auth.response.dto';
import { AuthService } from '../services/implements/auth.service.implement';
import Role from '../models/enum/role.enum';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayloadDto;
    }
  }
}

const authService = new AuthService();

/**
 * Middleware xác thực token và kiểm tra quyền truy cập
 * @param allowedRoles - Mảng các role được phép truy cập (mặc định là ['admin'])
 * @returns Middleware function
 */
export const authMiddleware = (allowedRoles: string[] = [Role.ADMIN]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res
          .status(401)
          .json(ApiResponse.unauthorized('Không thể truy cập'));
      }

      const tokenParts = authHeader.split(' ');
      if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res
          .status(401)
          .json(ApiResponse.unauthorized('Không thể truy cập'));
      }

      const token = tokenParts[1];

      const decoded = authService.verifyAccessToken(token);

      if (!allowedRoles.includes(decoded.role)) {
        return res
          .status(403)
          .json(ApiResponse.forbidden(`Không thể truy cập`));
      }

      req.user = decoded;

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);

      const errorMessage = (error as Error).message;

      if (errorMessage.includes('đã hết hạn')) {
        return res
          .status(401)
          .json(ApiResponse.unauthorized('Không thể truy cập'));
      } else if (errorMessage.includes('không hợp lệ')) {
        return res
          .status(401)
          .json(ApiResponse.unauthorized('Không thể truy cập'));
      }

      return res.status(500).json(ApiResponse.serverError('Lỗi server'));
    }
  };
};

export const adminOnly = authMiddleware([Role.ADMIN]);

export const authenticatedUser = authMiddleware([Role.ADMIN, Role.USER]);
