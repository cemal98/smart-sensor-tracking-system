import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sensor } from './entities/sensor.entity';
import { InfluxDBService } from '../influxdb/influxdb.service';
import { SensorsGateway } from './sensors.gateway';

interface SensorData {
  sensor_id: string;
  timestamp: number;
  [key: string]: any;
}

@Injectable()
export class SensorsService {
  private readonly logger = new Logger(SensorsService.name);
  private sensorDataCache: Map<string, any> = new Map();

  constructor(
    @InjectRepository(Sensor)
    private sensorRepository: Repository<Sensor>,
    private influxDBService: InfluxDBService,
    @Inject(forwardRef(() => SensorsGateway))
    private sensorsGateway?: SensorsGateway,
  ) {}

  async processSensorData(data: SensorData): Promise<void> {
    try {
      const { sensor_id } = data;
      
      const sensor = await this.sensorRepository.findOne({
        where: { sensorId: sensor_id },
        relations: ['company'],
      });
      
      if (!sensor) {
        this.logger.warn(`Bilinmeyen sensör ID: ${sensor_id}`);
        return;
      }
      
      await this.influxDBService.writeSensorData(data);
      
      const sensorData = {
        ...data,
        receivedAt: new Date(),
        sensorInfo: {
          id: sensor.id,
          name: sensor.name,
          type: sensor.type,
          companyId: sensor.companyId,
        },
      };
      
      this.sensorDataCache.set(sensor_id, sensorData);
      
      if (this.sensorsGateway) {
        this.sensorsGateway.sendSpecificSensorData(sensor_id, sensorData);
        
        if (sensor.companyId) {
          this.sensorsGateway.sendCompanySensorData(sensor.companyId, sensorData);
        }
      }
      
      this.logger.debug(`${sensor_id} sensöründen gelen veri işlendi`);
    } catch (error) {
      this.logger.error(`Sensör verisi işlenirken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      throw error;
    }
  }

  async getLatestSensorData(sensorId: string): Promise<any> {
    return this.sensorDataCache.get(sensorId);
  }

  async findAllByCompany(companyId: string): Promise<Sensor[]> {
    if (companyId) {
      const sensors = await this.sensorRepository.find({
        where: { companyId },
        order: { name: 'ASC' },
      });
      return sensors;
    }
    const allSensors = await this.sensorRepository.find({
      order: { name: 'ASC' },
    });
    return allSensors;
  }

  async findOne(id: string): Promise<Sensor | null> {
    const sensor = await this.sensorRepository.findOne({
      where: { id },
      relations: ['company'],
    });
    return sensor;
  }

  async findBySensorId(sensorId: string): Promise<Sensor | null> {
    const sensor = await this.sensorRepository.findOne({
      where: { sensorId },
      relations: ['company'],
    });
    return sensor;
  }

  async create(createSensorDto: any): Promise<Sensor> {
    const newSensor = this.sensorRepository.create(createSensorDto);
    
    const result = await this.sensorRepository.save(newSensor);
    const savedSensor = (Array.isArray(result) ? result[0] : result) as Sensor;
    
    return savedSensor;
  }

  async update(id: string, updateSensorDto: any): Promise<Sensor> {
    await this.sensorRepository.update(id, updateSensorDto);
    
    const updatedSensor = await this.findOne(id);
    if (!updatedSensor) {
      throw new Error(`Sensor with ID ${id} not found after update`);
    }
    return updatedSensor;
  }

  async remove(id: string): Promise<void> {
    await this.sensorRepository.delete(id);
  }

  async userHasAccessToSensor(userId: string, sensorId: string): Promise<boolean> {
    const sensor = await this.sensorRepository.findOne({ 
      where: { sensorId },
      relations: ['company', 'company.users'],
    });
    
    if (!sensor) return false;
    
    if (!sensor.company || !sensor.company.users) return false;
    
    const hasAccess = sensor.company.users.some(user => user.id === userId);
    return hasAccess;
  }
  

  async userHasAccessToCompany(userId: string, companyId: string): Promise<boolean> {
    const result = await this.sensorRepository.manager.query(
      `SELECT COUNT(*) as count FROM users WHERE id = $1 AND (company_id = $2 OR role = 'system_admin')`,
      [userId, companyId]
    );
    
    return result[0].count > 0;
  }
}