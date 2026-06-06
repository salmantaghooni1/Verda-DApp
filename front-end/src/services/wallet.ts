import { BrowserProvider, Contract, ethers } from 'ethers'

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
      on: (event: string, listener: (...args: unknown[]) => void) => void
      removeListener: (event: string, listener: (...args: unknown[]) => void) => void
      isMetaMask?: boolean
    }
  }
}

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined
const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

const ETHEREUM_MAINNET_CHAIN_ID = '0x1'
const ETHEREUM_SEPOLIA_CHAIN_ID = '0xaa36a7'

const INVESTMENT_ABI = [
  'function invest() external payable',
  'function withdrawReturns() external',
  'function getInvestor(address user) external view returns (uint256 investedAmount, uint256 returnsAmount, uint256 investmentCount, uint256 lastInvestmentTime)',
  'function getTotalStats() external view returns (uint256 invested, uint256 numInvestors, uint256 aprValue)',
  'event InvestmentMade(address indexed investor, uint256 amount)',
  'event ReturnsDistributed(address indexed investor, uint256 amount)',
  'event ReturnsWithdrawn(address indexed investor, uint256 amount)',
]

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'wrong-network'

export interface WalletState {
  status: WalletStatus
  address: string | null
  chainId: string | null
  token: string | null
}

type WalletListener = (state: WalletState) => void

class WalletService {
  private provider: BrowserProvider | null = null
  private contract: Contract | null = null
  private state: WalletState = { status: 'disconnected', address: null, chainId: null, token: null }
  private listeners: Set<WalletListener> = new Set()

  subscribe(fn: WalletListener): () => void {
    this.listeners.add(fn)
    fn(this.state)
    return () => this.listeners.delete(fn)
  }

  private emit(patch: Partial<WalletState>) {
    this.state = { ...this.state, ...patch }
    this.listeners.forEach(fn => fn(this.state))
  }

  getState(): WalletState {
    return this.state
  }

  isMetaMaskAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask
  }

  async connect(): Promise<WalletState> {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not installed')
    }

    this.emit({ status: 'connecting' })

    try {
      this.provider = new BrowserProvider(window.ethereum!)

      await this.provider.send('eth_requestAccounts', [])

      const network = await this.provider.getNetwork()
      const chainId = '0x' + network.chainId.toString(16)

      const signer = await this.provider.getSigner()
      const address = await signer.getAddress()

      const expectedChains = [ETHEREUM_MAINNET_CHAIN_ID, ETHEREUM_SEPOLIA_CHAIN_ID, '0x539']
      if (!expectedChains.includes(chainId)) {
        this.emit({ status: 'wrong-network', address, chainId })
        return this.state
      }

      if (CONTRACT_ADDRESS) {
        this.contract = new Contract(CONTRACT_ADDRESS, INVESTMENT_ABI, signer)
      }

      const stored = this.loadStoredToken(address)
      let token = stored

      if (!token) {
        token = await this.authenticate(address, signer)
      }

      this.emit({ status: 'connected', address, chainId, token })
      this.watchEvents()

      return this.state
    } catch (err: unknown) {
      this.emit({ status: 'disconnected' })
      throw err
    }
  }

  private async authenticate(address: string, signer: ethers.Signer): Promise<string> {
    const challengeRes = await fetch(`${API_BASE}/auth/challenge?wallet=${address}`)
    if (!challengeRes.ok) throw new Error('Failed to get auth challenge')

    const { nonce, message } = await challengeRes.json() as { nonce: string; message: string }

    const signature = await signer.signMessage(message)

    const verifyRes = await fetch(`${API_BASE}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet: address, signature, nonce }),
    })
    if (!verifyRes.ok) throw new Error('Authentication failed')

    const { token } = await verifyRes.json() as { token: string }

    localStorage.setItem(`verda.token.${address.toLowerCase()}`, token)
    return token
  }

  private loadStoredToken(address: string): string | null {
    return localStorage.getItem(`verda.token.${address.toLowerCase()}`)
  }

  async switchNetwork(): Promise<void> {
    if (!window.ethereum) throw new Error('MetaMask not found')

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ETHEREUM_SEPOLIA_CHAIN_ID }],
      })
    } catch (err: unknown) {
      const switchErr = err as { code?: number }
      if (switchErr.code === 4902) {
        throw new Error('Network not configured in MetaMask')
      }
      throw err
    }
  }

  async invest(amountEth: string): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized — check CONTRACT_ADDRESS env var')

    const value = ethers.parseEther(amountEth)
    const tx = await this.contract.invest({ value })
    return (tx as ethers.TransactionResponse).hash
  }

  async waitForTx(hash: string): Promise<ethers.TransactionReceipt | null> {
    if (!this.provider) throw new Error('Not connected')
    return this.provider.waitForTransaction(hash, 1, 60_000)
  }

  async withdrawReturns(): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized')

    const tx = await this.contract.withdrawReturns()
    return (tx as ethers.TransactionResponse).hash
  }

  async getInvestorData(address: string): Promise<{
    investedAmount: string
    returnsAmount: string
    investmentCount: bigint
    lastInvestmentTime: bigint
  } | null> {
    if (!this.contract) return null

    try {
      const [invested, returns, count, lastTime] = await this.contract.getInvestor(address) as [bigint, bigint, bigint, bigint]
      return {
        investedAmount: ethers.formatEther(invested),
        returnsAmount: ethers.formatEther(returns),
        investmentCount: count,
        lastInvestmentTime: lastTime,
      }
    } catch {
      return null
    }
  }

  async getTotalStats(): Promise<{ tvl: string; investors: bigint; apr: bigint } | null> {
    if (!this.contract) return null

    try {
      const [invested, investors, apr] = await this.contract.getTotalStats() as [bigint, bigint, bigint]
      return {
        tvl: ethers.formatEther(invested),
        investors,
        apr,
      }
    } catch {
      return null
    }
  }

  disconnect(): void {
    if (this.state.address) {
      localStorage.removeItem(`verda.token.${this.state.address.toLowerCase()}`)
    }
    this.provider = null
    this.contract = null
    this.emit({ status: 'disconnected', address: null, chainId: null, token: null })
  }

  private watchEvents(): void {
    if (!window.ethereum) return

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[]
      if (accs.length === 0) {
        this.disconnect()
      } else if (accs[0].toLowerCase() !== this.state.address?.toLowerCase()) {
        this.disconnect()
      }
    }

    const handleChainChanged = () => {
      window.location.reload()
    }

    window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
    window.ethereum.removeListener('chainChanged', handleChainChanged)
    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)
  }
}

export const walletService = new WalletService()
