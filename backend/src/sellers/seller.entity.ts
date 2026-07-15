import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../products/product.entity';
import { BotAllowedPhone } from '../bot/entities/bot-allowed-phone.entity';
import { BotAuthorizedUser } from '../bot/entities/bot-authorized-user.entity';

@Entity()
export class Seller {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column('double precision', { default: 0 })
  rating: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'text', nullable: true })
  contactPhone: string | null;

  @Column({ type: 'text', nullable: true })
  telegramChatId: string | null;

  @Column({ type: 'text', nullable: true })
  telegramChatTitle: string | null;

  @OneToMany(() => Product, (product) => product.seller)
  products: Product[];

  @OneToMany(() => BotAllowedPhone, (phone) => phone.seller)
  allowedPhones: BotAllowedPhone[];

  @OneToMany(() => BotAuthorizedUser, (user) => user.seller)
  botUsers: BotAuthorizedUser[];
}
