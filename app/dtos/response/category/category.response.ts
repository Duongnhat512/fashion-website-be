import { IsArray, IsDate, IsNotEmpty, IsString } from 'class-validator';

export class CategoryResponseDto {
  id!: string;
  name!: string;
  iconUrl!: string;
  status!: string;
  slug!: string;
  layout!: string;
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
  position!: number;
  level!: number;
  layout!: string;
  parent?: CategoryTreeResponseDto;
  createdAt!: Date;
  updatedAt!: Date;
  children?: CategoryTreeResponseDto[];
  path?: string[];
}
