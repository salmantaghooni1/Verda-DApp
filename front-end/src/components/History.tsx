import { useDApp } from '@services/DAppContext'
import { Icons } from '@utils/icons'

export function History() {
  const { history, chain } = useDApp()

  if (history.length === 0) return null

  const chainData = {
    ethereum: { explorer: 'etherscan.io', name: 'Etherscan' },
    solana: { explorer: 'solscan.io', name: 'Solscan' },
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h3 style={{ margin: '0 0 16px 0' }}>Transaction History</h3>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: 600, color: 'var(--text-muted)' }}>Type</th>
              <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 600, color: 'var(--text-muted)' }}>Amount</th>
              <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: 600, color: 'var(--text-muted)' }}>Time</th>
              <th style={{ textAlign: 'center', padding: '8px 0', fontWeight: 600, color: 'var(--text-muted)' }}></th>
            </tr>
          </thead>
          <tbody>
            {history.map(entry => (
              <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                <td style={{ padding: '12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {entry.type === 'invest' ? Icons.arrowUp : Icons.arrowDn}
                  </span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{entry.type}</span>
                </td>
                <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600, color: entry.type === 'invest' ? '#10b981' : '#ef4444' }}>
                  {entry.type === 'invest' ? '+' : '-'}{entry.amount.toLocaleString('en-US', { maximumFractionDigits: 4 })}
                </td>
                <td style={{ padding: '12px 0', textAlign: 'right', color: 'var(--text-muted)' }}>
                  {entry.time}
                </td>
                <td style={{ padding: '12px 0', textAlign: 'center' }}>
                  <a
                    href={`https://${chainData[chain].explorer}/tx/${entry.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent)', textDecoration: 'none' }}
                    title="View on explorer"
                  >
                    {Icons.ext}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
