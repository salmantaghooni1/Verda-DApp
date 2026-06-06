import { useDApp } from '@services/DAppContext'
import { Icons } from '@utils/icons'

export function PortfolioCard() {
  const { portfolio, protocol, chain } = useDApp()
  const symbol = chain === 'ethereum' ? 'ETH' : 'SOL'

  return (
    <div className="card portfolio-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Your Portfolio</h2>
        <span style={{ color: 'var(--text-muted)' }}>{Icons.coins}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>Total Invested</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em' }} className="tnum">
            {portfolio.invested.toLocaleString('en-US', { maximumFractionDigits: 4 })}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{symbol}</div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>Unclaimed Returns</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em', color: '#10b981' }} className="tnum">
            +{portfolio.returns.toLocaleString('en-US', { maximumFractionDigits: 4 })}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{symbol}</div>
        </div>
      </div>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-soft)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>Protocol APR</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>
          {protocol.apr.toLocaleString('en-US', { maximumFractionDigits: 2 })}%
        </div>
      </div>
    </div>
  )
}
