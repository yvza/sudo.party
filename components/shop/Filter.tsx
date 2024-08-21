import React, { useEffect, useState, forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

export interface PayloadFilter {
  searchQuery: string,
  checkbox: {
    method: boolean,
    bot: boolean
  }
}

interface FilterProps {
  onFilterCallback: (query: PayloadFilter) => void
  searchedQuery: PayloadFilter
}

const Filter = forwardRef<HTMLInputElement, FilterProps>(({
  onFilterCallback, searchedQuery
}, ref) => {
  const [inputValue, setInputValue] = useState('')
  const [checkboxMethod, setCheckboxMethod] = useState(false)
  const [checkboxBot, setCheckboxBot] = useState(false)

  useEffect(() => {
    setInputValue(searchedQuery.searchQuery)
    setCheckboxMethod(searchedQuery.checkbox.method)
    setCheckboxBot(searchedQuery.checkbox.bot)
  }, [searchedQuery])

  const handleChange = (input: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = input.target.value
    setInputValue(searchValue)
    const payload: PayloadFilter = {
      searchQuery: searchValue,
      checkbox: {
        method: checkboxMethod,
        bot: checkboxBot
      }
    }
    onFilterCallback(payload)
  }

  const onCheckboxChange = (type: number, condition: boolean) => {
    if (type === 1) {
      setCheckboxMethod(condition)
      const payload: PayloadFilter = {
        searchQuery: inputValue,
        checkbox: {
          method: condition,
          bot: checkboxBot
        }
      }
      onFilterCallback(payload)
    }

    if (type === 2) {
      setCheckboxBot(condition)
      const payload: PayloadFilter = {
        searchQuery: inputValue,
        checkbox: {
          method: checkboxMethod,
          bot: condition
        }
      }
      onFilterCallback(payload)
    }
  }

  return (
    <div className="flex gap-2 justify-center items-center w-64 sm:w-[32rem] mb-5 ml-auto mr-auto flex-col sm:flex-row">
      <Input
        ref={ref}
        type="text"
        placeholder="Search products..."
        value={inputValue}
        onChange={handleChange}
      />
      {/*will be fix later */}
      {/*<div className='flex items-center gap-2'>
        Category:
        <Checkbox
          checked={checkboxMethod}
          onCheckedChange={() => onCheckboxChange(1, !checkboxMethod)}
        /> Method
        <Checkbox
          checked={checkboxBot}
          onCheckedChange={() => onCheckboxChange(2, !checkboxBot)}
        /> Bot
      </div>*/}
    </div>
  )
})

Filter.displayName = 'Filter'

export default Filter
