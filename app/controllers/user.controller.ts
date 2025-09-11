import { Request, Response } from 'express';
import { UserService } from '../services/implements/user.service.implement';
import { IUserService } from '../services/user.service.interface';
import {
  CreateUserRequestDto,
  LoginRequestDto,
} from '../dtos/request/user/user.request.dto';
import { validate } from 'class-validator';
import { ValidationErrorDto } from '../dtos/response/response.dto';
import { ApiResponse } from '../dtos/response/api.response.dto';

export class UserController {
  private readonly userService: IUserService;

  constructor() {
    this.userService = new UserService();
  }

  createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const createUserDto = new CreateUserRequestDto();
      Object.assign(createUserDto, req.body);
      const errors = await validate(createUserDto);
      if (errors.length > 0) {
        const validationErrors: ValidationErrorDto[] = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}),
        }));

        res.status(400).json(ApiResponse.validationError(validationErrors));
        return;
      }

      const result = await this.userService.createUser(createUserDto);

      res.status(201).json(ApiResponse.success('Đăng ký thành công', result));
    } catch (error) {
      if (error instanceof Error && error.message === 'User already exists') {
        res.status(409).json(ApiResponse.conflict('Email đã được sử dụng'));
        return;
      }

      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const result = await this.userService.getUserById(id);
    res
      .status(200)
      .json(ApiResponse.success('Lấy thông tin người dùng thành công', result));
  };
}
