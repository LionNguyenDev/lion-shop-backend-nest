import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { numericTransformer } from 'src/common/transformers/numeric.transformer';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { Warehouse } from 'src/common/enums/warehouse.enum';
import { Customer } from 'src/customers/entities/customer.entity';
import { OrderItem } from './order-item.entity';

@Entity('orders')
@Index(['status', 'createdAt'])
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int', nullable: true })
  customerId: number | null;

  @ManyToOne(() => Customer, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer: Customer | null;

  // Snapshot thông tin khách tại thời điểm đặt hàng
  @Column()
  customerName: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ type: 'text', default: '' })
  address: string;

  @Index()
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.UNPAID })
  status: OrderStatus;

  @Column({ type: 'enum', enum: Warehouse })
  warehouse: Warehouse;

  @Column({ type: 'bigint', transformer: numericTransformer })
  totalAmount: number;

  @Column({ type: 'bigint', transformer: numericTransformer, default: 0 })
  profit: number;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @Index()
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
