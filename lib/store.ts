import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import rootSaga from './sagas'

import todoReducer from './features/user/info'
import tasksReducer from './features/user/mocktest'
import cartReducer from './features/shop/cart'

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
  reducer: {
    todos: todoReducer,
    tasks: tasksReducer,
    cart: cartReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware)
})

sagaMiddleware.run(rootSaga)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch