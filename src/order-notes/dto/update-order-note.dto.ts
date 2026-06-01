import { PartialType } from '@nestjs/swagger';
import { CreateOrderNoteDto } from './create-order-note.dto';

export class UpdateOrderNoteDto extends PartialType(CreateOrderNoteDto) {}
