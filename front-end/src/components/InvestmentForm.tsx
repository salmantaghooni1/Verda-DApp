import { useDApp } from '@services/DAppContext'
import { Icons } from '@utils/icons'

export function InvestmentForm() {
  const { wallet, amount, setAmount, invest, chain } = useDApp()
  const symbol = chain === 'ethereum' ? 'ETH' : 'SOL'

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setAmount(val)
    }
  }

  return (
    <div className="card">
      <h3 style={{ margin: '0 0 16px 0' }}>Make an Investment</h3>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
          Amount ({symbol})
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={amount}
            onChange={handleInputChange}
            placeholder="0.00"
            disabled={wallet.status !== 'connected'}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: '1px solid var(--border-soft)',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'monospace',
              background: 'var(--bg)',
              color: 'var(--text)',
            }}
          />
          <button
            style={{
              padding: '10px 16px',
              border: '1px solid var(--border-soft)',
              borderRadius: 8,
              background: 'var(--bg)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
            onClick={() => setAmount('1.0')}
            disabled={wallet.status !== 'connected'}
          >
            1 {symbol}
          </button>
        </div>
      </div>

      {wallet.status === 'wrong-network' && (
        <div style={{ padding: 12, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, marginBottom: 16, color: '#ef4444', fontSize: 13 }}>
          {Icons.alert} Wrong network - switch to invest
        </div>
      )}

      <button
        className="btn btn-primary btn-block"
        onClick={invest}
        disabled={!amount || parseFloat(amount) <= 0 || wallet.status !== 'connected'}
      >
        {Icons.bolt} Invest Now
      </button>
    </div>
  )
}
