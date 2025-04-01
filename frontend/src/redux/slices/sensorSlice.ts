import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Sensor, SensorData, SensorsState } from '../types/sensor.types';

const initialState: SensorsState = {
    list: [],
    selectedSensor: null,
    sensorData: {},
    loading: false,
    error: null,
};

const sensorsSlice = createSlice({
    name: 'sensors',
    initialState,
    reducers: {
        fetchSensorsRequest: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchSensorsSuccess: (state, action: PayloadAction<Sensor[]>) => {
            state.list = action.payload;
            state.loading = false;
        },
        fetchSensorsFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
        fetchSensorDataRequest: (state, _action: PayloadAction<{
            sensorId: string,
            params?: { from?: string; to?: string; fields?: string }
        }>) => {
            state.loading = true;
            state.error = null;
        },
        fetchSensorDataSuccess: (state, action: PayloadAction<{ sensorId: string, data: SensorData[] }>) => {
            const { sensorId, data } = action.payload;
            state.sensorData[sensorId] = data;
            state.loading = false;
        },
        updateSensorData: (state, action: PayloadAction<SensorData>) => {
            const data = action.payload;
            if (!state.sensorData[data.sensor_id]) {
                state.sensorData[data.sensor_id] = [];
            }
            state.sensorData[data.sensor_id].push(data);
            if (state.sensorData[data.sensor_id].length > 50) {
                state.sensorData[data.sensor_id] = state.sensorData[data.sensor_id].slice(-50);
            }
        },
        selectSensor: (state, action: PayloadAction<Sensor>) => {
            state.selectedSensor = action.payload;
        },

        createSensorRequest: (state, _action: PayloadAction<Partial<Sensor>>) => {
            state.loading = true;
        },
        createSensorSuccess: (state, action: PayloadAction<Sensor>) => {
            state.list.push(action.payload);
            state.loading = false;
        },
        createSensorFailure: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const {
    fetchSensorsRequest,
    fetchSensorsSuccess,
    fetchSensorsFailure,
    fetchSensorDataRequest,
    fetchSensorDataSuccess,
    updateSensorData,
    selectSensor,
    createSensorRequest,
    createSensorSuccess,
    createSensorFailure,
} = sensorsSlice.actions;

export default sensorsSlice.reducer;
