import { Request, Response } from 'express';
import { IReviewService } from '../services/review/review.service.interface';
import { ReviewService } from '../services/review/implements/review.service.implement';
import { ApiResponse } from '../dtos/response/api.response.dto';
import {
  CreateReviewRequestDto,
  UpdateReviewRequestDto,
} from '../dtos/request/review/review.request';
import { validate } from 'class-validator';
import { ValidationErrorDto } from '../dtos/response/response.dto';
import { ICloudService } from '../services/cloud/cloud.service.interface';
import { CloudinaryService } from '../services/cloud/implements/cloudinary.service.implement';
import { plainToInstance } from 'class-transformer';

export class ReviewController {
  private readonly reviewService: IReviewService;
  private readonly cloudService: ICloudService;

  constructor() {
    this.reviewService = new ReviewService();
    this.cloudService = new CloudinaryService();
  }

  async createReview(req: Request, res: Response) {
    let publicIds: string[] = [];

    try {
      const images = req.files as Express.Multer.File[];

      const imageUrls: string[] = [];

      for (const image of images) {
        const imageUrl = await this.cloudService.uploadImage(
          image,
          'fashion-website/reviews',
        );
        imageUrls.push(imageUrl.url);
        publicIds.push(imageUrl.publicId);
      }

      const createReviewDto = plainToInstance(CreateReviewRequestDto, req.body);
      createReviewDto.images = imageUrls;

      const errors = await validate(createReviewDto);
      if (errors.length > 0) {
        const validationErrors: ValidationErrorDto[] = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}),
        }));
        throw new Error(JSON.stringify(validationErrors));
      }

      const userId = req.user!.userId;
      const review = await this.reviewService.createReview(
        createReviewDto,
        userId,
      );

      return res
        .status(200)
        .json(ApiResponse.success('Tạo đánh giá thành công', review));
    } catch (error: any) {
      await this.cloudService.deleteMultipleImages(publicIds);
      return res.status(400).json(
        ApiResponse.error(error.message || 'Tạo đánh giá thất bại', [
          {
            field: 'createReview',
            message: [error.message || 'Tạo đánh giá thất bại'],
          },
        ]),
      );
    }
  }

  async updateReview(req: Request, res: Response) {
    let publicIds: string[] = [];

    try {
      const updateReviewDto = plainToInstance(UpdateReviewRequestDto, req.body);
      updateReviewDto.id = req.params.id;

      const images = req.files as Express.Multer.File[];

      const imageUrls: string[] = [];

      for (const image of images) {
        const imageUrl = await this.cloudService.uploadImage(
          image,
          'fashion-website/reviews',
        );
        imageUrls.push(imageUrl.url);
      }

      updateReviewDto.images = imageUrls;

      const errors = await validate(updateReviewDto);
      if (errors.length > 0) {
        const validationErrors: ValidationErrorDto[] = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints || {}),
        }));
        throw new Error(JSON.stringify(validationErrors));
      }

      const userId = req.user!.userId;
      const review = await this.reviewService.updateReview(
        updateReviewDto,
        userId,
      );

      return res
        .status(200)
        .json(ApiResponse.success('Cập nhật đánh giá thành công', review));
    } catch (error: any) {
      await this.cloudService.deleteMultipleImages(publicIds);

      return res.status(400).json(
        ApiResponse.error(error.message || 'Cập nhật đánh giá thất bại', [
          {
            field: 'updateReview',
            message: [error.message || 'Cập nhật đánh giá thất bại'],
          },
        ]),
      );
    }
  }

  async deleteReview(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      await this.reviewService.deleteReview(id, userId, userRole);

      return res
        .status(200)
        .json(ApiResponse.success('Xóa đánh giá thành công', null));
    } catch (error: any) {
      return res.status(400).json(
        ApiResponse.error(error.message || 'Xóa đánh giá thất bại', [
          {
            field: 'deleteReview',
            message: [error.message || 'Xóa đánh giá thất bại'],
          },
        ]),
      );
    }
  }

  async getReviewById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const review = await this.reviewService.getReviewById(id);

      return res
        .status(200)
        .json(ApiResponse.success('Chi tiết đánh giá', review));
    } catch (error: any) {
      return res.status(404).json(
        ApiResponse.error(error.message || 'Không tìm thấy đánh giá', [
          {
            field: 'getReviewById',
            message: [error.message || 'Không tìm thấy đánh giá'],
          },
        ]),
      );
    }
  }

  async getReviewsByProductId(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const reviews = await this.reviewService.getReviewsByProductId(
        productId,
        Number(page),
        Number(limit),
      );

      return res
        .status(200)
        .json(ApiResponse.success('Danh sách đánh giá', reviews));
    } catch (error: any) {
      return res.status(400).json(
        ApiResponse.error(error.message || 'Lấy danh sách đánh giá thất bại', [
          {
            field: 'getReviewsByProductId',
            message: [error.message || 'Lấy danh sách đánh giá thất bại'],
          },
        ]),
      );
    }
  }
}
