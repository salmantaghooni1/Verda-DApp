import { useDApp } from '@services/DAppContext'

export function PageHead() {
  const { wallet } = useDApp()

  return (
    <div className="pagehead">
      <div>
        <h1>Investment Vault</h1>
        <p>Stake capital and earn sustainable yields</p>
      </div>
      {wallet.status === 'disconnected' && (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>
          Connect your wallet to begin
        </div>
      )}
    </div>
  )
}
