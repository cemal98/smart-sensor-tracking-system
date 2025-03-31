import { Module, forwardRef } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sensor } from '../sensors/entities/sensor.entity';
import { SensorsModule } from '../sensors/sensors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sensor]),
    forwardRef(() => SensorsModule),
  ],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}