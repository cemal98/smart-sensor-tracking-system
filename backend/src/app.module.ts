import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';

// Import modules
import { InfluxDBModule } from './influxdb/influxdb.module';
import { LoggingModule } from './logging/logging.module';

// Other modules will be imported later
// import { AuthModule } from './auth/auth.module';
// import { UsersModule } from './users/users.module';
// import { CompaniesModule } from './companies/companies.module';
// import { SensorsModule } from './sensors/sensors.module';
// import { MqttModule } from './mqtt/mqtt.module';
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
    ThrottlerModule.forRoot([{
      ttl: 60,
      limit: 100,
    }]),
    
    // Core modules
    InfluxDBModule,
    LoggingModule,
    
    // Other modules will be added later
    // AuthModule,
    // UsersModule, 
    // CompaniesModule,
    // SensorsModule,
    // MqttModule,
    // UserActivityModule,
  ],
})
export class AppModule {}