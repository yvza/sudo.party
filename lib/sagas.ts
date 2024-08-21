import { call, put, takeEvery, takeLatest, all } from 'redux-saga/effects'
import { PayloadAction } from '@reduxjs/toolkit'
import { todoAdded } from './features/user/info'
import { addTasks } from './features/user/mocktest'
import { addToCart, removeProduct, resetCart } from './features/shop/cart'
import { CartProps } from './features/shop/cart'

// Worker saga: will be fired on todoAdded actions
function* handleTodoAdded(action: PayloadAction<{ id:number, text:string }>) {
  try {
    // Perform any side effect here, e.g., logging or async operations
    // console.log('Todo added : ', action.payload)

    // Example of putting another action if needed
    // yield put(anotherAction(action.payload))
  } catch (e) {
    // Handle error if necessary
    // console.error(e)
  }
}

function* handleTasks(action: PayloadAction<{ id:number, text:string }>) {
  try {
    // console.log('Tasks added : ', action.payload)
  } catch (e) {
    // console.error(e)
  }
}

function* handleTest() {
  try {
    // console.log('SAGA TRIGGERED!!!')
  } catch (e) {
    // console.error(e)
  }
}

// Watcher saga: spawn a new handleTodoAdded task on each todoAdded
function* watchTodoAdded() {
  yield takeEvery(todoAdded.type, handleTodoAdded)
}

function* watchTasks() {
  yield takeEvery(addTasks.type, handleTasks)
}

function* watchTest() {
  yield takeEvery('TEST_TRIGGER_SAGA', handleTest)
}

function* watchCart(): Generator {
  yield all([
    takeEvery(addToCart.type, handleAddToCart),
    takeEvery(removeProduct.type, handleRemoveProduct),
    takeEvery(resetCart.type, handleResetCart)
  ])
}

function* handleAddToCart(action: PayloadAction<CartProps>) {
  // console.log('Add to cart:', action.payload)
}

function* handleRemoveProduct(action: PayloadAction<{id: number}>) {
  // console.log('Remove product:', action.payload)
}

function* handleResetCart() {
  // console.log('Reset Cart')
}

// Combine all sagas into a root saga
export default function* rootSaga() {
  yield all([
    watchTodoAdded(),
    // add more sagas here if needed
    watchTasks(),
    watchTest(),
    watchCart()
  ])
}