import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSensorsRequest } from '../redux/slices/sensorSlice';
import { RootState } from '../app/store';

const SensorsList: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { list: sensors, loading, error } = useSelector((state: RootState) => state.sensors);

    useEffect(() => {
        dispatch(fetchSensorsRequest());
    }, [dispatch]);

    const handleSensorClick = (sensorId: string) => {
        navigate(`/sensors/${sensorId}`);
    };

    if (loading) {
        return <div className="p-4">Sensörler yükleniyor...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-600">{error}</div>;
    }

    if (sensors.length === 0) {
        return <div className="p-4 text-gray-500">Henüz sensör bulunmuyor</div>;
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
                <h2 className="font-semibold text-lg">Sensörler</h2>
            </div>
            <ul className="divide-y divide-gray-200">
                {sensors.map((sensor) => (
                    <li
                        key={sensor.id}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleSensorClick(sensor.id)}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium">{sensor.name}</div>
                                <div className="text-sm text-gray-500">{sensor.type}</div>
                            </div>
                            <div className={`h-3 w-3 rounded-full ${sensor.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SensorsList;