import { useDApp } from '@services/DAppContext'
import { Icons } from '@utils/icons'

export function ReturnsCard() {
  const { portfolio, wallet, withdraw, chain } = useDApp()
  const symbol = chain === 'ethereum' ? 'ETH' : 'SOL'

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0 }}>Claim Returns</h3>
        <span style={{ color: 'var(--text-muted)' }}>{Icons.coins}</span>
      </div>

      <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>Available to Withdraw</div>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-.02em' }} className="tnum">
          {portfolio.returns.toLocaleString('en-US', { maximumFractionDigits: 4 })} {symbol}
        </div>
      </div>

      <button
        className="btn btn-primary btn-block"
        onClick={withdraw}
        disabled={portfolio.returns <= 0 || wallet.status !== 'connected'}
      >
        {Icons.arrowUp} Withdraw Returns
      </button>
    </div>
  )
}
