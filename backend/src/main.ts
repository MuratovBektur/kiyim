import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' });
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Backend запущен на http://localhost:${port}`);
}

bootstrap();
