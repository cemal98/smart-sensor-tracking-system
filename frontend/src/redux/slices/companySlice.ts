import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Company, CompaniesState } from '../types/company.types';

const initialState: CompaniesState = {
    list: [],
    loading: false,
    error: null,
};

const companySlice = createSlice({
    name: 'companies',
    initialState,
    reducers: {
        fetchCompaniesRequest(state) {
            state.loading = true;
            state.error = null;
        },
        fetchCompaniesSuccess(state, action: PayloadAction<Company[]>) {
            state.list = action.payload;
            state.loading = false;
        },
        fetchCompaniesFailure(state, action: PayloadAction<string>) {
            state.error = action.payload;
            state.loading = false;
        },
        createCompanyRequest(state, _action: PayloadAction<Partial<Company>>) {
            state.loading = true;
        },
        createCompanySuccess(state, action: PayloadAction<Company>) {
            state.list.push(action.payload);
            state.loading = false;
        },
        createCompanyFailure(state, action: PayloadAction<string>) {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const {
    fetchCompaniesRequest,
    fetchCompaniesSuccess,
    fetchCompaniesFailure,
    createCompanyRequest,
    createCompanySuccess,
    createCompanyFailure,
} = companySlice.actions;

export default companySlice.reducer;
