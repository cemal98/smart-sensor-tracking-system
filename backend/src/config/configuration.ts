export default () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    
    // PostgreSQL Database Configuration
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      name: process.env.DB_NAME || 'sensor_tracking',
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
    },
    
    // InfluxDB Configuration
    influxdb: {
      url: process.env.INFLUXDB_URL || 'http://localhost:8086',
      token: process.env.INFLUXDB_TOKEN || '',
      org: process.env.INFLUXDB_ORG || 'sensor_org',
      bucket: process.env.INFLUXDB_BUCKET || 'sensor_data',
    },
    
    // JWT Authentication
    jwt: {
      secret: process.env.JWT_SECRET || 'jwt-secret-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },
    
    // MQTT Configuration
    mqtt: {
      broker: process.env.MQTT_BROKER || 'mqtt://localhost:1883',
      clientId: process.env.MQTT_CLIENT_ID || 'sensor-tracking-backend',
      username: process.env.MQTT_USERNAME || '',
      password: process.env.MQTT_PASSWORD || '',
      topicPrefix: process.env.MQTT_TOPIC_PREFIX || 'sensors',
      useTls: process.env.MQTT_USE_TLS === 'true',
    },
    
    // Rate Limiting
    throttle: {
      ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
      limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
    },
    
    // Logging
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      directory: process.env.LOG_DIRECTORY || 'logs',
    },
  });