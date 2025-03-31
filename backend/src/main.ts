import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  logger.log('Uygulama başlatılıyor...');

  const app = await NestFactory.create(AppModule);
  logger.log('NestJS uygulaması oluşturuldu');

  app.enableCors();
  logger.log('CORS aktif');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  logger.log('ValidationPipe yüklendi');

  app.setGlobalPrefix('api');
  logger.log('📦 Global prefix belirlendi: /api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Akıllı Sensör Takip Sistemi API')
    .setDescription('Fabrika sensörlerinden veri toplayan ve analiz eden API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);
  logger.log('Swagger yüklendi: /api/docs');

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;
  logger.log(`Port ayarlandı: ${port}`);

  await app.listen(port);
  logger.log(`Uygulama çalışıyor: ${await app.getUrl()}`);
}

bootstrap();
