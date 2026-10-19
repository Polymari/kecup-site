import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface KissState {
  count: number
  add: () => void
}

export const useKisses = create<KissState>()(
  persist(
    (set) => ({
      count: 0,
      add: () => set((state) => ({ count: state.count + 1 })),
    }),
    { name: 'kecup.kisses' },
  ),
)
