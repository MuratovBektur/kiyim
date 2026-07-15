import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Seller } from '../../sellers/seller.entity';

@Entity()
export class BotAllowedPhone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  phone: string;

  @Column()
  sellerId: string;

  @ManyToOne(() => Seller, (seller) => seller.allowedPhones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: Seller;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
