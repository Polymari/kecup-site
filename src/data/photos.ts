export interface PhotoEntry {
  photoKey: string
  src?: string
  label: string
  ratio: string
}

export const PHOTOS: PhotoEntry[] = [
  { photoKey: 'logo', src: 'brand/logo.jpeg', label: 'KeCup logo', ratio: '1 / 1' },
  { photoKey: 'menu-print-1', src: 'brand/menu-1.jpeg', label: 'Make Your Own Cup menu', ratio: '3 / 4' },
  { photoKey: 'menu-print-2', src: 'brand/menu2.jpeg', label: 'KeCup menu', ratio: '3 / 4' },
  { photoKey: 'hero-lifestyle', label: 'Hand holding the stacked cup', ratio: '4 / 5' },
  { photoKey: 'combo-bolo', label: 'Top-down Bolognese Craving Cup', ratio: '1 / 1' },
  { photoKey: 'combo-mush', label: 'Top-down Mushroom Craving Cup', ratio: '1 / 1' },
  { photoKey: 'combo-cheese', label: 'Top-down Cheesy Craving Cup', ratio: '1 / 1' },
  { photoKey: 'nachos-bolo', label: 'Bolognese nachos tray, 45°', ratio: '1 / 1' },
  { photoKey: 'nachos-mush', label: 'Mushroom nachos tray, 45°', ratio: '1 / 1' },
  { photoKey: 'nachos-cheese', label: 'Cheese nachos tray, 45°', ratio: '1 / 1' },
  { photoKey: 'tea-cloudy', label: 'Cloudy cheese-foam tea, side-lit', ratio: '3 / 4' },
  { photoKey: 'tea-fizzy', label: 'Fizzy tea with ice, side-lit', ratio: '3 / 4' },
  { photoKey: 'booth', label: 'Campus booth / cart with branding', ratio: '16 / 9' },
  { photoKey: 'team', label: 'Team polaroids on checkered cloth', ratio: '1 / 1' },
  { photoKey: 'ig-wall', label: 'Instagram lifestyle shot', ratio: '1 / 1' },
  { photoKey: 'outlet-anggrek', label: 'BINUS Anggrek storefront', ratio: '4 / 3' },
  { photoKey: 'outlet-kemanggisan', label: 'Kemanggisan storefront', ratio: '4 / 3' },
  { photoKey: 'outlet-blok-m', label: 'Blok M storefront', ratio: '4 / 3' },
  { photoKey: 'outlet-kelapa-gading', label: 'Kelapa Gading storefront', ratio: '4 / 3' },
  { photoKey: 'outlet-rawamangun', label: 'Rawamangun storefront', ratio: '4 / 3' },
  { photoKey: 'outlet-bsd', label: 'BSD storefront', ratio: '4 / 3' },
]

export const PHOTOS_BY_KEY: Record<string, PhotoEntry> = Object.fromEntries(
  PHOTOS.map((photo) => [photo.photoKey, photo]),
)

export function getPhoto(photoKey: string): PhotoEntry {
  const photo = PHOTOS_BY_KEY[photoKey]
  if (!photo) throw new Error(`Unknown photo key: ${photoKey}`)
  return photo
}
