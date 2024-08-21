import React from 'react'

export default function Detail({params}: {params: {slug: string}}) {
  return (
    <div>page slug : {JSON.stringify(params)}</div>
  )
}
