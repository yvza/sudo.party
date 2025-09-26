import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface CartProps {
  banner: string,
  product: {
    id: number,
    category: number,
    name: string,
    price: number,
  }
}

const initialState: CartProps[] = []

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartProps>) {
      state.push({
        banner: action.payload.banner,
        product: {
          id: action.payload.product.id,
          category: action.payload.product.category,
          name: action.payload.product.name,
          price: action.payload.product.price
        }
      })
    },
    removeProduct(state, action: PayloadAction<{id: number}>) {
      return state.filter(cartItem => cartItem.product.id !== action.payload.id)
    },
    resetCart() {
      return initialState
    }
  }
})

export const { addToCart, removeProduct, resetCart } = cartSlice.actions
export default cartSlice.reducer