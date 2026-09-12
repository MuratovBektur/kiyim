import { Module } from '@nestjs/common';
import { MirJeansModule } from './mir-jeans/mir-jeans.module';
import { SuppliersModule } from './suppliers/suppliers.module';

// Входящие вебхуки от внешних систем-источников товаров. MirJeansModule —
// один жёстко закодированный источник со своей таксономией и своим
// секретом (IngestTokenGuard). SuppliersModule — общий эндпоинт на много
// поставщиков в одном формате, отличающихся ключом Seller.apiKey, а не
// отдельным контроллером на каждого (см. suppliers/suppliers-ingest.controller.ts).
// Следующий источник вроде mir-jeans добавляется сюда ещё одним модулем;
// поставщик вроде suppliers — просто выдачей apiKey существующему продавцу.
@Module({
  imports: [MirJeansModule, SuppliersModule],
})
export class IntegrationsModule {}
