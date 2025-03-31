import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { User } from '../../users/entities/user.entity';
  
  export enum ActivityAction {
    VIEWED_LOGS = 'viewed_logs',
    LOGIN = 'login',
    LOGOUT = 'logout',
    VIEWED_DASHBOARD = 'viewed_dashboard',
    VIEWED_SENSORS = 'viewed_sensors',
    OTHER = 'other',
  }
  
  @Entity('user_activities')
  export class UserActivity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @ManyToOne(() => User, user => user.activities)
    @JoinColumn({ name: 'userId' })
    user: User;
  
    @Column()
    userId: string;
  
    @Column({
      type: 'enum',
      enum: ActivityAction,
      default: ActivityAction.OTHER,
    })
    action: ActivityAction;
  
    @Column({ nullable: true })
    details: string;
  
    @Column({ nullable: true })
    ipAddress: string;
  
    @Column({ nullable: true })
    userAgent: string;
  
    @CreateDateColumn()
    timestamp: Date;
  }