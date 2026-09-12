import { Body, Controller, Delete, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { IngestTokenGuard } from '../ingest-token.guard';
import { MirJeansIngestService } from './mir-jeans-ingest.service';
import { UpsertMirJeansProductDto } from './dto/upsert-mir-jeans-product.dto';

// Принимает вебхуки от бота "Мир Джинс" при публикации/удалении товара —
// см. server/src/modules/integrations/kiyim-sync.service.ts в том проекте.
// Авторизация — общий секрет в заголовке x-ingest-token (MIR_JEANS_INGEST_TOKEN).
@Controller('integrations/mir-jeans/products')
@UseGuards(IngestTokenGuard('MIR_JEANS'))
export class MirJeansIngestController {
  constructor(private readonly ingestService: MirJeansIngestService) {}

  @Post()
  async upsert(@Body() dto: UpsertMirJeansProductDto) {
    return this.ingestService.upsert(dto);
  }

  @Delete(':externalId')
  @HttpCode(204)
  async remove(@Param('externalId') externalId: string): Promise<void> {
    await this.ingestService.remove(externalId);
  }
}
