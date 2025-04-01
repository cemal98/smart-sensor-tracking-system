export interface Sensor {
    id: string;
    sensorId: string;
    name: string;
    description?: string;
    type: 'temperature' | 'humidity' | 'pressure' | 'motion' | 'light' | 'other';
    isActive: boolean;
    location?: string;
    metadata?: any;
    companyId: string;
    mqttTopic: string;
    createdAt: string;
    updatedAt: string;
}

export interface SensorData {
    sensor_id: string;
    timestamp: number;
    temperature: number;
    humidity: number;
}

export interface SensorsState {
    list: Sensor[];
    selectedSensor: Sensor | null;
    sensorData: Record<string, SensorData[]>;
    loading: boolean;
    error: string | null;
}