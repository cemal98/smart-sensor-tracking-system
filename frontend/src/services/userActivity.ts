import apiClient from './api';
import { ActivityAction, UserActivity } from '../redux/types/userActivity.types';

export const createUserActivity = async (userId: string, action: ActivityAction) => {
    try {
        await apiClient.post('/user-activity', { userId, action });
    } catch (error) {
        console.error('Kullanıcı aktivitesi oluşturulamadı:', error);
        throw error;
    }
};

export const getUserActivities = async (userId: string) => {
    const response = await apiClient.get<UserActivity[]>(`/user-activity/user/${userId}`);
    return response;
};