import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

export enum SensorType {
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  PRESSURE = 'pressure',
  MOTION = 'motion',
  LIGHT = 'light',
  OTHER = 'other',
}

@Entity('sensors')
export class Sensor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  get sensorId(): string {
    return this.id;
  }

  @Column({ length: 100 })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: SensorType,
    default: SensorType.OTHER,
  })
  type: SensorType;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isPublic: boolean;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @ManyToOne(() => Company, company => company.sensors)
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  companyId: string;

  @Column({ default: 'sensors/#' })
  mqttTopic: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}