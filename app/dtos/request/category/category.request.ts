import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryRequestDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  iconUrl!: string;
}
