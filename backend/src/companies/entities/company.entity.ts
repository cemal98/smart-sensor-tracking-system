import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  import { Sensor } from '../../sensors/entities/sensor.entity';
  
  @Entity('companies')
  export class Company {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ length: 100 })
    name: string;
  
    @Column({ nullable: true })
    description: string;
  
    @Column({ unique: true })
    code: string;
  
    @Column({ default: true })
    isActive: boolean;
  
    @OneToMany(() => User, user => user.company)
    users: User[];
  
    @OneToMany(() => Sensor, sensor => sensor.company)
    sensors: Sensor[];
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }