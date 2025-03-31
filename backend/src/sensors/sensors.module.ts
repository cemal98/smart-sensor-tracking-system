import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensorsController } from './sensors.controller';
import { SensorsService } from './sensors.service';
import { SensorsGateway } from './sensors.gateway';
import { Sensor } from './entities/sensor.entity';
import { InfluxDBModule } from '../influxdb/influxdb.module';
import { MqttModule } from '../mqtt/mqtt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sensor]),
    InfluxDBModule,
    forwardRef(() => MqttModule),
  ],
  controllers: [SensorsController],
  providers: [SensorsService, SensorsGateway],
  exports: [SensorsService, SensorsGateway],
})
export class SensorsModule {}