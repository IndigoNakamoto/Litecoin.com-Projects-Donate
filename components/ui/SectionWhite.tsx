import { ReactNode } from 'react'
import React from 'react'

interface Props {
  children: ReactNode
  bgColor?: string
}

export default function SectionWhite({ children }: Props) {
  return (
    <div className="bg-[#FFFFFF]">
      <div className="mx-auto w-full max-w-[1300px] p-8">{children}</div>
    </div>
  )
}

