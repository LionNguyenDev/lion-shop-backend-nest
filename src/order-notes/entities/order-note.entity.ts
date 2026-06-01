import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { OrderNoteProduct } from './order-note-product.entity';

@Entity('order_notes')
export class OrderNote {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ length: 100 })
  orderCode: string;

  @Column({ type: 'text' })
  note: string;

  @OneToMany(() => OrderNoteProduct, (product) => product.orderNote, { cascade: true })
  products: OrderNoteProduct[];

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
