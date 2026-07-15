import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type BotPresetKind = 'subtype' | 'brand' | 'country' | 'material';

@Entity()
@Index(['kind', 'value'], { unique: true })
export class BotCustomPreset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  kind: BotPresetKind;

  @Column()
  value: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
