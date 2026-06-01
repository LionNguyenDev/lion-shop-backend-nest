import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';

export class OrderNoteProductDto {
  @ApiProperty({ example: 'Kem chống nắng SPF50' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 2, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}

export class CreateOrderNoteDto {
  @ApiProperty({ example: 'DH-2026-001' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  orderCode: string;

  @ApiProperty({ type: [OrderNoteProductDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderNoteProductDto)
  products: OrderNoteProductDto[];

  @ApiProperty({ example: 'Khách yêu cầu gói quà, kèm thiệp sinh nhật' })
  @IsNotEmpty()
  @IsString()
  note: string;
}
