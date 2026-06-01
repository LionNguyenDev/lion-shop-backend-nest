import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { numericTransformer } from 'src/common/transformers/numeric.transformer';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Index()
  @Column({ length: 100 })
  brand: string;

  @Column({ length: 100 })
  type: string;

  @Column({ type: 'bigint', transformer: numericTransformer })
  originalPrice: number;

  @Column({ type: 'bigint', transformer: numericTransformer })
  sellingPrice: number;

  @Column({ type: 'int', default: 0 })
  stockHN: number;

  @Column({ type: 'int', default: 0 })
  stockQB: number;

  @Column({ type: 'int', default: 0 })
  stockSG: number;

  @Column({ type: 'text' })
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
