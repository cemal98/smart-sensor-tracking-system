import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserActivitiesRequest } from '../redux/slices/userActivitySlice';
import { fetchUsersRequest } from '../redux/slices/userSlice';
import { RootState } from '../app/store';
import { ActivityAction } from '../redux/types/userActivity.types';
import { getProfile } from '../services/auth';
import { createUserActivity } from '../services/userActivity';
import { UserRole, User } from '../redux/types/user.types';

const ITEMS_PER_PAGE = 10;

const UserActivitiesPage: React.FC = () => {
    const dispatch = useDispatch();
    const { list, loading, error } = useSelector((state: RootState) => state.userActivity);
    const users = useSelector((state: RootState) => state.users.list);

    const [selectedUser, setSelectedUser] = useState('');
    const [action, setAction] = useState<ActivityAction | "">('');
    const [currentPage, setCurrentPage] = useState(1);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        const loadProfileAndLog = async () => {
            try {
                const userData = await getProfile();
                setCurrentUser(userData);
                await createUserActivity(userData.id, ActivityAction.VIEWED_LOGS);
                dispatch(fetchUsersRequest());
            } catch (err) {
                console.error('Kullanıcı verisi alınamadı:', err);
            }
        };
        loadProfileAndLog();
    }, [dispatch]);

    useEffect(() => {
        if (!currentUser) return;

        if (currentUser.role === UserRole.SYSTEM_ADMIN) {
            dispatch(fetchUserActivitiesRequest({ userId: selectedUser, action: action || undefined }));
        } else if (currentUser.role === UserRole.COMPANY_ADMIN) {
            dispatch(fetchUserActivitiesRequest({ userId: selectedUser || undefined, action: action || undefined }));
        } else {
            dispatch(fetchUserActivitiesRequest({ userId: currentUser.id, action: action || undefined }));
        }
    }, [dispatch, selectedUser, action, currentUser]);

    const filteredActivities = list.filter((activity) => {
        const user = users.find((u) => u.id === activity.userId);
        return user && activity.userId !== currentUser?.id;
    });

    const paginatedActivities = filteredActivities.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);

    const filteredUsers =
        currentUser?.role === UserRole.SYSTEM_ADMIN
            ? users
            : currentUser?.role === UserRole.COMPANY_ADMIN
                ? users.filter((u) => u.companyId === currentUser.companyId)
                : users.filter((u) => u.id === currentUser?.id);

    const userCanSeeFilter = currentUser?.role !== UserRole.USER;

    if (loading) return <div>Yükleniyor...</div>;
    if (error) return <div>Hata: {error}</div>;

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
                <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                    <h1 className="text-xl font-bold text-gray-900">Kullanıcı Aktiviteleri</h1>
                </div>
            </header>

            <main>
                <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
                    <div className="px-4 py-6 sm:px-0">
                        {userCanSeeFilter && (
                            <form className="mb-4">
                                <div className="flex flex-wrap gap-4">
                                    <div>
                                        <label htmlFor="user" className="block text-sm font-medium text-gray-700">
                                            Kullanıcı
                                        </label>
                                        <select
                                            id="user"
                                            value={selectedUser}
                                            onChange={(e) => {
                                                setSelectedUser(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 rounded-md"
                                        >
                                            <option value="">Tümü</option>
                                            {filteredUsers.map((user) => (
                                                <option key={user.id} value={user.id}>
                                                    {user.firstName} {user.lastName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="action" className="block text-sm font-medium text-gray-700">
                                            Eylem
                                        </label>
                                        <select
                                            id="action"
                                            value={action}
                                            onChange={(e) => {
                                                setAction(e.target.value as ActivityAction | '');
                                                setCurrentPage(1);
                                            }}
                                            className="mt-1 block w-full pl-3 pr-10 py-2 border-gray-300 rounded-md"
                                        >
                                            <option value="">Tümü</option>
                                            <option value={ActivityAction.LOGIN}>Giriş</option>
                                            <option value={ActivityAction.LOGOUT}>Çıkış</option>
                                            <option value={ActivityAction.VIEWED_LOGS}>Logları Görüntüleme</option>
                                            <option value={ActivityAction.VIEWED_DASHBOARD}>Dashboard Görüntüleme</option>
                                            <option value={ActivityAction.VIEWED_SENSORS}>Sensör İnceleme</option>
                                        </select>
                                    </div>
                                </div>
                            </form>
                        )}

                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="overflow-y-auto max-h-[400px]">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kullanıcı</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Eylem</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zaman</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedActivities.map((activity) => {
                                            const user = users.find((u) => u.id === activity.userId);
                                            return (
                                                <tr key={activity.id}>
                                                    <td className="px-6 py-4">{user ? `${user.firstName} ${user.lastName}` : '—'}</td>
                                                    <td className="px-6 py-4">{activity.action}</td>
                                                    <td className="px-6 py-4">{new Date(activity.timestamp).toLocaleString()}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t">
                                <p className="text-sm text-gray-600">
                                    Sayfa {currentPage} / {totalPages}
                                </p>
                                <div className="space-x-2">
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 bg-indigo-600 text-white rounded disabled:opacity-50"
                                    >
                                        Önceki
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 bg-indigo-600 text-white rounded disabled:opacity-50"
                                    >
                                        Sonraki
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserActivitiesPage;
