import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderNote } from './entities/order-note.entity';
import { OrderNoteProduct } from './entities/order-note-product.entity';
import { CreateOrderNoteDto, OrderNoteProductDto } from './dto/create-order-note.dto';
import { UpdateOrderNoteDto } from './dto/update-order-note.dto';

@Injectable()
export class OrderNotesService {
  constructor(
    @InjectRepository(OrderNote)
    private readonly orderNotesRepository: Repository<OrderNote>,
    @InjectRepository(OrderNoteProduct)
    private readonly orderNoteProductsRepository: Repository<OrderNoteProduct>,
  ) {}

  private mapProducts(products: OrderNoteProductDto[]): OrderNoteProduct[] {
    return products.map((product) =>
      this.orderNoteProductsRepository.create({
        name: product.name,
        quantity: product.quantity ?? 1,
      }),
    );
  }

  findAll(): Promise<OrderNote[]> {
    return this.orderNotesRepository.find({
      relations: ['products'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<OrderNote> {
    const note = await this.orderNotesRepository.findOne({ where: { id }, relations: ['products'] });
    if (!note) throw new NotFoundException('Order note not found');
    return note;
  }

  async create(dto: CreateOrderNoteDto): Promise<OrderNote> {
    const note = this.orderNotesRepository.create({
      orderCode: dto.orderCode,
      note: dto.note,
      products: this.mapProducts(dto.products),
    });
    return this.orderNotesRepository.save(note);
  }

  async update(id: number, dto: UpdateOrderNoteDto): Promise<OrderNote> {
    const note = await this.findOne(id);

    if (dto.orderCode !== undefined) note.orderCode = dto.orderCode;
    if (dto.note !== undefined) note.note = dto.note;

    if (dto.products) {
      await this.orderNoteProductsRepository.delete({ orderNoteId: id });
      note.products = this.mapProducts(dto.products);
    }

    return this.orderNotesRepository.save(note);
  }

  async remove(id: number): Promise<void> {
    const result = await this.orderNotesRepository.delete(id);
    if (!result.affected) throw new NotFoundException('Order note not found');
  }
}
