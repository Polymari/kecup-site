import { asset } from '@/lib/asset'
import { getPhoto } from '@/data/photos'
import { Placeholder } from './Placeholder'
import { cn } from '@/lib/cn'

type PhotoProps = {
  photoKey: string
  className?: string
  imgClassName?: string
}

export function Photo({ photoKey, className = '', imgClassName = '' }: PhotoProps) {
  const photo = getPhoto(photoKey)

  if (!photo.src) {
    return <Placeholder label={photoKey} ratio={photo.ratio} className={className} />
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border-[3px] border-ink', className)}>
      <img
        src={asset(photo.src)}
        alt={photo.label}
        className={cn('h-full w-full object-cover', imgClassName)}
        loading="lazy"
      />
    </div>
  )
}
