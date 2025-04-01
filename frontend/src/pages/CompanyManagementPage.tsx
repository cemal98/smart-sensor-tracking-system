import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { createCompanyRequest, fetchCompaniesRequest } from '../redux/slices/companySlice';
import { Company } from '../redux/types/company.types';

const CompanyManagementPage: React.FC = () => {
    const dispatch = useDispatch();
    const { list: companies, loading, error } = useSelector((state: RootState) => state.company);

    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        dispatch(fetchCompaniesRequest());
    }, [dispatch]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !code) return;

        dispatch(createCompanyRequest({ name, code, description }));
        setName('');
        setCode('');
        setDescription('');
    };

    return (
        <div className="min-h-screen p-6 bg-gray-100">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
                <h1 className="text-xl font-bold mb-6">Şirket Yönetimi</h1>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Şirket Adı"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="border p-2 rounded"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Kod (örn: DEMO01)"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        className="border p-2 rounded"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Açıklama"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="border p-2 rounded"
                    />
                    <button type="submit" className="md:col-span-3 bg-indigo-600 text-white p-2 rounded hover:bg-indigo-500">
                        Şirket Ekle
                    </button>
                </form>

                {loading && <p className="text-gray-500">Yükleniyor...</p>}
                {error && <p className="text-red-500">Hata: {error}</p>}

                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100 text-left">
                            <th className="p-2 border">Adı</th>
                            <th className="p-2 border">Kod</th>
                            <th className="p-2 border">Açıklama</th>
                            <th className="p-2 border">Durum</th>
                        </tr>
                    </thead>
                    <tbody>
                        {companies.map((company: Company) => (
                            <tr key={company.id} className="hover:bg-gray-50">
                                <td className="p-2 border">{company.name}</td>
                                <td className="p-2 border">{company.code}</td>
                                <td className="p-2 border">{company.description || '-'}</td>
                                <td className="p-2 border">{company.isActive ? 'Aktif' : 'Pasif'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CompanyManagementPage;
