import { call, put, takeLatest } from 'redux-saga/effects';
import apiClient from '../../services/api';
import {
    fetchSensorsRequest,
    fetchSensorsSuccess,
    fetchSensorsFailure,
    fetchSensorDataRequest,
    fetchSensorDataSuccess,
    createSensorRequest,
    createSensorSuccess,
    createSensorFailure,
} from '../slices/sensorSlice';
import { Sensor, SensorData } from '../types/sensor.types';

function* fetchSensorsSaga(): Generator<any, void, Sensor[]> {
    try {
        const sensors = yield call(apiClient.get, '/sensors');
        yield put(fetchSensorsSuccess(sensors));
    } catch (error: any) {
        yield put(fetchSensorsFailure(error.message || 'Sensörler alınamadı'));
    }
}

function* fetchSensorDataSaga(action: ReturnType<typeof fetchSensorDataRequest>): Generator<any, void, SensorData[]> {
    try {
        const { sensorId, params } = action.payload;
        const queryParams = new URLSearchParams(params).toString();
        const data = yield call(apiClient.get, `/sensors/data/${sensorId}${queryParams ? `?${queryParams}` : ''}`);
        yield put(fetchSensorDataSuccess({ sensorId, data }));
    } catch (error: any) {
        yield put(fetchSensorsFailure(error.message || 'Sensör verileri alınamadı'));
    }
}

function* createSensorSaga(action: ReturnType<typeof createSensorRequest>): Generator<any, void, Sensor> {
    try {
        const sensor = yield call(apiClient.post, '/sensors', action.payload);
        yield put(createSensorSuccess(sensor));
    } catch (error: any) {
        yield put(createSensorFailure(error.message || 'Sensör oluşturulamadı'));
    }
}

export function* sensorsSaga(): Generator {
    yield takeLatest(fetchSensorsRequest.type, fetchSensorsSaga);
    yield takeLatest(fetchSensorDataRequest.type, fetchSensorDataSaga);
    yield takeLatest(createSensorRequest.type, createSensorSaga);
}
