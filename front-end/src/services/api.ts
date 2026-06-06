import axios, { AxiosError } from 'axios'
import { walletService } from './wallet'

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'

const http = axios.create({
  baseURL: BASE,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use(config => {
  const token = walletService.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  res => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      walletService.disconnect()
    }
    return Promise.reject(err)
  },
)

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Investment {
  id: number
  wallet_address: string
  amount: string
  tx_hash: string
  block_number: number | null
  status: 'pending' | 'confirmed' | 'failed'
  created_at: string
  updated_at: string
}

export interface PaginatedInvestments {
  items: Investment[]
  total: number
  page: number
  limit: number
}

export interface Stats {
  total_invested: string
  total_investors: number
  daily_volume: string
  average_amount: string
}

export interface TopInvestor {
  wallet_address: string
  total_invested: string
  investment_count: number
}

export interface DailyVolume {
  day: string
  num_investments: number
  volume: string
}

export interface AuthChallengeResponse {
  nonce: string
  message: string
  expires_at: string
}

// ─── API methods ─────────────────────────────────────────────────────────────

export const api = {
  auth: {
    challenge(wallet: string) {
      return http.get<AuthChallengeResponse>('/auth/challenge', { params: { wallet } })
    },
    verify(wallet: string, signature: string, nonce: string) {
      return http.post<{ token: string }>('/auth/verify', { wallet, signature, nonce })
    },
  },

  user: {
    me() {
      return http.get('/user/me')
    },
  },

  investments: {
    list(wallet: string, page = 1, limit = 20) {
      return http.get<PaginatedInvestments>('/investments', { params: { wallet, page, limit } })
    },
    get(id: number) {
      return http.get<Investment>(`/investments/${id}`)
    },
    create(wallet: string, amount: string, txHash: string) {
      return http.post<Investment>('/investments', { wallet, amount, tx_hash: txHash })
    },
  },

  stats: {
    get() {
      return http.get<Stats>('/stats')
    },
    topInvestors(limit = 10) {
      return http.get<TopInvestor[]>('/stats/investors', { params: { limit } })
    },
    dailyVolume(days = 30) {
      return http.get<DailyVolume[]>('/stats/volume', { params: { days } })
    },
  },

  returns: {
    get(wallet: string) {
      return http.get('/returns', { params: { wallet } })
    },
  },
}
