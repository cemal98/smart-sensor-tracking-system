import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sensor } from '../sensors/entities/sensor.entity';
import { SensorsService } from '../sensors/sensors.service';
import { InfluxDBService } from '../influxdb/influxdb.service';

interface SensorData {
  sensor_id: string;
  timestamp: number;
  [key: string]: any;
}

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private client: mqtt.MqttClient | null = null;
  private readonly logger = new Logger(MqttService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(Sensor)
    private sensorRepository: Repository<Sensor>,
    @Inject(forwardRef(() => SensorsService))
    private sensorsService: SensorsService,
    private influxDBService: InfluxDBService,
  ) {}

  onModuleInit() {
    this.connectToBroker();
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.end();
    }
  }

  private connectToBroker() {
    const broker = this.configService.get<string>('mqtt.broker') || 'mqtt://localhost:1883';
    const clientId = this.configService.get<string>('mqtt.clientId') || 'sensor-tracking-backend';
    const username = this.configService.get<string>('mqtt.username') || '';
    const password = this.configService.get<string>('mqtt.password') || '';
    const useTls = this.configService.get<boolean>('mqtt.useTls');

    const options: mqtt.IClientOptions = {
      clientId,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    };

    if (username && password) {
      options.username = username;
      options.password = password;
    }

    if (useTls) {
      options.rejectUnauthorized = false;
    }

    this.logger.log(`MQTT broker'a bağlanılıyor: ${broker}`);

    try {
      this.client = mqtt.connect(broker, options);

      this.client.on('connect', () => {
        this.logger.log('MQTT broker\'a bağlantı başarılı');
        this.subscribeToTopics();
      });

      this.client.on('error', (error) => {
        this.logger.error(`MQTT bağlantı hatası: ${error.message}`);
      });

      this.client.on('reconnect', () => {
        this.logger.log('MQTT broker\'a yeniden bağlanmaya çalışılıyor');
      });

      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message);
      });
    } catch (error) {
      this.logger.error(`MQTT broker'a bağlanırken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  private async subscribeToTopics() {
    if (!this.client) {
      this.logger.error('MQTT istemcisi oluşturulmadı, abonelikler yapılamıyor');
      return;
    }

    try {
      const sensors = await this.sensorRepository.find();
      const topicPrefix = this.configService.get<string>('mqtt.topicPrefix') || 'sensors';
      const generalTopic = `${topicPrefix}/#`;

      const mqttClient = this.client;

      mqttClient.subscribe(generalTopic, (err) => {
        if (err) {
          this.logger.error(`${generalTopic} konusuna abone olurken hata: ${err.message}`);
        } else {
          this.logger.log(`Konuya abone olundu: ${generalTopic}`);
        }
      });

      sensors.forEach(sensor => {
        if (sensor.mqttTopic && sensor.mqttTopic !== generalTopic) {
          mqttClient.subscribe(sensor.mqttTopic, (err) => {
            if (err) {
              this.logger.error(`${sensor.mqttTopic} konusuna abone olurken hata: ${err.message}`);
            } else {
              this.logger.log(`Sensör konusuna abone olundu: ${sensor.mqttTopic}`);
            }
          });
        }
      });
    } catch (error) {
      this.logger.error(`Konulara abone olurken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  private async handleMessage(topic: string, message: Buffer) {
    try {
      const messageString = message.toString();
      this.logger.debug(`${topic} konusundan mesaj alındı: ${messageString}`);

      const data = JSON.parse(messageString) as SensorData;

      if (!this.isValidSensorData(data)) {
        this.logger.warn(`Geçersiz sensör veri formatı: ${messageString}`);
        return;
      }

      await this.sensorsService.processSensorData(data);
      this.logger.debug(`Sensör ${data.sensor_id} için veri işlendi`);

      await this.influxDBService.writeSensorData(data);
      this.logger.debug(`Sensör ${data.sensor_id} verisi InfluxDB'ye yazıldı`);
    } catch (error) {
      this.logger.error(`${topic} konusundan gelen mesajı işlerken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  private isValidSensorData(data: any): data is SensorData {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.sensor_id === 'string' &&
      typeof data.timestamp === 'number'
    );
  }

  async publish(topic: string, message: string | object): Promise<void> {
    if (!this.client || !this.client.connected) {
      throw new Error('MQTT istemcisi bağlı değil');
    }

    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);

    const mqttClient = this.client;

    return new Promise<void>((resolve, reject) => {
      mqttClient.publish(topic, messageStr, (error?: Error) => {
        if (error) {
          this.logger.error(`${topic} konusuna yayın yaparken hata: ${error.message}`);
          reject(error);
        } else {
          this.logger.debug(`${topic} konusuna mesaj yayınlandı`);
          resolve();
        }
      });
    });
  }
}