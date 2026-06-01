import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class OrderItemDto {
  @ApiPropertyOptional({ description: 'ID sản phẩm (null nếu sản phẩm đã bị xóa)' })
  @IsOptional()
  @IsInt()
  productId?: number;

  @ApiProperty({ example: 'Kem chống nắng SPF50' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  productName: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 240000, description: 'Giá bán thực tế trong đơn (VND)' })
  @IsInt()
  @Min(0)
  price: number;

  @ApiProperty({ example: 180000, description: 'Giá vốn snapshot (VND)' })
  @IsInt()
  @Min(0)
  originalPrice: number;
}
