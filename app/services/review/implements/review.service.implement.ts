import { IReviewService } from '../review.service.interface';
import { ReviewRepository } from '../../../repositories/review.repository';
import {
  CreateReviewRequestDto,
  UpdateReviewRequestDto,
} from '../../../dtos/request/review/review.request';
import {
  PaginatedReviewsResponseDto,
  ReviewResponseDto,
} from '../../../dtos/response/review/review.response';
import { ProductRepository } from '../../../repositories/product.repository';
import Role from '../../../models/enum/role.enum';
import { IProductCacheService } from '../../product/product_cache.service.interface';
import { ProductCacheService } from '../../product/implements/product_cache.service.implement';

export class ReviewService implements IReviewService {
  private readonly reviewRepository: ReviewRepository;
  private readonly productRepository: ProductRepository;
  private readonly productCacheService: IProductCacheService;

  constructor() {
    this.reviewRepository = new ReviewRepository();
    this.productRepository = new ProductRepository();
    this.productCacheService = new ProductCacheService();
  }

  async createReview(
    review: CreateReviewRequestDto,
    userId: string,
  ): Promise<ReviewResponseDto> {
    await this.productRepository.getProductById(review.productId);

    const newReview = await this.reviewRepository.createReview(review, userId);

    await this.updateProductRating(review.productId);

    return newReview;
  }

  async updateReview(
    review: UpdateReviewRequestDto,
    userId: string,
  ): Promise<ReviewResponseDto> {
    const existingReview = await this.reviewRepository.getReviewById(review.id);

    if (existingReview.userId !== userId) {
      throw new Error('Bạn không có quyền cập nhật review này');
    }

    const updatedReview = await this.reviewRepository.updateReview(review);

    await this.updateProductRating(existingReview.productId);

    return updatedReview;
  }

  async deleteReview(
    id: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    const review = await this.reviewRepository.getReviewById(id);

    if (review.userId !== userId && userRole !== Role.ADMIN) {
      throw new Error('Bạn không có quyền xóa review này');
    }

    const productId = review.productId;

    await this.reviewRepository.deleteReview(id);

    await this.updateProductRating(productId);
  }

  async getReviewById(id: string): Promise<ReviewResponseDto> {
    return this.reviewRepository.getReviewById(id);
  }

  async getReviewsByProductId(
    productId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedReviewsResponseDto> {
    return this.reviewRepository.getReviewsByProductId(productId, page, limit);
  }

  private async updateProductRating(productId: string): Promise<void> {
    const ratingData = await this.reviewRepository.calculateProductRating(
      productId,
    );

    const ratingAverage = Math.round(ratingData.average * 10) / 10;
    const ratingCount = ratingData.count;

    await this.productRepository.updateProductRating(
      productId,
      ratingAverage,
      ratingCount,
    );

    try {
      const exists = await this.productCacheService.existsProduct(productId);
      if (exists) {
        await this.productCacheService.updateProductRating(
          productId,
          ratingAverage,
          ratingCount,
        );
      } else {
        const product = await this.productRepository.getProductById(productId);
        await this.productCacheService.indexProduct(product);
      }
    } catch (error) {
      console.error('Error updating product rating in Redis:', error);
    }
  }
}
