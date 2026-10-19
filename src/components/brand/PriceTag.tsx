type PriceTagProps = {
  price: string
  compare?: string
  className?: string
}

export function PriceTag({ price, compare, className = '' }: PriceTagProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border-[3px] border-ink bg-lime px-3 py-1 shadow-sticker ${className}`}
    >
      {compare ? (
        <span className="font-mono text-sm text-brick line-through decoration-ketchup decoration-2">
          {compare}
        </span>
      ) : null}
      <span className="font-display text-base font-semibold text-ink">{price}</span>
    </span>
  )
}
