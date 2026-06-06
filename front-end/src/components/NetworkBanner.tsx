import { useDApp } from '@services/DAppContext'
import { Icons } from '@utils/icons'

export function NetworkBanner() {
  const { wallet, switchNetwork } = useDApp()

  if (wallet.status !== 'wrong-network') return null

  return (
    <div style={{
      padding: '12px 16px',
      background: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: 8,
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', fontSize: 13, fontWeight: 600 }}>
        {Icons.alert}
        <span>Wrong network - switch to continue</span>
      </div>
      <button className="btn btn-primary" onClick={switchNetwork} style={{ fontSize: 13, padding: '6px 12px' }}>
        Switch Network
      </button>
    </div>
  )
}
