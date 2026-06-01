import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { Warehouse } from 'src/common/enums/warehouse.enum';
import { OrderItemDto } from './order-item.dto';

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ example: 'Nguyễn Khánh Linh' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  customerName: string;

  @ApiProperty({ example: '0901234567' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({ example: '123 Nguyễn Trãi, Q.1, TP.HCM' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ enum: Warehouse, example: Warehouse.SG })
  @IsEnum(Warehouse)
  warehouse: Warehouse;

  @ApiPropertyOptional({ enum: OrderStatus, default: OrderStatus.UNPAID })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
