export class CategoryResponseDto {
  id!: string;
  name!: string;
  iconUrl!: string;
  status!: string;
  slug!: string;
  layout!: string;
  autoGenSlug!: boolean;
  autoGenSeoTitle!: boolean;
  autoGenSeoDescription!: boolean;
  parent?: CategoryResponseDto;
  children?: CategoryResponseDto[];
  createdAt!: Date;
  updatedAt!: Date;
}

export class CategoryTreeResponseDto {
  id!: string;
  name!: string;
  iconUrl!: string;
  status!: string;
  slug!: string;
  autoGenSlug!: boolean;
  autoGenSeoTitle!: boolean;
  autoGenSeoDescription!: boolean;
  layout!: string;
  parent?: CategoryTreeResponseDto;
  createdAt!: Date;
  updatedAt!: Date;
  children?: CategoryTreeResponseDto[];
  path?: string[];
}
