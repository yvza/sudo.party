import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface DefaultState {
  id: number,
  text: string,
  completed: boolean
}

const initialState: DefaultState[] = [
  {
    id: 1,
    text: 'asdasdsad',
    completed: false
  }
];

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTasks(state, action: PayloadAction<{id: number, text: string}>) {
      state.push({
        id: action.payload.id,
        text: action.payload.text,
        completed: false
      })
    }
  }
})

export const { addTasks } = taskSlice.actions
export default taskSlice.reducer