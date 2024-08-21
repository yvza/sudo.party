'use client'
import React, { ReactNode, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/shop/Header'
import Filter from '@/components/shop/Filter'
import Product from '@/components/Product'
import Footer from '@/components/shop/Footer'
import { Skeleton } from '@/components/ui/skeleton'
import useSWR from 'swr'
import { fetcher } from '@/utils/helper'
import { ProductType } from '@/pages/api/product'
import { Input } from '@/components/ui/input'
import { PayloadFilter } from '@/components/shop/Filter'

export default function Shop() {
  const router = useRouter()
  const { data, error, isLoading } = useSWR('/api/product', fetcher)
  const [ filter, setFilter ] = useState<PayloadFilter>({
    searchQuery: '',
    checkbox: {
      method: false,
      bot: false
    }
  })
  const filterRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    router.prefetch('/shop/refund_policy')
  }, [])

  // useEffect(() => {
  //   console.log('should be rerendered', filteredData)
  // }, [filter])

  const handleFilter = (query: PayloadFilter) => {
    // console.log(query)
    if (filter.searchQuery !== query.searchQuery) {
      setTimeout(() => {
        filterRef.current?.focus()
      }, 1)
    }

    setFilter({
      ...filter,
      searchQuery: query.searchQuery,
      checkbox: {
        method: query.checkbox.method,
        bot: query.checkbox.bot
      }
    })
  }

  // we still have bug on filter by category
  const filteredData = filter.searchQuery ?
    data.filter((product: ProductType) => {
      const matchesQuery = product.product.name.toLowerCase().includes(filter.searchQuery.toLowerCase())
      const matchesCategory =
        (filter.checkbox.method && product.product.category === 1) ||
        (filter.checkbox.bot && product.product.category === 2)
      return matchesQuery || matchesCategory
    })
    : data

  const RenderPage = ({children}: {children: ReactNode}) => {
    return <div className='m-5'>
      <Header />
      {children}
      <Footer />
    </div>
  }

  if (isLoading) {
    return <RenderPage>
      <div className="flex justify-center">
        <Skeleton className='w-[32rem] h-9 mb-4'/>
      </div>
      <div className="flex flex-wrap justify-center gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="w-[18rem] h-[27.5rem]" />
        ))}
      </div>
    </RenderPage>
  }

  if (error) {
    return <RenderPage>
      <div className='text-red-500'>Something went wrong when fetching data.</div>
    </RenderPage>
  }

  return (
    <RenderPage>
      <Filter
        ref={filterRef}
        onFilterCallback={handleFilter}
        searchedQuery={filter}
      />
      <Product listProduct={filteredData} />
    </RenderPage>
  )
}
