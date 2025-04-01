import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import sensorsReducer from '../redux/slices/sensorSlice';
import userActivitiesReduces from '../redux/slices/userActivitySlice';
import userReducer from '../redux/slices/userSlice';
import companyReducer from '../redux/slices/companySlice';

import rootSaga from '../redux/sagas/rootSaga';

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
  reducer: {
    sensors: sensorsReducer,
    userActivity: userActivitiesReduces,
    users: userReducer,
    company: companyReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;