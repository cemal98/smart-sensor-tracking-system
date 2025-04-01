import { all } from 'redux-saga/effects';
import { sensorsSaga } from './sensorsSaga';
import { userActivitySaga } from './userActivitySaga';
import { userSaga } from './userSaga';
import companySaga from './companySaga';

export default function* rootSaga(): Generator {
  yield all([
    sensorsSaga(),
    userActivitySaga(),
    userSaga(),
    companySaga(),
  ]);
}