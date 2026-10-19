import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface OutletState {
  slug: string
  setSlug: (slug: string) => void
}

export const useSelectedOutlet = create<OutletState>()(
  persist(
    (set) => ({
      slug: 'anggrek',
      setSlug: (slug) => set({ slug }),
    }),
    { name: 'kecup.outlet' },
  ),
)
