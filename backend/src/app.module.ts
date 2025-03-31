import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';

// Modüller (şimdilik yorum satırında, sırayla ekleyeceğiz)
// import { InfluxDBModule } from './influxdb/influxdb.module';
// import { AuthModule } from './auth/auth.module';
// import { UsersModule } from './users/users.module';
// import { CompaniesModule } from './companies/companies.module';
// import { SensorsModule } from './sensors/sensors.module';
// import { MqttModule } from './mqtt/mqtt.module';
// import { LoggingModule } from './logging/logging.module';
// import { UserActivityModule } from './user-activity/user-activity.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    
    // PostgreSQL Database
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
      }),
    }),
    
    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get('throttle.ttl'),
        limit: configService.get('throttle.limit'),
      }),
    }),
    
    // Diğer modüller (şimdilik yorum satırında)
    // InfluxDBModule,
    // AuthModule,
    // UsersModule, 
    // CompaniesModule,
    // SensorsModule,
    // MqttModule,
    // LoggingModule,
    // UserActivityModule,
  ],
})
export class AppModule {}