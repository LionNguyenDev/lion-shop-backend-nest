import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Kem chống nắng SPF50' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'Skin1004' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  brand: string;

  @ApiProperty({ example: 'Skincare' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  type: string;

  @ApiProperty({ example: 180000, description: 'Giá nhập (VND)' })
  @IsInt()
  @Min(0)
  originalPrice: number;

  @ApiProperty({ example: 250000, description: 'Giá bán (VND)' })
  @IsInt()
  @Min(0)
  sellingPrice: number;

  @ApiProperty({ example: 10, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockHN?: number;

  @ApiProperty({ example: 5, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockQB?: number;

  @ApiProperty({ example: 8, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stockSG?: number;

  @ApiProperty({ example: 'https://cdn.example.com/image.jpg', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
