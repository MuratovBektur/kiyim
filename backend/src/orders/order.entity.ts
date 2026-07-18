import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Seller } from '../sellers/seller.entity';

export interface OrderItemSnapshot {
  productId: string;
  title: string;
  size: string | null;
  color: string | null;
  quantity: number;
  price: string;
  currency: string;
}

@Entity()
@Index(['sellerId'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  phone: string;

  @Column('jsonb')
  items: OrderItemSnapshot[];

  @Column('decimal', { precision: 10, scale: 2 })
  total: string;

  @Column()
  currency: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column()
  sellerId: string;

  @ManyToOne(() => Seller, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: Seller;
}
