import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('customers')
@Unique(['phone'])
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Index()
  @Column({ length: 20 })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'int', default: 0 })
  orderCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
