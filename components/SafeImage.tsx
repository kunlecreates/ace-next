'use client'

import Image, { type ImageProps } from 'next/image'
import { useState } from 'react'

type Props = Omit<ImageProps, 'src'> & {
  src?: string | null
  fallbackSrc: string
}

export default function SafeImage({ src, fallbackSrc, alt, ...rest }: Props) {
  const [currentSrc, setCurrentSrc] = useState<string>(src || fallbackSrc)
  return (
    <Image
      {...rest}
      alt={alt}
      src={currentSrc}
      onError={() => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc)
      }}
    />
  )
}
