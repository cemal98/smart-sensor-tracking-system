import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, UserState } from '../types/user.types';

const initialState: UserState = {
    list: [],
    loading: false,
    error: null,
};

const userSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {
        fetchUsersRequest: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchUsersSuccess: (state, action: PayloadAction<User[]>) => {
            state.list = action.payload;
            state.loading = false;
        },
        fetchUsersFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        createUserRequest: (state, _action: PayloadAction<Partial<User>>) => {
            state.loading = true;
        },
        createUserSuccess: (state, action: PayloadAction<User>) => {
            state.list.push(action.payload);
            state.loading = false;
        },
        createUserFailure: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const {
    fetchUsersRequest,
    fetchUsersSuccess,
    fetchUsersFailure,
    createUserRequest,
    createUserSuccess,
    createUserFailure,
} = userSlice.actions;

export default userSlice.reducer;
