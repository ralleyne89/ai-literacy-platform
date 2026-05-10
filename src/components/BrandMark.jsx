import React from 'react'

export const BRAND_MARK_SRC = '/brand/litmusai-mark.png'

const BrandMark = ({
  alt = 'LitmusAI mark',
  className = '',
  decorative = false,
  imgClassName = 'h-full w-full object-contain',
  ...props
}) => (
  <span className={className} aria-hidden={decorative ? 'true' : undefined} {...props}>
    <img
      src={BRAND_MARK_SRC}
      alt={decorative ? '' : alt}
      className={`block ${imgClassName}`}
      draggable="false"
    />
  </span>
)

export default BrandMark
