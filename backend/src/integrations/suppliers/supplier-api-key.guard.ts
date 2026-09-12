import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface SupplierClient {
  sellerSlug: string;
  apiKey: string;
}

const CONFIG_PATH = join(process.cwd(), 'config', 'suppliers-clients.json');

// Тот же приём, что ApiKeyGuard в showroom (config/bot-products-clients.json)
// — ключи поставщиков правятся вручную в config/suppliers-clients.json на
// каждом окружении, без деплоя кода и без похода в БД. Файл гитигнорится
// (см. .gitignore), в репозитории только config/suppliers-clients.example.json
// как образец формата.
@Injectable()
export class SupplierApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.header('x-api-key') as string | undefined;
    if (!apiKey) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    const client = this.findClient(apiKey);
    if (!client) {
      throw new UnauthorizedException('Invalid API key');
    }

    (request as { supplierSellerSlug?: string }).supplierSellerSlug = client.sellerSlug;
    return true;
  }

  private findClient(apiKey: string): SupplierClient | undefined {
    if (!existsSync(CONFIG_PATH)) return undefined;
    const clients = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) as SupplierClient[];
    return clients.find((client) => client.apiKey === apiKey);
  }
}
