import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Seller } from '../sellers/seller.entity';
import { Category } from '../categories/category.entity';

export interface PublishedTelegramInfo {
  chatId: string;
  messageIds: string[];
}

@Entity()
@Index(['sellerId'])
@Index(['categoryId'])
@Index(['title'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column('decimal', { precision: 10, scale: 2 })
  price: string;

  @Column({ default: 'KZT' })
  currency: string;

  @Column('text', { array: true, default: '{}' })
  photos: string[];

  @Column('text', { array: true, default: '{}' })
  extraPhotos: string[];

  @Column({ type: 'text', nullable: true })
  subtype: string | null;

  @Column({ type: 'text', nullable: true })
  brand: string | null;

  @Column({ type: 'text', nullable: true })
  originCountry: string | null;

  @Column('text', { array: true, default: '{}' })
  materials: string[];

  @Column('text', { array: true, default: '{}' })
  sizes: string[];

  @Column('text', { array: true, default: '{}' })
  colors: string[];

  @Column({ default: true })
  inStock: boolean;

  @Column({ type: 'text', nullable: true })
  sellerUrl: string | null;

  @Column({ default: false })
  isPublished: boolean;

  @Column('jsonb', { nullable: true })
  publishedTelegram: PublishedTelegramInfo | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @Column()
  sellerId: string;

  @ManyToOne(() => Seller, (seller) => seller.products, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sellerId' })
  seller: Seller;

  @Column()
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.products, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;
}
