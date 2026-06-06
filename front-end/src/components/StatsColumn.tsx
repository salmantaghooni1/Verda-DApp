import { useDApp } from '@services/DAppContext'
import { Icons } from '@utils/icons'

export function StatsColumn() {
  const { protocol, statFlash } = useDApp()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className={`card stat-card ${statFlash === 'tvl' ? 'flash' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Total Value Locked</h3>
          <span style={{ color: 'var(--text-muted)' }}>{Icons.bank}</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-.02em' }} className="tnum">
          ${protocol.tvl.toLocaleString('en-US', { maximumFractionDigits: 2 })}
        </div>
      </div>

      <div className="card stat-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Total Investors</h3>
          <span style={{ color: 'var(--text-muted)' }}>{Icons.users}</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>
          {protocol.investors.toLocaleString('en-US')}
        </div>
      </div>

      <div className="card stat-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Annual Returns</h3>
          <span style={{ color: 'var(--text-muted)' }}>{Icons.trend}</span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>
          {protocol.apr.toLocaleString('en-US', { maximumFractionDigits: 2 })}%
        </div>
      </div>
    </div>
  )
}
