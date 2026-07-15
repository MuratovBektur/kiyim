import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotCustomPreset, BotPresetKind } from './entities/bot-custom-preset.entity';

@Injectable()
export class BotPresetsService {
  constructor(@InjectRepository(BotCustomPreset) private readonly presetRepo: Repository<BotCustomPreset>) {}

  async listCustom(kind: BotPresetKind): Promise<string[]> {
    const rows = await this.presetRepo.find({ where: { kind }, order: { createdAt: 'ASC' } });
    return rows.map((row) => row.value);
  }

  async remember(kind: BotPresetKind, value: string): Promise<void> {
    const trimmed = value.trim();
    if (!trimmed) return;
    const exists = await this.presetRepo.findOne({ where: { kind, value: trimmed } });
    if (exists) return;
    await this.presetRepo.save(this.presetRepo.create({ kind, value: trimmed }));
  }
}
