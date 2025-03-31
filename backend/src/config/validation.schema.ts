import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  
  // Database
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default('password'),
  DB_NAME: Joi.string().default('sensor_tracking'),
  
  // InfluxDB
  INFLUXDB_URL: Joi.string().default('http://localhost:8086'),
  INFLUXDB_TOKEN: Joi.string().optional(),
  INFLUXDB_ORG: Joi.string().default('sensor_org'),
  INFLUXDB_BUCKET: Joi.string().default('sensor_data'),
  
  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  
  // MQTT
  MQTT_BROKER: Joi.string().default('mqtt://localhost:1883'),
  MQTT_CLIENT_ID: Joi.string().default('sensor-tracking-backend'),
  MQTT_USERNAME: Joi.string().optional(),
  MQTT_PASSWORD: Joi.string().optional(),
  MQTT_TOPIC_PREFIX: Joi.string().default('sensors'),
  MQTT_USE_TLS: Joi.boolean().default(false),
});