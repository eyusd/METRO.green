import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface GameState {
  visitedStations: string[]
  addStation: (stationName: string) => void
  resetGame: () => void
  getStationCount: () => number
  hasVisitedStation: (stationName: string) => boolean
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      visitedStations: [],
      
      addStation: (stationName: string) => {
        const currentStations = get().visitedStations
        // Only add if station hasn't been visited already
        if (!currentStations.includes(stationName)) {
          set((state) => ({
            visitedStations: [...state.visitedStations, stationName]
          }))
        }
      },
      
      resetGame: () => {
        set({ visitedStations: [] })
      },
      
      getStationCount: () => {
        return get().visitedStations.length
      },
      
      hasVisitedStation: (stationName: string) => {
        return get().visitedStations.includes(stationName)
      }
    }),
    {
      name: 'metro-game-storage', // unique name for localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ visitedStations: state.visitedStations }), // Only persist the stations list
    }
  )
)

