import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchSensorDataRequest,
    selectSensor,
    fetchSensorsRequest
} from '../redux/slices/sensorSlice';
import { RootState } from '../app/store';
import { format } from 'date-fns';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { getProfile } from '../services/auth';
import { ActivityAction } from '../redux/types/userActivity.types';
import { createUserActivity } from '../services/userActivity';

const SensorDetailPage: React.FC = () => {
    const { sensorId } = useParams<{ sensorId: string }>();
    const dispatch = useDispatch();

    const {
        list: sensorList,
        selectedSensor,
        sensorData,
        loading,
        error
    } = useSelector((state: RootState) => state.sensors);

    const [timeRange, setTimeRange] = useState<string>('-1h');

    useEffect(() => {
        const logActivity = async () => {
            try {
                const userData = await getProfile();
                await createUserActivity(userData.id, ActivityAction.VIEWED_SENSORS);
            } catch (error) {
                console.error('Kullanıcı aktivitesi kaydedilemedi:', error);
            }
        };

        logActivity();

        if (sensorId) {
            const sensor = sensorList?.find(s => s.id === sensorId);

            if (sensor) {
                dispatch(selectSensor(sensor));
                dispatch(fetchSensorDataRequest({
                    sensorId,
                    params: { from: timeRange }
                }));
            } else {
                dispatch(fetchSensorsRequest());
            }
        }
    }, [sensorId, timeRange, dispatch, sensorList]);

    const timeRangeOptions = [
        { label: 'Son 1 Saat', value: '-1h' },
        { label: 'Son 24 Saat', value: '-24h' },
        { label: 'Son 7 Gün', value: '-7d' }
    ];

    const rawValues = sensorData && sensorId ? sensorData[sensorId] : null;
    const sensorValues = Array.isArray(rawValues) ? rawValues : [];
    const chartData = sensorValues.map(data => ({
        timestamp: format(new Date(data.timestamp * 1000), 'HH:mm'),
        temperature: data.temperature ?? 0,
        humidity: data.humidity ?? 0
    }));

    const lastSensorData = sensorValues.length > 0
        ? sensorValues[sensorValues.length - 1]
        : null;

    if (loading) return <div>Yükleniyor...</div>;
    if (error) return <div>Hata: {error}</div>;
    if (!selectedSensor) return <div>Sensör bulunamadı</div>;

    return (
        <div className="container mx-auto p-4">
            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">{selectedSensor.name}</h1>
                    <div className="flex items-center space-x-2">
                        <span>Zaman Aralığı:</span>
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="border rounded p-2"
                        >
                            {timeRangeOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Sensör Detayları</h2>
                        <div className="bg-gray-100 p-4 rounded">
                            <p><strong>Adı:</strong> {selectedSensor.name}</p>
                            <p><strong>Tip:</strong> {selectedSensor.type}</p>
                            <p><strong>Durum:</strong>
                                <span className={`ml-2 ${selectedSensor.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                    {selectedSensor.isActive ? 'Aktif' : 'Pasif'}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold mb-2">Son Veri</h2>
                        <div className="bg-gray-100 p-4 rounded">
                            {lastSensorData ? (
                                <>
                                    <p>
                                        <strong>Sıcaklık:</strong> {lastSensorData.temperature} °C
                                    </p>
                                    <p>
                                        <strong>Nem:</strong> {lastSensorData.humidity} %
                                    </p>
                                </>
                            ) : (
                                <p>Henüz veri yok</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Sensör Verisi Grafiği</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" />
                            <YAxis />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="temperature"
                                stroke="#8884d8"
                                activeDot={{ r: 8 }}
                                name="Sıcaklık"
                            />
                            <Line
                                type="monotone"
                                dataKey="humidity"
                                stroke="#82ca9d"
                                name="Nem"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default SensorDetailPage;
