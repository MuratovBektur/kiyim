import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotCustomPreset, BotPresetKind } from './entities/bot-custom-preset.entity';

// Most-recently-used list per (kind, categorySlug): remembering a value
// bumps it to the top, and once a group grows past this size the oldest
// entries fall off the bottom.
const MAX_PRESETS_PER_GROUP = 10;

@Injectable()
export class BotPresetsService {
  constructor(@InjectRepository(BotCustomPreset) private readonly presetRepo: Repository<BotCustomPreset>) {}

  // categorySlug only matters (and must be passed) for kind='subtype'/'size'
  // — those presets are per-category, everything else is global.
  async listCustom(kind: BotPresetKind, categorySlug = ''): Promise<string[]> {
    const rows = await this.presetRepo.find({ where: { kind, categorySlug }, order: { createdAt: 'DESC' } });
    return rows.map((row) => row.value);
  }

  async remember(kind: BotPresetKind, value: string, categorySlug = ''): Promise<void> {
    const trimmed = value.trim();
    if (!trimmed) return;

    const existing = await this.presetRepo.findOne({ where: { kind, value: trimmed, categorySlug } });
    if (existing) {
      // Re-used — bump it back to the top of the MRU order.
      existing.createdAt = new Date();
      await this.presetRepo.save(existing);
    } else {
      await this.presetRepo.save(this.presetRepo.create({ kind, value: trimmed, categorySlug }));
    }

    await this.evictOldest(kind, categorySlug);
  }

  private async evictOldest(kind: BotPresetKind, categorySlug: string): Promise<void> {
    const rows = await this.presetRepo.find({ where: { kind, categorySlug }, order: { createdAt: 'DESC' } });
    const stale = rows.slice(MAX_PRESETS_PER_GROUP);
    if (stale.length) await this.presetRepo.remove(stale);
  }
}
