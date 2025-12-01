export class ReviewResponseDto {
  id!: string;
  productId!: string;
  userId!: string;
  userName!: string;
  userAvatar?: string;
  replyToId: string | null;
  images!: string[];
  rating!: number;
  comment?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export class PaginatedReviewsResponseDto {
  reviews!: ReviewResponseDto[];
  pagination!: {
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    page: number;
    limit: number;
  };
}
