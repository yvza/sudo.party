import React from 'react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RootState } from '@/lib/store';
import { useDispatch, useSelector } from 'react-redux';
import { hideAlertDialog } from '@/lib/features/alertDialog/toggle';

const Dialog: React.FC = () => {
  const { show, title, description, onCancel, onAction } = useSelector((state: RootState) => state.alertDialog)
  const dispatch = useDispatch()

  const onClose = () => {
    dispatch(hideAlertDialog())
    dispatch
    if (onCancel) {
      onCancel();
    }
  }

  const RenderDialogAction = () => {
    if (!onCancel) {
      return <AlertDialogAction onClick={onAction}>Continue</AlertDialogAction>
    }

    return <>
      <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={onAction}>Continue</AlertDialogAction>
    </>
  }

  return (
    <AlertDialog open={show}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <RenderDialogAction />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default Dialog;