import React from 'react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription
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
    if (onCancel) {
      return <AlertDialogCancel className='cursor-pointer' onClick={onClose}>Cancel</AlertDialogCancel>
    }

    if (!onCancel) {
      return <AlertDialogAction className='cursor-pointer' onClick={onAction}>Continue</AlertDialogAction>
    }

    return <>
      <AlertDialogCancel className='cursor-pointer' onClick={onClose}>Cancel</AlertDialogCancel>
      <AlertDialogAction className='cursor-pointer' onClick={onAction}>Continue</AlertDialogAction>
    </>
  }

  return (
    <AlertDialog open={show}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description()}
          <AlertDialogDescription></AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <RenderDialogAction />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default Dialog;