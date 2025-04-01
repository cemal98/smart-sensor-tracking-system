import { call, put, takeLatest } from 'redux-saga/effects';
import {
    fetchCompaniesRequest,
    fetchCompaniesSuccess,
    fetchCompaniesFailure,
    createCompanyRequest,
    createCompanySuccess,
    createCompanyFailure,
} from '../slices/companySlice';
import apiClient from '../../services/api';
import { Company } from '../types/company.types';

function* fetchCompaniesSaga() {
    try {
        const response: Company[] = yield call(apiClient.get, '/companies');
        yield put(fetchCompaniesSuccess(response));
    } catch (error: any) {
        yield put(fetchCompaniesFailure(error.message || 'Şirketler alınamadı'));
    }
}

function* createCompanySaga(action: ReturnType<typeof createCompanyRequest>) {
    try {
        const response: Company = yield call(apiClient.post, '/companies', action.payload);
        yield put(createCompanySuccess(response));
    } catch (error: any) {
        yield put(createCompanyFailure(error.message || 'Şirket oluşturulamadı'));
    }
}

export default function* companySaga() {
    yield takeLatest(fetchCompaniesRequest.type, fetchCompaniesSaga);
    yield takeLatest(createCompanyRequest.type, createCompanySaga);
}
