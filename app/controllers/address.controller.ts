import { Request, Response } from 'express';
import { AddressService } from '../services/address/implements/address.service.implement';
import {
  CreateAddressRequestDto,
  UpdateAddressRequestDto,
} from '../dtos/request/address/address.request';
import { validate } from 'class-validator';
import { ValidationErrorDto } from '../dtos/response/response.dto';
import { ApiResponse } from '../dtos/response/api.response.dto';

export class AddressController {
  private readonly addressService: AddressService;

  constructor() {
    this.addressService = new AddressService();
  }

  createAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json(ApiResponse.error('Chưa đăng nhập'));
        return;
      }

      const createAddressDto = new CreateAddressRequestDto();
      Object.assign(createAddressDto, req.body);

      const errors = await validate(createAddressDto);
      if (errors.length > 0) {
        const validationErrors: ValidationErrorDto[] = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}),
        }));

        res.status(400).json(ApiResponse.validationError(validationErrors));
        return;
      }

      const address = await this.addressService.createAddress(
        userId,
        createAddressDto,
      );

      res
        .status(201)
        .json(ApiResponse.success('Thêm địa chỉ thành công', address));
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.error(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };

  updateAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json(ApiResponse.error('Chưa đăng nhập'));
        return;
      }

      const updateAddressDto = new UpdateAddressRequestDto();
      updateAddressDto.id = req.params.id;
      Object.assign(updateAddressDto, req.body);

      const errors = await validate(updateAddressDto);
      if (errors.length > 0) {
        const validationErrors: ValidationErrorDto[] = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}),
        }));

        res.status(400).json(ApiResponse.validationError(validationErrors));
        return;
      }

      const address = await this.addressService.updateAddress(
        userId,
        updateAddressDto,
      );

      res
        .status(200)
        .json(ApiResponse.success('Cập nhật địa chỉ thành công', address));
    } catch (error) {
      const statusCode =
        error instanceof Error && error.message.includes('quyền') ? 403 : 500;
      res.status(statusCode).json(
        ApiResponse.error(
          error instanceof Error ? error.message : 'Lỗi server',
        ),
      );
    }
  };

  deleteAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json(ApiResponse.error('Chưa đăng nhập'));
        return;
      }

      const addressId = req.params.id;
      await this.addressService.deleteAddress(userId, addressId);

      res.status(200).json(ApiResponse.success('Xóa địa chỉ thành công', null));
    } catch (error) {
      const statusCode =
        error instanceof Error && error.message.includes('quyền') ? 403 : 500;
      res.status(statusCode).json(
        ApiResponse.error(
          error instanceof Error ? error.message : 'Lỗi server',
        ),
      );
    }
  };

  getAddressById = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json(ApiResponse.error('Chưa đăng nhập'));
        return;
      }

      const addressId = req.params.id;
      const address = await this.addressService.getAddressById(
        userId,
        addressId,
      );

      res
        .status(200)
        .json(ApiResponse.success('Lấy thông tin địa chỉ thành công', address));
    } catch (error) {
      const statusCode =
        error instanceof Error && error.message.includes('quyền') ? 403 : 500;
      res.status(statusCode).json(
        ApiResponse.error(
          error instanceof Error ? error.message : 'Lỗi server',
        ),
      );
    }
  };

  getAddressesByUserId = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json(ApiResponse.error('Chưa đăng nhập'));
        return;
      }

      const addresses = await this.addressService.getAddressesByUserId(userId);

      res
        .status(200)
        .json(
          ApiResponse.success('Lấy danh sách địa chỉ thành công', addresses),
        );
    } catch (error) {
      res
        .status(500)
        .json(
          ApiResponse.error(
            error instanceof Error ? error.message : 'Lỗi server',
          ),
        );
    }
  };

  setDefaultAddress = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json(ApiResponse.error('Chưa đăng nhập'));
        return;
      }

      const addressId = req.params.id;
      const address = await this.addressService.setDefaultAddress(
        userId,
        addressId,
      );

      res
        .status(200)
        .json(
          ApiResponse.success('Đặt địa chỉ mặc định thành công', address),
        );
    } catch (error) {
      const statusCode =
        error instanceof Error && error.message.includes('quyền') ? 403 : 500;
      res.status(statusCode).json(
        ApiResponse.error(
          error instanceof Error ? error.message : 'Lỗi server',
        ),
      );
    }
  };
}

