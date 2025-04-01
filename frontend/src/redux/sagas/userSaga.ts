import { call, put, takeLatest } from 'redux-saga/effects';
import apiClient from '../../services/api';
import {
    fetchUsersRequest,
    fetchUsersSuccess,
    fetchUsersFailure,
    createUserRequest,
    createUserSuccess,
    createUserFailure,
} from '../slices/userSlice';
import { User } from '../types/user.types';

function* fetchUsersSaga(): Generator<any, void, User[]> {
    try {
        const users = yield call(apiClient.get, '/users');
        yield put(fetchUsersSuccess(users));
    } catch (error: any) {
        yield put(fetchUsersFailure(error.message || 'Kullanıcılar alınamadı'));
    }
}

function* createUserSaga(action: ReturnType<typeof createUserRequest>): Generator<any, void, User> {
    try {
        const user = yield call(apiClient.post, '/users', action.payload);
        yield put(createUserSuccess(user));
    } catch (error: any) {
        yield put(createUserFailure(error.message || 'Kullanıcı oluşturulamadı'));
    }
}

export function* userSaga(): Generator {
    yield takeLatest(fetchUsersRequest.type, fetchUsersSaga);
    yield takeLatest(createUserRequest.type, createUserSaga);
}
