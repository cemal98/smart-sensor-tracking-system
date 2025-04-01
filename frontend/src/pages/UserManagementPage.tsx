import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { fetchCompaniesRequest } from '../redux/slices/companySlice';
import { getProfile } from '../services/auth';
import apiClient from '../services/api';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../redux/types/user.types';
import { fetchUsersRequest } from '../redux/slices/userSlice';

const UserManagementPage: React.FC = () => {
    const dispatch = useDispatch();
    const companies = useSelector((state: RootState) => state.company.list);
    const users = useSelector((state: RootState) => state.users.list);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: UserRole.USER,
        companyId: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient.post('/users', formData);
            alert('Kullanıcı başarıyla oluşturuldu');
            dispatch(fetchUsersRequest());
            setFormData({ firstName: '', lastName: '', email: '', password: '', role: UserRole.USER, companyId: '' });
        } catch (error) {
            console.error('Kullanıcı oluşturulamadı:', error);
            alert('Hata oluştu');
        }
    };

    useEffect(() => {
        const loadData = async () => {
            const user = await getProfile();
            setCurrentUser(user);
            if (user.role === UserRole.SYSTEM_ADMIN) {
                dispatch(fetchCompaniesRequest());
            }
            dispatch(fetchUsersRequest());
        };
        loadData();
    }, [dispatch]);

    const visibleUsers = currentUser?.role === UserRole.SYSTEM_ADMIN
        ? users
        : users.filter(u => u.companyId === currentUser?.companyId);

    return (
        <div className="max-w-5xl mx-auto mt-10 bg-white p-6 shadow rounded">
            <h1 className="text-xl font-bold mb-6">Kullanıcı Oluştur</h1>
            <form onSubmit={handleSubmit} className="space-y-6 mb-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Ad</label>
                        <input
                            type="text"
                            name="firstName"
                            className="w-full border rounded px-3 py-2 text-sm"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Soyad</label>
                        <input
                            type="text"
                            name="lastName"
                            className="w-full border rounded px-3 py-2 text-sm"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">E-posta</label>
                        <input
                            type="email"
                            name="email"
                            className="w-full border rounded px-3 py-2 text-sm"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Şifre</label>
                        <input
                            type="password"
                            name="password"
                            className="w-full border rounded px-3 py-2 text-sm"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {currentUser?.role === UserRole.SYSTEM_ADMIN && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Rol</label>
                            <select
                                name="role"
                                className="w-full border rounded px-3 py-2 text-sm"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value={UserRole.USER}>User</option>
                                <option value={UserRole.COMPANY_ADMIN}>Company Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Şirket</label>
                            <select
                                name="companyId"
                                className="w-full border rounded px-3 py-2 text-sm"
                                value={formData.companyId}
                                onChange={handleChange}
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
                    </div>
                )}

                <div className="pt-2">
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-medium"
                    >
                        Oluştur
                    </button>
                </div>
            </form>


            <h2 className="text-lg font-semibold mb-4">Kayıtlı Kullanıcılar</h2>
            <table className="min-w-full border divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-2 text-left">Ad Soyad</th>
                        <th className="px-4 py-2 text-left">E-posta</th>
                        <th className="px-4 py-2 text-left">Rol</th>
                        <th className="px-4 py-2 text-left">Şirket</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {visibleUsers.map((user) => (
                        <tr key={user.id}>
                            <td className="px-4 py-2">{user.firstName} {user.lastName}</td>
                            <td className="px-4 py-2">{user.email}</td>
                            <td className="px-4 py-2">{user.role}</td>
                            <td className="px-4 py-2">{user.company?.name || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserManagementPage;
