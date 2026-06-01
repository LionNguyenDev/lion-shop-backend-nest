import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderNote } from './entities/order-note.entity';
import { OrderNoteProduct } from './entities/order-note-product.entity';
import { OrderNotesService } from './order-notes.service';
import { OrderNotesController } from './order-notes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrderNote, OrderNoteProduct])],
  providers: [OrderNotesService],
  controllers: [OrderNotesController],
  exports: [OrderNotesService],
})
export class OrderNotesModule {}
