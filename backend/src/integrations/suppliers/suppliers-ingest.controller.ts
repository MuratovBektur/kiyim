import { Body, Controller, Delete, HttpCode, NotFoundException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SupplierApiKeyGuard } from './supplier-api-key.guard';
import { SuppliersIngestService } from './suppliers-ingest.service';
import { UpsertSupplierProductDto } from './dto/upsert-supplier-product.dto';

// Общий эндпоинт на много поставщиков в одном формате (в отличие от
// /integrations/mir-jeans/products — тот жёстко под один источник со своей
// таксономией). Кто именно публикует, определяет не путь, а ключ в
// заголовке x-api-key — см. SupplierApiKeyGuard и config/suppliers-clients.json.
@Controller('integrations/suppliers/products')
@UseGuards(SupplierApiKeyGuard)
export class SuppliersIngestController {
  constructor(private readonly ingestService: SuppliersIngestService) {}

  @Post()
  async upsert(@Body() dto: UpsertSupplierProductDto, @Req() req: { supplierSellerSlug?: string }) {
    return this.ingestService.upsert(req.supplierSellerSlug!, dto);
  }

  @Delete(':externalId')
  @HttpCode(204)
  async remove(@Param('externalId') externalId: string, @Req() req: { supplierSellerSlug?: string }): Promise<void> {
    const removed = await this.ingestService.remove(req.supplierSellerSlug!, externalId);
    if (!removed) throw new NotFoundException('Товар не найден');
  }
}
