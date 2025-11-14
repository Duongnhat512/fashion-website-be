import { Request, Response } from 'express';
import { UserService } from '../services/user/implements/user.service.implement';
import { IUserService } from '../services/user/user.service.interface';
import {
  CreateUserRequestDto,
  UpdateUserRequestDto,
} from '../dtos/request/user/user.request.dto';
import { validate } from 'class-validator';
import { ValidationErrorDto } from '../dtos/response/response.dto';
import { ApiResponse } from '../dtos/response/api.response.dto';
import { ICloudService } from '../services/cloud/cloud.service.interface';
import { CloudinaryService } from '../services/cloud/implements/cloudinary.service.implement';

export class UserController {
  private readonly userService: IUserService;
  private readonly cloudinaryService: ICloudService;

  constructor() {
    this.userService = new UserService();
    this.cloudinaryService = new CloudinaryService();
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

  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const updateUserDto = new UpdateUserRequestDto();
      Object.assign(updateUserDto, req.body);
      const result = await this.userService.updateUser(updateUserDto);
      res
        .status(200)
        .json(
          ApiResponse.success(
            'Cập nhật thông tin người dùng thành công',
            result,
          ),
        );
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json(ApiResponse.error('Email là bắt buộc'));
        return;
      }

      await this.userService.forgotPassword(email);

      res
        .status(200)
        .json(
          ApiResponse.success(
            'Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra email.',
          ),
        );
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.error(
            error instanceof Error ? error.message : 'Lỗi khi gửi OTP',
          ),
        );
    }
  };

  verifyResetOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res.status(400).json(ApiResponse.error('Email và OTP là bắt buộc'));
        return;
      }

      const resetToken = await this.userService.verifyResetOtpAndGetToken(
        email,
        parseInt(otp),
      );

      res.status(200).json(
        ApiResponse.success('OTP đã được xác thực', {
          resetToken,
        }),
      );
    } catch (error) {
      res
        .status(400)
        .json(
          ApiResponse.error(
            error instanceof Error ? error.message : 'OTP không hợp lệ',
          ),
        );
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, password, confirmPassword } = req.body;

      if (!token) {
        res
          .status(400)
          .json(
            ApiResponse.error('Xác thực đặt lại mật khẩu không thành công'),
          );
        return;
      }

      if (!password) {
        res.status(400).json(ApiResponse.error('Vui lòng nhập mật khẩu mới.'));
        return;
      }

      if (password.length < 6) {
        res
          .status(400)
          .json(ApiResponse.error('Mật khẩu phải có ít nhất 6 ký tự'));
        return;
      }

      if (password !== confirmPassword) {
        res.status(400).json(ApiResponse.error('Không trùng khớp mật khẩu.'));
        return;
      }

      await this.userService.resetPassword(token, password);

      res.status(200).json(ApiResponse.success('Đặt lại mật khẩu thành công'));
    } catch (error) {
      res
        .status(400)
        .json(
          ApiResponse.error(
            error instanceof Error
              ? error.message
              : 'Không thể đặt lại mật khẩu',
          ),
        );
    }
  };

  updateAvt = async (req: Request, res: Response): Promise<void> => {
    let publicId: string = '';

    try {
      const files = (req.files as Express.Multer.File[]) || [];
      const userId = req.user!.userId;
      const avt = files.find((file) => file.fieldname === 'avt');

      if (!avt) {
        res.status(400).json(ApiResponse.error('Ảnh đại diện là bắt buộc'));
        return;
      }

      const uploadResult = await this.cloudinaryService.uploadImage(
        avt,
        'fashion-website/users',
      );
      const avtUrl = uploadResult.url;
      publicId = uploadResult.publicId;

      const result = await this.userService.updateUser({
        id: userId,
        avt: avtUrl,
      });
      res
        .status(200)
        .json(ApiResponse.success('Cập nhật ảnh đại diện thành công', result));
    } catch (error) {
      await this.cloudinaryService.deleteImage(publicId);
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };

  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.userService.getAllUsers();
      res
        .status(200)
        .json(ApiResponse.success('Lấy tất cả người dùng thành công', result));
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.serverError(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };
}
