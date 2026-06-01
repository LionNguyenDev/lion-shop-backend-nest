import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/strategy/jwt-auth.guard';
import { RolesGuard } from 'src/auth/strategy/roles.guard';
import { Roles } from 'src/custom.decorator';
import { Role } from 'src/users/enums/role.enum';
import { OrderNotesService } from './order-notes.service';
import { CreateOrderNoteDto } from './dto/create-order-note.dto';
import { UpdateOrderNoteDto } from './dto/update-order-note.dto';

@ApiTags('order-notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.admin)
@Controller('order-notes')
export class OrderNotesController {
  constructor(private readonly orderNotesService: OrderNotesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả order notes' })
  findAll() {
    return this.orderNotesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết 1 order note' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orderNotesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo order note mới' })
  create(@Body() dto: CreateOrderNoteDto) {
    return this.orderNotesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật order note' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderNoteDto) {
    return this.orderNotesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa order note' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.orderNotesService.remove(id);
  }
}
