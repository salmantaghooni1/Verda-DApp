import { useDApp } from '@services/DAppContext'
import { Icons } from '@utils/icons'

export function ActivityFeed() {
  const { feed } = useDApp()

  return (
    <div className="card">
      <h3 style={{ margin: '0 0 12px 0' }}>Live Activity</h3>

      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {feed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            No activity yet
          </div>
        ) : (
          feed.map(item => (
            <div
              key={item.id}
              className={item.fresh ? 'feed-item fresh' : 'feed-item'}
              style={{
                padding: '12px 0',
                borderBottom: '1px solid var(--border-soft)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 13,
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  {item.type === 'invest' ? Icons.arrowUp : Icons.arrowDn}
                </span>
                <div>
                  <div style={{ fontWeight: 600 }}>{item.you ? 'You' : item.who}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.type === 'invest' ? 'Invested' : 'Withdrawn'}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: item.type === 'invest' ? '#10b981' : '#ef4444' }}>
                  {item.type === 'invest' ? '+' : '-'}{item.amount.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.time}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
