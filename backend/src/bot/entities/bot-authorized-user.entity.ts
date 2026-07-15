import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Seller } from '../../sellers/seller.entity';

@Entity()
export class BotAuthorizedUser {
  @PrimaryColumn()
  telegramId: string;

  @Column()
  phone: string;

  @Column()
  sellerId: string;

  @ManyToOne(() => Seller, (seller) => seller.botUsers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sellerId' })
  seller: Seller;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
