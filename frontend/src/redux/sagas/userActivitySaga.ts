import { call, put, takeLatest } from 'redux-saga/effects';
import apiClient from '../../services/api';
import {
    fetchUserActivitiesRequest,
    fetchUserActivitiesSuccess,
    fetchUserActivitiesFailure,
} from '../slices/userActivitySlice';
import { UserActivity } from '../types/userActivity.types';

function* fetchUserActivitiesSaga(action: ReturnType<typeof fetchUserActivitiesRequest>): Generator<any, void, UserActivity[]> {
    try {
        const { userId, action: activityAction } = action.payload;
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        if (activityAction) params.append('action', activityAction);

        const activities = yield call(apiClient.get, `/user-activity?${params.toString()}`);
        yield put(fetchUserActivitiesSuccess(activities));
    } catch (error: any) {
        yield put(fetchUserActivitiesFailure(error.message || 'Kullanıcı aktiviteleri alınamadı'));
    }
}

export function* userActivitySaga(): Generator {
    yield takeLatest(fetchUserActivitiesRequest.type, fetchUserActivitiesSaga);
}