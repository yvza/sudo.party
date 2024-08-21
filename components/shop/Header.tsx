import React, { useState, useEffect } from 'react'
import { lang } from '@/lib/constants'
import {
  IconShoppingCartFilled,
  IconHelpHexagonFilled,
  IconUserFilled
} from '@tabler/icons-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'

export default function Header() {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const router = useRouter()
  const totalItemsInCart = useSelector((state: RootState) => state.cart.length)

  useEffect(() => {
    router.prefetch('/shop')
    router.prefetch('/shop/checkout')
  }, [])

  const informationDialog = () => {
    return <Dialog open={isDialogOpen} onOpenChange={() => setIsDialogOpen(!isDialogOpen)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{lang.findingHowToUse}</DialogTitle>
          <DialogDescription>
            {lang.dontWorry} {lang.thisApplicationWillAutomateAllProcesses}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  }

  return (
    <>
      <div id="shopHeader" className='flex justify-between mb-7 items-center'>
        <div id='brandName'>
          <Link href='/shop'>[{lang.siteUrl} {lang.labs}]</Link>
        </div>
        <div id="navigation" className='flex gap-6 items-center'>
          <Link href='/shop/checkout'>
            <div className='flex flex-col items-center hover:cursor-pointer'>
              <IconShoppingCartFilled />
              {totalItemsInCart !== 0 && (
                <Badge>{totalItemsInCart}</Badge>
              )}
            </div>
          </Link>
          <div onClick={() => setIsDialogOpen(true)}>
            <IconHelpHexagonFilled className='hover:cursor-pointer' />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <IconUserFilled className='hover:cursor-pointer' />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem>
                Log out
                <DropdownMenuShortcut>⌘Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {informationDialog()}
    </>
  )
}
