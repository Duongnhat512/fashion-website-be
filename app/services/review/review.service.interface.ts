import {
  CreateReviewRequestDto,
  UpdateReviewRequestDto,
} from '../../dtos/request/review/review.request';
import {
  PaginatedReviewsResponseDto,
  ReviewResponseDto,
} from '../../dtos/response/review/review.response';

export interface IReviewService {
  createReview(
    review: CreateReviewRequestDto,
    userId: string,
  ): Promise<ReviewResponseDto>;
  updateReview(
    review: UpdateReviewRequestDto,
    userId: string,
  ): Promise<ReviewResponseDto>;
  deleteReview(id: string, userId: string, userRole: string): Promise<void>;
  getReviewById(id: string): Promise<ReviewResponseDto>;
  getReviewsByProductId(
    productId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedReviewsResponseDto>;
}
