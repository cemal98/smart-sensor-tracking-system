import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserActivity, ActivityAction, UserActivityState } from '../types/userActivity.types';

const initialState: UserActivityState = {
    list: [],
    loading: false,
    error: null,
};

const userActivitySlice = createSlice({
    name: 'userActivity',
    initialState,
    reducers: {
        fetchUserActivitiesRequest: (state, action: PayloadAction<{ userId?: string; action?: ActivityAction }>) => {
            state.loading = true;
            state.error = null;
        },
        fetchUserActivitiesSuccess: (state, action: PayloadAction<UserActivity[]>) => {
            state.list = action.payload;
            state.loading = false;
        },
        fetchUserActivitiesFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
    },
});

export const {
    fetchUserActivitiesRequest,
    fetchUserActivitiesSuccess,
    fetchUserActivitiesFailure,
} = userActivitySlice.actions;

export default userActivitySlice.reducer;