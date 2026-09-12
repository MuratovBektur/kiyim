import { CanActivate, ExecutionContext, Injectable, mixin, ServiceUnavailableException, Type, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

// Общий guard для входящих вебхуков внешних интеграций (см. src/integrations).
// Каждый источник получает свой env var с токеном — IngestTokenGuard('MIR_JEANS')
// проверяет process.env.MIR_JEANS_INGEST_TOKEN. Добавить следующий источник —
// это IngestTokenGuard('SOME_OTHER_SOURCE') на новом контроллере плюс
// SOME_OTHER_SOURCE_INGEST_TOKEN в .env, без изменений тут.
export function IngestTokenGuard(envPrefix: string): Type<CanActivate> {
  class MixinIngestTokenGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const expected = process.env[`${envPrefix}_INGEST_TOKEN`];
      if (!expected) {
        throw new ServiceUnavailableException(`Интеграция ${envPrefix} не настроена (нет ${envPrefix}_INGEST_TOKEN на сервере).`);
      }

      const request = context.switchToHttp().getRequest<Request>();
      const provided = request.header('x-ingest-token');
      if (!provided || provided !== expected) {
        throw new UnauthorizedException('Неверный или отсутствующий x-ingest-token.');
      }

      return true;
    }
  }

  return mixin(MixinIngestTokenGuard);
}
