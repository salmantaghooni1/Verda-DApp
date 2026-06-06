import { createContext, ReactNode, useContext } from 'react'
import type { DAppContextType } from '@types'

export const DAppContext = createContext<DAppContextType | null>(null)

export function DAppProvider({ value, children }: { value: DAppContextType; children: ReactNode }) {
  return <DAppContext.Provider value={value}>{children}</DAppContext.Provider>
}

export function useDApp() {
  const ctx = useContext(DAppContext)
  if (!ctx) throw new Error('useDApp must be used inside DAppProvider')
  return ctx
}
