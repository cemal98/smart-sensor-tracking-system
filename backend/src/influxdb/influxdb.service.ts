import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InfluxDB, Point } from '@influxdata/influxdb-client';

@Injectable()
export class InfluxDBService implements OnModuleInit {
  private client: InfluxDB | null = null;
  private org: string = '';
  private bucket: string = '';
  private readonly logger = new Logger(InfluxDBService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('influxdb.url') || '';
    const token = this.configService.get<string>('influxdb.token') || '';
    this.org = this.configService.get<string>('influxdb.org') || 'sensor_org';
    this.bucket = this.configService.get<string>('influxdb.bucket') || 'sensor_data';

    if (!url || !token) {
      this.logger.warn('InfluxDB yapılandırması eksik. Zaman serisi veri depolama kullanılamayacak.');
      return;
    }

    try {
      this.client = new InfluxDB({ url, token });
      this.logger.log(`InfluxDB'ye bağlandı: ${url}`);
    } catch (error) {
      this.logger.error(`InfluxDB'ye bağlanırken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }

  async writeSensorData(sensorData: any): Promise<void> {
    if (!this.client) {
      throw new Error('InfluxDB istemcisi başlatılmadı');
    }

    try {
      const writeApi = this.client.getWriteApi(this.org, this.bucket);
      
      const point = new Point('sensor_data')
        .tag('sensor_id', sensorData.sensor_id)
        .timestamp(new Date(sensorData.timestamp * 1000));
      
      Object.entries(sensorData).forEach(([key, value]) => {
        if (key !== 'sensor_id' && key !== 'timestamp' && typeof value === 'number') {
          point.floatField(key, value);
        }
      });
      
      writeApi.writePoint(point);
      await writeApi.close();
      
      this.logger.debug(`${sensorData.sensor_id} sensörü için veri InfluxDB'ye yazıldı`);
    } catch (error) {
      this.logger.error(`Sensör verisi InfluxDB'ye yazılırken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      throw error;
    }
  }

  async querySensorData(sensorId: string, start: string, end?: string, fields?: string[]) {
    if (!this.client) {
      throw new Error('InfluxDB istemcisi başlatılmadı');
    }

    try {
      const queryApi = this.client.getQueryApi(this.org);
      
      let query = `from(bucket: "${this.bucket}")
        |> range(start: ${start}`;
      
      if (end) {
        query += `, stop: ${end}`;
      }
      
      query += `)
        |> filter(fn: (r) => r._measurement == "sensor_data")
        |> filter(fn: (r) => r.sensor_id == "${sensorId}")`;
      
      if (fields && fields.length > 0) {
        query += `
        |> filter(fn: (r) => ${fields.map(field => `r._field == "${field}"`).join(' or ')})`;
      }
      
      query += `
        |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")`;
      
      const result = await queryApi.collectRows(query);
      return result;
    } catch (error) {
      this.logger.error(`Sensör verisi sorgulanırken hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
      throw error;
    }
  }
}