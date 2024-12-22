import React, {useState} from 'react'
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
import { DialogProps } from '@/types/global'

const Dialog: React.FC<DialogProps> = ({show, title, description, onCancel, onAction}) => {
  const [isOpen, setIsOpen] = useState(show);

  const onClose = () => {
    setIsOpen(!isOpen);
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
    <AlertDialog open={isOpen}>
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