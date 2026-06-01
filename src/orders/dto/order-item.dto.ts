import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class OrderItemDto {
  @ApiProperty({ description: 'ID sản phẩm' })
  @IsNotEmpty()
  @IsInt()
  productId!: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity!: number;
}
