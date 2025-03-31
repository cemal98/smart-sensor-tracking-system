import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
// Import modules
import { InfluxDBModule } from './influxdb/influxdb.module';
import { LoggingModule } from './logging/logging.module';
import { SensorsModule } from './sensors/sensors.module';
import { MqttModule } from './mqtt/mqtt.module';
import { AuthModule } from './auth/auth.module';
import { UserActivityModule } from './user-activity/user-activity.module';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';

@Module({
  imports: [
    // Konfigürasyon
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    
    // PostgreSQL Veritabanı
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('database.synchronize'),
        logging: configService.get('database.logging'),
        dropSchema: process.env.NODE_ENV === 'development' && process.env.DB_DROP_SCHEMA === 'true',
      }),
    }),
    
    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('throttle.ttl', 60),
          limit: configService.get<number>('throttle.limit', 100),
        },
      ],
    }),
    
    // Temel modüller
    InfluxDBModule,
    LoggingModule,
    UsersModule,
    CompaniesModule,
    SensorsModule,
    MqttModule,
    AuthModule,
    UserActivityModule,
  ],
})
export class AppModule {}