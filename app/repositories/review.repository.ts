import { Repository } from 'typeorm';
import { AppDataSource } from '../config/data_source';
import { Review } from '../models/review.model';
import {
  PaginatedReviewsResponseDto,
  ReviewResponseDto,
} from '../dtos/response/review/review.response';
import {
  CreateReviewRequestDto,
  UpdateReviewRequestDto,
} from '../dtos/request/review/review.request';
import { Product } from '../models/product.model';

export class ReviewRepository {
  private readonly reviewRepository: Repository<Review>;
  private readonly productRepository: Repository<Product>;

  constructor() {
    this.reviewRepository = AppDataSource.getRepository(Review);
    this.productRepository = AppDataSource.getRepository(Product);
  }

  async createReview(
    review: CreateReviewRequestDto,
    userId: string,
  ): Promise<ReviewResponseDto> {
    const newReview = await this.reviewRepository.save({
      ...review,
      product: { id: review.productId } as Product,
      user: { id: userId } as any,
    });

    return this.getReviewById(newReview.id);
  }

  async updateReview(
    review: UpdateReviewRequestDto,
  ): Promise<ReviewResponseDto> {
    await this.reviewRepository.update({ id: review.id }, review);
    return this.getReviewById(review.id);
  }

  async deleteReview(id: string): Promise<void> {
    await this.reviewRepository.delete(id);
  }

  async getReviewById(id: string): Promise<ReviewResponseDto> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: {
        product: true,
        user: true,
      },
    });

    if (!review) {
      throw new Error('Không tìm thấy đánh giá.');
    }

    return {
      id: review.id,
      productId: review.product.id,
      userId: review.user.id,
      userName: review.user.fullname,
      userAvatar: review.user.avt,
      rating: review.rating,
      comment: review.comment,
      isVerified: review.isVerified,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  async getReviewsByProductId(
    productId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedReviewsResponseDto> {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: { product: { id: productId } },
      relations: {
        user: true,
        product: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      reviews: reviews.map((review) => ({
        id: review.id,
        productId: review.product.id,
        userId: review.user.id,
        userName: review.user.fullname,
        userAvatar: review.user.avt,
        rating: review.rating,
        comment: review.comment,
        isVerified: review.isVerified,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
      })),
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
        page,
        limit,
      },
    };
  }

  async getReviewByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<Review | null> {
    return this.reviewRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: productId },
      },
    });
  }

  async calculateProductRating(productId: string): Promise<{
    average: number;
    count: number;
  }> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .addSelect('COUNT(review.id)', 'count')
      .where('review.product.id = :productId', { productId })
      .getRawOne();

    return {
      average: parseFloat(result.average) || 0,
      count: parseInt(result.count) || 0,
    };
  }
}
