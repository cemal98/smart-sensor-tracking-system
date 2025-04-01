import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProfile, logout } from '../services/auth';
import { fetchSensorsRequest } from '../redux/slices/sensorSlice';
import wsService from '../services/websocket';
import SensorsList from '../components/SensorList';
import { RootState } from '../app/store';
import { createUserActivity, getUserActivities } from '../services/userActivity';
import { ActivityAction, UserActivity } from '../redux/types/userActivity.types';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId?: string;
  company?: {
    name: string
  }
}

const actionLabels: Record<ActivityAction, string> = {
  login: "Giriş yaptı",
  logout: "Çıkış yaptı",
  viewed_dashboard: "Dashboard'u görüntüledi",
  viewed_logs: "Logları görüntüledi",
  viewed_sensors: "Sensörleri inceledi",
  other: "Diğer"
};

const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<UserActivity[]>([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const sensors = useSelector((state: RootState) => state.sensors.list);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getProfile();
        setUser(userData);
        await createUserActivity(userData.id, ActivityAction.VIEWED_DASHBOARD);

        wsService.init(dispatch);
        if (userData.companyId) {
          wsService.subscribeCompany(userData.companyId);
        }

        dispatch(fetchSensorsRequest());
        await fetchRecentActivities(userData.id);
      } catch (error) {
        console.error('Kullanıcı bilgileri alınamadı:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    const fetchRecentActivities = async (userId: string) => {
      try {
        const data = await getUserActivities(userId);
        const sorted = data.filter((a) => a.action !== ActivityAction.VIEWED_DASHBOARD)
          .sort((a: UserActivity, b: UserActivity) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, 5);
        setRecentActivities(sorted);
      } catch (err) {
        console.error("Aktiviteler alınamadı:", err);
      }
    };

    fetchUserData();

    return () => {
      wsService.close();
    };
  }, [dispatch, navigate]);

  const handleLogout = async () => {
    try {
      navigate('/login');
      await logout();
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
      navigate('/login');
    }
  };

  const activeSensors = sensors.filter(sensor => sensor.isActive).length;
  const inactiveSensors = sensors.length - activeSensors;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Sensör İzleme Paneli</h1>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {user?.firstName} {user?.lastName} <span className="text-gray-400">({user?.role})</span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <SensorsList />

                {(user?.role === 'system_admin' || user?.role === 'company_admin') && (
                  <div className="mt-8">
                    <a
                      href="/user-activities"
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Kullanıcı Aktiviteleri
                    </a>
                  </div>
                )}

                {user?.role === 'system_admin' && (
                  <div className="mt-8">
                    <a href="/companies" className="text-blue-600 hover:text-blue-800 font-semibold">
                      Şirket Yönetimi
                    </a>
                  </div>
                )}

                {(user?.role === 'system_admin' || user?.role === 'company_admin') && (
                  <div className="mt-8">
                    <a href="/users" className="text-blue-600 hover:text-blue-800 font-semibold">
                      Kullanıcı Yönetimi
                    </a>
                  </div>
                )}

                {(user?.role === 'system_admin') && (
                  <div className="mt-8">
                    <a href="/sensors" className="text-blue-600 hover:text-blue-800 font-semibold">
                      Sensör Yönetimi
                    </a>
                  </div>
                )}
              </div>


              <div className="lg:col-span-3">
                <div className="bg-white rounded-lg border-4 border-dashed border-gray-200 p-4 min-h-[80vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    <div className="bg-white rounded-lg shadow p-6">
                      <h2 className="text-lg font-semibold mb-4">Sensör Özeti</h2>
                      <div className="flex justify-between items-center">
                        <div className="text-gray-600">Toplam Sensör</div>
                        <div className="text-2xl font-bold">{sensors.length}</div>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <div className="text-gray-600">Aktif</div>
                        <div className="text-green-600 font-bold">{activeSensors}</div>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <div className="text-gray-600">Pasif</div>
                        <div className="text-red-600 font-bold">{inactiveSensors}</div>
                      </div>
                    </div>

                    {/* Firma Bilgileri */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h2 className="text-lg font-semibold mb-4">Firma Bilgileri</h2>
                      {user?.company ? (
                        <div className="flex items-center">
                          <div className="text-gray-600">Firma İsmi</div>
                          <div className="font-medium ml-2">{user.company?.name}</div>
                        </div>
                      ) : (
                        <div className="text-gray-600">Firma bilgisi bulunamadı</div>
                      )}
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                      <h2 className="text-lg font-semibold mb-4">Son Aktiviteler</h2>
                      {recentActivities.length === 0 ? (
                        <div className="text-gray-600">Henüz aktivite kaydı yok</div>
                      ) : (
                        <ul className="space-y-2">
                          {recentActivities.map(activity => (
                            <li
                              key={activity.id}
                              className="flex justify-between text-sm text-gray-700"
                            >
                              <span>{actionLabels[activity.action] ?? activity.action}</span>
                              <span className="text-gray-400 text-xs">
                                {new Date(activity.timestamp).toLocaleString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
