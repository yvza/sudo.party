import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface toggleAlertDialog {
  show: boolean,
  title: string,
  description: () => React.ReactNode,
  onCancel?: () => void | undefined,
  onAction?: () => void
}

const initialState: toggleAlertDialog = {
  show: false,
  title: '',
  description: () => null,
  onCancel: undefined,
  onAction: undefined
}

const alertDialog = createSlice({
  name: 'alertDialog',
  initialState,
  reducers: {
    hideAlertDialog() {
      return initialState
    },
    showAlertDialog(_, action: PayloadAction<toggleAlertDialog>) {
      return {
        show: action.payload.show,
        title: action.payload.title,
        description: action.payload.description,
        onCancel: action.payload.onCancel,
        onAction: action.payload.onAction
      }
    }
  }
})

export const { hideAlertDialog, showAlertDialog } = alertDialog.actions
export default alertDialog.reducer