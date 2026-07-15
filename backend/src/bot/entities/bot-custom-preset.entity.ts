import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type BotPresetKind = 'subtype' | 'brand' | 'country' | 'material' | 'color' | 'size';

@Entity()
@Index(['kind', 'value', 'categorySlug'], { unique: true })
export class BotCustomPreset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  kind: BotPresetKind;

  @Column()
  value: string;

  // Only meaningful for kind='subtype'/'size' (subtypes and size grids are
  // per-category); '' (not null, so the unique index actually enforces
  // uniqueness) for brand/country/material/color, which are global.
  @Column({ default: '' })
  categorySlug: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
