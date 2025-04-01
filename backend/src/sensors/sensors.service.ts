import {
  Injectable,
  Logger,
  Inject,
  forwardRef,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sensor } from './entities/sensor.entity';
import { InfluxDBService } from '../influxdb/influxdb.service';
import { SensorsGateway } from './sensors.gateway';
import { UserRole } from '../users/entities/user.entity';
import { User } from '../users/entities/user.entity';

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
  ) { }

  async processSensorData(data: SensorData): Promise<void> {
    try {
      const { sensor_id } = data;

      const sensor = await this.sensorRepository.findOne({
        where: { id: sensor_id },
        relations: ['company'],
      });

      if (!sensor) {
        this.logger.warn(`Bilinmeyen sensör ID: ${sensor_id}`);
        return;
      }

      if (!sensor.isActive) {
        this.logger.warn(`Pasif sensörden veri alındı: ${sensor_id}`);
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

  async getSensorHistoricalData(sensorId: string, from: string, to?: string, fields?: string): Promise<any> {
    try {
      if (from === 'latest' || !from) {
        const latestData = await this.getLatestSensorData(sensorId);
        return latestData || { message: 'Henüz veri yok' };
      }

      const sensor = await this.findBySensorId(sensorId);
      if (!sensor) {
        throw new NotFoundException(`Sensör bulunamadı: ${sensorId}`);
      }

      let fieldsArray: string[] | undefined;
      if (fields) {
        fieldsArray = fields.split(',').map(f => f.trim());
      }

      const data = await this.influxDBService.querySensorData(
        sensorId,
        from,
        to,
        fieldsArray
      );

      if (!data || data.length === 0) {
        return { message: 'Belirtilen tarih aralığında veri bulunamadı' };
      }

      const formattedData = data.map(item => {
        const typedItem = item as {
          _time?: string;
          _measurement?: string;
          _start?: string;
          _stop?: string;
          result?: string;
          table?: number;
          [key: string]: any
        };

        const timestamp = typedItem._time ? new Date(typedItem._time).getTime() / 1000 : null;

        const cleanData = { ...typedItem };
        delete cleanData._measurement;
        delete cleanData._start;
        delete cleanData._stop;
        delete cleanData._time;
        delete cleanData.result;
        delete cleanData.table;

        return {
          sensor_id: sensorId,
          timestamp,
          ...cleanData
        };
      });
      console.log("FormattedData", formattedData)
      return formattedData;
    } catch (error) {
      this.logger.error(`Sensör verileri alınırken hata: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Sensör verileri alınamadı: ' + error.message);
    }
  }

  async findAllByCompany(companyId: string): Promise<Sensor[]> {
    if (companyId) {
      const sensors = await this.sensorRepository.find({
        where: { companyId },
        order: { name: 'ASC' },
        relations: ['company']
      });
      return sensors;
    }
    const allSensors = await this.sensorRepository.find({
      order: { name: 'ASC' },
      relations: ['company']
    });
    return allSensors;
  }

  async getPublicSensors(): Promise<Sensor[]> {
    return this.sensorRepository.find({
      where: { isPublic: true, isActive: true },
      order: { name: 'ASC' }
    });
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
      where: { id: sensorId },
      relations: ['company'],
    });
    return sensor;
  }

  async create(createSensorDto: any): Promise<Sensor> {
    if (createSensorDto.sensorId) {
      const existingSensor = await this.findBySensorId(createSensorDto.sensorId);
      if (existingSensor) {
        throw new ConflictException(`${createSensorDto.sensorId} ID'li sensör zaten mevcut`);
      }
    }

    const newSensor = this.sensorRepository.create(createSensorDto);

    const result = await this.sensorRepository.save(newSensor);
    const savedSensor = (Array.isArray(result) ? result[0] : result) as Sensor;

    this.logger.log(`Yeni sensör oluşturuldu: ${savedSensor.name} (${savedSensor.sensorId})`);
    return savedSensor;
  }

  async update(id: string, updateSensorDto: any): Promise<Sensor> {
    const sensor = await this.findOne(id);
    if (!sensor) {
      throw new NotFoundException(`Sensör bulunamadı: ${id}`);
    }

    if (updateSensorDto.sensorId && updateSensorDto.sensorId !== sensor.sensorId) {
      const existingSensor = await this.findBySensorId(updateSensorDto.sensorId);
      if (existingSensor) {
        throw new ConflictException(`${updateSensorDto.sensorId} ID'li sensör zaten mevcut`);
      }
    }

    await this.sensorRepository.update(id, updateSensorDto);

    const updatedSensor = await this.findOne(id);
    if (!updatedSensor) {
      throw new NotFoundException(`Sensör bulunamadı: ${id}`);
    }

    this.logger.log(`Sensör güncellendi: ${id}`);
    return updatedSensor;
  }

  async remove(id: string): Promise<void> {
    const sensor = await this.findOne(id);
    if (!sensor) {
      throw new NotFoundException(`Sensör bulunamadı: ${id}`);
    }

    await this.sensorRepository.delete(id);
    this.logger.log(`Sensör silindi: ${id}`);
  }

  async userHasAccessToSensor(userId: string, sensorId: string): Promise<boolean> {
    const sensor = await this.sensorRepository.findOne({
      where: { sensorId },
      relations: ['company', 'company.users'],
    });

    if (!sensor) return false;

    if (sensor.isPublic) return true;

    if (!sensor.company || !sensor.company.users) return false;

    const isCompanyMember = sensor.company.users.some(user => user.id === userId);
    if (isCompanyMember) return true;

    const user = sensor.company.users.find(user => user.id === userId);
    return user?.role === UserRole.SYSTEM_ADMIN;
  }

  async userHasAccessToCompany(userId: string, companyId: string): Promise<boolean> {
    const result = await this.sensorRepository.manager.query(
      `SELECT COUNT(*) as count FROM users WHERE id = $1 AND (company_id = $2 OR role = 'system_admin')`,
      [userId, companyId]
    );

    return result[0].count > 0;
  }

  async getSensorsForUser(user: User): Promise<Sensor[]> {
    if (user.role === UserRole.SYSTEM_ADMIN) {
      return this.findAllByCompany('');
    }

    if (user.companyId) {
      const companySensors = await this.findAllByCompany(user.companyId);

      const publicSensors = await this.getPublicSensors();

      const allAccessibleSensors = [...companySensors];

      for (const sensor of publicSensors) {
        if (!allAccessibleSensors.some(s => s.id === sensor.id)) {
          allAccessibleSensors.push(sensor);
        }
      }

      return allAccessibleSensors;
    }

    return this.getPublicSensors();
  }
}