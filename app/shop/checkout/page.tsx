'use client'
import React, { useState, useEffect } from 'react'
import Header from '@/components/shop/Header'
import Footer from '@/components/shop/Footer'
import { lang } from '@/lib/constants'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { IconX } from '@tabler/icons-react'
import { useDispatch } from 'react-redux'
import { removeProduct } from '@/lib/features/shop/cart'
import { localFormatPrice } from '@/utils/helper'

export default function Checkout() {
  const cartList = useSelector((state: RootState) => state.cart)
  const totalPrice = cartList.reduce((total, item) => total + item.product.price, 0)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const dispatch = useDispatch()

  const showMaintenanceDialog = () => {
    return <Dialog open={isDialogOpen} onOpenChange={() => setIsDialogOpen(!isDialogOpen)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{lang.maintenance}</DialogTitle>
          <DialogDescription>
            {lang.weWillBeRightBackVerySoon}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  }

  const payNowAction = () => {
    setIsDialogOpen(true)
  }

  const removeItemAction = (id: number) => {
    dispatch(removeProduct({id}))
  }

  if (cartList.length === 0) {
    return (
      <div className='m-5'>
        <Header />
        Your cart is empty.
        <Footer />
      </div>
    )
  }

  return (
    <div className='m-5'>
      <Header />
      <div className='max-w-[32rem] m-auto'>
        <div className="text-xl font-bold mb-6">{lang.checkout}</div>
        <Table>
          <TableCaption className='text-right'>
            <Button
              onClick={() => payNowAction()}
              disabled={cartList.length === 0}
            >
              Pay Now
            </Button>
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead className="w-[100px]">Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Name</TableHead>
              {/* <TableHead>Action</TableHead> */}
              <TableHead className="text-right">Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cartList.map((item) => (
              <TableRow key={item.product.id}>
                <TableCell>
                  <div
                    className='hover:cursor-pointer'
                    onClick={() => removeItemAction(item.product.id)}
                  >
                    <IconX className='text-red-500' />
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <Image
                    src={item.banner}
                    alt={item.product.name}
                    height={90}
                    width={90}
                  />
                </TableCell>
                <TableCell>{item.product.category === 1 ? 'Method' : 'Bot'}</TableCell>
                <TableCell>{item.product.name}</TableCell>
                <TableCell className="text-right">{item.product.price}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          {totalPrice !== 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className='text-right'>Rp</TableCell>
                <TableCell className="text-right">{localFormatPrice(totalPrice, false)}</TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
      {showMaintenanceDialog()}
      <Footer />
    </div>
  )
}
