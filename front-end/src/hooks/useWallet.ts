import { useState, useEffect, useCallback } from 'react'
import { walletService, WalletState } from '@services/wallet'

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>(walletService.getState)

  useEffect(() => {
    return walletService.subscribe(setWalletState)
  }, [])

  const connect = useCallback(async () => {
    return walletService.connect()
  }, [])

  const disconnect = useCallback(() => {
    walletService.disconnect()
  }, [])

  const switchNetwork = useCallback(async () => {
    return walletService.switchNetwork()
  }, [])

  return { walletState, connect, disconnect, switchNetwork }
}
