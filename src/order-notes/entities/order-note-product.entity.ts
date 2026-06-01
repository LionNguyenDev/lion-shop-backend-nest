import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrderNote } from './order-note.entity';

@Entity('order_note_products')
export class OrderNoteProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  orderNoteId: number;

  @ManyToOne(() => OrderNote, (note) => note.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderNoteId' })
  orderNote: OrderNote;

  @Column()
  name: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;
}
