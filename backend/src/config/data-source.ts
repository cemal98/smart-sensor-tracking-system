import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { Sensor } from '../sensors/entities/sensor.entity';
import { UserActivity } from '../user-activity/entities/user-activity.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'sensor_tracking',
  synchronize: false,
  logging: false,
  entities: [User, Company, Sensor, UserActivity],
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: 'migrations',
});

export default AppDataSource;
