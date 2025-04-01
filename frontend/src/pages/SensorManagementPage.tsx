import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchSensorsRequest,
    createSensorRequest,
} from '../redux/slices/sensorSlice';
import { fetchCompaniesRequest } from '../redux/slices/companySlice';
import { RootState } from '../app/store';
import { Sensor } from '../redux/types/sensor.types';
import { getProfile } from '../services/auth';
import { User, UserRole } from '../redux/types/user.types';
import { v4 as uuidv4 } from 'uuid';

const SensorManagementPage: React.FC = () => {
    const dispatch = useDispatch();
    const { list, loading } = useSelector((state: RootState) => state.sensors);
    const companies = useSelector((state: RootState) => state.company.list);

    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [formData, setFormData] = useState<Partial<Sensor & { companyId?: string }>>({
        name: '',
        description: '',
        isActive: true,
        mqttTopic: `sensors/${uuidv4()}`,
    });

    useEffect(() => {
        dispatch(fetchSensorsRequest());

        const fetchInitialData = async () => {
            const user = await getProfile();
            setCurrentUser(user);

            if (user.role === UserRole.SYSTEM_ADMIN) {
                dispatch(fetchCompaniesRequest());
            } else {
                setFormData((prev) => ({ ...prev, companyId: user.companyId }));
            }
        };

        fetchInitialData();
    }, [dispatch]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'isActive' ? value === 'true' : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        dispatch(createSensorRequest(formData));
        setFormData({
            name: '',
            description: '',
            isActive: true,
            mqttTopic: `sensors/${uuidv4()}`,
            ...(currentUser?.role === UserRole.COMPANY_ADMIN ? { companyId: currentUser.companyId } : {}),
        });
    };

    return (
        <div className="max-w-5xl mx-auto mt-10 bg-white p-6 shadow rounded">
            <h1 className="text-xl font-bold mb-6">Sensör Yönetimi</h1>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                <div>
                    <label className="block text-sm font-medium">Ad</label>
                    <input
                        name="name"
                        type="text"
                        value={formData.name || ''}
                        onChange={handleChange}
                        className="w-full border rounded p-2"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Açıklama</label>
                    <input
                        name="description"
                        type="text"
                        value={formData.description || ''}
                        onChange={handleChange}
                        className="w-full border rounded p-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Durum</label>
                    <select
                        name="isActive"
                        value={formData.isActive ? 'true' : 'false'}
                        onChange={handleChange}
                        className="w-full border rounded p-2"
                    >
                        <option value="true">Aktif</option>
                        <option value="false">Pasif</option>
                    </select>
                </div>

                {currentUser?.role === UserRole.SYSTEM_ADMIN && (
                    <div>
                        <label className="block text-sm font-medium">Şirket</label>
                        <select
                            name="companyId"
                            value={formData.companyId || ''}
                            onChange={handleChange}
                            className="w-full border rounded p-2"
                            required
                        >
                            <option value="">Şirket Seçin</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="md:col-span-2">
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded w-full md:w-auto"
                        disabled={loading}
                    >
                        {loading ? 'Oluşturuluyor...' : 'Sensör Oluştur'}
                    </button>
                </div>
            </form>

            <h2 className="text-lg font-semibold mb-4">Kayıtlı Sensörler</h2>
            <table className="min-w-full border divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-2 text-left">Ad</th>
                        <th className="px-4 py-2 text-left">Açıklama</th>
                        <th className="px-4 py-2 text-left">Durum</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {list.map((sensor) => (
                        <tr key={sensor.id}>
                            <td className="px-4 py-2">{sensor.name}</td>
                            <td className="px-4 py-2">{sensor.description || '-'}</td>
                            <td className="px-4 py-2">
                                {sensor.isActive ? (
                                    <span className="text-green-600 font-medium">Aktif</span>
                                ) : (
                                    <span className="text-red-600 font-medium">Pasif</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SensorManagementPage;
