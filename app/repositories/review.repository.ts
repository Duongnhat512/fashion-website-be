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
import { IsNull, Not } from "typeorm";
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
      replyTo: { id: review.replyToId } as any,
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
    console.log(`Deleting review ${id} and all its replies...`);

    // First, delete all replies to this review
    await this.deleteReviewReplies(id);

    // Then delete the main review
    await this.reviewRepository.delete(id);

    console.log(`Successfully deleted review ${id} and all its replies`);
  }

  /**
   * Delete all replies for a given review (recursive for nested replies)
   */
  private async deleteReviewReplies(reviewId: string): Promise<void> {
    const replies = await this.reviewRepository.find({
      where: { replyTo: { id: reviewId } },
    });

    if (replies.length > 0) {
      console.log(`Found ${replies.length} replies for review ${reviewId}`);
    }

    for (const reply of replies) {
      // Recursively delete replies of replies (nested replies)
      await this.deleteReviewReplies(reply.id);
      await this.reviewRepository.delete(reply.id);
      console.log(`Deleted reply ${reply.id}`);
    }
  }

  async getReviewById(id: string): Promise<ReviewResponseDto> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: {
        product: true,
        user: true,
        replyTo: true,
        replies: {
          user: true,
        },
      },
    });

    if (!review) {
      throw new Error('Không tìm thấy đánh giá.');
    }

    return {
      id: review.id,
      productId: review.product?.id || '',
      userId: review.user?.id || '',
      userName: review.user?.fullname || '',
      replyToId: review.replyTo ? review.replyTo.id : null,
      userAvatar: review.user?.avt || '',
     images: review.images || [], 
      rating: review.rating,
      comment: review.comment,
      isVerified: review.isVerified,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  /**
   * Get review entity with relations (for internal use)
   */
  async getReviewEntityById(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: {
        product: true,
        user: true,
        replyTo: true,
        replies: true,
      },
    });

    if (!review) {
      throw new Error('Không tìm thấy đánh giá.');
    }

    return review;
  }

  async getReviewsByProductId(
    productId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedReviewsResponseDto> {
 const [reviews, total] = await this.reviewRepository.findAndCount({
  relations: {
    user: true,
    product: true,
    replyTo: true,
    replies: {
      user: true,
    },
  },
  where: {
    replyTo: IsNull(),
    // Ensure user and product exist
    user: {
      id: Not(IsNull()),
    },
    product: {
      id: Not(IsNull()),
    },
  },
  skip: (page - 1) * limit,
  take: limit,
  order: {
    createdAt: "DESC",
  },
});


    return {
      reviews: reviews.map((review) => {
        // Debug logging for null relations
        if (!review.product) {
          console.warn(`Review ${review.id} has no product relation`);
        }
        if (!review.user) {
          console.warn(`Review ${review.id} has no user relation`);
        }

        return {
          id: review.id,
          productId: review.product?.id || '',
          userId: review.user?.id || '',
          userName: review.user?.fullname || '',
          replyToId: review.replyTo ? review.replyTo.id : null,
          userAvatar: review.user?.avt || '',
          rating: review.rating,
          comment: review.comment,
          images: review.images || [], 
          isVerified: review.isVerified,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt,
            replies: review.replies?.map((reply) => {
              if (!reply.user) {
                console.warn(`Reply ${reply.id} has no user relation`);
              }
              return {
                id: reply.id,
                userId: reply.user?.id || '',
                userName: reply.user?.fullname || '',
                userAvatar: reply.user?.avt || '', 
                comment: reply.comment,
                rating: reply.rating,
                images: reply.images || [],
                createdAt: reply.createdAt,
              };
            }) || [],
        };
      }),
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
async getAllReviews(
  page: number = 1,
  limit: number = 10
): Promise<PaginatedReviewsResponseDto> {
 const [reviews, total] = await this.reviewRepository.findAndCount({
  relations: {
    user: true,
    product: true,
    replyTo: true,
    replies: {
      user: true,
    },
  },
  where: {
    replyTo: IsNull(),
    // Ensure user and product exist
    user: {
      id: Not(IsNull()),
    },
    product: {
      id: Not(IsNull()),
    },
  },
  skip: (page - 1) * limit,
  take: limit,
  order: {
    createdAt: "DESC",
  },
});

  return {
    reviews: reviews.map((review) => {
      // Debug logging for null relations
      if (!review.product) {
        console.warn(`Review ${review.id} has no product relation`);
      }
      if (!review.user) {
        console.warn(`Review ${review.id} has no user relation`);
      }

      return {
        id: review.id,
        productId: review.product?.id || '',
        userId: review.user?.id || '',
        images: review.images || [], 
        replyToId: review.replyTo ? review.replyTo.id : null,
        userName: review.user?.fullname || '',
        userAvatar: review.user?.avt || '',
        rating: review.rating,
        comment: review.comment,
        isVerified: review.isVerified,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
          replies: review.replies?.map((reply) => {
            if (!reply.user) {
              console.warn(`Reply ${reply.id} has no user relation`);
            }
            return {
              id: reply.id,
              userId: reply.user?.id || '',
              userName: reply.user?.fullname || '',
              userAvatar: reply.user?.avt || '',
              comment: reply.comment,
              rating: reply.rating,
              images: reply.images || [],
              createdAt: reply.createdAt,
            };
          }) || [],
      };
    }),
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
