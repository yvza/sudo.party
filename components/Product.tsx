import React, { useEffect } from 'react'
import {
  productCategory,
  productStatus,
  productPurchaseStatus,
  releasePurchaseStatus
} from '@/lib/constants'
import { localFormatPrice } from '@/utils/helper'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { CartProps } from '@/lib/features/shop/cart'
import { decryptProductId } from '@/utils/helper'
import { useDispatch } from 'react-redux'
import { addToCart } from '@/lib/features/shop/cart'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/store'
import { ProductType } from '@/types/global'

export default function Product({ listProduct }: { listProduct: ProductType[] }) {
  const dispatch = useDispatch()
  const cartList = useSelector((state: RootState) => state.cart)

  useEffect(() => {

  }, [cartList])

  const retrieveProductPurchaseStatus = (status: number): string => {
    switch (status) {
      case 1:
        return productPurchaseStatus.NOT_PURCHASED
      case 2:
        return productPurchaseStatus.PURCHASED_PARTIALLY
      case 3:
        return productPurchaseStatus.FULLY_PURCHASED
      default:
        return ''
    }
  }

  const retrieveReleasePurchaseStatus = (status: number): string => {
    switch (status) {
      case 1:
        return releasePurchaseStatus.NOT_PURCHASED
      case 2:
        return releasePurchaseStatus.PURCHASED
      default:
        return ''
    }
  }

  const retrieveProductStatus = (status: number): string => {
    switch (status) {
      case 1:
        return productStatus.AVAILABLE
      case 2:
        return productStatus.NOT_AVAILABLE
      default:
        return ''
    }
  }

  const retrieveProductCategory = (category: number): string => {
    switch (category) {
      case 1:
        return productCategory.METHOD
      case 2:
        return productCategory.BOT
      default:
        return ''
    }
  }

  const addToCartAction = (item: ProductType) => {
    const payload: CartProps = {
      banner: item.product.banner,
      product: {
        id: decryptProductId(item.product.idProduct),
        category: item.product.category,
        name: item.product.name,
        price: item.product.price
      }
    }
    dispatch(addToCart(payload))
  }

  const addToCartControl = (data: ProductType): boolean => {
    const productId = decryptProductId(data.product.idProduct)
    const isProductOnCart = !!cartList.find(item => item.product.id === productId)
    return data.product.status !== 1 || isProductOnCart
  }

  const renderProducts = (listProduct: ProductType[]) => {
    return listProduct.map((data, index) =>
      <div key={index} className='w-72 h-auto shadow-sm rounded'>
        <div
          id='banner'
          className='w-72 h-48 rounded-tl rounded-tr'
          style={{
            backgroundImage: `url(${data.product.banner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        ></div>
        <div
          id='wrapper'
          className="p-3"
        >
          <Badge variant="secondary" className='mb-2'>{retrieveProductCategory(data.product.category)}</Badge>
          <div
            id="productName"
            className="text-lg subpixel-antialiased font-bold pb-2"
          >
            {data.product.name}
          </div>
          <div
            id="bottomInformation"
            className='flex justify-between pb-2'
          >
            <div id="productPrice" className='font-semibold'>{localFormatPrice(data.product.price, true)}</div>
            <div
              id="productStatus"
              className={data.product.status == 1 ? 'text-green-500' : 'text-red-500'}
            >
              {retrieveProductStatus(data.product.status)}
            </div>
          </div>
          <div
            id="purchaseStatus"
            className='pb-2 font-light'
          >
            {retrieveProductPurchaseStatus(data.productPurchaseStatus)}
          </div>
          <Button
            disabled={addToCartControl(data)}
            variant="outline"
            className='w-full'
            onClick={() => addToCartAction(data)}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    )
  }

  const RenderProductList = ({ listProduct }: { listProduct: ProductType[] }) => {
    return <div className="flex flex-wrap gap-6 justify-center">
      {renderProducts(listProduct)}
    </div>
  }

  return (
    <RenderProductList listProduct={listProduct}/>
  )
}
