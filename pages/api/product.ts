import { NextApiRequest, NextApiResponse } from "next"
import { encryptProductId } from "@/utils/helper"

interface Release {
  // name: string, // need to change this to id for individual release, change 'name' to 'idRelease'. need hashing algorithm
  idRelease: string,
  version: string,
  date: string,
  releasePurchaseStatus: number
}

export interface ProductType {
  product: {
    banner: string,
    // id: number, // need to encode this for safety reason. maybe turning named 'id' to 'idProduct'. need hashing algorithm
    idProduct: string,
    category: number,
    name: string,
    price: number,
    status: number,
    release?: Release[]
  }
  productPurchaseStatus: number
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const productJson: ProductType[] = [
    {
      product: {
        banner: 'https://dummyimage.com/970x590/000000/fff',
        idProduct: encryptProductId('1'),
        category: 1,
        name: 'Bypassing SSL Pinning and Building Bot With Chat GPT 4o',
        price: 599000,
        status: 1
      },
      productPurchaseStatus: 1
    },
    {
      product: {
        banner: 'https://dummyimage.com/970x590/000000/fff',
        idProduct: encryptProductId('2'),
        category: 1,
        name: 'Creating Unlimited Mastercard VCC',
        price: 599000,
        status: 1
      },
      productPurchaseStatus: 1
    },
    {
      product: {
        banner: 'https://dummyimage.com/970x590/000000/fff',
        idProduct: encryptProductId('3'),
        category: 2,
        name: 'Bot X (formerly Twitter)',
        price: 99000,
        status: 1,
        release: [
          {
            idRelease: encryptProductId('1'),
            version: '1',
            date: '1 Jul 2024',
            releasePurchaseStatus: 2
          },
          {
            idRelease: encryptProductId('2'),
            version: '2',
            date: '2 Jul 2024',
            releasePurchaseStatus: 1
          }
        ]
      },
      productPurchaseStatus: 2
    },
    {
      product: {
        banner: 'https://dummyimage.com/970x590/000000/fff',
        idProduct: encryptProductId('4'),
        category: 2,
        name: 'Instagram Account Checker',
        price: 99000,
        status: 1,
        release: [
          {
            idRelease: encryptProductId('1'),
            version: '1',
            date: '1 Jul 2024',
            releasePurchaseStatus: 1
          },
          {
            idRelease: encryptProductId('2'),
            version: '2',
            date: '2 Jul 2024',
            releasePurchaseStatus: 2
          }
        ]
      },
      productPurchaseStatus: 2
    },
    {
      product: {
        banner: 'https://dummyimage.com/970x590/000000/fff',
        idProduct: encryptProductId('5'),
        category: 2,
        name: 'Bot Gmail Account Creator',
        price: 99000,
        status: 2,
        release: [
          {
            idRelease: encryptProductId('1'),
            version: '1',
            date: '1 Jul 2024',
            releasePurchaseStatus: 1
          },
          {
            idRelease: encryptProductId('2'),
            version: '2',
            date: '2 Jul 2024',
            releasePurchaseStatus: 1
          }
        ]
      },
      productPurchaseStatus: 1
    },
    {
      product: {
        banner: 'https://dummyimage.com/970x590/000000/fff',
        idProduct: encryptProductId('6'),
        category: 2,
        name: 'Bot Hotmail Account Checker + Searcher',
        price: 99000,
        status: 2,
        release: [
          {
            idRelease: encryptProductId('1'),
            version: '1',
            date: '1 Jul 2024',
            releasePurchaseStatus: 1
          }
        ]
      },
      productPurchaseStatus: 1
    }
  ]

  if (request.method !== 'GET') return response.status(500).end()

  return response.status(200).json(productJson)
}